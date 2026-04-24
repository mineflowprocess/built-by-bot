// Built by Bot — Lightweight Analytics
// Tracks page views via Azure Function → Table Storage
// No cookies, no fingerprinting, privacy-first
(function() {
    if (navigator.doNotTrack === '1') return; // Respect DNT
    
    var data = {
        page: window.location.pathname,
        referrer: document.referrer || '',
        event: 'pageview'
    };

    // Use sendBeacon for reliability (fires even on page close)
    var payload = JSON.stringify(data);
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
        }).catch(function() {});
    }
})();
