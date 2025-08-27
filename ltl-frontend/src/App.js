import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // Import router components
import './App.css';

// Import all the view components
import TerminalView from './components/TerminalView';
import BookingView from './components/BookingView';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import PortfolioView from './components/PortfolioView';
import StatsView from './components/StatsView';
import ForgotPasswordView from './components/ForgotPasswordView';
import ResetPasswordView from './components/ResetPasswordView'; // New import

function App() {
  return (
    <div className="App">
      <div className="matrix-bg"></div>
      <div className="alert-container"></div>
      <div className="terminal-container">
        <Routes>
          {/* Route for the main application */}
          <Route path="/" element={<MainApp />} />
          {/* Route for the password reset page */}
          <Route path="/reset/:token" element={<ResetPasswordView />} />
        </Routes>
      </div>
    </div>
  );
}

// We've moved the original app logic into its own component
// so the router can manage what's being displayed.
const MainApp = () => {
  const [view, setView] = useState('terminal');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const handleSetView = (newView) => {
    // This makes sure we are at the base URL when changing views
    navigate('/'); 
    setView(newView);
  }

  const renderView = () => {
    if (currentUser) {
      switch (view) {
        case 'booking':
          return <BookingView setView={handleSetView} />;
        case 'portfolio':
          return <PortfolioView setView={handleSetView} />;
        case 'stats':
          return <StatsView setView={handleSetView} />;
        case 'terminal':
          return <TerminalView setView={handleSetView} />;
        default:
          return <DashboardView currentUser={currentUser} setCurrentUser={setCurrentUser} setView={handleSetView} />;
      }
    }

    switch (view) {
      case 'terminal':
        return <TerminalView setView={handleSetView} />;
      case 'booking':
        return <BookingView setView={handleSetView} />;
      case 'login':
        return <LoginView setView={handleSetView} setCurrentUser={setCurrentUser} />;
      case 'portfolio':
        return <PortfolioView setView={handleSetView} />;
      case 'stats':
        return <StatsView setView={handleSetView} />;
      case 'forgot-password':
        return <ForgotPasswordView setView={handleSetView} />;
      default:
        return <TerminalView setView={handleSetView} />;
    }
  };

  return renderView();
}

export default App;
