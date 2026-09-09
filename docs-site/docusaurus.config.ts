import type { Config } from '@docusaurus/types';

const config: Config = {
  title: '2stagram',
  tagline: 'Documentation du projet',
  url: process.env.DOCS_URL ?? 'http://localhost:3001',
  baseUrl: process.env.DOCS_BASE_URL ?? '/',
  onBrokenLinks: 'throw',
  i18n: { defaultLocale: 'fr', locales: ['fr'] },
  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          exclude: ['api/generated/**'],
        },
        blog: false,
        theme: {},
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: '2stagram',
      items: [
        {
          href: 'pathname:///reference/index.html',
          label: 'Référence TypeScript',
          position: 'right',
        },
      ],
    },
  },
};

export default config;
