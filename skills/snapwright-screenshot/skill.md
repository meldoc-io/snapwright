---
name: snapwright-screenshot
description: >
  Takes screenshots of the current browser page using snapwright.
  Use when the user wants to capture, screenshot, or photograph the current
  state of the browser, a specific element, or a UI flow.
  Trigger phrases: "take a screenshot", "screenshot", "capture the page",
  "save a screenshot", "photograph the UI", "snap this".
meldoc-skill-version: "1"
---

Take a screenshot using the running snapwright browser server.

## Full page screenshot

```bash
snapwright screenshot output/filename.png
```

## Clip to a specific element

```bash
snapwright screenshot output/filename.png ".css-selector"
```

## Screenshot workflow

1. Navigate to the right page first if needed:
```bash
snapwright navigate https://example.com
```

2. Optionally interact to reach desired UI state:
```bash
snapwright click "button.open-dialog"
snapwright wait 400
```

3. Take the screenshot:
```bash
snapwright screenshot output/my-screen.png
```

Screenshots are compressed automatically (~60–70% size reduction via sharp).

## Notes
- Paths are relative to where the server was started (`outputDir`)
- Use absolute paths to save anywhere: `snapwright screenshot /path/to/file.png`
- Element screenshots clip tightly to the element's bounding box
