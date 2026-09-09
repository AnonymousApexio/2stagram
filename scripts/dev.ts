import { spawn } from 'node:child_process';

const COMMANDS = [
  [
    'node_modules/typescript/bin/tsc',
    '-p',
    'shared/tsconfig.build.json',
    '--watch',
  ],
  ['--env-file-if-exists=.env', '--watch', 'backend/src/server.ts'],
  [
    'node_modules/vite/bin/vite.js',
    '--config',
    'frontend/vite.config.ts',
    'frontend',
  ],
];
const CHILDREN = COMMANDS.map((args) =>
  spawn(process.execPath, args, { stdio: 'inherit' }),
);
let isStopping = false;

function stop(exitCode: number): void {
  if (isStopping) return;
  isStopping = true;
  for (const child of CHILDREN) child.kill('SIGTERM');
  process.exitCode = exitCode;
}

for (const child of CHILDREN) {
  child.on('error', () => stop(1));
  child.on('exit', (code) => stop(code ?? 1));
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
