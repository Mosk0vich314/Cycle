import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { CycleProvider } from './context/CycleContext.jsx';
import './index.css';

// PWA auto-update: when a new service worker takes control after a deploy, reload the
// page so the user sees the latest version without a manual hard-refresh.
if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CycleProvider>
      <App />
    </CycleProvider>
  </React.StrictMode>
);
