import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

// Only replace generated output; keep source documents intact.
const DESTINATION = 'docs-site/static/reference';
await rm(DESTINATION, { recursive: true, force: true });
await mkdir(DESTINATION, { recursive: true });
await cp('docs/api/generated', DESTINATION, { recursive: true });

// Docusaurus can redirect index.html to /reference without a trailing slash.
// An explicit base preserves relative stylesheet and search asset paths.
const BASE_PATH = process.env.DOCS_BASE_URL ?? '/';
const REFERENCE_PATH = new URL(
  `${BASE_PATH}reference/`,
  'http://localhost',
).pathname
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;');
const INDEX_PATH = `${DESTINATION}/index.html`;
const INDEX_HTML = await readFile(INDEX_PATH, 'utf8');
await writeFile(
  INDEX_PATH,
  INDEX_HTML.replace('<head>', `<head><base href="${REFERENCE_PATH}">`),
);
