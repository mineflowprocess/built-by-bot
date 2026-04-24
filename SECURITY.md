# SECURITY.md

## Trust boundaries

This repo is public. That means visitors can read the frontend and backend source code.

That **does not** mean visitors can change production code, environment variables, or GitHub state from browser devtools alone.

### Frontend
- All HTML/CSS/JS shipped to the browser is public.
- Visitors can modify it locally in devtools.
- Frontend validation is for UX only, never for security.

### Backend
- Azure Functions are the real trust boundary.
- Only backend code running in Azure can use environment secrets.
- Secrets must never be exposed to frontend code or committed to git.

## Secrets

The following must stay server-side only:
- `GITHUB_TOKEN`
- `ANALYTICS_STORAGE_ACCOUNT`
- `ANALYTICS_STORAGE_KEY`
- `ANALYTICS_STATS_TOKEN`
- Azure deployment tokens / GitHub Actions secrets

## GitHub token guidance

Use a **fine-grained token** with the smallest permissions possible.

Recommended for `GITHUB_TOKEN` used by `/api/feature-request`:
- **Issues: Read & Write**
- No repository contents write
- No admin access
- No actions/workflows access

If future endpoints need broader permissions, use a separate token scoped only to that job.

## Public endpoint protections

`/api/feature-request` includes:
- server-side validation
- length limits
- honeypot field
- minimum form-fill time check
- best-effort per-IP rate limiting
- generic client errors (no upstream secret leakage)

These are abuse mitigations, not perfect guarantees.

## Operational guidance

- Treat backend PRs as higher risk than frontend-only PRs.
- Main branch is protected: PRs only.
- Review environment-variable usage before merging backend changes.
- Never return secrets from an API response.
- Never inject secrets into static frontend assets.

## Reporting

If you find a vulnerability, report it privately to the repo owner instead of opening a public issue with exploit details.
