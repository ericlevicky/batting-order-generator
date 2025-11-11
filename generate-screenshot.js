// Script to generate a placeholder screenshot
import sharp from 'sharp';

const svgContent = `
<svg width="390" height="844" xmlns="http://www.w3.org/2000/svg">
  <rect width="390" height="844" fill="#f8fafc"/>
  <rect x="20" y="60" width="350" height="80" rx="8" fill="#1e3a8a"/>
  <text x="195" y="110" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">Batting Order Generator</text>
  <rect x="20" y="160" width="350" height="600" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <circle cx="195" cy="380" r="80" fill="#1e3a8a" opacity="0.1"/>
  <text x="195" y="400" font-family="Arial, sans-serif" font-size="64" fill="#1e3a8a" text-anchor="middle">⚾</text>
  <text x="195" y="480" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">Generate Fair Lineups</text>
  <text x="195" y="510" font-family="Arial, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">for Your Team</text>
</svg>
`;

sharp(Buffer.from(svgContent))
  .png()
  .toFile('public/screenshot-mobile.png')
  .then(() => console.log('Generated screenshot-mobile.png'))
  .catch(console.error);
