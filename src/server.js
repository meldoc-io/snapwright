/**
 * BrowserServer — persistent Playwright browser controlled via HTTP.
 *
 * Programmatic usage:
 *   import { BrowserServer } from 'snapwright';
 *   const server = new BrowserServer({ headless: false, port: 9999 });
 *   await server.start();
 */

import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

export class BrowserServer {
  /**
   * @param {object} [options]
   * @param {number}  [options.port=9999]
   * @param {boolean} [options.headless=true]
   * @param {string}  [options.authFile]       Path to auth state JSON file
   * @param {string}  [options.outputDir]      Default directory for screenshots
   * @param {number}  [options.viewportWidth=1440]
   * @param {number}  [options.viewportHeight=900]
   */
  constructor(options = {}) {
    this.port = options.port ?? 9999;
    this.headless = options.headless ?? true;
    this.authFile = options.authFile ?? null;
    this.outputDir = options.outputDir ?? process.cwd();
    this.viewportWidth = options.viewportWidth ?? 1440;
    this.viewportHeight = options.viewportHeight ?? 900;

    this._browser = null;
    this._context = null;
    this._page = null;
    this._server = null;
  }

  async start() {
    this._browser = await chromium.launch({
      headless: this.headless,
      args: [`--window-size=${this.viewportWidth},${this.viewportHeight}`],
    });

    const authExists = this.authFile && fs.existsSync(this.authFile);
    this._context = await this._browser.newContext({
      viewport: { width: this.viewportWidth, height: this.viewportHeight },
      ...(authExists ? { storageState: this.authFile } : {}),
    });

    if (authExists) console.log(`[snapwright] Loaded auth session from ${this.authFile}`);

    this._page = await this._context.newPage();

    this._server = http.createServer(this._handleRequest.bind(this));
    await new Promise((resolve) => this._server.listen(this.port, resolve));

    console.log(`[snapwright] Browser ready (headless: ${this.headless})`);
    console.log(`[snapwright] Listening on http://localhost:${this.port}`);

    return this;
  }

  async stop() {
    this._server?.close();
    await this._browser?.close();
  }

  // ---------------------------------------------------------------------------

  async _navigate(url) {
    await this._page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await this._page.waitForFunction(() => document.body?.innerHTML.length > 100, { timeout: 10_000 }).catch(() => {});
    await this._page.waitForTimeout(600);
    return this._page.url();
  }

  async _screenshot(filename, selector) {
    const outPath = path.isAbsolute(filename) ? filename : path.join(this.outputDir, filename);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    if (selector) {
      await this._page.locator(selector).first().screenshot({ path: outPath });
    } else {
      await this._page.screenshot({ path: outPath, fullPage: true });
    }
    return outPath;
  }

  async _saveAuth() {
    if (!this.authFile) throw new Error('authFile not configured');
    await this._context.storageState({ path: this.authFile });
    return this.authFile;
  }

  // ---------------------------------------------------------------------------

  _respond(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  }

  async _readBody(req) {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', (c) => { data += c; });
      req.on('end', () => resolve(data ? JSON.parse(data) : {}));
    });
  }

  async _handleRequest(req, res) {
    const cmd = req.url.slice(1);

    try {
      const body = await this._readBody(req);
      const page = this._page;

      switch (cmd) {
        case 'navigate': {
          const url = await this._navigate(body.url);
          this._respond(res, 200, { url });
          break;
        }
        case 'click': {
          await page.click(body.selector, { timeout: 10_000 });
          await page.waitForTimeout(400);
          this._respond(res, 200, { ok: true });
          break;
        }
        case 'fill': {
          await page.fill(body.selector, body.value ?? '');
          this._respond(res, 200, { ok: true });
          break;
        }
        case 'hover': {
          await page.hover(body.selector, { timeout: 10_000 });
          await page.waitForTimeout(300);
          this._respond(res, 200, { ok: true });
          break;
        }
        case 'scroll': {
          if (body.selector) {
            await page.locator(body.selector).first().scrollIntoViewIfNeeded();
          } else {
            await page.evaluate(() => window.scrollTo(0, 0));
          }
          this._respond(res, 200, { ok: true });
          break;
        }
        case 'wait': {
          await page.waitForTimeout(body.ms ?? 1000);
          this._respond(res, 200, { ok: true });
          break;
        }
        case 'screenshot': {
          const outPath = await this._screenshot(body.filename, body.selector ?? null);
          this._respond(res, 200, { path: outPath });
          break;
        }
        case 'text': {
          await page.waitForFunction(() => document.body?.innerText?.trim().length > 10, { timeout: 10_000 }).catch(() => {});
          const text = await page.evaluate(() => document.body.innerText);
          this._respond(res, 200, { text });
          break;
        }
        case 'html': {
          await page.waitForFunction(() => document.body?.innerHTML?.length > 100, { timeout: 10_000 }).catch(() => {});
          const html = await page.content();
          this._respond(res, 200, { html });
          break;
        }
        case 'snapshot': {
          await page.waitForFunction(() => document.body?.innerHTML?.length > 100, { timeout: 10_000 }).catch(() => {});
          const snapshot = await page.accessibility.snapshot({ interestingOnly: false });
          this._respond(res, 200, { snapshot });
          break;
        }
        case 'url': {
          this._respond(res, 200, { url: page.url() });
          break;
        }
        case 'auth-save': {
          const saved = await this._saveAuth();
          this._respond(res, 200, { saved });
          break;
        }
        case 'stop': {
          this._respond(res, 200, { ok: true });
          setTimeout(() => this.stop().then(() => process.exit(0)), 200);
          break;
        }
        default:
          this._respond(res, 404, { error: `Unknown command: ${cmd}` });
      }
    } catch (err) {
      this._respond(res, 500, { error: err.message });
    }
  }
}
