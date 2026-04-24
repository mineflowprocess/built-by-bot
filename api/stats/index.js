const crypto = require('crypto');

module.exports = async function (context, req) {
    // ─── Auth: simple shared secret ───
    const token = req.headers['x-stats-token'] || req.query.token;
    const expectedToken = process.env.ANALYTICS_STATS_TOKEN;

    if (!expectedToken || token !== expectedToken) {
        context.res = { status: 401, body: { error: 'Unauthorized' } };
        return;
    }

    const account = process.env.ANALYTICS_STORAGE_ACCOUNT;
    const accountKey = process.env.ANALYTICS_STORAGE_KEY;
    const tableName = process.env.ANALYTICS_TABLE_NAME || 'analytics';

    if (!account || !accountKey) {
        context.res = { status: 500, body: { error: 'Analytics not configured' } };
        return;
    }

    // ─── Query parameters ───
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const now = new Date();
    
    // Build date range
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    // ─── Fetch data from Table Storage ───
    const allRows = [];

    for (const dateKey of dates) {
        try {
            const filter = `PartitionKey eq '${dateKey}'`;
            const url = `https://${account}.table.core.windows.net/${tableName}()?$filter=${encodeURIComponent(filter)}`;
            const dateStr = new Date().toUTCString();

            const stringToSign = `${dateStr}\n/${account}/${tableName}`;
            const signature = crypto.createHmac('sha256', Buffer.from(accountKey, 'base64'))
                .update(stringToSign)
                .digest('base64');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `SharedKeyLite ${account}:${signature}`,
                    'Accept': 'application/json;odata=nometadata',
                    'x-ms-date': dateStr,
                    'x-ms-version': '2020-12-06'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.value) allRows.push(...data.value);
            }
        } catch (err) {
            context.log.warn(`Failed to fetch ${dateKey}:`, err.message);
        }
    }

    // ─── Aggregate ───
    const stats = {
        period: `${days} days`,
        totalPageViews: 0,
        uniqueVisitors: new Set(),
        byPage: {},
        byDate: {},
        byHour: {},
        topReferrers: {},
        events: {}
    };

    allRows.forEach(row => {
        stats.totalPageViews++;
        stats.uniqueVisitors.add(row.VisitorHash);

        // By page
        const page = row.Page || '/';
        stats.byPage[page] = (stats.byPage[page] || 0) + 1;

        // By date
        const date = row.PartitionKey;
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;

        // By hour
        const hour = row.Hour ?? 0;
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

        // Referrers
        if (row.Referrer && !row.Referrer.includes(account)) {
            const ref = row.Referrer.substring(0, 100);
            stats.topReferrers[ref] = (stats.topReferrers[ref] || 0) + 1;
        }

        // Events
        const evt = row.Event || 'pageview';
        stats.events[evt] = (stats.events[evt] || 0) + 1;
    });

    // Convert set to count
    stats.uniqueVisitors = stats.uniqueVisitors.size;

    // Sort referrers by count, top 10
    stats.topReferrers = Object.entries(stats.topReferrers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    // Sort pages by count
    stats.byPage = Object.entries(stats.byPage)
        .sort((a, b) => b[1] - a[1])
        .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    // Sort dates
    stats.byDate = Object.entries(stats.byDate)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: stats
    };
};
