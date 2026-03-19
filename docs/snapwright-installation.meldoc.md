---
alias: snapwright-installation
order: 1
title: Installation
---

## Requirements

- Node.js 18 or later
- npm

Chromium is downloaded separately after install — it's not bundled in the npm package.

## Global install (recommended)

Install globally so the `snapwright` command is available system-wide. This is required if you want to use snapwright with AI agents like Claude Code.

```bash
npm install -g @meldocio/snapwright
snapwright install-browsers
```

`snapwright install-browsers` downloads Chromium using the exact Playwright version that comes with snapwright. This avoids version mismatches.

Verify the install:

```bash
snapwright help
```

## Local install (per project)

```bash
npm install @meldocio/snapwright
npx snapwright install-browsers
```

Run via npx or the local binary:

```bash
npx snapwright start
./node_modules/.bin/snapwright start
```

## Installing Claude Code skills

If you plan to use snapwright with Claude Code, install the built-in skills after the global install:

```bash
snapwright install-skills
```

Then restart Claude Code. See [[snapwright-ai-agents]] for the full setup.

## Updating

```bash
npm update -g @meldocio/snapwright
snapwright install-browsers
```

Run `install-browsers` again after updating — Playwright may have bumped the Chromium version.
