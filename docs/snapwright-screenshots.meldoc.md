---
alias: snapwright-screenshots
order: 3
title: Taking Screenshots
---

## Basic screenshot

Take a full-page screenshot of the current page:

```bash
snapwright screenshot output/home.png
```

The file is saved relative to the directory where you started the server. Use an absolute path to save anywhere:

```bash
snapwright screenshot /Users/me/reports/home.png
```

## Clip to an element

Pass a CSS selector as the second argument to crop the screenshot to that element's bounding box:

```bash
snapwright screenshot output/nav.png "nav.main-nav"
snapwright screenshot output/modal.png ".modal-dialog"
snapwright screenshot output/button.png "button[data-id=submit]"
```

Useful for documenting specific UI components without capturing the whole page.

## Typical workflow

Navigate to the page, interact if needed, then shoot:

```bash
snapwright navigate https://app.example.com/dashboard
snapwright screenshot output/dashboard.png

# Open a dialog first
snapwright click "button.open-settings"
snapwright wait 400
snapwright screenshot output/settings-dialog.png ".settings-dialog"
```

## Capturing a multi-step flow

```bash
snapwright navigate https://app.example.com
snapwright screenshot output/step-1-landing.png

snapwright click "a[href='/signup']"
snapwright screenshot output/step-2-signup.png

snapwright fill "input[name=email]" "user@example.com"
snapwright fill "input[name=password]" "secret"
snapwright screenshot output/step-3-filled.png

snapwright click "button[type=submit]"
snapwright wait 1000
snapwright screenshot output/step-4-result.png
```

## Automatic compression

Every screenshot is compressed in-place after capture using sharp. Typical savings: **60–70% smaller file size** with no visible quality loss.

You don't need to do anything — it happens automatically.

## Output directory

By default, paths are resolved relative to the directory where `snapwright start` was run. Start the server from your project root to keep output paths predictable:

```bash
cd /my-project
snapwright start
snapwright screenshot screenshots/home.png   # saves to /my-project/screenshots/home.png
```
