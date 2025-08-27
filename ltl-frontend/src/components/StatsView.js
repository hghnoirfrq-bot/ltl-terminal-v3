import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

const StatsView = ({ setView }) => {
  const [stats, setStats] = useState({ bookingCount: 0, userCount: 0, dbStatus: 'CHECKING...' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const bookingsRes = await fetch(`${API_URL}/bookings`);
        const bookingsData = await bookingsRes.json();
        
        const usersRes = await fetch(`${API_URL}/users`);
        const usersData = await usersRes.json();

        const statusRes = await fetch(`${API_URL}/test`);
        const statusData = await statusRes.json();

        setStats({
          bookingCount: bookingsData.length,
          userCount: usersData.length,
          dbStatus: statusData.database === 'Connected' ? 'CONNECTED' : 'DISCONNECTED'
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
        setStats({ bookingCount: 'N/A', userCount: 'N/A', dbStatus: 'DISCONNECTED' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => setView('terminal')}>← Back to Terminal</button>
      <h2 style={{ color: '#00ff00', margin: '20px 0' }}>System Analytics</h2>
      {isLoading ? <div className="loading" style={{margin: '50px auto'}}></div> : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.bookingCount}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.userCount}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: '16px', color: stats.dbStatus === 'CONNECTED' ? '#00ff00' : '#ff0000' }}>
              {stats.dbStatus}
            </div>
            <div className="stat-label">Database Status</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsView;
