import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The root .env is shared by the server and the client build. Explicitly expose
// ONLY APP_NAME; never pass DATABASE_URL or other server secrets to the browser.
export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('../', import.meta.url));
  const env = loadEnv(mode, rootDir, '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_NAME__: JSON.stringify(env.APP_NAME || 'cpp-taskapp'),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 4000}`,
          changeOrigin: true,
        },
      },
    },
  };
});
