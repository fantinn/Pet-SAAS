import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serve o site em /Pet-SAAS/ (project page), então o build
// de produção precisa desse prefixo. Em dev mantemos "/" para não quebrar
// petshop.localhost.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Pet-SAAS/' : '/',
  server: {
    host: true,
    allowedHosts: ['petshop.localhost'],
  },
}))
