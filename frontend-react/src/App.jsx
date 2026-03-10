import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Module1Panel from './components/Module1Panel';
import Module2Panel from './components/Module2Panel';
import Module3Panel from './components/Module3Panel';
import SettingsPanel from './components/SettingsPanel';
import IntroPage from './components/IntroPage';
import LoginPage from './components/LoginPage';
import HistoryPanel from './components/HistoryPanel';
import {
  getCurrentUser,
  getSystemLlmProviderSettings,
  logoutBankUser,
  updateSystemLlmProviderSettings,
} from './api/client';

export default function App() {
  const [active, setActive] = useState('module1');
  const [llmSettings, setLlmSettings] = useState({
    provider: 'loading',
    activeModel: 'loading',
    availableProviders: ['gemini', 'groq'],
    modelsByProvider: {
      gemini: ['gemini-2.5-flash', 'gemini-2.0-flash'],
      groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    },
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('credere_theme') || 'dark');
  const [started, setStarted] = useState(() => localStorage.getItem('credere_started') === 'true');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function refreshLlmSettings() {
    try {
      const d = await getSystemLlmProviderSettings();
      setLlmSettings((prev) => ({
        ...prev,
        provider: d?.provider || 'unknown',
        activeModel: d?.activeModel || 'unknown',
        availableProviders: d?.availableProviders || prev.availableProviders,
        modelsByProvider: d?.modelsByProvider || prev.modelsByProvider,
      }));
    } catch {
      setLlmSettings((prev) => ({
        ...prev,
        provider: 'unknown',
        activeModel: 'unknown',
      }));
    }
  }

  useEffect(() => {
    refreshLlmSettings();

    getCurrentUser()
      .then((u) => setUser(u || null))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  async function handleSaveLlmSettings(provider, model) {
    const d = await updateSystemLlmProviderSettings(provider, model);
    setLlmSettings((prev) => ({
      ...prev,
      provider: d?.provider || provider,
      activeModel: d?.activeModel || model,
      availableProviders: d?.availableProviders || prev.availableProviders,
      modelsByProvider: d?.modelsByProvider || prev.modelsByProvider,
    }));
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('credere_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('credere_started', started ? 'true' : 'false');
  }, [started]);

  if (!started) {
    return (
      <main className="content intro-shell">
        <IntroPage
          onGetStarted={() => {
            setStarted(true);
            setActive('module1');
          }}
        />
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="content intro-shell">
        <section className="card login-card">
          <h2>Loading Secure Workspace...</h2>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="content intro-shell">
        <LoginPage onLoginSuccess={setUser} />
      </main>
    );
  }

  async function handleLogout() {
    try {
      await logoutBankUser();
    } finally {
      setUser(null);
      setActive('module1');
    }
  }

  return (
    <div className="app-shell">
      <Sidebar active={active} onChange={setActive} user={user} onLogout={handleLogout} />
      <main className="content">
        <header className="header">
          <div>
            <h1>Credere AI Credit Workspace</h1>
            <p>
              Enterprise credit intelligence on Java (Spring Boot): ingest, investigate, detect fraud signals, and
              generate explainable lending recommendations.
            </p>
          </div>
          <div className="op-bar">
            <span className="chip chip-ok">Backend Online</span>
            <span className="chip chip-unknown">LLM: {llmSettings.provider} / {llmSettings.activeModel}</span>
            <span className="chip chip-low">Mode: Production Preview</span>
            <span className="chip chip-unknown">User: {user?.fullName || user?.username}</span>
            <button className="secondary header-toggle" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <button className="secondary header-toggle" onClick={handleLogout}>
              Logout
            </button>
            <button className="secondary header-toggle" onClick={() => setStarted(false)}>
              Home
            </button>
          </div>
        </header>
        {active === 'module1' ? <Module1Panel user={user} /> : null}
        {active === 'module2' ? <Module2Panel /> : null}
        {active === 'module3' ? <Module3Panel /> : null}
        {active === 'history' ? <HistoryPanel /> : null}
        {active === 'settings' ? (
          <SettingsPanel
            theme={theme}
            onThemeChange={setTheme}
            llmSettings={llmSettings}
            onSaveLlmSettings={handleSaveLlmSettings}
          />
        ) : null}
      </main>
    </div>
  );
}
