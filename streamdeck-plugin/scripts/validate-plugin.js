const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const pluginDir = process.argv[2] || 'com.chromusx.contextdeck.sdPlugin';
const manifestPath = path.join(pluginDir, 'manifest.json');
const errors = [];

if (!fs.existsSync(manifestPath)) {
  errors.push(`Missing ${manifestPath}`);
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.UUID !== 'com.chromusx.contextdeck') errors.push('Unexpected plugin UUID.');
  if (manifest.SDKVersion !== 3) {
    errors.push('Marketplace builds require manifest SDKVersion 3 for DRM.');
  }
  if (Number.parseFloat(manifest.Software?.MinimumVersion || '0') < 6.9) {
    errors.push('DRM requires Stream Deck Software.MinimumVersion 6.9 or newer.');
  }
  if (manifest.Actions?.[0]?.UUID !== 'com.chromusx.contextdeck.control') {
    errors.push('ContextDeck control action is missing.');
  }
  if (!Array.isArray(manifest.Profiles) || manifest.Profiles.length !== 24) {
    errors.push('Expected 24 generated context profiles.');
  }
  for (const profile of manifest.Profiles || []) {
    const profilePath = path.join(pluginDir, `${profile.Name}.streamDeckProfile`);
    if (!fs.existsSync(profilePath)) errors.push(`Missing profile: ${profilePath}`);
    if (profile.Readonly !== false) errors.push(`Profile must be editable: ${profile.Name}`);
    if (fs.existsSync(profilePath)) validateProfile(profilePath, profile.Name);
  }
}

for (const file of [
  'bin/plugin.js',
  'bin/settings.js',
  'ui/property-inspector.html',
  'ContextDeck.Helper.exe',
  'imgs/plugin-icon.png',
  'imgs/plugin-icon@2x.png',
  'imgs/action-icon.png',
  'imgs/action-icon@2x.png',
  'imgs/category-icon.png',
  'imgs/category-icon@2x.png',
  'node_modules/ws/index.js',
]) {
  if (!fs.existsSync(path.join(pluginDir, file))) errors.push(`Missing required file: ${file}`);
}

if (errors.length) {
  for (const error of errors) console.error(`Error: ${error}`);
  process.exit(1);
}

console.log(`Validated ${pluginDir}.`);

function validateProfile(profilePath, profileName) {
  let entries;
  try {
    entries = new AdmZip(profilePath).getEntries();
  } catch (error) {
    errors.push(`Invalid profile ZIP ${profileName}: ${error.message}`);
    return;
  }

  const manifests = entries.filter(
    (entry) => !entry.isDirectory && entry.entryName.endsWith('/manifest.json')
  );
  const directories = new Set(
    entries.filter((entry) => entry.isDirectory).map((entry) => entry.entryName)
  );
  if (manifests.length < 2) {
    errors.push(`Profile has an incomplete structure: ${profileName}`);
    return;
  }
  if (![...directories].some((entryName) => entryName.endsWith('/Profiles/'))) {
    errors.push(`Profile is missing its Profiles directory entry: ${profileName}`);
  }
  if (![...directories].some((entryName) => entryName.endsWith('/Images/'))) {
    errors.push(`Profile is missing page Images directory entries: ${profileName}`);
  }

  let bundledActions = 0;
  let rootManifest;
  for (const entry of manifests) {
    let json;
    try {
      json = JSON.parse(entry.getData().toString('utf8'));
    } catch (error) {
      errors.push(`Invalid profile manifest in ${profileName}: ${error.message}`);
      continue;
    }

    if (entry.entryName.split('/').filter(Boolean).length === 2) {
      rootManifest = json;
    }

    const serialized = JSON.stringify(json);
    if (serialized.includes('com.elgato.lightsout')) {
      errors.push(`Template action leaked into profile: ${profileName}`);
    }
    for (const controller of json.Controllers || []) {
      bundledActions += Object.keys(controller.Actions || {}).length;
    }
  }

  if (bundledActions !== 0) {
    errors.push(`Bundled profile must be empty: ${profileName} contains ${bundledActions} action(s).`);
  }

  const deviceSlug = path.basename(profileName).replace(
    /^(text|file|folder|image)-/,
    ''
  );
  const templatePath = path.join('profiles', 'templates', `${deviceSlug}.streamDeckProfile`);
  if (rootManifest && fs.existsSync(templatePath)) {
    const templateRoot = new AdmZip(templatePath)
      .getEntries()
      .find(
        (entry) =>
          !entry.isDirectory &&
          entry.entryName.endsWith('/manifest.json') &&
          entry.entryName.split('/').filter(Boolean).length === 2
      );
    const templateManifest = templateRoot
      ? JSON.parse(templateRoot.getData().toString('utf8'))
      : undefined;
    if (
      !templateManifest ||
      JSON.stringify(rootManifest.Pages) !== JSON.stringify(templateManifest.Pages)
    ) {
      errors.push(`Profile page identity differs from its exported template: ${profileName}`);
    }
  }
}
