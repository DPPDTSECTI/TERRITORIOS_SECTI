import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: '50px', color: 'red', background: 'white', zIndex: 99999, position: 'fixed', inset: 0}}><h1>Crash!</h1><pre>{this.state.error.message}</pre><pre>{this.state.error.stack}</pre></div>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registrado:', registration.scope);
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('[App] Erro ao registrar Service Worker:', err);
      });
  });
}

