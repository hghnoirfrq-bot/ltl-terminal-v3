import React, { useState, useEffect, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL;
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;

const DashboardView = ({ currentUser, setCurrentUser, setView }) => {
  const [bookings, setBookings] = useState([]);
  const [files, setFiles] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const fileInputRef = useRef(null);
  const ws = useRef(null);
  const messageContainerRef = useRef(null);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [bookingsRes, filesRes, conversationsRes] = await Promise.all([
          fetch(`${API_URL}/bookings`),
          fetch(`${API_URL}/projects/${currentUser.email}`),
          fetch(`${API_URL}/conversations/${currentUser.email}`)
        ]);
        const allBookings = await bookingsRes.json();
        const userFiles = await filesRes.json();
        const userConversations = await conversationsRes.json();
        
        setBookings(allBookings.filter(b => b.clientEmail === currentUser.email));
        setFiles(userFiles);
        setConversations(userConversations);
        if (userConversations.length > 0) {
            setCurrentConversation(userConversations[0]);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser.email]);
  
  // Fetch messages for the selected conversation
  useEffect(() => {
      const fetchMessages = async () => {
          if (currentConversation) {
              const messagesRes = await fetch(`${API_URL}/messages/${currentConversation._id}`);
              const messageHistory = await messagesRes.json();
              setMessages(messageHistory);
          }
      };
      fetchMessages();
  }, [currentConversation]);

  // WebSocket connection
  useEffect(() => {
    if (!currentConversation) return;
      
    ws.current = new WebSocket(WEBSOCKET_URL);
    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onclose = () => console.log("WebSocket disconnected");
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.conversationId === currentConversation._id) {
          setMessages(prevMessages => [...prevMessages, message]);
      }
    };
    return () => ws.current.close();
  }, [currentConversation]);
  
  // Scroll to bottom of message container
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
        conversationId: currentConversation._id,
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

  const renderFile = (file) => {
    const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(file.fileName);
    const isVideo = /\.(mp4|mov|webm|mpeg|avi|flv)$/i.test(file.fileName);

    if (isAudio) {
      return (
        <>
          <p style={{color: '#00ff00'}}>{file.fileName}</p>
          <audio controls src={file.fileUrl} style={{width: '100%', marginTop: '10px'}}>
            Your browser does not support the audio element.
          </audio>
        </>
      );
    } else if (isVideo) {
      return (
        <>
          <p style={{color: '#00ff00'}}>{file.fileName}</p>
          <video controls src={file.fileUrl} style={{width: '100%', marginTop: '10px'}}>
            Your browser does not support the video tag.
          </video>
        </>
      );
    }

    return (
      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" style={{color: '#00ff00', textDecoration: 'none'}}>
        {file.fileName}
      </a>
    );
  };
  
  const handleDeleteFile = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        const response = await fetch(`${API_URL}/projects/${currentUser.email}/files/${fileId}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (response.ok) {
          alert('File deleted successfully!');
          setFiles(prevFiles => prevFiles.filter(file => file._id !== fileId));
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        alert(`Error deleting file: ${error.message}`);
      }
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'canceled' }),
        });
        const result = await response.json();
        if (response.ok) {
          alert('Booking canceled successfully!');
          setBookings(prevBookings => prevBookings.map(b => b._id === bookingId ? { ...b, status: 'canceled' } : b));
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        alert(`Error canceling booking: ${error.message}`);
      }
    }
  };


  return (
    <div>
      <button className="btn btn-secondary" onClick={handleLogout}>← Logout</button>
      <h2 style={{ color: '#00ff00', margin: '20px 0' }}>Welcome back, {currentUser.name}</h2>
      <div className="dashboard">
        {/* New Conversation List Sidebar */}
        <div className="sidebar" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <h3 style={{ color: '#00ff00', marginBottom: '15px' }}>Conversations</h3>
          {conversations.length > 0 ? (
            conversations.map(convo => (
                <div 
                    key={convo._id} 
                    onClick={() => setCurrentConversation(convo)} 
                    style={{
                        padding: '15px', 
                        backgroundColor: currentConversation?._id === convo._id ? 'rgba(0,255,0,0.2)' : 'rgba(0,255,0,0.1)',
                        border: '1px solid rgba(0,255,0,0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    <p style={{color: '#00ff00', marginBottom: '5px'}}>LTL Admin</p>
                    <p style={{color: '#888', fontSize: '12px'}}>
                        Last message: {new Date(convo.lastMessageAt).toLocaleDateString()}
                    </p>
                </div>
            ))
          ) : (
            <p style={{ color: '#888', fontSize: '12px' }}>No conversations started yet.</p>
          )}

          <h3 style={{ color: '#00ff00', marginTop: '30px', marginBottom: '15px' }}>Quick Actions</h3>
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
        
        {/* Main Content Area */}
        <div className="main-content">
          <h3 style={{ color: '#00ff00', marginBottom: '15px' }}>Messages</h3>
          <div className="message-container" ref={messageContainerRef}>
            {messages.map((msg) => (
                <div key={msg._id} className={`message ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                    <div style={{fontWeight: 'bold', marginBottom: '5px'}}>
                        {msg.sender === 'user' ? currentUser.name : 'LTL Admin'}
                    </div>
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
                  {booking.status !== 'canceled' && (
                    <button className="btn btn-secondary" style={{marginTop: '10px'}} onClick={() => handleCancelBooking(booking._id)}>
                      Cancel Booking
                    </button>
                  )}
                </div>
              )) : <p style={{ color: '#888', fontSize: '12px' }}>No active bookings found.</p>}
            </div>
          )}
          
          <h3 style={{ color: '#00ff00', margin: '30px 0 15px' }}>Project Files</h3>
          {isLoading ? <div className="loading"></div> : (
            <div id="files-list">
              {files.length > 0 ? files.map(file => (
                <div key={file._id} className="project-card">
                  {renderFile(file)}
                  <p style={{marginTop: '10px'}}>Uploaded on: {new Date(file.uploadDate).toLocaleDateString()}</p>
                  <button className="btn btn-secondary" style={{marginTop: '10px'}} onClick={() => handleDeleteFile(file._id)}>
                    Delete File
                  </button>
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