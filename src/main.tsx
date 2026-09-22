import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerPushServiceWorker } from './utils/pushManager.ts';

// Pre-register service worker on startup for reliable background push notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerPushServiceWorker().catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
