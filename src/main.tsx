import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ConfirmProvider } from './components/ConfirmDialog'
import { AlertProvider } from './components/AlertDialog'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfirmProvider>
      <AlertProvider>
        <App />
      </AlertProvider>
    </ConfirmProvider>
  </React.StrictMode>,
)
