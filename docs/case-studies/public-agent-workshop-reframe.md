# Case study: Built by Bot as a public AI-agent workshop

Date: 2026-05-30
Repo: `mineflowprocess/built-by-bot`
Status: ready for public review; not a claim of autonomous production without human approval

## Short version

Built by Bot was reframed from a simple AI-built portfolio into a public AI-agent workshop.

The new story is:

> Submit a brief. Watch it enter the queue. See agents build, review, and ship it.

This makes the project more useful as public proof-of-work: visitors can understand the workflow, inspect shipped projects, follow build notes, and see that agent output is reviewed before it is treated as ready.

## Why this mattered

The old positioning leaned heavily on the idea that a bot could build whatever visitors asked for. That was fun, but it created three problems:

1. It overpromised. Not every request should or can be built.
2. It hid the process. The strongest evidence is not just the finished page, but the queue, build trail, review notes, and fixes.
3. It made the site feel like a novelty portfolio instead of a repeatable workshop.

The new positioning keeps the playful Hans/OpenClaw lore, but adds a clearer operating model: brief, queue, build, review, ship.

## What changed

The homepage was updated to communicate the workshop loop in about ten seconds:

- New page title and meta description around the public AI-agent workshop.
- New hero copy with the core promise: submit a small brief, then follow the public build trail.
- A five-step process section: Brief -> Queue -> Build -> Review -> Ship.
- A workshop board explaining the state of ideas, builds, reviews, shipped work, and receipts.
- Agent crew cards for Hans, Researcher, Builder, and Reviewer roles.
- Prompt starter cards that prefill the existing request form without submitting it.
- More public-facing request-form copy, replacing internal implementation notes.
- Safer issue rendering on `/projects/`: issue text is escaped, issue links are built from numeric issue numbers, and new tab links use safer relationship attributes.

No new backend dependency, payment flow, authentication flow, or secret was added.

## Review trail

The work used a multi-step agent workflow:

1. Research/planning produced the workshop positioning and homepage content model.
2. Builder work implemented the homepage reframe and project-page safety fix.
3. Reviewer work checked UX, copy, link safety, browser behavior, and regression risk.
4. Builder work fixed review findings around anchor positioning, prompt-starter affordance, and public form helper copy.
5. Final acceptance marked the slice ready for preview, with caveats.

The important point: the agent did not just generate copy and ship it. The change went through a review/fix/acceptance loop.

## Checks performed

The acceptance pass included:

- Syntax checks for the JavaScript-bearing API/shared files and `devlog/embed.js`.
- JSON parsing checks for repository JSON files outside `.git`.
- Static checks for unsafe new-tab links in the reviewed homepage and projects page paths.
- Static checks that internal helper copy was removed and prompt starters include explicit action text.
- Browser smoke checks for homepage title, CTA anchor behavior, prompt-starter form prefill, required-field validation, and console errors.
- Browser check that `/projects/` rendered issue cards with constrained issue URLs and safer `rel` attributes.

## Remaining caveats

This slice improves the public workshop story and reviewed paths, but it is not a full-site security or product-completeness claim.

Known follow-up areas:

- The homepage is longer and content-dense; a future pass can add a repeated compact CTA or shorten dev-log previews.
- Public GitHub API data remains a live dependency for some activity/projects/status surfaces.
- Broader hardening still belongs in the backlog: CSP/security headers, workflow hardening, wider link cleanup, and AI/API cost-control safeguards.
- The feature-request backend should be monitored separately; if GitHub issue creation fails, that is an operational backend/config issue, not a homepage-copy issue.

## What this proves

This is useful proof-of-work for Flowsafe-style agent delivery because it shows the operating pattern, not just the output:

- A small product slice was scoped.
- The agent work was decomposed into roles.
- Risky public-data rendering was handled before expanding the public surface.
- Reviewer feedback produced concrete fixes.
- The result is inspectable in git and on the live static site once released.

That is the commercial lesson: agents are most credible when their work is visible, reviewed, and tied to a clear business or user outcome.
