import React, { useState, useEffect, useRef } from 'react';

const TerminalView = ({ setView }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([
    { type: 'line', text: '╔════════════════════════════════════════════════════╗' },
    { type: 'line', text: '║     LUCTHELEO TERMINAL - CREATIVE COACHING        ║' },
    { type: 'line', text: '║   Alternative R&B • Cyber Neo Louisiana • Music   ║' },
    { type: 'line', text: '╚════════════════════════════════════════════════════╝' },
    { type: 'line', text: '' },
    { type: 'line', text: 'Welcome to the LUCTHELEO creative ecosystem (React Version).' },
    { type: 'line', text: 'System Status: ONLINE' },
    { type: 'line', text: "Type 'help' for available commands or use the navigation below." },
  ]);
  const terminalBodyRef = useRef(null);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [output]);

  const commands = {
    help: () => `Available commands:\n• help\n• clear\n• status\n• book\n• register\n• login\n• portfolio\n• about\n• stats`,
    clear: () => { setOutput([]); return ''; },
    book: () => { setView('booking'); return 'Opening booking system...'; },
    register: () => { setView('register'); return 'Opening registration portal...'; },
    login: () => { setView('login'); return 'Accessing client portal...'; },
    portfolio: () => { setView('portfolio'); return 'Loading portfolio...'; },
    stats: () => { setView('stats'); return 'Loading analytics...'; },
    about: () => `LUCTHELEO Terminal v3.0\nCreative Coaching & Music Production\nServices: $75/session`,
    status: () => 'System Status: ONLINE (React Version)'
  };

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const command = input.trim().toLowerCase();
      const newOutput = [...output, { type: 'command', text: command }];
      if (command) {
        const commandOutput = commands[command] ? commands[command]() : `Command not found: ${command}.`;
        if (commandOutput) {
          newOutput.push({ type: 'line', text: commandOutput });
        }
      }
      setOutput(newOutput);
      setInput('');
    }
  };

  return (
    <div>
      <div className="terminal-window">
        <div className="terminal-header">
          <span className="terminal-button red"></span>
          <span className="terminal-button yellow"></span>
          <span className="terminal-button green"></span>
          <span className="terminal-title">LUCTHELEO TERMINAL v3.0 - REACT EDITION</span>
        </div>
        <div className="terminal-body" ref={terminalBodyRef}>
          <div className="terminal-output">
            {output.map((line, index) => (
              <div key={index} className="terminal-line">
                {line.type === 'command' && <span className="prompt">ltl@terminal:~$ </span>}
                {line.text}
              </div>
            ))}
          </div>
          <div className="command-line">
            <span className="prompt">ltl@terminal:~$</span>
            <input 
              type="text" 
              className="terminal-input" 
              autoFocus 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={handleCommand} 
            />
            <span className="cursor"></span>
          </div>
        </div>
      </div>
      
      <div className="nav-cards">
        <div className="nav-card" onClick={() => setView('booking')}>
          <h3>BOOK SESSION</h3>
          <p>Schedule your creative coaching session. $75/hour.</p>
        </div>
        <div className="nav-card" onClick={() => setView('register')}>
          <h3>CREATE ACCOUNT</h3>
          <p>Join the LUCTHELEO ecosystem and unlock exclusive features.</p>
        </div>
        <div className="nav-card" onClick={() => setView('login')}>
          <h3>CLIENT PORTAL</h3>
          <p>Access your dashboard, projects, and session history.</p>
        </div>
        <div className="nav-card" onClick={() => setView('portfolio')}>
          <h3>PORTFOLIO</h3>
          <p>Explore LUCTHELEO's creative works.</p>
        </div>
        <div className="nav-card" onClick={() => setView('stats')}>
          <h3>SYSTEM STATUS</h3>
          <p>Live analytics and system performance metrics.</p>
        </div>
      </div>
    </div>
  );
};

export default TerminalView;
