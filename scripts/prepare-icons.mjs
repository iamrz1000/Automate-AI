import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import png2icons from 'png2icons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceLogo = path.join(rootDir, 'public', 'assets', 'aistudio', 'Gemini_Generated_Image_ee5hycee5hycee5h_050d414c.png');
const outDir = path.join(rootDir, 'build', 'icons');

fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(sourceLogo)) {
  console.error('Source logo missing at:', sourceLogo);
  process.exit(1);
}

const inputBuffer = fs.readFileSync(sourceLogo);

// Copy base PNG for Linux/Tray use
fs.writeFileSync(path.join(outDir, 'icon.png'), inputBuffer);
fs.writeFileSync(path.join(outDir, '512x512.png'), inputBuffer);

const icoBuffer = png2icons.createICO(inputBuffer, png2icons.BICUBIC2, 0, true);
if (icoBuffer) {
  fs.writeFileSync(path.join(outDir, 'icon.ico'), icoBuffer);
  console.log('Generated build/icons/icon.ico');
} else {
  console.warn('Warning: could not generate icon.ico');
}

const icnsBuffer = png2icons.createICNS(inputBuffer, png2icons.BICUBIC2, 0);
if (icnsBuffer) {
  fs.writeFileSync(path.join(outDir, 'icon.icns'), icnsBuffer);
  console.log('Generated build/icons/icon.icns');
} else {
  console.warn('Warning: could not generate icon.icns');
}
