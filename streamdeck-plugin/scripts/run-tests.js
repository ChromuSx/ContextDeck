const { spawnSync } = require('child_process');

const result = spawnSync(
  process.execPath,
  ['--test', 'test/settings.test.js'],
  { stdio: 'inherit' }
);
process.exit(result.status || 0);
