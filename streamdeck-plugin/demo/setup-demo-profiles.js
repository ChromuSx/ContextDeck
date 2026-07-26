const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const pluginUuid = "com.chromusx.contextdeck";
const contextColors = {
  text: ["#06b6d4", "#2563eb"],
  file: ["#3b82f6", "#1d4ed8"],
  folder: ["#8b5cf6", "#6d28d9"],
  image: ["#d946ef", "#7c3aed"],
};

const profiles = {
  text: [
    ["COPY", "C", {key: "C", ctrl: true}],
    ["FIND", "F", {key: "F", ctrl: true}],
    ["BOLD", "B", {key: "B", ctrl: true}],
    ["ITALIC", "I", {key: "I", ctrl: true}],
    ["UNDO", "Z", {key: "Z", ctrl: true}],
    ["SELECT", "A", {key: "A", ctrl: true}],
    ["CUT", "X", {key: "X", ctrl: true}],
    ["PASTE", "V", {key: "V", ctrl: true}],
  ],
  file: [
    ["OPEN", "↵", {key: "ENTER"}],
    ["COPY", "C", {key: "C", ctrl: true}],
    ["CUT", "X", {key: "X", ctrl: true}],
    ["RENAME", "F2", {key: "F2"}],
    ["PROPS", "i", {key: "ENTER", alt: true}],
    ["DELETE", "DEL", {key: "DELETE"}],
    ["PATH", "#", {key: "C", ctrl: true, shift: true}],
    ["NEW", "+", {key: "N", ctrl: true, shift: true}],
  ],
  folder: [
    ["OPEN", "↵", {key: "ENTER"}],
    ["COPY", "C", {key: "C", ctrl: true}],
    ["CUT", "X", {key: "X", ctrl: true}],
    ["RENAME", "F2", {key: "F2"}],
    ["NEW DIR", "+", {key: "N", ctrl: true, shift: true}],
    ["PROPS", "i", {key: "ENTER", alt: true}],
    ["PATH", "#", {key: "C", ctrl: true, shift: true}],
    ["DELETE", "DEL", {key: "DELETE"}],
  ],
  image: [
    ["OPEN", "↵", {key: "ENTER"}],
    ["COPY", "C", {key: "C", ctrl: true}],
    ["CUT", "X", {key: "X", ctrl: true}],
    ["RENAME", "F2", {key: "F2"}],
    ["PREVIEW", "P", {key: "P", alt: true}],
    ["PROPS", "i", {key: "ENTER", alt: true}],
    ["MENU", "≡", {key: "F10", shift: true}],
    ["DELETE", "DEL", {key: "DELETE"}],
  ],
};

const keyDefinitions = {
  ENTER: {nativeCode: 13, qtKeyCode: 16777220, vKeyCode: 13},
  DELETE: {nativeCode: 46, qtKeyCode: 16777223, vKeyCode: 46},
  F2: {nativeCode: 113, qtKeyCode: 16777265, vKeyCode: 113},
  F10: {nativeCode: 121, qtKeyCode: 16777273, vKeyCode: 121},
};

async function main() {
  const serial = process.argv[2];
  if (!serial) {
    throw new Error(
      "Usage: node demo/setup-demo-profiles.js <STREAM_DECK_SERIAL> [BACKUP_DIRECTORY]",
    );
  }
  const profileRoot = path.join(
    process.env.APPDATA,
    "Elgato",
    "StreamDeck",
    "ProfilesV3",
  );
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot =
    process.argv[3] ||
    path.join(os.tmpdir(), `contextdeck-demo-profiles-${timestamp}`);

  fs.mkdirSync(backupRoot, {recursive: true});
  const matches = findContextProfiles(profileRoot, serial);
  if (matches.size !== 4) {
    throw new Error(
      `Expected four ContextDeck profiles for ${serial}, found ${matches.size}`,
    );
  }

  const report = [];
  for (const [kind, profile] of matches) {
    const backup = path.join(backupRoot, path.basename(profile.directory));
    fs.cpSync(profile.directory, backup, {recursive: true, errorOnExist: true});

    const pageDirectory = path.join(
      profile.directory,
      "Profiles",
      profile.manifest.Pages.Current,
    );
    const imagesDirectory = path.join(pageDirectory, "Images");
    fs.mkdirSync(imagesDirectory, {recursive: true});

    const actions = {};
    const definitions = profiles[kind];
    for (let index = 0; index < definitions.length; index++) {
      const [label, symbol, shortcut] = definitions[index];
      const coordinate = `${index % 4},${Math.floor(index / 4)}`;
      const imageName = `ContextDeckDemo-${kind}-${index + 1}.png`;
      await renderIcon(
        path.join(imagesDirectory, imageName),
        contextColors[kind],
        label,
        symbol,
      );
      actions[coordinate] = hotkeyAction(
        label,
        `Images/${imageName}`,
        shortcut,
      );
    }

    const pageManifest = {
      Controllers: [
        {Actions: actions, Type: "Keypad"},
        {Actions: null, Type: "Encoder"},
      ],
      Icon: "",
      Name: "",
    };
    fs.writeFileSync(
      path.join(pageDirectory, "manifest.json"),
      `${JSON.stringify(pageManifest)}\n`,
      "utf8",
    );
    report.push({
      kind,
      profile: profile.manifest.Name,
      directory: profile.directory,
      backup,
      actions: definitions.map(([label]) => label),
    });
  }

  const reportPath = path.join(backupRoot, "setup-report.json");
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify({serial, createdAt: new Date(), report}, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify({backupRoot, reportPath, profiles: report}, null, 2));
}

