import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the frontend runs on :5173 and forwards /api to the FastAPI backend on :8000.
// Deploy: set VITE_API_URL (e.g. https://your-backend.onrender.com) before `npm run build`.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:8000' } },
});
