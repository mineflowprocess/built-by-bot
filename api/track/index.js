const crypto = require('crypto');

module.exports = async function (context, req) {
    // ─── Collect event data ───
    const page = req.body?.page || '/';
    const referrer = req.body?.referrer || '';
    const event = req.body?.event || 'pageview';
    const ua = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-client-ip'] || 
               req.headers['client-ip'] || 'unknown';

    // ─── Azure Table Storage config ───
    const account = process.env.ANALYTICS_STORAGE_ACCOUNT;
    const accountKey = process.env.ANALYTICS_STORAGE_KEY;
    const tableName = process.env.ANALYTICS_TABLE_NAME || 'analytics';

    if (!account || !accountKey) {
        // Silent fail — don't break the site if analytics isn't configured
        context.res = { status: 200, body: { ok: true } };
        return;
    }

    // ─── Build row ───
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // 2026-04-24
    const hourKey = now.getUTCHours().toString().padStart(2, '0');
    
    // Hash the IP for privacy — we don't store raw IPs
    const visitorHash = crypto.createHash('sha256')
        .update(ip + dateKey) // Rotates daily so we can't track long-term
        .digest('hex')
        .substring(0, 12);

    const rowKey = `${now.getTime()}-${crypto.randomBytes(4).toString('hex')}`;

    const entity = {
        PartitionKey: dateKey,
        RowKey: rowKey,
        Page: page,
        Event: event,
        Referrer: referrer.substring(0, 500),
        VisitorHash: visitorHash,
        Hour: parseInt(hourKey),
        UserAgent: ua.substring(0, 300),
        Timestamp: now.toISOString()
    };

    // ─── Write to Table Storage (REST API) ───
    try {
        const url = `https://${account}.table.core.windows.net/${tableName}`;
        const dateStr = now.toUTCString();
        
        // Build the authorization header (SharedKey)
        const stringToSign = `${dateStr}\n/${account}/${tableName}`;
        const signature = crypto.createHmac('sha256', Buffer.from(accountKey, 'base64'))
            .update(stringToSign)
            .digest('base64');

        const body = JSON.stringify(entity);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `SharedKeyLite ${account}:${signature}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json;odata=nometadata',
                'x-ms-date': dateStr,
                'x-ms-version': '2020-12-06',
                'Content-Length': Buffer.byteLength(body).toString(),
                'Prefer': 'return-no-content'
            },
            body: body
        });

        if (!response.ok) {
            const err = await response.text();
            context.log.warn('Analytics write failed:', response.status, err);
        }
    } catch (err) {
        // Don't fail the request — analytics is best-effort
        context.log.warn('Analytics error:', err.message);
    }

    // ─── Always return OK ───
    // CORS-friendly, tiny response, fast
    context.res = {
        status: 200,
        headers: {
            'Cache-Control': 'no-store'
        },
        body: { ok: true }
    };
};
