const { spawnSync } = require('child_process');
const fs = require('fs');

const testFiles = fs
  .readdirSync('test')
  .filter((file) => file.endsWith('.test.js'))
  .map((file) => `test/${file}`);

const result = spawnSync(
  process.execPath,
  ['--test', ...testFiles],
  { stdio: 'inherit' }
);
process.exit(result.status || 0);
