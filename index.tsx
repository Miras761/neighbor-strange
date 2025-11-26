import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Access document via window cast since global document type might be missing
const doc = (window as any).document;
const rootElement = doc.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Fix: Add missing React Three Fiber intrinsic elements to global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      group: any;
      mesh: any;
      primitive: any;
      boxGeometry: any;
      planeGeometry: any;
      capsuleGeometry: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      [elemName: string]: any;
    }
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);