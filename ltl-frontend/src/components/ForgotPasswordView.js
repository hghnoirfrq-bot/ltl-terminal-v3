import React, { useState } from 'react';

const API_URL = 'http://localhost:5000/api';

const ForgotPasswordView = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setMessage(result.message);
    } catch (err) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => setView('login')}>← Back to Login</button>
      <div className="form-container" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '20px' }}>Reset Password</h2>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '20px' }}>
          Enter the email address associated with your account, and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-email">Email Address</label>
            <input type="email" id="reset-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? <div className="loading"></div> : 'Send Reset Link'}
          </button>
          {message && <p style={{ color: '#00ff00', marginTop: '15px', textAlign: 'center' }}>{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
