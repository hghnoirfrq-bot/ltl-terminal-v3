import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

const LoginView = ({ setView, setCurrentUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Login failed.');
      setCurrentUser(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => setView('terminal')}>← Back to Terminal</button>
      <div className="form-container" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '20px' }}>Client Portal Access</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          
          {/* --- CORRECTED: Forgot Password Link is now here --- */}
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <a href="#" onClick={() => setView('forgot-password')} style={{ color: '#888', fontSize: '12px', textDecoration: 'none' }}>
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="btn" disabled={isLoading}>{isLoading ? <div className="loading"></div> : 'Access Portal'}</button>
          {error && <p style={{ color: '#ff0000', marginTop: '15px', textAlign: 'center' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default LoginView;
