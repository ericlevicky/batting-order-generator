// Script to generate PWA icons from baseball.png
import sharp from 'sharp';
import fs from 'fs';

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    // Create a blue background
    const background = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 30, g: 58, b: 138, alpha: 1 } // #1e3a8a
      }
    }).png().toBuffer();

    // Calculate baseball size (80% of icon size for nice padding)
    const baseballSize = Math.round(size * 0.8);
    const offset = Math.round((size - baseballSize) / 2);

    // Resize baseball image and composite onto background
    const baseball = await sharp('public/baseball.png')
      .resize(baseballSize, baseballSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp(background)
      .composite([{
        input: baseball,
        top: offset,
        left: offset
      }])
      .toFile(`public/icon-${size}.png`);

    console.log(`Generated icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
