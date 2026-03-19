---
alias: snapwright-ai-agents
order: 5
title: Using with AI Agents
---

## Overview

snapwright comes with two Claude Code skills that let AI agents control the browser directly. Once set up, you can ask Claude things like:

> "Go to the settings page and take a screenshot"
> "Navigate to /projects, read what's on the page, then capture it"
> "Click the Invite button and screenshot the modal"

## Setup

**1. Install snapwright globally** (required — Claude Code needs `snapwright` on PATH):

```bash
npm install -g @meldocio/snapwright
snapwright install-browsers
```

**2. Install the Claude Code skills:**

```bash
snapwright install-skills
```

**3. Restart Claude Code.** Two skills are now active:

| Skill | What it does |
|---|---|
| `snapwright` | Navigate, click, fill forms, read page content |
| `snapwright-screenshot` | Take and save screenshots |

**4. Start the server before your Claude session:**

```bash
snapwright start --visible --auth .auth-state.json
```

Claude Code will detect the running server and use it automatically when you ask browser-related questions.

## Example prompts

Once the server is running, just describe what you want:

- "Take a screenshot of the homepage"
- "Navigate to /onboarding and tell me what's on the page"
- "Click the 'New Project' button and capture the result"
- "Go through the signup flow and screenshot each step"

## Auth with AI agents

If your app requires login, set up auth persistence first so the agent doesn't need to log in during the session. See [[snapwright-auth]] for the full guide.

Short version:

```bash
# First time: log in manually
snapwright start --visible --auth .auth-state.json
snapwright navigate https://app.example.com/login
# ... log in via the browser window ...
snapwright auth-save

# Every session after that:
snapwright start --auth .auth-state.json
```

## Tips

- **Start the server before opening Claude Code** — the agent checks for a running server at the start of its session
- **Use `--visible`** while developing or debugging so you can see what the browser is doing
- **Keep the server running** across multiple prompts — the browser retains state between Claude messages
- **Use a dedicated auth file per project** to avoid mixing sessions
