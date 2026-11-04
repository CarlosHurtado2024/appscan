import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { startPwa } from './ui/pwa';
import '@fontsource/libre-bodoni/latin-700.css';
import '@fontsource/courier-prime/latin-700.css';
import './ui/theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

startPwa();
