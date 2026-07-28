const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pluginSource = fs.readFileSync('src/plugin.ts', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

test('does not cycle through profiles to repair or warm their installation', () => {
  assert.doesNotMatch(pluginSource, /repairBundledProfiles/);
  assert.doesNotMatch(pluginSource, /scheduleProfileWarmupRetries/);
  assert.doesNotMatch(pluginSource, /profileRepairVersion/);
});

test('installs bundled profiles through the single install-time prompt', () => {
  assert.equal(manifest.Profiles.length, 24);
  for (const profile of manifest.Profiles) {
    assert.equal(profile.AutoInstall, true, profile.Name);
    assert.equal(profile.DontAutoSwitchWhenInstalled, true, profile.Name);
  }
});
