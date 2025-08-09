import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Ensure Unity HTML under public/unity is served as a static file (bypass SPA fallback)
function serveUnityFromPublic() {
  return {
    name: 'serve-unity-from-public',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const originalUrl = req.url?.split('?')[0] || '';
        if (originalUrl === '/unity' || originalUrl === '/unity/') {
          // Directory access → serve the Unity index.html explicitly
          const abs = path.join(__dirname, 'public', 'unity', 'index.html');
          if (fs.existsSync(abs)) {
            res.setHeader('Content-Type', 'text/html');
            fs.createReadStream(abs).pipe(res);
            return;
          }
        }
        if (originalUrl.startsWith('/unity/')) {
          const rel = decodeURIComponent(originalUrl.replace(/^\//, ''));
          const abs = path.join(__dirname, 'public', rel);
          if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
            const ext = path.extname(abs).toLowerCase();
            const type =
              ext === '.html' ? 'text/html' :
              ext === '.js' ? 'application/javascript' :
              ext === '.wasm' ? 'application/wasm' :
              ext === '.data' ? 'application/octet-stream' :
              'application/octet-stream';
            res.setHeader('Content-Type', type);
            fs.createReadStream(abs).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveUnityFromPublic()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
