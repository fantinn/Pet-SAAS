import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthProvider.jsx'
import Root from './Root.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
)
