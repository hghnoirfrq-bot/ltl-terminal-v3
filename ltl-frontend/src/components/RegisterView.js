import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

const RegisterView = ({ setView }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevData => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Registration failed');
      }
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setView('login');
      }, 2000);
      
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
      
      <div className="form-container" style={{ maxWidth: '450px', margin: '50px auto' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '20px' }}>Create Your Account</h2>
        
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '25px' }}>
          Join the LUCTHELEO creative ecosystem and access exclusive features.
        </p>
        
        {success ? (
          <div style={{ 
            backgroundColor: 'rgba(0, 255, 0, 0.1)', 
            border: '1px solid #00ff00',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#00ff00', margin: 0 }}>
              ✓ Registration successful! Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your@email.com"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Minimum 6 characters"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
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