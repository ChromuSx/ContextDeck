const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imageDir = 'imgs';
const logoPath = path.resolve(__dirname, '..', '..', 'logo.png');
fs.mkdirSync(imageDir, { recursive: true });
let logoCropPromise;

const icons = {
  'key-active': [null, null],
  'key-paused': ['#64748b', 'Ⅱ'],
  'key-text': ['#06b6d4', 'T'],
  'key-file': ['#3b82f6', 'F'],
  'key-folder': ['#f59e0b', 'D'],
  'key-image': ['#a855f7', 'I'],
  'key-error': ['#ef4444', '!'],
};

Promise.all([
  renderPluginIcons(),
  renderActionListIcon('category-icon', 28, 56),
  renderActionListIcon('action-icon', 20, 40),
  ...Object.entries(icons).map(([name, definition]) =>
    renderKeyIcon(name, definition[0], definition[1])
  ),
]).then(() => console.log('ContextDeck icons generated.'));

async function renderPluginIcons() {
  const crop = await getLogoCrop();
  await renderPluginIcon(crop, 256, 'plugin-icon.png');
  await renderPluginIcon(crop, 512, 'plugin-icon@2x.png');
}

function getLogoCrop() {
  logoCropPromise ||= readLogoCrop();
  return logoCropPromise;
}

async function readLogoCrop() {
  if (!fs.existsSync(logoPath)) {
    throw new Error(`Missing ContextDeck logo: ${logoPath}`);
  }

  const metadata = await sharp(logoPath).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Cannot read ContextDeck logo dimensions: ${logoPath}`);
  }

  const cropSize = Math.floor(Math.min(metadata.width, metadata.height) * 0.684);
  return {
    left: Math.floor((metadata.width - cropSize) / 2),
    top: Math.floor((metadata.height - cropSize) / 2),
    width: cropSize,
    height: cropSize,
  };
}

async function renderPluginIcon(crop, size, filename) {
  await sharp(logoPath)
    .extract(crop)
    .resize(size, size, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(imageDir, filename));
}
async function renderActionListIcon(name, size, retinaSize) {
  const source = actionListLogoSvg(80);
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(path.join(imageDir, `${name}.png`));
  await sharp(Buffer.from(source)).resize(retinaSize, retinaSize).png().toFile(path.join(imageDir, `${name}@2x.png`));
}

async function renderKeyIcon(name, color, letter) {
  const crop = await getLogoCrop();
  let logo = sharp(logoPath)
    .extract(crop)
    .resize(144, 144, { fit: 'cover', kernel: sharp.kernel.lanczos3 });

  if (name === 'key-paused') {
    logo = logo.modulate({ brightness: 0.65, saturation: 0.2 });
  }

  const composites = [];
  if (color && letter) {
    composites.push({ input: Buffer.from(badgeSvg(144, color, letter)) });
  }

  const retina = await logo.composite(composites).png().toBuffer();
  fs.writeFileSync(path.join(imageDir, `${name}@2x.png`), retina);
  await sharp(retina)
    .resize(72, 72, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(imageDir, `${name}.png`));
}

function actionListLogoSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 80 80"><g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M36 12h24a9 9 0 0 1 9 9v35a9 9 0 0 1-9 9H36"/><path d="M23 20h27a9 9 0 0 1 9 9v34a9 9 0 0 1-9 9H23"/><path d="M10 30h30a9 9 0 0 1 9 9v31H19a9 9 0 0 1-9-9z"/></g><path d="M7 63c14-14 29-20 45-18 10 1 16-4 21-15" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`;
}

function badgeSvg(size, color, letter) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 144 144"><circle cx="113" cy="113" r="24" fill="${color}" stroke="#fff" stroke-width="4"/><text x="113" y="124" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="32" font-weight="700" fill="#fff">${letter}</text></svg>`;
}
