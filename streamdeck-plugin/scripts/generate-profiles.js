const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const templateDir = path.join('profiles', 'templates');
const outputDir = path.join('profiles', 'generated');
const profileFormatVersion = '3';
const deviceTemplates = ['sd', 'sd-mini', 'sdxl', 'sd-mobile', 'sdp', 'sd-neo'];
const contexts = [
  { kind: 'text', label: 'Text' },
  { kind: 'file', label: 'File' },
  { kind: 'folder', label: 'Folder' },
  { kind: 'image', label: 'Image' },
];

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const device of deviceTemplates) {
  const templatePath = path.join(templateDir, `${device}.streamDeckProfile`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing profile template: ${templatePath}`);
  }

  for (const context of contexts) {
    generateProfile(templatePath, device, context);
  }
}

console.log(`Generated ${deviceTemplates.length * contexts.length} ContextDeck profiles.`);

function generateProfile(templatePath, device, context) {
  const sourceZip = new AdmZip(templatePath);
  const outputZip = new AdmZip();
  const seed = `${profileFormatVersion}:${device}:${context.kind}`;
  const rootEntry = sourceZip
    .getEntries()
    .map((entry) => entry.entryName.split('/')[0])
    .find((name) => name.endsWith('.sdProfile'));

  if (!rootEntry) throw new Error(`Invalid profile template: ${templatePath}`);

  const newRoot = `${deterministicUuid(seed, rootEntry).toUpperCase()}.sdProfile`;

  for (const entry of sourceZip.getEntries()) {
    const relative = entry.entryName.slice(rootEntry.length);
    const targetName = `${newRoot}${relative}`;

    if (entry.isDirectory) {
      outputZip.addFile(
        targetName.endsWith('/') ? targetName : `${targetName}/`,
        Buffer.alloc(0)
      );
      continue;
    }

    let data = entry.getData();

    if (entry.entryName.endsWith('/manifest.json')) {
      const manifest = JSON.parse(data.toString('utf8'));
      const depth = entry.entryName.split('/').filter(Boolean).length;
      if (depth === 2) {
        manifest.Name = `ContextDeck — ${context.label}`;
        manifest.Device.UUID = '';
      } else if (Array.isArray(manifest.Controllers)) {
        for (const controller of manifest.Controllers) {
          controller.Actions = {};
        }
      }
      data = Buffer.from(JSON.stringify(manifest), 'utf8');
    }

    outputZip.addFile(targetName, data);
  }

  const outputPath = path.join(outputDir, `${context.kind}-${device}.streamDeckProfile`);
  outputZip.writeZip(outputPath);
}

function deterministicUuid(seed, value) {
  const hash = crypto.createHash('sha256').update(`${seed}:${value}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `a${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}
