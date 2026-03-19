---
alias: snapwright
order: 0
title: Overview
---

## What is snapwright?

snapwright is a persistent browser server you control from the command line. Start it once, then send it commands — navigate, click, fill forms, read page content, take screenshots — without reopening a browser each time.

It's built for workflows where you need to automate or observe a web UI repeatedly: manual testing, documentation, AI-driven automation, or capturing screenshots for reports.

## How it works

```
snapwright start          ← launches a Chromium browser in the background
snapwright navigate ...   ← sends commands to that browser over HTTP
snapwright screenshot ...
snapwright stop
```

The browser stays open between commands, so cookies, session state, and page context are preserved across the entire workflow.

## Key features

- **Persistent session** — the browser doesn't restart between commands; state is preserved
- **Auth persistence** — log in once, save the session, restore it on future runs
- **Full-page screenshots** — captures the entire page or clips to a specific element
- **Automatic PNG compression** — screenshots are compressed ~60–70% in size
- **AI agent integration** — works out of the box with Claude Code via built-in skills

## Quick start

```bash
# 1. Install
npm install -g @meldocio/snapwright
snapwright install-browsers

# 2. Start the browser
snapwright start

# 3. Use it
snapwright navigate https://example.com
snapwright screenshot output/home.png
snapwright stop
```

## What's next

- [[snapwright-installation]] — full install guide, global vs local
- [[snapwright-cli]] — all commands and options
- [[snapwright-screenshots]] — screenshot workflows
- [[snapwright-auth]] — saving and restoring login sessions
- [[snapwright-ai-agents]] — using snapwright with Claude Code
