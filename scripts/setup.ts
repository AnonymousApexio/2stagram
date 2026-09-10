import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

if (!existsSync('.env')) {
  const template = readFileSync('.env.example', 'utf8');
  writeFileSync(
    '.env',
    template.replace('changeme', randomBytes(48).toString('base64url')),
    { flag: 'wx', mode: 0o600 },
  );
  process.stdout.write('.env créé avec un secret local aléatoire.\n');
} else {
  process.stdout.write('.env existant conservé.\n');
}
