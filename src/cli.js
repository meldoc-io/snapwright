/**
 * snapwright CLI — controls a running BrowserServer over HTTP.
 * Used by bin/snapwright.js.
 */

import path from 'path';
import { compressPng } from './compress.js';

const DEFAULT_PORT = process.env.SNAPWRIGHT_PORT ?? '9999';

export async function runCli(argv) {
  const [command, ...args] = argv;

  if (!command || command === 'help') {
    printHelp();
    process.exit(0);
  }

  // "start" is handled by bin/snapwright.js before reaching here
  if (command === 'start') {
    console.error('"start" must be handled by the entry point, not runCli()');
    process.exit(1);
  }

  const port = DEFAULT_PORT;
  const base = `http://localhost:${port}`;

  async function send(cmd, body = {}) {
    let res;
    try {
      res = await fetch(`${base}/${cmd}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      console.error('Cannot reach browser server. Start it with:\n  snapwright start');
      process.exit(1);
    }
    const data = await res.json();
    if (!res.ok) { console.error('Server error:', data.error); process.exit(1); }
    return data;
  }

  switch (command) {
    case 'navigate': {
      const result = await send('navigate', { url: args[0] });
      console.log(`Navigated to: ${result.url}`);
      break;
    }
    case 'click': {
      await send('click', { selector: args[0] });
      console.log(`Clicked: ${args[0]}`);
      break;
    }
    case 'fill': {
      await send('fill', { selector: args[0], value: args[1] ?? '' });
      console.log(`Filled: ${args[0]}`);
      break;
    }
    case 'hover': {
      await send('hover', { selector: args[0] });
      console.log(`Hovered: ${args[0]}`);
      break;
    }
    case 'scroll': {
      await send('scroll', { selector: args[0] ?? null });
      console.log(args[0] ? `Scrolled into view: ${args[0]}` : 'Scrolled to top');
      break;
    }
    case 'wait': {
      await send('wait', { ms: parseInt(args[0]) || 1000 });
      console.log(`Waited ${args[0] ?? 1000}ms`);
      break;
    }
    case 'screenshot': {
      const filename = args[0] || `screenshot-${Date.now()}.png`;
      const selector = args[1] ?? null;
      const result = await send('screenshot', { filename, selector });
      try {
        const stats = await compressPng(result.path);
        console.log(`Saved: ${result.path} (${stats.saved})`);
      } catch {
        console.log(`Saved: ${result.path}`);
      }
      break;
    }
    case 'text': {
      const result = await send('text');
      console.log(result.text);
      break;
    }
    case 'html': {
      const result = await send('html');
      console.log(result.html);
      break;
    }
    case 'snapshot': {
      const result = await send('snapshot');
      console.log(JSON.stringify(result.snapshot, null, 2));
      break;
    }
    case 'url': {
      const result = await send('url');
      console.log(result.url);
      break;
    }
    case 'auth-save': {
      const result = await send('auth-save');
      console.log(`Auth state saved to ${result.saved}`);
      break;
    }
    case 'stop': {
      await send('stop');
      console.log('Browser server stopped.');
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
snapwright — Playwright browser server CLI

Usage:
  snapwright install-browsers         Download Chromium (run once after install)
  snapwright start                    Start browser server (headless)
  snapwright start --visible          Start with visible browser window
  snapwright start --port 9998        Custom port
  snapwright start --auth .auth.json  Load/save auth from file

  snapwright navigate <url>
  snapwright click <selector>
  snapwright fill <selector> <value>
  snapwright hover <selector>
  snapwright scroll [selector]
  snapwright wait <ms>
  snapwright screenshot <file> [selector]
  snapwright text
  snapwright html
  snapwright snapshot
  snapwright url
  snapwright auth-save
  snapwright stop

Environment variables:
  SNAPWRIGHT_PORT     Server port (default: 9999)
  HEADLESS            Set to "false" for visible browser
`);
}
