import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Access document via window cast since global document type might be missing
const doc = (window as any).document;
const rootElement = doc.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);