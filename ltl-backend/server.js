const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => console.log('❌ MongoDB connection error:', err));

// --- Schemas ---
const bookingSchema = new mongoose.Schema({ clientName: String, clientEmail: String, serviceType: String, sessionFormat: String, preferredDate: String, experienceLevel: String, projectDescription: String, status: { type: String, default: 'pending' }, price: { type: Number, default: 75 }, paymentIntentId: String, dateBooked: { type: Date, default: Date.now } });
const userSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, dateCreated: { type: Date, default: Date.now }, resetPasswordToken: String, resetPasswordExpires: Date });
const projectSchema = new mongoose.Schema({ userEmail: String, files: [{ fileName: String, fileUrl: String, uploadDate: { type: Date, default: Date.now } }] });

const conversationSchema = new mongoose.Schema({
    participants: [{ type: String, required: true }],
    lastMessageAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: String, required: true, enum: ['user', 'admin'] },
    content: { type: String, required: true },
    readStatus: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);
const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

// --- WebSocket Server ---
const wss = new WebSocket.Server({ server });
wss.on('connection', ws => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        // Find or create a conversation
        let conversation = await Conversation.findOne({ participants: { $all: [data.userEmail, 'admin'] } });
        if (!conversation) {
            conversation = new Conversation({ participants: [data.userEmail, 'admin'] });
            await conversation.save();
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            sender: data.sender,
            content: data.content
        });
        await newMessage.save();

        // Broadcast message to all clients in the same conversation
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(newMessage));
            }
        });
    });
});

// --- API Routes ---

app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
        }
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset/${token}`;
        console.log('====================================');
        console.log('PASSWORD RESET LINK (for testing):');
        console.log(resetLink);
        console.log('====================================');
        res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ success: false, error: 'Password reset token is invalid or has expired.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ success: true, message: 'Password has been reset successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/user/change-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ success: false, error: 'Incorrect current password.' });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ success: true, message: 'Password updated successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// NEW: Get list of conversations for a user
app.get('/api/conversations/:userEmail', async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.params.userEmail }).sort({ lastMessageAt: -1 });
        res.json(conversations);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// UPDATED: Get messages for a specific conversation
app.get('/api/messages/:conversationId', async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// NEW: Mark messages in a conversation as read
app.put('/api/messages/read/:conversationId', async (req, res) => {
    try {
        await Message.updateMany(
            { conversationId: req.params.conversationId, sender: 'admin', readStatus: false },
            { $set: { readStatus: true } }
        );
        res.json({ success: true, message: 'Messages marked as read.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 7500,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
        });
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(400).send({ error: { message: error.message } });
    }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
        const { userEmail } = req.body;
        
        const uploadResult = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
            resource_type: "auto"
        });

        let project = await Project.findOne({ userEmail });
        if (!project) project = new Project({ userEmail, files: [] });
        project.files.push({ fileName: req.file.originalname, fileUrl: uploadResult.secure_url });
        await project.save();
        res.json({ success: true, file: project.files[project.files.length - 1] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/projects/:userEmail', async (req, res) => {
    try {
        const project = await Project.findOne({ userEmail: req.params.userEmail });
        res.json(project ? project.files : []);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/test', (req, res) => res.json({ message: 'Backend is working!', database: mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected' }));

app.post('/api/bookings', async (req, res) => {
    try {
        const booking = new Booking(req.body);
        await booking.save();
        const tempPassword = 'temp' + Math.random().toString(36).substr(2, 9);
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);
            const user = new User({ name: req.body.clientName, email: req.body.clientEmail, password: hashedPassword });
            await user.save();
        } catch (err) {
            if (err.code === 11000) console.log('User already exists.');
        }
        res.json({ success: true, bookingId: booking._id, tempPassword: tempPassword });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ dateBooked: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            res.json({ success: true, user: { name: user.name, email: user.email, id: user._id } });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Delete a file from a project
app.delete('/api/projects/:userEmail/files/:fileId', async (req, res) => {
    try {
        const { userEmail, fileId } = req.params;
        const project = await Project.findOne({ userEmail });
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found.' });
        }
        const initialFileCount = project.files.length;
        project.files.pull({ _id: fileId });
        await project.save();

        if (project.files.length < initialFileCount) {
            res.json({ success: true, message: 'File deleted successfully.' });
        } else {
            res.status(404).json({ success: false, error: 'File not found.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update the status of a booking (e.g., to 'canceled')
app.put('/api/bookings/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { status: status },
            { new: true }
        );
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found.' });
        }
        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});