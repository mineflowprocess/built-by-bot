const { checkOrigin } = require('../shared/origin-check');
const { checkDailyCap, recordUsage } = require('../shared/daily-cap');

const rateLimit = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-client-ip'] || 'unknown';
}

function cleanupRateLimit(now) {
    for (const [key, entry] of rateLimit.entries()) {
        if (now - entry.windowStart > WINDOW_MS) rateLimit.delete(key);
    }
}

const SYSTEM_PROMPT = `You are a senior BI & Data Strategy consultant with 20+ years of experience across enterprise analytics, data platforms, and digital transformation. You speak to both technical teams and C-level stakeholders.

When given a business problem and tech stack, produce a structured strategy response in valid JSON with these exact keys:

{
  "executive_summary": "2-3 sentence overview for leadership",
  "current_state_assessment": {
    "strengths": ["..."],
    "gaps": ["..."],
    "risks": ["..."]
  },
  "recommendations": [
    {
      "priority": 1,
      "title": "Short title",
      "description": "What and why",
      "effort": "Low|Medium|High",
      "impact": "Low|Medium|High",
      "timeline": "e.g. 2-4 weeks"
    }
  ],
  "architecture": {
    "description": "Plain-text description of the recommended architecture",
    "mermaid": "A valid Mermaid.js diagram (graph TD or flowchart TD) showing data flow and components. Use simple node names, no special characters in labels."
  },
  "change_management": {
    "phases": [
      {
        "name": "Phase name",
        "duration": "e.g. Month 1-2",
        "activities": ["..."],
        "stakeholders": ["..."]
      }
    ],
    "key_risks": ["..."],
    "success_metrics": ["..."]
  },
  "next_steps": ["Immediate actionable items"]
}

Rules:
- Be specific and actionable, not generic
- Reference the user's actual tech stack in recommendations
- Architecture diagram should show their current tools AND recommended additions
- Change management should be realistic for their company size
- Prioritize quick wins that build momentum
- Be honest about trade-offs
- Return ONLY valid JSON, no markdown wrapping`;

module.exports = async function (context, req) {
    if ((req.method || '').toUpperCase() !== 'POST') {
        context.res = { status: 405, body: { error: 'Method not allowed' } };
        return;
    }

    // Layer 1: Origin check
    const originBlock = checkOrigin(req, context);
    if (originBlock) {
        context.res = originBlock;
        return;
    }

    // Layer 2: Per-IP rate limit (instance-local)
    const clientIp = getClientIp(req);
    const now = Date.now();
    cleanupRateLimit(now);

    const current = rateLimit.get(clientIp);
    if (!current || now - current.windowStart > WINDOW_MS) {
        rateLimit.set(clientIp, { count: 1, windowStart: now });
    } else {
        current.count += 1;
        if (current.count > MAX_REQUESTS_PER_WINDOW) {
            context.res = { status: 429, body: { error: 'Rate limit exceeded. Please wait 15 minutes.' } };
            return;
        }
    }

    // Layer 3: Daily cost ceiling (check BEFORE expensive work)
    const capBlock = checkDailyCap(context);
    if (capBlock) {
        context.res = capBlock;
        return;
    }

    // Layer 4: Cloudflare Turnstile verification
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const turnstileToken = req.body?.turnstileToken;

    if (turnstileSecret) {
        // Turnstile is configured — enforce it
        if (!turnstileToken) {
            context.res = { status: 400, body: { error: 'Bot verification failed. Please refresh and try again.' } };
            return;
        }

        try {
            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(turnstileToken)}&remoteip=${encodeURIComponent(clientIp)}`
            });
            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
                context.log.warn('Turnstile verification failed', { codes: verifyData['error-codes'] });
                context.res = { status: 403, body: { error: 'Bot verification failed. Please refresh and try again.' } };
                return;
            }
        } catch (err) {
            context.log.error('Turnstile verification error', err.message);
            // Fail open on Turnstile errors — other layers still protect us
        }
    }

    const { problem, techStack, companySize, budget, timeline } = req.body || {};

    if (!problem || problem.trim().length < 10) {
        context.res = { status: 400, body: { error: 'Please describe your business problem in more detail (at least 10 characters).' } };
        return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        context.log.error('Missing OPENAI_API_KEY');
        context.res = { status: 500, body: { error: 'AI service not configured. Please contact the site admin.' } };
        return;
    }

    const userMessage = `## Business Problem
${problem.slice(0, 3000)}

## Current Tech Stack
${(techStack || 'Not specified').slice(0, 1000)}

## Company Size
${(companySize || 'Not specified').slice(0, 200)}

## Budget Range
${(budget || 'Not specified').slice(0, 200)}

## Timeline
${(timeline || 'Not specified').slice(0, 200)}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            context.log.error('OpenAI API error', { status: response.status, body: errText.slice(0, 500) });
            context.res = { status: 502, body: { error: 'AI service temporarily unavailable.' } };
            return;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            context.res = { status: 502, body: { error: 'No response from AI service.' } };
            return;
        }

        // Parse JSON from response (handle possible markdown wrapping)
        let strategy;
        try {
            const jsonStr = content.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '');
            strategy = JSON.parse(jsonStr);
        } catch (parseErr) {
            context.log.error('Failed to parse AI response as JSON', content.slice(0, 500));
            context.res = { status: 502, body: { error: 'AI returned invalid format. Please try again.' } };
            return;
        }

        // Success — record usage for daily cap
        recordUsage();

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { success: true, strategy }
        };

    } catch (err) {
        context.log.error('BI strategy handler failed', err.message);
        context.res = { status: 500, body: { error: 'Internal server error.' } };
    }
};
