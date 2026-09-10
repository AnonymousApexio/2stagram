import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

export default defineConfig(() => {
  // Read the port without leaking the backend NODE_ENV into the React build.
  const envPath = fileURLToPath(new URL('../.env', import.meta.url));
  const env = existsSync(envPath)
    ? parseEnv(readFileSync(envPath, 'utf8'))
    : {};
  const port = process.env.PORT ?? env.PORT ?? '3000';
  const target = `http://127.0.0.1:${port}`;
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target },
        '/socket.io': { target, ws: true },
      },
    },
  };
});
