// Script to generate PWA icons from SVG
import sharp from 'sharp';
import fs from 'fs';

const svgContent = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1e3a8a"/>
  <circle cx="256" cy="256" r="200" fill="#ffffff" opacity="0.2"/>
  <text x="256" y="330" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="#ffffff" text-anchor="middle">⚾</text>
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
