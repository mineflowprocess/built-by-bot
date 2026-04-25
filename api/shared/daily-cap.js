/**
 * Daily cost ceiling — hard cap on successful API calls per UTC day.
 *
 * Implementation: in-memory counter keyed by UTC date string.
 * Resets naturally at midnight UTC. If the Function instance restarts,
 * the counter resets early — this is acceptable because:
 *   1. It's one layer in a stack (Origin check + IP rate limit + Turnstile)
 *   2. Worst case on restart = up to 2x daily cap, not unlimited
 *   3. Zero additional infra/cost vs Table Storage
 *
 * For production with real money at stake and multiple instances,
 * swap this for Azure Table Storage with a single row per date.
 */

let dailyCount = 0;
let dailyKey = '';

function getUtcDate() {
    return new Date().toISOString().slice(0, 10); // "2026-04-25"
}

/**
 * Check if we're under the daily cap.
 * Call BEFORE doing expensive work (OpenAI call).
 * Returns null if OK, or a 429 response object if capped.
 */
function checkDailyCap(context) {
    const today = getUtcDate();
    const cap = parseInt(process.env.DAILY_AI_CAP) || 50;

    // Reset on new day
    if (dailyKey !== today) {
        dailyKey = today;
        dailyCount = 0;
    }

    if (dailyCount >= cap) {
        context.log.warn('Daily AI cap reached', { date: today, count: dailyCount, cap });
        return {
            status: 429,
            body: { error: 'Daily limit reached. The AI strategy tool resets at midnight UTC. Try again tomorrow!' }
        };
    }

    return null; // under cap
}

/**
 * Increment the counter. Call AFTER a successful OpenAI response.
 */
function recordUsage() {
    const today = getUtcDate();
    if (dailyKey !== today) {
        dailyKey = today;
        dailyCount = 0;
    }
    dailyCount++;
}

module.exports = { checkDailyCap, recordUsage };
