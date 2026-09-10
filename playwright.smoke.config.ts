import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.SMOKE_PORT ?? 4183);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/smoke',
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [360, 768, 1280].map((width) => ({
    name: `${width}px`,
    use: { viewport: { width, height: 900 } },
  })),
  webServer: {
    command:
      'npm run build && node node_modules/vite/bin/vite.js preview ' +
      `frontend --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
  },
});
