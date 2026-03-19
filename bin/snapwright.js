#!/usr/bin/env node

/**
 * snapwright CLI entry point.
 *
 * Handles "start" command locally; delegates everything else to src/cli.js.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BrowserServer } from '../src/server.js';
import { runCli } from '../src/cli.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const command = argv[0];

if (command === 'install-skills') {
  const skillsSrc = path.join(__dirname, '..', 'skills');
  const skillsDst = path.join(process.env.HOME, '.claude', 'skills');

  if (!fs.existsSync(skillsSrc)) {
    console.error('No skills directory found in package.');
    process.exit(1);
  }

  fs.mkdirSync(skillsDst, { recursive: true });

  for (const skill of fs.readdirSync(skillsSrc)) {
    const src = path.join(skillsSrc, skill);
    const dst = path.join(skillsDst, skill);
    fs.mkdirSync(dst, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      fs.copyFileSync(path.join(src, file), path.join(dst, file));
    }
    console.log(`Installed skill: ${skill} → ${dst}`);
  }

  console.log('\nDone. Restart Claude Code to activate the skills.');
  process.exit(0);
} else if (command === 'start') {
  // Parse start flags
  const headless = !argv.includes('--visible');
  const portIdx = argv.indexOf('--port');
  const port = portIdx !== -1 ? parseInt(argv[portIdx + 1]) : parseInt(process.env.SNAPWRIGHT_PORT ?? '9999');
  const authIdx = argv.indexOf('--auth');
  const authFile = authIdx !== -1 ? path.resolve(argv[authIdx + 1]) : null;
  const outputDir = process.cwd();

  const server = new BrowserServer({ port, headless, authFile, outputDir });

  const shutdown = async () => {
    console.log('\n[snapwright] Shutting down...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await server.start();
} else {
  await runCli(argv);
}

