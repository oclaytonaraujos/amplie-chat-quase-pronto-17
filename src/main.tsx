import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initProductionOptimizations } from './utils/production-optimizations'

// Otimizações de produção
if (import.meta.env.PROD) {
  initProductionOptimizations();
}

createRoot(document.getElementById("root")!).render(<App />);
