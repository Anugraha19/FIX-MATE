import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite is the dev server + build tool for React (the modern replacement for Webpack in this project).
// The proxy sends every /api request to the Express server, so the browser never has CORS problems in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
