// 修复版 cf-umami tracker.js
(function() {
    const WORKER_URL = 'https://cf-umami-cofe.050815.xyz';
    const SEND_ENDPOINT = WORKER_URL + '/send';
    let lastPathname = null;

    function sendPageView() {
        try {
            const pathname = location.pathname || '/';
            if (lastPathname === pathname) return;
            lastPathname = pathname;

            const data = JSON.stringify({ pathname: pathname });

            if (navigator.sendBeacon) {
                try {
                    const blob = new Blob([data], { type: 'application/json' });
                    if (navigator.sendBeacon(SEND_ENDPOINT, blob)) return;
                } catch (e) {}
            }

            fetch(SEND_ENDPOINT, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: data,
                keepalive: true,
                mode: 'cors',
                credentials: 'omit'
            }).catch(() => {});
        } catch (e) {}
    }

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        const result = originalPushState.apply(this, arguments);
        sendPageView();
        return result;
    };

    history.replaceState = function() {
        const result = originalReplaceState.apply(this, arguments);
        sendPageView();
        return result;
    };

    addEventListener('popstate', sendPageView, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sendPageView, { once: true });
    } else {
        sendPageView();
    }
})();
