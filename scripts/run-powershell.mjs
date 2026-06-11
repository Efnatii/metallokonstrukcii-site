import { spawnSync } from 'node:child_process';
import process from 'node:process';

const [, , scriptPath, ...scriptArgs] = process.argv;

if (!scriptPath) {
  console.error('Usage: node scripts/run-powershell.mjs <script.ps1> [args...]');
  process.exit(1);
}

const candidates = [
  process.env.POWERSHELL,
  process.platform === 'win32' ? 'powershell' : 'pwsh',
  process.platform === 'win32' ? 'pwsh' : 'powershell'
].filter(Boolean);

let lastError = null;

for (const executable of candidates) {
  const args = ['-NoProfile'];

  if (process.platform === 'win32') {
    args.push('-ExecutionPolicy', 'Bypass');
  }

  args.push('-File', scriptPath, ...scriptArgs);

  const result = spawnSync(executable, args, { stdio: 'inherit' });

  if (result.error && result.error.code === 'ENOENT') {
    lastError = result.error;
    continue;
  }

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 0);
}

console.error(`PowerShell executable was not found: ${lastError?.message || 'unknown error'}`);
process.exit(1);
