const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_SETTINGS,
  normalizeSettings,
  profileName,
  resolveProfileKind,
} = require('../bin/settings');

function observation(kind, process = 'notepad') {
  return {
    kind,
    process,
    source: 'test',
    confidence: 'high',
    timestamp: new Date(0).toISOString(),
  };
}

test('normalizes unsafe timing values', () => {
  const settings = normalizeSettings({ debounceMs: -1, returnDelayMs: 99999 });
  assert.equal(settings.debounceMs, 100);
  assert.equal(settings.returnDelayMs, 3000);
});

test('maps supported observations to context profiles', () => {
  assert.equal(resolveProfileKind(observation('text'), DEFAULT_SETTINGS), 'text');
  assert.equal(resolveProfileKind(observation('file'), DEFAULT_SETTINGS), 'file');
  assert.equal(resolveProfileKind(observation('folder'), DEFAULT_SETTINGS), 'folder');
  assert.equal(resolveProfileKind(observation('image'), DEFAULT_SETTINGS), 'image');
});

test('maps image files according to the configured mode', () => {
  assert.equal(resolveProfileKind(observation('image-file'), DEFAULT_SETTINGS), 'image');
  assert.equal(
    resolveProfileKind(
      observation('image-file'),
      { ...DEFAULT_SETTINGS, imageFileMode: 'file' }
    ),
    'file'
  );
});

test('application exclusions are case insensitive and accept .exe', () => {
  const settings = {
    ...DEFAULT_SETTINGS,
    excludedProcesses: ['PrivateEditor.exe'],
  };
  assert.equal(resolveProfileKind(observation('text', 'privateeditor'), settings), undefined);
});

test('builds device-specific bundled profile names', () => {
  assert.equal(profileName('text', 0), 'profiles/text-sd');
  assert.equal(profileName('image', 7), 'profiles/image-sdp');
  assert.equal(profileName('file', 99), undefined);
});
