const sharp = require('sharp');
const fs = require('fs');

const svgPath = '/dev-server/src/assets/globedoc-logo.svg';
const outDir = '/dev-server/public';

async function gen() {
  const svg = fs.readFileSync(svgPath);
  
  // Generate favicon PNGs
  await sharp(svg)
    .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(`${outDir}/favicon-16x16.png`);
  
  await sharp(svg)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(`${outDir}/favicon-32x32.png`);
  
  await sharp(svg)
    .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(`${outDir}/favicon-48x48.png`);
  
  await sharp(svg)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(`${outDir}/apple-touch-icon.png`);
  
  console.log('PNG favicons generated in', outDir);
}

gen().catch(e => { console.error(e); process.exit(1); });
