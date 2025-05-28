
import React from 'react'; // Add explicit React import
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure we have a root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found! Check your HTML file.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
