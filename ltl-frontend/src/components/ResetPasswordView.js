import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const ResetPasswordView = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { token } = useParams(); // Gets the token from the URL
  const navigate = useNavigate(); // To redirect the user after success

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setMessage(result.message + " Redirecting to login...");
      setTimeout(() => navigate('/'), 2000); // Redirect to home/login page
    } catch (err) {
      setMessage(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="form-container" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '20px' }}>Set New Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input type="password" id="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? <div className="loading"></div> : 'Reset Password'}
          </button>
          {message && <p style={{ color: '#00ff00', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordView;
