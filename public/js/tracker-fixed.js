// 修复版 cf-umami tracker.js
// 解决 document.currentScript 在 Next.js 中不可用的问题

(function() {
    // 使用硬编码的 Worker URL，而不是依赖 document.currentScript
    const WORKER_URL = 'https://cf-umami-cofe.050815.xyz';
    const SEND_ENDPOINT = WORKER_URL + '/send';
    
    let lastPathname = null;
    
    function sendPageView() {
        try {
            const pathname = location.pathname || '/';
            
            // 避免重复发送相同路径
            if (lastPathname === pathname) return;
            lastPathname = pathname;
            
            const data = JSON.stringify({ pathname: pathname });
            
            // 尝试使用 sendBeacon
            if (navigator.sendBeacon) {
                try {
                    const blob = new Blob([data], { type: 'application/json' });
                    const result = navigator.sendBeacon(SEND_ENDPOINT, blob);
                    if (result) {
                        console.log('[Tracker] Page view sent via sendBeacon:', pathname);
                        return;
                    }
                } catch (e) {
                    console.warn('[Tracker] sendBeacon failed:', e);
                }
            }
            
            // 回退到 fetch
            fetch(SEND_ENDPOINT, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: data,
                keepalive: true,
                mode: 'cors',
                credentials: 'omit'
            }).then(() => {
                console.log('[Tracker] Page view sent via fetch:', pathname);
            }).catch((err) => {
                console.warn('[Tracker] fetch failed:', err);
            });
        } catch (e) {
            console.error('[Tracker] Error:', e);
        }
    }
    
    // 监听路由变化
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
    
    // 页面加载完成后发送
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sendPageView, { once: true });
    } else {
        sendPageView();
    }
    
    console.log('[Tracker] Fixed tracker.js loaded, Worker URL:', WORKER_URL);
})();
