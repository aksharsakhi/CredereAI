import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Module1Panel from './components/Module1Panel';
import Module2Panel from './components/Module2Panel';
import Module3Panel from './components/Module3Panel';
import SettingsPanel from './components/SettingsPanel';
import IntroPage from './components/IntroPage';
import LoginPage from './components/LoginPage';
import HistoryPanel from './components/HistoryPanel';
import PortfolioPanel from './components/PortfolioPanel';
import KnowledgePanel from './components/KnowledgePanel';
import {
  getCurrentUser,
  getSystemLlmProviderSettings,
  logoutBankUser,
  updateSystemLlmProviderSettings,
} from './api/client';

function safeStorageGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so the UI keeps working in restricted browsers.
  }
}

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
  const [theme, setTheme] = useState(() => safeStorageGet('credere_theme', 'dark') || 'dark');
  const [started, setStarted] = useState(() => safeStorageGet('credere_started', 'false') === 'true');
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
    safeStorageSet('credere_theme', theme);
  }, [theme]);

  useEffect(() => {
    safeStorageSet('credere_started', started ? 'true' : 'false');
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
          </div>
        </header>
        {active === 'module1' ? <Module1Panel user={user} /> : null}
        {active === 'module2' ? <Module2Panel /> : null}
        {active === 'module3' ? <Module3Panel /> : null}
        {active === 'portfolio' ? <PortfolioPanel /> : null}
        {active === 'knowledge' ? <KnowledgePanel /> : null}
        {active === 'history' ? <HistoryPanel /> : null}
        {active === 'settings' ? (
          <SettingsPanel
            theme={theme}
            onThemeChange={setTheme}
            llmSettings={llmSettings}
            onSaveLlmSettings={handleSaveLlmSettings}
            user={user}
            onLogout={handleLogout}
            onGoHome={() => setStarted(false)}
          />
        ) : null}
      </main>
    </div>
  );
}
