const rateLimit = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_NAME_LENGTH = 60;
const MIN_FORM_FILL_MS = 1500;

function cleanText(value, maxLength) {
    return String(value || '')
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-client-ip'] ||
        req.headers['client-ip'] ||
        'unknown';
}

function cleanupRateLimit(now) {
    for (const [key, entry] of rateLimit.entries()) {
        if (now - entry.windowStart > WINDOW_MS) {
            rateLimit.delete(key);
        }
    }
}

module.exports = async function (context, req) {
    if ((req.method || '').toUpperCase() !== 'POST') {
        context.res = {
            status: 405,
            body: { error: 'Method not allowed' }
        };
        return;
    }

    const clientIp = getClientIp(req);
    const now = Date.now();
    cleanupRateLimit(now);

    // Best-effort rate limit per IP (instance-local; still useful against casual abuse)
    const current = rateLimit.get(clientIp);
    if (!current || now - current.windowStart > WINDOW_MS) {
        rateLimit.set(clientIp, { count: 1, windowStart: now });
    } else {
        current.count += 1;
        if (current.count > MAX_REQUESTS_PER_WINDOW) {
            context.res = {
                status: 429,
                body: { error: 'Too many requests. Please try again later.' }
            };
            return;
        }
    }

    const title = cleanText(req.body?.title, MAX_TITLE_LENGTH);
    const description = cleanText(req.body?.description, MAX_DESCRIPTION_LENGTH);
    const submitter = cleanText(req.body?.name || 'Anonymous', MAX_NAME_LENGTH) || 'Anonymous';
    const honeypot = cleanText(req.body?.website, 200);
    const formStartedAt = Number(req.body?.formStartedAt || 0);

    // Hidden field bots fill, humans won't.
    if (honeypot) {
        context.res = {
            status: 200,
            body: { success: true }
        };
        return;
    }

    // Light bot friction: instant submissions are suspicious.
    if (!Number.isFinite(formStartedAt) || now - formStartedAt < MIN_FORM_FILL_MS) {
        context.res = {
            status: 400,
            body: { error: 'Form submitted too quickly. Please try again.' }
        };
        return;
    }

    if (!title) {
        context.res = {
            status: 400,
            body: { error: 'Title is required' }
        };
        return;
    }

    if (title.length < 3) {
        context.res = {
            status: 400,
            body: { error: 'Title is too short' }
        };
        return;
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        context.log.error('Missing GITHUB_TOKEN');
        context.res = {
            status: 500,
            body: { error: 'Server configuration error' }
        };
        return;
    }

    const issueBody = `## Feature Request

**Submitted by:** ${submitter}

**Description:**
${description || 'No description provided.'}

---
*Submitted via the website feature request form* 🦾`;

    try {
        const response = await fetch('https://api.github.com/repos/mineflowprocess/built-by-bot/issues', {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'Azure-Function'
            },
            body: JSON.stringify({
                title: `[Feature Request] ${title}`,
                body: issueBody,
                labels: ['feature-request']
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            context.log.error('GitHub issue creation failed', {
                status: response.status,
                body: errorText.slice(0, 1000)
            });
            context.res = {
                status: 502,
                body: { error: 'Failed to create issue' }
            };
            return;
        }

        const issue = await response.json();
        context.res = {
            status: 200,
            body: {
                success: true,
                issueNumber: issue.number,
                issueUrl: issue.html_url
            }
        };
    } catch (err) {
        context.log.error('Feature request handler failed', err.message);
        context.res = {
            status: 500,
            body: { error: 'Failed to create issue' }
        };
    }
};
