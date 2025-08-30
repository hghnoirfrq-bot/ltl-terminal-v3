import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

const RegisterView = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Registration failed.');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => setView('terminal')}>
        ← Back to Terminal
      </button>
      <div className="form-container" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '20px' }}>CREATE ACCOUNT</h2>
        
        {success ? (
          <p style={{ color: '#00ff00', textAlign: 'center', fontSize: '14px' }}>
            Account created successfully! You can now log in.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="register-name">Full Name</label>
              <input 
                type="text" 
                id="register-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-email">Email Address</label>
              <input 
                type="email" 
                id="register-email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="Enter your email address"
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input 
                type="password" 
                id="register-password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Create a password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                placeholder="Re-enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn" 
              disabled={isLoading}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {isLoading ? <div className="loading"></div> : 'CREATE ACCOUNT'}
            </button>
            
            {error && (
              <p style={{ 
                color: '#ff0000', 
                marginTop: '15px', 
                textAlign: 'center',
                fontSize: '14px' 
              }}>
                {error}
              </p>
            )}
          </form>
        )}
        
        <div style={{ 
          marginTop: '25px', 
          paddingTop: '20px', 
          borderTop: '1px solid rgba(0, 255, 0, 0.2)',
          textAlign: 'center'
        }}>
          <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
            Already have an account?
          </p>
          <button 
            className="btn btn-secondary" 
            onClick={() => setView('login')}
            style={{ width: '100%' }}
          >
            Sign In Instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;