import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core'

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-app');
}

createRoot(document.getElementById("root")!).render(<App />);
