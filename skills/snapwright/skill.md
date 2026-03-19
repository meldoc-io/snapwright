---
name: snapwright
description: >
  Controls a running snapwright browser server to navigate pages, read content,
  and interact with UI elements. Use when the user wants to explore an app,
  click around, read page text, or interact with the browser.
  Trigger phrases: "navigate to", "click on", "read the page", "what's on the page",
  "go to", "open the app", "browse to", "interact with", "snapwright".
meldoc-skill-version: "1"
---

Use the snapwright CLI to control the running browser server.

## Check server is running

```bash
curl -s http://localhost:9999/url || echo "Server not running — start with: snapwright start --visible"
```

## Available commands

```bash
snapwright navigate <url>           # navigate to a URL
snapwright text                     # read visible page text (use this to understand current UI)
snapwright url                      # get current URL
snapwright click "<selector>"       # click an element (CSS selector or text=...)
snapwright fill "<selector>" "val"  # type into an input
snapwright hover "<selector>"       # hover over an element
snapwright scroll "<selector>"      # scroll element into view
snapwright wait <ms>                # pause (e.g. 500 for animations)
snapwright snapshot                 # accessibility tree — use to find selectors
```

## Workflow

1. `snapwright text` or `snapwright snapshot` — understand what's on screen
2. Identify the right selector from the output
3. `snapwright click` / `snapwright fill` to interact
4. Repeat until the desired UI state is reached
