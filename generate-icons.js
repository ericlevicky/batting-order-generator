// Script to generate PWA icons from SVG
import sharp from 'sharp';
import fs from 'fs';

const svgContent = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1e3a8a"/>
  
  <!-- Baseball -->
  <circle cx="256" cy="256" r="180" fill="#ffffff" stroke="#000000" stroke-width="4"/>
  
  <!-- Left stitching curve -->
  <path d="M 140 200 Q 160 240 140 280" fill="none" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="134" y1="208" x2="146" y2="200" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="134" y1="224" x2="146" y2="220" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="134" y1="240" x2="146" y2="240" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="134" y1="256" x2="146" y2="260" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="134" y1="272" x2="146" y2="280" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="134" y1="288" x2="146" y2="300" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  
  <!-- Right stitching curve -->
  <path d="M 372 200 Q 352 240 372 280" fill="none" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="378" y1="208" x2="366" y2="200" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="378" y1="224" x2="366" y2="220" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="378" y1="240" x2="366" y2="240" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="378" y1="256" x2="366" y2="260" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="378" y1="272" x2="366" y2="280" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
  <line x1="378" y1="288" x2="366" y2="300" stroke="#cc0000" stroke-width="6" stroke-linecap="round"/>
</svg>
`;

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(`public/icon-${size}.png`);
    console.log(`Generated icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
