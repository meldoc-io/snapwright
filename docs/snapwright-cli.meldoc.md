---
alias: snapwright-cli
order: 2
title: CLI Reference
---

## Starting the server

The browser server must be running before you can use any other commands.

```bash
snapwright start                              # headless (no visible window)
snapwright start --visible                    # visible browser window
snapwright start --port 9998                  # custom port (default: 9999)
snapwright start --auth .auth-state.json      # load saved auth session
snapwright start --visible --auth .auth.json  # visible + auth
```

The server runs in the foreground. Use a separate terminal for commands, or run it in the background with your shell (`snapwright start &`).

## Navigation

```bash
snapwright navigate https://example.com
```

Waits for the page to fully load (network idle) before returning.

## Reading the page

```bash
snapwright text      # visible text content — good for understanding what's on screen
snapwright html      # raw HTML of the page
snapwright snapshot  # accessibility tree as JSON — useful for finding selectors
snapwright url       # current URL
```

Start with `snapwright text` or `snapwright snapshot` when you're unsure what's on the page.

## Interacting

```bash
snapwright click "<selector>"              # click an element
snapwright fill "<selector>" "<value>"     # type into an input field
snapwright hover "<selector>"              # hover over an element
snapwright scroll "<selector>"             # scroll element into view
snapwright scroll                          # scroll to top of page
snapwright wait <ms>                       # pause for N milliseconds
```

Selectors can be CSS selectors (`button.submit`, `input[name=email]`) or Playwright text selectors (`text=Sign in`).

## Screenshots

```bash
snapwright screenshot output/page.png              # full page
snapwright screenshot output/btn.png ".my-button"  # clip to element
```

Screenshots are compressed automatically. See [[snapwright-screenshots]] for workflows.

## Auth

```bash
snapwright auth-save   # save current cookies + localStorage to --auth file
```

Requires `--auth <file>` to be set when starting the server. See [[snapwright-auth]].

## Stopping

```bash
snapwright stop
```

Closes the browser and shuts down the server.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SNAPWRIGHT_PORT` | `9999` | Port the server listens on |
| `HEADLESS` | `true` | Set to `false` for a visible browser window |

Environment variables can be used instead of CLI flags:

```bash
SNAPWRIGHT_PORT=9998 snapwright start
HEADLESS=false snapwright start
```
