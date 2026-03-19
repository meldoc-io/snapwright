import sharp from 'sharp';
import fs from 'fs/promises';

/**
 * Compresses a PNG file in-place.
 * @param {string} filePath
 * @param {{ compressionLevel?: number, palette?: boolean, quality?: number }} [options]
 * @returns {Promise<{ original: number, compressed: number, saved: string }>}
 */
export async function compressPng(filePath, options = {}) {
  const { compressionLevel = 9, palette = true, quality = 80 } = options;

  const originalBuffer = await fs.readFile(filePath);
  const compressedBuffer = await sharp(originalBuffer)
    .png({ compressionLevel, ...(palette ? { palette: true, quality } : {}) })
    .toBuffer();

  await fs.writeFile(filePath, compressedBuffer);

  const originalKb = (originalBuffer.length / 1024).toFixed(1);
  const compressedKb = (compressedBuffer.length / 1024).toFixed(1);
  const savedPct = (((originalBuffer.length - compressedBuffer.length) / originalBuffer.length) * 100).toFixed(0);

  return {
    original: originalBuffer.length,
    compressed: compressedBuffer.length,
    saved: `${originalKb}KB → ${compressedKb}KB (−${savedPct}%)`,
  };
}
