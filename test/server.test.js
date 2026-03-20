import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

vi.mock('playwright', () => ({
  chromium: { launch: vi.fn() },
}));

vi.mock('fs', () => ({
  default: { existsSync: vi.fn(() => false), promises: { mkdir: vi.fn() } },
  existsSync: vi.fn(() => false),
  promises: { mkdir: vi.fn() },
}));

const { BrowserServer } = await import('../src/server.js');

function createMockReq(url, body) {
  const req = new EventEmitter();
  req.url = url;
  setImmediate(() => {
    if (body !== undefined && body !== null) {
      req.emit('data', JSON.stringify(body));
    }
    req.emit('end');
  });
  return req;
}

function createMockRes() {
  const res = {
    writeHead: vi.fn(),
    end: vi.fn(),
  };
  return res;
}

describe('BrowserServer', () => {
  let server;
  let mockPage;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new BrowserServer();

    mockPage = {
      click: vi.fn(),
      fill: vi.fn(),
      hover: vi.fn(),
      evaluate: vi.fn(),
      locator: vi.fn(() => ({
        first: vi.fn(() => ({
          scrollIntoViewIfNeeded: vi.fn(),
          screenshot: vi.fn(),
        })),
      })),
      waitForTimeout: vi.fn(),
      waitForFunction: vi.fn(() => ({ catch: vi.fn() })),
      screenshot: vi.fn(),
      content: vi.fn(),
      accessibility: { snapshot: vi.fn() },
      url: vi.fn(() => 'https://current.url'),
      goto: vi.fn(),
    };

    server._page = mockPage;
    server._context = { storageState: vi.fn() };
    server._server = { close: vi.fn() };
    server._browser = { close: vi.fn() };
  });

  // Constructor
  describe('constructor', () => {
    it('sets default options', () => {
      const s = new BrowserServer();
      expect(s.port).toBe(9999);
      expect(s.headless).toBe(true);
      expect(s.authFile).toBeNull();
      expect(s.outputDir).toBe(process.cwd());
      expect(s.viewportWidth).toBe(1440);
      expect(s.viewportHeight).toBe(900);
    });

    it('accepts custom options', () => {
      const s = new BrowserServer({
        port: 8080,
        headless: false,
        authFile: '/tmp/auth.json',
        outputDir: '/tmp/out',
        viewportWidth: 1920,
        viewportHeight: 1080,
      });
      expect(s.port).toBe(8080);
      expect(s.headless).toBe(false);
      expect(s.authFile).toBe('/tmp/auth.json');
      expect(s.outputDir).toBe('/tmp/out');
      expect(s.viewportWidth).toBe(1920);
      expect(s.viewportHeight).toBe(1080);
    });
  });

  // _respond
  describe('_respond', () => {
    it('writes correct headers, status, and JSON body', () => {
      const res = createMockRes();
      server._respond(res, 200, { ok: true });

      expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    });

    it('writes correct status for error responses', () => {
      const res = createMockRes();
      server._respond(res, 500, { error: 'boom' });

      expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'boom' }));
    });
  });

  // _readBody
  describe('_readBody', () => {
    it('parses JSON body from stream', async () => {
      const req = createMockReq('/test', { key: 'value' });
      const body = await server._readBody(req);
      expect(body).toEqual({ key: 'value' });
    });

    it('returns {} for empty body', async () => {
      const req = createMockReq('/test', null);
      const body = await server._readBody(req);
      expect(body).toEqual({});
    });
  });

  // _handleRequest — each command
  describe('_handleRequest', () => {
    it('navigate: calls _navigate and responds with {url}', async () => {
      server._navigate = vi.fn().mockResolvedValue('https://example.com');
      const req = createMockReq('/navigate', { url: 'https://example.com' });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(server._navigate).toHaveBeenCalledWith('https://example.com');
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ url: 'https://example.com' }));
    });

    it('click: calls page.click with selector and timeout, responds {ok:true}', async () => {
      mockPage.click.mockResolvedValue(undefined);
      mockPage.waitForTimeout.mockResolvedValue(undefined);
      const req = createMockReq('/click', { selector: '#btn' });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.click).toHaveBeenCalledWith('#btn', { timeout: 10_000 });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    });

    it('fill: calls page.fill with selector and value, responds {ok:true}', async () => {
      mockPage.fill.mockResolvedValue(undefined);
      const req = createMockReq('/fill', { selector: '#input', value: 'text' });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.fill).toHaveBeenCalledWith('#input', 'text');
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    });

    it('hover: calls page.hover with selector and timeout, responds {ok:true}', async () => {
      mockPage.hover.mockResolvedValue(undefined);
      mockPage.waitForTimeout.mockResolvedValue(undefined);
      const req = createMockReq('/hover', { selector: '.item' });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.hover).toHaveBeenCalledWith('.item', { timeout: 10_000 });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    });

    it('scroll without selector: calls page.evaluate, responds {ok:true}', async () => {
      mockPage.evaluate.mockResolvedValue(undefined);
      const req = createMockReq('/scroll', { selector: null });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    });

    it('scroll with selector: calls page.locator and scrollIntoViewIfNeeded, responds {ok:true}', async () => {
      const scrollMock = vi.fn().mockResolvedValue(undefined);
      mockPage.locator.mockReturnValue({
        first: vi.fn(() => ({ scrollIntoViewIfNeeded: scrollMock })),
      });
      const req = createMockReq('/scroll', { selector: '#section' });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.locator).toHaveBeenCalledWith('#section');
      expect(scrollMock).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    });

    it('wait: calls page.waitForTimeout with ms, responds {ok:true}', async () => {
      mockPage.waitForTimeout.mockResolvedValue(undefined);
      const req = createMockReq('/wait', { ms: 3000 });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(3000);
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
    });

    it('screenshot: calls _screenshot with filename and selector, responds with {path}', async () => {
      server._screenshot = vi.fn().mockResolvedValue('/tmp/out/shot.png');
      const req = createMockReq('/screenshot', { filename: 'shot.png', selector: null });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(server._screenshot).toHaveBeenCalledWith('shot.png', null);
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ path: '/tmp/out/shot.png' }));
    });

    it('text: responds with {text}', async () => {
      mockPage.waitForFunction.mockReturnValue({ catch: vi.fn() });
      mockPage.evaluate.mockResolvedValue('Page text content');
      const req = createMockReq('/text', {});
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ text: 'Page text content' }));
    });

    it('html: calls page.content and responds with {html}', async () => {
      mockPage.waitForFunction.mockReturnValue({ catch: vi.fn() });
      mockPage.content.mockResolvedValue('<html><body>Hello</body></html>');
      const req = createMockReq('/html', {});
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.content).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ html: '<html><body>Hello</body></html>' }));
    });

    it('snapshot: calls page.accessibility.snapshot and responds with {snapshot}', async () => {
      mockPage.waitForFunction.mockReturnValue({ catch: vi.fn() });
      const snapData = { role: 'WebArea', children: [] };
      mockPage.accessibility.snapshot.mockResolvedValue(snapData);
      const req = createMockReq('/snapshot', {});
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.accessibility.snapshot).toHaveBeenCalledWith({ interestingOnly: false });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ snapshot: snapData }));
    });

    it('url: responds with {url: page.url()}', async () => {
      mockPage.url.mockReturnValue('https://current.url/page');
      const req = createMockReq('/url', {});
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(mockPage.url).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ url: 'https://current.url/page' }));
    });

    it('auth-save: calls _saveAuth and responds with {saved}', async () => {
      server._saveAuth = vi.fn().mockResolvedValue('/tmp/auth.json');
      const req = createMockReq('/auth-save', {});
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(server._saveAuth).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ saved: '/tmp/auth.json' }));
    });

    it('stop: responds {ok:true} and schedules shutdown', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
      server.stop = vi.fn().mockResolvedValue(undefined);

      // Manually create req that emits synchronously so we can use fake timers after
      const req = new EventEmitter();
      req.url = '/stop';

      // Feed data before calling _handleRequest, then use fake timers
      vi.useFakeTimers({ shouldAdvanceTime: true });

      setImmediate(() => {
        req.emit('data', JSON.stringify({}));
        req.emit('end');
      });

      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));

      // Advance timers to trigger the setTimeout callback
      await vi.advanceTimersByTimeAsync(200);

      expect(server.stop).toHaveBeenCalled();

      exitSpy.mockRestore();
      vi.useRealTimers();
    });

    it('unknown route: responds with status 404', async () => {
      const req = createMockReq('/unknown-command', {});
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
      expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({ error: 'Unknown command: unknown-command' }),
      );
    });

    it('thrown errors: responds with status 500', async () => {
      mockPage.click.mockRejectedValue(new Error('Element not found'));
      const req = createMockReq('/click', { selector: '#missing' });
      const res = createMockRes();

      await server._handleRequest(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
      expect(res.end).toHaveBeenCalledWith(
        JSON.stringify({ error: 'Element not found' }),
      );
    });
  });
});
