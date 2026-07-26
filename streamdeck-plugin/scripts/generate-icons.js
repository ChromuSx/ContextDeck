const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imageDir = 'imgs';
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
  renderSmallIcon('category-icon', 20, 40),
  renderSmallIcon('action-icon', 20, 40),
  ...Object.entries(icons).map(([name, definition]) =>
    renderKeyIcon(name, definition[0], definition[1])
  ),
]).then(() => console.log('ContextDeck icons generated.'));

async function renderPluginIcons() {
  const source = logoSvg(512);
  await sharp(Buffer.from(source)).resize(256, 256).png().toFile(path.join(imageDir, 'plugin-icon.png'));
  await sharp(Buffer.from(source)).resize(512, 512).png().toFile(path.join(imageDir, 'plugin-icon@2x.png'));
}
async function renderSmallIcon(name, size, retinaSize) {
  const source = glyphSvg(80);
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(path.join(imageDir, `${name}.png`));
  await sharp(Buffer.from(source)).resize(retinaSize, retinaSize).png().toFile(path.join(imageDir, `${name}@2x.png`));
}

async function renderKeyIcon(name, color, letter) {
  const source = keySvg(144, color, letter);
  await sharp(Buffer.from(source)).resize(72, 72).png().toFile(path.join(imageDir, `${name}.png`));
  await sharp(Buffer.from(source)).resize(144, 144).png().toFile(path.join(imageDir, `${name}@2x.png`));
}

function logoSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#182638"/><stop offset="1" stop-color="#0a0f18"/></linearGradient><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#55e3ff"/><stop offset="1" stop-color="#6577ff"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#b)"/>
  <path d="M116 211v-58c0-21 17-37 37-37h58M301 116h58c21 0 37 16 37 37v58M396 301v58c0 21-16 37-37 37h-58M211 396h-58c-20 0-37-16-37-37v-58" fill="none" stroke="url(#g)" stroke-width="34" stroke-linecap="round"/>
  <path d="M203 246h106M256 193v126" stroke="#f5fbff" stroke-width="26" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="22" fill="#55e3ff"/>
  </svg>`;
}

function glyphSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 80 80"><path d="M12 32V18c0-4 3-6 6-6h14M48 12h14c3 0 6 2 6 6v14M68 48v14c0 4-3 6-6 6H48M32 68H18c-3 0-6-2-6-6V48" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><circle cx="40" cy="40" r="8" fill="#fff"/></svg>`;
}

function keySvg(size, color, letter) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 144 144"><rect width="144" height="144" rx="28" fill="#101720"/><path d="M27 58V39c0-7 5-12 12-12h19M86 27h19c7 0 12 5 12 12v19M117 86v19c0 7-5 12-12 12H86M58 117H39c-7 0-12-5-12-12V86" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/><text x="72" y="88" text-anchor="middle" font-family="Segoe UI,Arial" font-size="50" font-weight="700" fill="#fff">${letter}</text></svg>`;
}
