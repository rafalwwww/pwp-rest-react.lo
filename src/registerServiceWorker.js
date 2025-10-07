// registerServiceWorker.js
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Only register on localhost or when served over https
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/)
    );

    if (isLocalhost || window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('[SW] registered with scope:', reg.scope);
      }).catch(err => {
        console.warn('[SW] registration failed:', err);
      });
    }
  }
}
