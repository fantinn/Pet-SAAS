import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './context/AppProvider'
import { ConfirmacaoProvider } from './hooks/useConfirmacao'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <ConfirmacaoProvider>
        <App />
      </ConfirmacaoProvider>
    </AppProvider>
  </React.StrictMode>,
)
