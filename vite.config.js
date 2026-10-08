import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Explicitly bind IPv4 for local network / mobile access
    port: 5173,
    strictPort: true, // Do not silently jump to 5174 if port is occupied
  },
})
