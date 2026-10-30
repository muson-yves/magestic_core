const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tasks = ['dev:backend', 'dev:frontend'];
const npmCli = process.env.npm_execpath;
const children = [];
let closedCount = 0;
let stopping = false;
let exitCode = 0;

function stopAll(code, source) {
  if (!stopping) {
    stopping = true;
    exitCode = code;
  } else if (code && exitCode === 0) {
    exitCode = code;
  }

  for (const child of children) {
    if (
      child !== source &&
      child.exitCode === null &&
      child.signalCode === null
    ) {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', () => stopAll(130));
process.on('SIGTERM', () => stopAll(143));

for (const task of tasks) {
  const command = npmCli
    ? process.execPath
    : process.platform === 'win32'
      ? 'npm.cmd'
      : 'npm';
  const args = npmCli
    ? [npmCli, 'run', task]
    : ['run', task];

  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: !npmCli && process.platform === 'win32',
  });

  children.push(child);

  child.on('error', (error) => {
    console.error(`Unable to start ${task}: ${error.message}`);
    stopAll(1, child);
  });

  child.on('close', (code) => {
    closedCount += 1;

    if (!stopping) {
      stopAll(code ?? 1, child);
    } else if (code && exitCode === 0) {
      exitCode = code;
    }

    if (closedCount === tasks.length) {
      process.exitCode = exitCode;
    }
  });
}
