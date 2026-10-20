import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthProvider.jsx'
import Root from './Root.jsx'
import './index.css'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { supabase } from './services/supabaseClient.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {supabase ? <ErrorBoundary><AuthProvider>
      <Root />
    </AuthProvider></ErrorBoundary> : <main className="p-8"><h1 className="text-xl font-semibold">Configuração pendente</h1><p>Configure a conexão com o Supabase para iniciar o sistema.</p></main>}
  </React.StrictMode>,
)
