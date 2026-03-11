import React from 'react';

export default function Sidebar({ active, onChange, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">Credere AI</div>
      <p className="side-subtitle">Corporate Credit Decisioning Engine</p>
      <button
        className={active === 'module1' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => onChange('module1')}
      >
        Financial Intake
      </button>
      <button
        className={active === 'module2' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => onChange('module2')}
      >
        Credit Intelligence
      </button>
      <button
        className={active === 'module3' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => onChange('module3')}
      >
        Decision Studio
      </button>
      <button
        className={active === 'portfolio' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => onChange('portfolio')}
      >
        Portfolio Analytics
      </button>
      <button
        className={active === 'knowledge' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => onChange('knowledge')}
      >
        AI Knowledge Hub
      </button>
      <button
        className={active === 'history' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => onChange('history')}
      >
        Analysis History
      </button>
      <button
        className={active === 'settings' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => onChange('settings')}
      >
        Settings
      </button>
      <div className="sidebar-user">
        <strong>{user?.fullName || user?.username}</strong>
        <p>{user?.role || 'BANK_USER'}</p>
        <button className="secondary" onClick={onLogout}>Sign Out</button>
      </div>
      <div className="sidebar-note">
        <strong>Target Output</strong>
        <p>Comprehensive CAM with explainable risk, limit, and pricing recommendation.</p>
      </div>
    </aside>
  );
}
