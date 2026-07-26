const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { spawnSync } = require('child_process');

const pluginDir = 'com.chromusx.contextdeck.sdPlugin';
const outputFile = 'com.chromusx.contextdeck.streamDeckPlugin';

const validation = spawnSync(
  process.execPath,
  [path.join('scripts', 'validate-plugin.js'), pluginDir],
  { stdio: 'inherit' }
);
if (validation.status !== 0) process.exit(validation.status || 1);

fs.rmSync(outputFile, { force: true });
const zip = new AdmZip();
addDirectory(pluginDir, pluginDir);
zip.writeZip(outputFile);

const sizeMb = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
console.log(`Created ${outputFile} (${sizeMb} MB)`);

function addDirectory(directory, zipBasePath) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const zipPath = path.join(zipBasePath, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) addDirectory(fullPath, zipPath);
    else zip.addFile(zipPath, fs.readFileSync(fullPath));
  }
}
