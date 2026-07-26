const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imageDir = 'imgs';
const logoPath = path.resolve(__dirname, '..', '..', 'logo.png');
fs.mkdirSync(imageDir, { recursive: true });

const icons = {
  'key-active': ['#4fd8ff', '⌁'],
  'key-paused': ['#8b97a8', 'Ⅱ'],
  'key-text': ['#5ad8ff', 'T'],
  'key-file': ['#7897ff', 'F'],
  'key-folder': ['#ffc861', 'D'],
  'key-image': ['#d98cff', 'I'],
  'key-error': ['#ff6b7a', '!'],
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
  if (!fs.existsSync(logoPath)) {
    throw new Error(`Missing ContextDeck logo: ${logoPath}`);
  }

  const metadata = await sharp(logoPath).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Cannot read ContextDeck logo dimensions: ${logoPath}`);
  }

  const cropSize = Math.floor(Math.min(metadata.width, metadata.height) * 0.684);
  const crop = {
    left: Math.floor((metadata.width - cropSize) / 2),
    top: Math.floor((metadata.height - cropSize) / 2),
    width: cropSize,
    height: cropSize,
  };

  await renderPluginIcon(crop, 256, 'plugin-icon.png');
  await renderPluginIcon(crop, 512, 'plugin-icon@2x.png');
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
  const source = keySvg(144, color, letter);
  await sharp(Buffer.from(source)).resize(72, 72).png().toFile(path.join(imageDir, `${name}.png`));
  await sharp(Buffer.from(source)).resize(144, 144).png().toFile(path.join(imageDir, `${name}@2x.png`));
}

function actionListLogoSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 80 80"><g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M36 12h24a9 9 0 0 1 9 9v35a9 9 0 0 1-9 9H36"/><path d="M23 20h27a9 9 0 0 1 9 9v34a9 9 0 0 1-9 9H23"/><path d="M10 30h30a9 9 0 0 1 9 9v31H19a9 9 0 0 1-9-9z"/></g><path d="M7 63c14-14 29-20 45-18 10 1 16-4 21-15" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>`;
}

function keySvg(size, color, letter) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 144 144"><rect width="144" height="144" rx="28" fill="#101720"/><path d="M27 58V39c0-7 5-12 12-12h19M86 27h19c7 0 12 5 12 12v19M117 86v19c0 7-5 12-12 12H86M58 117H39c-7 0-12-5-12-12V86" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/><text x="72" y="88" text-anchor="middle" font-family="Segoe UI,Arial" font-size="50" font-weight="700" fill="#fff">${letter}</text></svg>`;
}
