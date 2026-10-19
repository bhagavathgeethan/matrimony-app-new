import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import App from './App.jsx';
import { languageReady } from '@shared/i18n';

// Wait for the saved interface language so the first screen is already translated
languageReady.then(() => ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
));
