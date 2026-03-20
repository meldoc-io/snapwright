import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const toBuffer = vi.fn();
  const png = vi.fn(() => ({ toBuffer }));
  const sharpFn = vi.fn(() => ({ png }));
  const readFile = vi.fn();
  const writeFile = vi.fn();
  return { sharpFn, png, toBuffer, readFile, writeFile };
});

vi.mock('sharp', () => ({ default: mocks.sharpFn }));
vi.mock('fs/promises', () => ({ default: { readFile: mocks.readFile, writeFile: mocks.writeFile } }));

const { compressPng } = await import('../src/compress.js');

describe('compressPng', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the chain so sharp() returns fresh .png().toBuffer()
    mocks.sharpFn.mockReturnValue({ png: mocks.png });
    mocks.png.mockReturnValue({ toBuffer: mocks.toBuffer });
  });

  it('reads the file at the given path and writes compressed data back', async () => {
    const original = Buffer.alloc(1000, 'x');
    const compressed = Buffer.alloc(500, 'y');
    mocks.readFile.mockResolvedValue(original);
    mocks.toBuffer.mockResolvedValue(compressed);

    await compressPng('/tmp/test.png');

    expect(mocks.readFile).toHaveBeenCalledWith('/tmp/test.png');
    expect(mocks.writeFile).toHaveBeenCalledWith('/tmp/test.png', compressed);
  });

  it('passes default options to sharp (compressionLevel=9, palette=true, quality=80)', async () => {
    const original = Buffer.alloc(2048, 'a');
    const compressed = Buffer.alloc(1024, 'b');
    mocks.readFile.mockResolvedValue(original);
    mocks.toBuffer.mockResolvedValue(compressed);

    await compressPng('/tmp/img.png');

    expect(mocks.sharpFn).toHaveBeenCalledWith(original);
    expect(mocks.png).toHaveBeenCalledWith({
      compressionLevel: 9,
      palette: true,
      quality: 80,
    });
  });

  it('passes custom options correctly', async () => {
    const original = Buffer.alloc(2048, 'a');
    const compressed = Buffer.alloc(1024, 'b');
    mocks.readFile.mockResolvedValue(original);
    mocks.toBuffer.mockResolvedValue(compressed);

    await compressPng('/tmp/img.png', { compressionLevel: 6, palette: true, quality: 50 });

    expect(mocks.png).toHaveBeenCalledWith({
      compressionLevel: 6,
      palette: true,
      quality: 50,
    });
  });

  it('does NOT include palette/quality when palette=false', async () => {
    const original = Buffer.alloc(2048, 'a');
    const compressed = Buffer.alloc(1024, 'b');
    mocks.readFile.mockResolvedValue(original);
    mocks.toBuffer.mockResolvedValue(compressed);

    await compressPng('/tmp/img.png', { palette: false });

    expect(mocks.png).toHaveBeenCalledWith({ compressionLevel: 9 });
  });

  it('returns correct {original, compressed, saved} with proper format', async () => {
    // 2048 bytes -> 1024 bytes = 50% saving
    const original = Buffer.alloc(2048, 'a');
    const compressed = Buffer.alloc(1024, 'b');
    mocks.readFile.mockResolvedValue(original);
    mocks.toBuffer.mockResolvedValue(compressed);

    const result = await compressPng('/tmp/img.png');

    expect(result.original).toBe(2048);
    expect(result.compressed).toBe(1024);
    expect(result.saved).toMatch(/KB/);
    expect(result.saved).toContain('\u2192'); // arrow character
  });

  it('computes 50% compression correctly', async () => {
    const original = Buffer.alloc(2048, 'a');
    const compressed = Buffer.alloc(1024, 'b');
    mocks.readFile.mockResolvedValue(original);
    mocks.toBuffer.mockResolvedValue(compressed);

    const result = await compressPng('/tmp/img.png');

    // 2048 bytes = 2.0KB, 1024 bytes = 1.0KB, 50%
    expect(result.saved).toBe('2.0KB \u2192 1.0KB (\u221250%)');
  });
});
