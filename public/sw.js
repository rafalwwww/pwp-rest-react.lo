// Service Worker for local fallback of WP JSON endpoints
// Scope: / (serve from site root)

// Cache naming/versioning
const CACHE_PREFIX = 'local-backup-';
const CACHE_VERSION = 'v20251007160539';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// Map remote request patterns to local backup files (relative to site root)
const FALLBACKS = [
  { match: /\/wp-json\/$/, local: '/backup/wp-json.json' },
  { match: /\/wp-json\/wp\/v2\/pages\/269/, local: '/backup/pages-269.json' },
  { match: /\/wp-json\/wp\/v2\/portfolio_project/, local: '/backup/portfolio_project.json' }
];

function timeoutPromise(promise, ms = 6000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(res => {
      clearTimeout(t);
      resolve(res);
    }, err => {
      clearTimeout(t);
      reject(err);
    });
  });
}

self.addEventListener('install', event => {
  // Optionally pre-cache the local backups
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      const urls = FALLBACKS.map(f => f.local);
      return cache.addAll(urls.map(url => new Request(url, { cache: 'reload' }))).catch(() => {
        // ignore cache failures
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Clean up old caches that match the prefix but are not the current version
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => {
        if (k !== CACHE_NAME && k.startsWith(CACHE_PREFIX)) {
          return caches.delete(k);
        }
        return Promise.resolve();
      }));
    } catch (e) {
      // ignore cleanup errors
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Find a fallback rule for the request
  const rule = FALLBACKS.find(f => f.match.test(url));
  if (!rule) return; // let the request go to network

  event.respondWith((async () => {
    // Try cached local file first (fast, avoids hitting remote API)
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(rule.local);
      if (cached) return cached;
    } catch (e) {
      // ignore cache lookup errors
    }

    // Try fetching local file directly from same origin (and cache it for next time)
    try {
      const localResp = await fetch(rule.local);
      if (localResp && localResp.ok) {
        try {
          const cache = await caches.open(CACHE_NAME);
          cache.put(rule.local, localResp.clone()).catch(() => {});
        } catch (e) {
          // ignore cache put errors
        }
        return localResp;
      }
    } catch (e) {
      // fall through
    }

    // Finally, try the network original request with timeout
    try {
      const netResp = await timeoutPromise(fetch(event.request), 6000);
      if (netResp && netResp.ok) {
        return netResp;
      }

      // If network returned non-ok, check for specific WP REST disabled 404
      if (netResp) {
        try {
          const cloned = netResp.clone();
          const body = await cloned.json().catch(() => null);
          if (body && body.code === 'rest_disabled') {
            // try to return local backup if available
            try {
              const cache = await caches.open(CACHE_NAME);
              const cached = await cache.match(rule.local);
              if (cached) return cached;
            } catch (e) {
              // ignore cache lookup errors
            }
            try {
              const localResp = await fetch(rule.local).catch(() => null);
              if (localResp && localResp.ok) return localResp;
            } catch (e) {
              // ignore
            }
            // if no local backup -> fall through to return original network response
          }
        } catch (e) {
          // parsing network response failed — fall through
        }
      }

      // if network returns non-ok and nothing matched, fall through to final fallback
    } catch (e) {
      // network failed or timed out — fall back
    }

    // final fallback: return a generic 503 response
    return new Response(JSON.stringify({ error: 'service_unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  })());
});
