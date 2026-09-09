import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Archives without .git and production images must remain installable.
if (existsSync('.git') && process.env.HUSKY !== '0') {
  const result = spawnSync(process.execPath, ['node_modules/husky/bin.js'], {
    stdio: 'inherit',
  });
  process.exitCode = result.status ?? 1;
}
