---
alias: snapwright-auth
order: 4
title: Session & Auth Persistence
---

## The problem

Without auth persistence, you'd have to log in manually every time you start the browser server. snapwright solves this by saving and restoring your full browser session — cookies, localStorage, and session storage — across runs.

## Setup

**1. Start with an auth file path:**

```bash
snapwright start --visible --auth .auth-state.json
```

The `--visible` flag is recommended for the first run so you can log in through the browser window.

**2. Log in manually in the browser.**

Navigate to your app and complete login normally:

```bash
snapwright navigate https://app.example.com/login
```

Then log in through the visible browser window.

**3. Save the session:**

```bash
snapwright auth-save
```

This writes cookies and storage state to `.auth-state.json`.

## Restoring the session

On all future runs, pass the same auth file:

```bash
snapwright start --auth .auth-state.json
```

snapwright loads the session automatically. No login required.

## What gets saved

The auth file contains:
- Cookies (including session and auth cookies)
- `localStorage` values
- `sessionStorage` values

This covers most standard login flows — cookie-based sessions, JWT tokens stored in localStorage, etc.

## When does the session expire?

The saved session is only valid as long as the underlying auth tokens are valid. If the session expires (e.g. after 30 days), you'll need to log in again and re-run `snapwright auth-save`.

## Security note

The `.auth-state.json` file contains real session tokens. Don't commit it to version control.

Add it to `.gitignore`:

```
.auth-state.json
```
