import React, { useEffect, useMemo, useState } from 'react';

export default function SettingsPanel({ 
  theme, 
  onThemeChange, 
  llmSettings, 
  onSaveLlmSettings, 
  user, 
  onLogout, 
  onGoHome 
}) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(15);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const providers = llmSettings?.availableProviders || ['gemini', 'groq'];
  const modelsByProvider = llmSettings?.modelsByProvider || {};
  const selectedProviderModels = useMemo(() => modelsByProvider[selectedProvider] || [], [modelsByProvider, selectedProvider]);

  useEffect(() => {
    const provider = llmSettings?.provider || 'gemini';
    const model = llmSettings?.activeModel || (modelsByProvider[provider] || [])[0] || '';
    setSelectedProvider(provider);
    setSelectedModel(model);
  }, [llmSettings, modelsByProvider]);

  async function handleSaveLlm() {
    if (!selectedProvider || !selectedModel) {
      setStatus('Select both provider and model.');
      return;
    }

    setSaving(true);
    setStatus('');
    try {
      await onSaveLlmSettings(selectedProvider, selectedModel);
      setStatus('LLM settings updated successfully.');
    } catch (e) {
      setStatus(e?.message || 'Failed to update LLM settings.');
    } finally {
      setSaving(false);
    }
  }

  function handleProviderChange(nextProvider) {
    setSelectedProvider(nextProvider);
    const models = modelsByProvider[nextProvider] || [];
    setSelectedModel(models[0] || '');
    setStatus('');
  }

  return (
    <section className="panel">
      <h2>System Settings</h2>
      
      <div className="card">
        <h3>System Status</h3>
        <div className="op-bar" style={{ margin: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="chip chip-ok">Backend Online</span>
          <span className="chip chip-unknown">LLM: {llmSettings.provider} / {llmSettings.activeModel}</span>
          <span className="chip chip-low">Mode: Production Preview</span>
          <span className="chip chip-unknown">User: {user?.fullName || user?.username}</span>
        </div>
        <div className="actions" style={{ marginTop: '1rem' }}>
          <button className="secondary" onClick={onGoHome}>Go to Home Page</button>
          <button className="secondary" onClick={onLogout}>Logout Session</button>
        </div>
      </div>

      <div className="card">
        <h3>Platform Preferences</h3>
        <div className="form-grid">
          <label>
            Theme Mode
            <select value={theme} onChange={(e) => onThemeChange(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label>
            LLM Provider
            <select value={selectedProvider} onChange={(e) => handleProviderChange(e.target.value)}>
              {providers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            LLM Model
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {selectedProviderModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Auto Refresh Dashboards
            <select value={autoRefresh ? 'enabled' : 'disabled'} onChange={(e) => setAutoRefresh(e.target.value === 'enabled')}>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label>
            Risk Alert Threshold
            <input type="number" value={alertThreshold} min={0} max={30} onChange={(e) => setAlertThreshold(Number(e.target.value))} />
          </label>
        </div>
        <div className="actions">
          <button type="button" onClick={handleSaveLlm} disabled={saving || !selectedModel}>
            {saving ? 'Saving...' : 'Save LLM Settings'}
          </button>
        </div>
        {status ? <p className="muted-note">{status}</p> : null}
      </div>

      <div className="card">
        <h3>Environment Snapshot</h3>
        <ul className="insight-list">
          <li>Upload limit configured in backend to support large annual reports.</li>
          <li>Provider routing supports Gemini and Groq with runtime switching from Settings.</li>
          <li>Use dark mode for operator rooms and light mode for executive walkthroughs.</li>
        </ul>
      </div>
    </section>
  );
}
