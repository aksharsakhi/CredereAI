import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Credere frontend runtime error', error, info);
  }

  handleReset = () => {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('credere_'))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage cleanup failures and still reload.
    }
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <main className="content intro-shell">
          <section className="card login-card">
            <p className="intro-kicker">Recovery Mode</p>
            <h2>Workspace failed to render</h2>
            <p className="login-subtext">
              A browser-side runtime error interrupted the UI. Reset local session data and reload the workspace.
            </p>
            <div className="actions">
              <button type="button" onClick={this.handleReset}>Reset Local Session</button>
            </div>
            <p className="error" style={{ marginTop: '12px' }}>
              {this.state.error?.message || 'Unknown frontend error'}
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
