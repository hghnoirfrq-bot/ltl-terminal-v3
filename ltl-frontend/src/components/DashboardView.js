import React, { useState, useEffect, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL;
const WEBSOCKET_URL = 'ws://localhost:5000';

const DashboardView = ({ currentUser, setCurrentUser, setView }) => {
  const [bookings, setBookings] = useState([]);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const fileInputRef = useRef(null);
  const ws = useRef(null);
  const messageContainerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [bookingsRes, filesRes, messagesRes] = await Promise.all([
          fetch(`${API_URL}/bookings`),
          fetch(`${API_URL}/projects/${currentUser.email}`),
          fetch(`${API_URL}/messages/${currentUser.email}`)
        ]);
        const allBookings = await bookingsRes.json();
        const userFiles = await filesRes.json();
        const messageHistory = await messagesRes.json();
        setBookings(allBookings.filter(b => b.clientEmail === currentUser.email));
        setFiles(userFiles);
        setMessages(messageHistory);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser.email]);

  useEffect(() => {
    ws.current = new WebSocket(WEBSOCKET_URL);
    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onclose = () => console.log("WebSocket disconnected");
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.userEmail === currentUser.email) {
          setMessages(prevMessages => [...prevMessages, message]);
      }
    };
    return () => ws.current.close();
  }, [currentUser.email]);
  
  useEffect(() => {
    if (messageContainerRef.current) {
        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogout = () => {
    setCurrentUser(null);
    setView('terminal');
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userEmail', currentUser.email);
    try {
      const response = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setFiles(prevFiles => [...prevFiles, result.file]);
      alert('File uploaded successfully!');
    } catch (error) {
      alert(`Error uploading file: ${error.message}`);
    }
   };
  const handleUploadClick = () => fileInputRef.current.click();
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim() && ws.current.readyState === WebSocket.OPEN) {
      const messagePayload = {
        userEmail: currentUser.email,
        sender: 'user',
        content: currentMessage.trim()
      };
      ws.current.send(JSON.stringify(messagePayload));
      setCurrentMessage('');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/user/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          currentPassword,
          newPassword
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert(`Error changing password: ${error.message}`);
    }
  };

  // --- NEW: Helper function to render the correct file interaction ---
  const renderFile = (file) => {
    const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(file.fileName);

    if (isAudio) {
      return (
        <>
          <p style={{color: '#00ff00'}}>{file.fileName}</p>
          <audio controls src={file.fileUrl} style={{width: '100%', marginTop: '10px'}}>
            Your browser does not support the audio element.
          </audio>
        </>
      );
    }

    return (
      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" style={{color: '#00ff00', textDecoration: 'none'}}>
        {file.fileName}
      </a>
    );
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={handleLogout}>← Logout</button>
      <h2 style={{ color: '#00ff00', margin: '20px 0' }}>Welcome back, {currentUser.name}</h2>
      <div className="dashboard">
        <div className="sidebar">
          <h3 style={{ color: '#00ff00', marginBottom: '15px' }}>Quick Actions</h3>
          <button className="btn" style={{ width: '100%', marginBottom: '10px' }} onClick={() => setView('booking')}>Book New Session</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '10px' }} onClick={handleUploadClick}>Upload File</button>
          <button className="btn btn-secondary" style={{ width: '100%' }}>View Invoices</button>
          
          <h3 style={{ color: '#00ff00', margin: '30px 0 15px' }}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group"><input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
            <div className="form-group"><input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
            <div className="form-group"><input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
            <button type="submit" className="btn" style={{width: '100%'}}>Update Password</button>
          </form>
        </div>
        <div className="main-content">
          <h3 style={{ color: '#00ff00', marginBottom: '15px' }}>Messages</h3>
          <div className="message-container" ref={messageContainerRef}>
            {messages.map((msg, index) => (
                <div key={msg._id || index} className={`message ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                    {msg.content}
                </div>
            ))}
          </div>
          <form className="message-input-container" onSubmit={handleSendMessage}>
            <input type="text" className="terminal-input" placeholder="Type your message..." value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} />
            <button type="submit" className="btn">Send</button>
          </form>
          <h3 style={{ color: '#00ff00', margin: '30px 0 15px' }}>Your Bookings</h3>
          {isLoading ? <div className="loading"></div> : (
            <div id="bookings-list">
              {bookings.length > 0 ? bookings.map(booking => (
                <div key={booking._id} className="project-card">
                  <h4>{booking.serviceType.replace(/-/g, ' ')}</h4>
                  <p>Format: {booking.sessionFormat}</p>
                  <p>Booked on: {new Date(booking.dateBooked).toLocaleDateString()}</p>
                  <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                </div>
              )) : <p style={{ color: '#888', fontSize: '12px' }}>No active bookings found.</p>}
            </div>
          )}
          <h3 style={{ color: '#00ff00', margin: '30px 0 15px' }}>Project Files</h3>
          {isLoading ? <div className="loading"></div> : (
            <div id="files-list">
              {files.length > 0 ? files.map(file => (
                <div key={file._id} className="project-card">
                  {/* --- UPDATED: Use the renderFile function here --- */}
                  {renderFile(file)}
                  <p style={{marginTop: '10px'}}>Uploaded on: {new Date(file.uploadDate).toLocaleDateString()}</p>
                </div>
              )) : <p style={{ color: '#888', fontSize: '12px' }}>No files uploaded yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
