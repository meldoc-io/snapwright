import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const compressPng = vi.fn();
  const fetchFn = vi.fn();
  return { compressPng, fetchFn };
});

vi.mock('../src/compress.js', () => ({ compressPng: mocks.compressPng }));

let runCli;
let exitSpy;
let logSpy;
let errorSpy;

beforeEach(async () => {
  vi.clearAllMocks();
  globalThis.fetch = mocks.fetchFn;
  exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  // Re-import to get fresh module with mocks applied
  const mod = await import('../src/cli.js');
  runCli = mod.runCli;
});

afterEach(() => {
  exitSpy.mockRestore();
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

function mockFetchOk(data) {
  mocks.fetchFn.mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

function mockFetchError(errorMsg) {
  mocks.fetchFn.mockResolvedValue({
    ok: false,
    json: async () => ({ error: errorMsg }),
  });
}

describe('runCli', () => {
  // Help commands
  describe('help commands', () => {
    it('exits 0 for no command', async () => {
      await expect(runCli([])).rejects.toThrow('process.exit(0)');
      expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it.each([
      [['help']],
      [['--help']],
      [['-h']],
    ])('exits 0 for argv=%j', async (argv) => {
      await expect(runCli(argv)).rejects.toThrow('process.exit(0)');
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });

  // Version commands
  describe('version commands', () => {
    it.each([
      [['version']],
      [['--version']],
      [['-v']],
    ])('exits 0 and logs semver for argv=%j', async (argv) => {
      await expect(runCli(argv)).rejects.toThrow('process.exit(0)');
      expect(exitSpy).toHaveBeenCalledWith(0);
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+/));
    });
  });

  // Start command
  it('start command exits 1 with error message', async () => {
    await expect(runCli(['start'])).rejects.toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith('"start" must be handled by the entry point, not runCli()');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // Navigate
  it('navigate sends POST to /navigate with {url} and logs result', async () => {
    mockFetchOk({ url: 'https://example.com' });
    await runCli(['navigate', 'https://example.com']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/navigate'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com' }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('Navigated to: https://example.com');
  });

  // Click
  it('click sends POST to /click with {selector} and logs result', async () => {
    mockFetchOk({ ok: true });
    await runCli(['click', '#btn']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/click'),
      expect.objectContaining({
        body: JSON.stringify({ selector: '#btn' }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('Clicked: #btn');
  });

  // Fill
  it('fill sends {selector, value} and logs result', async () => {
    mockFetchOk({ ok: true });
    await runCli(['fill', '#input', 'hello']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/fill'),
      expect.objectContaining({
        body: JSON.stringify({ selector: '#input', value: 'hello' }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('Filled: #input');
  });

  it('fill uses empty string when value omitted', async () => {
    mockFetchOk({ ok: true });
    await runCli(['fill', '#input']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/fill'),
      expect.objectContaining({
        body: JSON.stringify({ selector: '#input', value: '' }),
      }),
    );
  });

  // Hover
  it('hover sends {selector} and logs result', async () => {
    mockFetchOk({ ok: true });
    await runCli(['hover', '.menu']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/hover'),
      expect.objectContaining({
        body: JSON.stringify({ selector: '.menu' }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('Hovered: .menu');
  });

  // Scroll
  it('scroll with selector sends {selector} and logs "Scrolled into view"', async () => {
    mockFetchOk({ ok: true });
    await runCli(['scroll', '#s']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/scroll'),
      expect.objectContaining({
        body: JSON.stringify({ selector: '#s' }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('Scrolled into view: #s');
  });

  it('scroll without selector sends {selector: null} and logs "Scrolled to top"', async () => {
    mockFetchOk({ ok: true });
    await runCli(['scroll']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/scroll'),
      expect.objectContaining({
        body: JSON.stringify({ selector: null }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('Scrolled to top');
  });

  // Wait
  it('wait with ms sends {ms: 2000} and logs "Waited 2000ms"', async () => {
    mockFetchOk({ ok: true });
    await runCli(['wait', '2000']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/wait'),
      expect.objectContaining({
        body: JSON.stringify({ ms: 2000 }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('Waited 2000ms');
  });

  it('wait without ms sends {ms: 1000} and logs "Waited 1000ms"', async () => {
    mockFetchOk({ ok: true });
    await runCli(['wait']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/wait'),
      expect.objectContaining({
        body: JSON.stringify({ ms: 1000 }),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('Waited 1000ms');
  });

  // Screenshot
  it('screenshot sends {filename, selector: null}, calls compressPng, and logs with stats', async () => {
    mockFetchOk({ path: '/tmp/shot.png' });
    mocks.compressPng.mockResolvedValue({ saved: '10.0KB \u2192 5.0KB (\u221250%)' });

    await runCli(['screenshot', 'shot.png']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/screenshot'),
      expect.objectContaining({
        body: JSON.stringify({ filename: 'shot.png', selector: null }),
      }),
    );
    expect(mocks.compressPng).toHaveBeenCalledWith('/tmp/shot.png');
    expect(logSpy).toHaveBeenCalledWith('Saved: /tmp/shot.png (10.0KB \u2192 5.0KB (\u221250%))');
  });

  it('screenshot with selector sends correct selector', async () => {
    mockFetchOk({ path: '/tmp/shot.png' });
    mocks.compressPng.mockResolvedValue({ saved: '5KB \u2192 3KB (\u221240%)' });

    await runCli(['screenshot', 'shot.png', '#content']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/screenshot'),
      expect.objectContaining({
        body: JSON.stringify({ filename: 'shot.png', selector: '#content' }),
      }),
    );
  });

  it('screenshot falls back to logging without stats when compressPng fails', async () => {
    mockFetchOk({ path: '/tmp/shot.png' });
    mocks.compressPng.mockRejectedValue(new Error('sharp failed'));

    await runCli(['screenshot', 'shot.png']);

    expect(logSpy).toHaveBeenCalledWith('Saved: /tmp/shot.png');
  });

  // Text
  it('text logs result.text', async () => {
    mockFetchOk({ text: 'Hello World' });
    await runCli(['text']);
    expect(logSpy).toHaveBeenCalledWith('Hello World');
  });

  // HTML
  it('html logs result.html', async () => {
    mockFetchOk({ html: '<html></html>' });
    await runCli(['html']);
    expect(logSpy).toHaveBeenCalledWith('<html></html>');
  });

  // Snapshot
  it('snapshot logs JSON.stringify(result.snapshot, null, 2)', async () => {
    const snap = { role: 'document', children: [] };
    mockFetchOk({ snapshot: snap });
    await runCli(['snapshot']);
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(snap, null, 2));
  });

  // URL
  it('url logs result.url', async () => {
    mockFetchOk({ url: 'https://example.com/page' });
    await runCli(['url']);
    expect(logSpy).toHaveBeenCalledWith('https://example.com/page');
  });

  // Auth-save
  it('auth-save logs "Auth state saved to ..."', async () => {
    mockFetchOk({ saved: '/tmp/.auth.json' });
    await runCli(['auth-save']);
    expect(logSpy).toHaveBeenCalledWith('Auth state saved to /tmp/.auth.json');
  });

  // Stop
  it('stop sends stop and logs "Browser server stopped."', async () => {
    mockFetchOk({ ok: true });
    await runCli(['stop']);

    expect(mocks.fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/stop'),
      expect.anything(),
    );
    expect(logSpy).toHaveBeenCalledWith('Browser server stopped.');
  });

  // Unknown command
  it('unknown command exits 1 and logs error', async () => {
    await expect(runCli(['foobar'])).rejects.toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith('Unknown command: foobar');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // Fetch failure
  it('fetch failure exits 1 and logs "Cannot reach browser server..."', async () => {
    mocks.fetchFn.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(runCli(['navigate', 'https://x.com'])).rejects.toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith('Cannot reach browser server. Start it with:\n  snapwright start');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  // Server error response
  it('server error response (ok=false) exits 1 and logs "Server error: ..."', async () => {
    mockFetchError('Something broke');

    await expect(runCli(['navigate', 'https://x.com'])).rejects.toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith('Server error:', 'Something broke');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
