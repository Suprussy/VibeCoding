const { spawn, exec } = require('child_process');

const dev = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: __dirname
});

let opened = false;
dev.stdout.on('data', (data) => {
  process.stdout.write(data);
  if (!opened) {
    const match = data.toString().match(/http:\/\/localhost:\d+/);
    if (match) {
      opened = true;
      exec('start ' + match[0]);
    }
  }
});

dev.stderr.on('data', (data) => {
  process.stderr.write(data);
});

dev.on('close', (code) => {
  process.exit(code);
});
