/**
 * Origin / Referer check.
 *
 * Why Origin and not CORS?
 * CORS is enforced by browsers only — it tells the browser whether to expose
 * the response to JS. It does NOT prevent the request from reaching the server.
 * curl, Postman, and scripts ignore CORS entirely. The request still executes,
 * the Function still runs, the OpenAI bill still goes up.
 *
 * Origin/Referer is a server-side check: we read the header and reject before
 * doing any work. A determined attacker can spoof it — that's fine, this is
 * one layer in a stack (rate limit, daily cap, Turnstile).
 *
 * Custom headers like "X-From-Website" are pure theater — anyone can send any
 * header. At least Origin is set automatically by browsers and hard to forge
 * from a browser context.
 */

const ALLOWED_ORIGINS = [
    'https://polite-glacier-0ea8c2510.7.azurestaticapps.net',
    // Add custom domain here when ready:
    // 'https://hans.build',
    // 'https://www.hans.build',
];

// Dev origins — only active when ALLOW_DEV_ORIGINS env var is set
const DEV_ORIGINS = [
    'http://localhost:4280',
    'http://localhost:3000',
    'http://127.0.0.1:4280',
    'http://127.0.0.1:3000',
];

/**
 * Returns null if the origin is allowed, or a 403 response object if not.
 */
function checkOrigin(req, context) {
    const origin = req.headers['origin'] || '';
    const referer = req.headers['referer'] || '';

    const allowed = [
        ...ALLOWED_ORIGINS,
        ...(process.env.ALLOW_DEV_ORIGINS ? DEV_ORIGINS : []),
    ];

    // Check Origin header first (sent on POST by all modern browsers)
    if (origin && allowed.some(a => origin === a)) {
        return null; // allowed
    }

    // Fall back to Referer (some edge cases don't send Origin)
    if (referer && allowed.some(a => referer.startsWith(a + '/'))) {
        return null; // allowed
    }

    // No valid origin
    context.log.warn('Blocked request — bad origin', { origin, referer, ip: getIp(req) });
    return {
        status: 403,
        body: { error: 'Forbidden' }
    };
}

function getIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
}

module.exports = { checkOrigin, ALLOWED_ORIGINS };
