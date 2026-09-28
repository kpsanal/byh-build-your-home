import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

function Navigation({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🏗️ Expense Manager
        </Link>

        <div className="nav-menu">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/projects" className="nav-link">Projects</Link>
          <Link to="/expenses" className="nav-link">Expenses</Link>
          <Link to="/reports" className="nav-link">Reports</Link>
        </div>

        <div className="nav-right">
          <span className="nav-user">Welcome, {user?.name || 'User'}</span>
          <button onClick={handleLogout} className="nav-logout">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
