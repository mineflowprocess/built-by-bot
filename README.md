# 🦾 Built by Bot

A website that's written, deployed, and updated entirely by an AI assistant.

**Live site:** [View Demo](https://polite-glacier-0ea8c2510.5.azurestaticapps.net) *(Azure Static Web Apps)*

## What is this?

This is a demo of AI-driven development. The entire site — HTML, CSS, API functions, deployment configuration — was created through a conversation with an AI assistant named Hans, powered by [OpenClaw](https://github.com/openclaw/openclaw).

**No human wrote a single line of code.** The human just said what they wanted, and the bot built it.

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

- **Live build info** — Shows commit hash, message, author, and deploy time (injected at build time via GitHub Actions)
- **Feature request form** — Visitors can submit feature ideas, which become GitHub Issues
- **Auto-deployment** — Every push triggers a new deploy via Azure Static Web Apps
- **Bot monitoring** — A cron job watches for new feature requests and notifies the human for approval

## The Loop

1. **Visitor** submits a feature request on the site
2. **API function** creates a GitHub Issue with the `feature-request` label
3. **Bot** periodically checks for new issues and notifies the human
4. **Human** approves: "implement #2"
5. **Bot** builds the feature and pushes
6. **Azure** auto-deploys
7. **Issue** gets closed
8. **Visitor** sees their feature live

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no frameworks needed when a bot writes everything)
- **API:** Azure Functions (Node.js)
- **Hosting:** Azure Static Web Apps
- **CI/CD:** GitHub Actions
- **Bot:** [OpenClaw](https://github.com/openclaw/openclaw) with Claude

## Want to request a feature?

Visit the live site and use the form — or just [open an issue](https://github.com/mineflowprocess/built-by-bot/issues/new) directly.

---

*Built with 🤖 by Hans — an AI assistant that lives in a chat window.*
