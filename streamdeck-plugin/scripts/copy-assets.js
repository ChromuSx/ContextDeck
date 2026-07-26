const fs = require('fs');
const path = require('path');

const pluginDir = 'com.chromusx.contextdeck.sdPlugin';

fs.rmSync(pluginDir, { recursive: true, force: true });
fs.mkdirSync(pluginDir, { recursive: true });

copyFile('manifest.json', path.join(pluginDir, 'manifest.json'));
copyDirectory('bin', path.join(pluginDir, 'bin'), (file) => file.endsWith('.js'));
copyDirectory('ui', path.join(pluginDir, 'ui'));
copyDirectory('imgs', path.join(pluginDir, 'imgs'));
copyDirectory(path.join('profiles', 'generated'), path.join(pluginDir, 'profiles'));

const helperSource = path.join(
  'native',
  'ContextDeck.Helper',
  'bin',
  'Release',
  'net8.0-windows10.0.19041.0',
  'win-x64',
  'publish',
  'ContextDeck.Helper.exe'
);

copyFile(helperSource, path.join(pluginDir, 'ContextDeck.Helper.exe'));
copyProductionDependency('ws');
console.log('ContextDeck build assets copied.');

function copyProductionDependency(name) {
  const source = path.join('node_modules', name);
  const dest = path.join(pluginDir, 'node_modules', name);
  if (!fs.existsSync(source)) throw new Error(`Required dependency not found: ${name}`);
  copyDirectory(source, dest);
}

function copyDirectory(source, dest, predicate) {
  if (!fs.existsSync(source)) throw new Error(`Required directory not found: ${source}`);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath, predicate);
    } else if (!predicate || predicate(entry.name)) {
      copyFile(sourcePath, destPath);
    }
  }
}

function copyFile(source, dest) {
  if (!fs.existsSync(source)) throw new Error(`Required file not found: ${source}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
}
