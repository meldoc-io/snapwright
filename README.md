# snapwright


[![npm version](https://badge.fury.io/js/@meldocio%2Fsnapwright.svg)](https://www.npmjs.com/package/@meldocio/snapwright)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A persistent Playwright browser server with CLI control, session persistence, and PNG compression.

Designed for agent-driven screenshot workflows — start the server once, then send commands from scripts, AI agents, or the terminal.

## Install

### Global (recommended)

Install globally so the `snapwright` command is available system-wide — required for use with AI agents like Claude Code.

```bash
npm install -g @meldocio/snapwright
snapwright install-browsers
```

Verify:

```bash
snapwright --help
```

### Local (per project)

```bash
npm install @meldocio/snapwright
snapwright install-browsers
```

Run via npx or the local binary:

```bash
npx snapwright start
./node_modules/.bin/snapwright start
```

---

## CLI

### Start the browser server

```bash
# Headless (default)
snapwright start

# Visible browser window
snapwright start --visible

# With persistent auth session
snapwright start --visible --auth .auth-state.json

# Custom port
snapwright start --port 9998
```

### Control the browser

```bash
snapwright navigate https://example.com
snapwright click "button.submit"
snapwright fill "input[name=email]" "user@example.com"
snapwright hover ".dropdown-trigger"
snapwright scroll ".footer"
snapwright wait 1000

# Screenshots
snapwright screenshot output/home.png           # full page
snapwright screenshot output/btn.png ".button"  # clip to element

# Read the page
snapwright text       # visible text content
snapwright snapshot   # accessibility tree (JSON)
snapwright url        # current URL

# Auth
snapwright auth-save  # save cookies + localStorage to --auth file

# Stop
snapwright stop
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `SNAPWRIGHT_PORT` | `9999` | Server port |
| `HEADLESS` | `true` | Set to `false` for visible browser |

---

## Using with AI agents (Claude Code)

### 1. Install globally

The agent needs `snapwright` on `PATH`. Global install is the easiest way:

```bash
npm install -g @meldocio/snapwright
snapwright install-browsers
```

### 2. Install Claude Code skills

```bash
snapwright install-skills
```

Restart Claude Code. Two skills will be available automatically:

| Skill | What it does |
|---|---|
| `snapwright` | Navigate, click, read page content |
| `snapwright-screenshot` | Take and save screenshots |

### 3. Start the server before your session

```bash
snapwright start --visible --auth .auth-state.json
```

The agent can now use `snapwright` commands via Bash. Example prompts:

> "Navigate to the settings page and take a screenshot"

> "Go to /projects, read what's on the page, then screenshot it"

> "Click the Invite button and capture the modal"

### Auth persistence

Log in once through the visible browser, then save the session:

```bash
snapwright auth-save
```

On all future `snapwright start --auth .auth-state.json` calls the session is restored automatically — no login required.

---

## Programmatic API

```javascript
import { BrowserServer } from '@meldocio/snapwright';

const server = new BrowserServer({
  port: 9999,
  headless: false,
  authFile: '.auth-state.json',
  outputDir: './screenshots',
  viewportWidth: 1440,
  viewportHeight: 900,
});

await server.start();
// listening on http://localhost:9999

await server.stop();
```

### PNG compression

```javascript
import { compressPng } from '@meldocio/snapwright/compress';

const stats = await compressPng('./screenshot.png');
// { original: 102400, compressed: 32768, saved: '100KB → 32KB (−68%)' }
```

---

## License

MIT
