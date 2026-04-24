# 🦾 Built by Bot

A website that's written, deployed, and updated entirely by an AI assistant.

**Live site:** [View Demo](https://polite-glacier-0ea8c2510.7.azurestaticapps.net) *(Azure Static Web Apps)*

## What is this?

This is a demo of AI-driven development. The entire site — HTML, CSS, API functions, deployment configuration — was created through a conversation with an AI assistant named Hans, powered by [OpenClaw](https://github.com/openclaw/openclaw).

**No human wrote a single line of code.** The human just said what they wanted, and the bot built it.

## Architecture

```
static-site/
├── index.html              # Landing page
├── projects/
│   ├── index.html          # Projects showcase (auto-generated from GitHub issues)
│   └── calculator/         # Example standalone project
│       └── index.html
└── api/
    └── feature-request/    # Azure Function for form submissions
        └── index.js
```

### Key Design Decisions

- **Projects pull from GitHub Issues** — No manual tracking needed. Close an issue → shows as "Done" on the site
- **Standalone projects** live in `/projects/{slug}/` — Keeps landing page clean
- **Monetization via Ko-fi** — Priority requests (€5) to jump the queue

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│  Human: "Let's build a website"                             │
│     ↓                                                       │
│  Bot: Creates HTML, pushes to GitHub                        │
│     ↓                                                       │
│  GitHub Actions: Triggers Azure deployment                  │
│     ↓                                                       │
│  Site goes live with build info injected at deploy time     │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Live build info** — Shows commit hash, message, author, and deploy time
- **Feature request form** — Visitors submit ideas → become GitHub Issues
- **Priority requests** — €5 via Ko-fi to get features built first
- **Projects showcase** — Auto-generated from GitHub issues, zero maintenance
- **Standalone tools** — Individual projects at `/projects/{name}/`
- **Auto-deployment** — Every push triggers a new deploy

## The Loop

1. **Visitor** submits a feature request on the site
2. **API function** creates a GitHub Issue with the `feature-request` label
3. **Human** (or bot) sees the request and builds it
4. **Bot** creates the feature in `/projects/{name}/` if standalone
5. **Bot** pushes to GitHub, closes the issue
6. **Azure** auto-deploys
7. **Projects page** auto-updates (pulls from GitHub API)

## Adding New Projects

When building a new standalone project:

1. Create the page at `/projects/{slug}/index.html`
2. Add the slug mapping in `/projects/index.html` → `getProjectUrl()`:
   ```javascript
   const knownProjects = {
       'simple-calculator': '/projects/calculator/',
       'your-new-project': '/projects/your-new-project/'
   };
   ```
3. Close the GitHub issue → shows as "Done" with "Try it →" button

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS
- **API:** Azure Functions (Node.js)
- **Hosting:** Azure Static Web Apps
- **CI/CD:** GitHub Actions
- **Payments:** Ko-fi (https://ko-fi.com/builtbybot)
- **Bot:** [OpenClaw](https://github.com/openclaw/openclaw) with Claude

## Links

- **Live site:** https://polite-glacier-0ea8c2510.7.azurestaticapps.net
- **Projects:** https://polite-glacier-0ea8c2510.7.azurestaticapps.net/projects/
- **Ko-fi:** https://ko-fi.com/builtbybot
- **Request a feature:** [Open an issue](https://github.com/mineflowprocess/built-by-bot/issues/new)

---

*Built with 🤖 by Hans — an AI assistant that lives in a chat window.*
# test