function findContextProfiles(profileRoot, serial) {
  const found = new Map();
  for (const entry of fs.readdirSync(profileRoot, {withFileTypes: true})) {
    if (!entry.isDirectory() || !entry.name.endsWith(".sdProfile")) continue;
    const directory = path.join(profileRoot, entry.name);
    const manifestPath = path.join(directory, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (manifest.InstalledByPluginUUID !== pluginUuid) continue;
    if (!manifest.Device?.UUID?.includes(serial)) continue;
    const kind = String(manifest.PreconfiguredName || "")
      .split("/")
      .pop()
      .split("-")[0];
    if (profiles[kind]) found.set(kind, {directory, manifest});
  }
  return found;
}

function hotkeyAction(label, image, shortcut) {
  const key = resolveKey(shortcut.key);
  const modifiers =
    (shortcut.shift ? 1 : 0) +
    (shortcut.alt ? 4 : 0) +
    (shortcut.ctrl ? 8 : 0);
  const stroke = {
    KeyCmd: Boolean(shortcut.ctrl),
    KeyCtrl: false,
    KeyModifiers: modifiers,
    KeyOption: Boolean(shortcut.alt),
    KeyShift: Boolean(shortcut.shift),
    NativeCode: key.nativeCode,
    QTKeyCode: key.qtKeyCode,
    VKeyCode: key.vKeyCode,
  };
  const empty = {
    KeyCmd: false,
    KeyCtrl: false,
    KeyModifiers: 0,
    KeyOption: false,
    KeyShift: false,
    NativeCode: 146,
    QTKeyCode: 33554431,
    VKeyCode: -1,
  };
  return {
    ActionID: crypto.randomUUID(),
    LinkedTitle: false,
    Name: "Hotkey",
    Plugin: {
      Name: "Activate a Key Command",
      UUID: "com.elgato.streamdeck.system.hotkey",
      Version: "1.0",
    },
    Resources: null,
    Settings: {Coalesce: true, Hotkeys: [stroke, empty, empty, empty]},
    State: 0,
    States: [
      {
        FontFamily: "Segoe UI",
        FontSize: 12,
        FontStyle: "",
        FontUnderline: false,
        Image: image,
        OutlineThickness: 2,
        ShowTitle: false,
        Title: label,
        TitleAlignment: "bottom",
        TitleColor: "#ffffff",
      },
    ],
    UUID: "com.elgato.streamdeck.system.hotkey",
  };
}

function resolveKey(value) {
  if (keyDefinitions[value]) return keyDefinitions[value];
  const code = value.toUpperCase().charCodeAt(0);
  return {nativeCode: code, qtKeyCode: code, vKeyCode: code};
}

async function renderIcon(output, [start, end], label, symbol) {
  const safeLabel = escapeXml(label);
  const safeSymbol = escapeXml(symbol);
  const symbolSize = symbol.length > 2 ? 38 : 52;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${start}"/>
          <stop offset="1" stop-color="${end}"/>
        </linearGradient>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity=".45"/>
        </filter>
      </defs>
      <rect width="144" height="144" rx="25" fill="#07111f"/>
      <rect x="5" y="5" width="134" height="134" rx="22" fill="url(#g)" fill-opacity=".22"
            stroke="${start}" stroke-width="3" filter="url(#s)"/>
      <path d="M22 25h100" stroke="${start}" stroke-width="5" stroke-linecap="round"/>
      <text x="72" y="82" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif"
            font-size="${symbolSize}" font-weight="800" fill="#fff">${safeSymbol}</text>
      <text x="72" y="119" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif"
            font-size="17" font-weight="750" letter-spacing=".7" fill="#dbeafe">${safeLabel}</text>
    </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(output);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
