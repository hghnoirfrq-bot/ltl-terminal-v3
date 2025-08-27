import React from 'react';

const PortfolioView = ({ setView }) => {
  return (
    <div>
      <button className="btn btn-secondary" onClick={() => setView('terminal')}>← Back to Terminal</button>
      <h2 style={{ color: '#00ff00', margin: '20px 0' }}>LUCTHELEO Portfolio</h2>
      <div className="nav-cards">
        <div className="nav-card"><h3>Latest Track: "Cyber Dreams"</h3><p>Alternative R&B production featuring ethereal vocals and futuristic soundscapes.</p></div>
        <div className="nav-card"><h3>Studio Session: Beat Making</h3><p>Watch the creative process behind building atmospheric trap-soul instrumentals.</p></div>
        <div className="nav-card"><h3>Visual Art: Noir Expressions</h3><p>Digital artwork exploring the intersection of technology and human emotion.</p></div>
        <div className="nav-card"><h3>Writing Sample: "Terminal Love"</h3><p>Lyrical exploration of connection in the digital age.</p></div>
      </div>
    </div>
  );
};

export default PortfolioView;
