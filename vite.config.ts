import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks to api.openverse.org directly (Openverse sends
// `Access-Control-Allow-Origin: *`), so no proxy is required. The dev server
// binds 0.0.0.0 and accepts any Host so the sandbox preview host works.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: 443, protocol: 'wss' },
  },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
});
