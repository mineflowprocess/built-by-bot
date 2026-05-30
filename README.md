# 🦾 Built by Bot

A public AI-agent workshop: visitors submit small briefs, watch them enter the queue, and follow the path from build notes to shipped mini-projects.

**Live site:** [View Demo](https://polite-glacier-0ea8c2510.7.azurestaticapps.net) *(Azure Static Web Apps)*

## What is this?

This is a demo of AI-assisted development with a visible workflow. Hans and the agent crew turn selected small briefs into live HTML/CSS/JS projects, while the queue, dev log, review trail, and shipped work stay inspectable.

The point is not “bots magically build everything.” The point is a public loop: **Brief → Queue → Build → Review → Ship**.

See the public write-up: [case study: Built by Bot as a public AI-agent workshop](./docs/case-studies/public-agent-workshop-reframe.md).

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

- **Projects pull from GitHub Issues** — Public requests and shipped work stay visible
- **Standalone projects** live in `/projects/{slug}/` — Keeps the workshop simple and inspectable
- **Review before shipping** — Agent work is checked for obvious bugs, unsafe rendering, and overconfident copy before release

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│  Visitor: submits a small brief                             │
│     ↓                                                       │
│  Queue: request becomes visible as a GitHub issue            │
│     ↓                                                       │
│  Agents: scope, build, and review a selected slice           │
│     ↓                                                       │
│  Human approval + GitHub Actions: release to the live site   │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Live build info** — Shows commit hash, message, author, and deploy time
- **Feature request form** — Visitors submit ideas that can become GitHub Issues
- **Workshop process** — Brief, queue, build, review, and ship are explained publicly
- **Projects showcase** — Auto-generated from GitHub issues, with live project links where available
- **Standalone tools** — Individual projects at `/projects/{name}/`
- **Auto-deployment** — Approved changes deploy through GitHub Actions

## The Loop

1. **Visitor** submits a small feature request or project brief
2. **API function** creates a GitHub Issue with the `feature-request` label
3. **Human/agent workflow** decides whether the request is small, safe, and useful enough to build
4. **Agent crew** scopes, builds, and reviews the selected slice
5. **Human approval** decides whether the PR is merged
6. **Azure** deploys approved changes
7. **Projects page and dev log** expose shipped work and receipts

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

## Security Notes

- The repo is public, so frontend and backend source code are readable.
- Secrets live in Azure environment variables, not in the frontend or git.
- Public APIs must be validated server-side; frontend checks are UX only.
- See [`SECURITY.md`](./SECURITY.md) for trust boundaries and token guidance.

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
