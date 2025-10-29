import shave from 'shave';
import { WP_REST_BASE, WP_REST_V2_BASE } from '../config/apiConfig';

export function loadJSON(path, options = {}) {
    const {
        root = false,
        useCache = false,
        cacheTTL = 86400,
        retries = 0,
        timeout = 8000,
        // if true, doRequest will NOT reject on HTTP status != 200 but resolve
        // with an object { ok: false, status, statusText, url, body }
        silentHTTP = false
    } = options || {};

    const base = root
        ? WP_REST_BASE + '/'
        : WP_REST_V2_BASE + '/';
    const url = base + path;
    const cacheKey = 'loadJSON:' + url;

    if (useCache) {
        try {
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.ts && (Date.now() - parsed.ts) < cacheTTL * 1000 && parsed.payload) {
                    return Promise.resolve(parsed.payload);
                }
            }
        } catch (e) {
            // ignore cache errors
        }
    }

    const doRequest = () => new Promise((resolve, reject) => {
        const xobj = new XMLHttpRequest();
        let timer = null;
        try {
            xobj.overrideMimeType('application/json');
            xobj.open('GET', url, true);
            xobj.onreadystatechange = function () {
                if (xobj.readyState === 4) {
                    if (timer) clearTimeout(timer);
                    if (xobj.status === 200) {
                        const payload = {
                            data: JSON.parse(xobj.responseText),
                            total: xobj.getResponseHeader('X-WP-Total'),
                            totalPages: xobj.getResponseHeader('X-WP-TotalPages')
                        };
                        try {
                            if (useCache) {
                                localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
                            }
                        } catch (e) {
                            // ignore localStorage errors
                        }
                        resolve(payload);
                    } else {
                        // include HTTP status for clearer errors (e.g. 401 Unauthorized)
                        const statusText = xobj.statusText || 'error';
                        // try to parse response body if present
                        let body = null;
                        try {
                            body = xobj.responseText ? JSON.parse(xobj.responseText) : null;
                        } catch (e) {
                            body = xobj.responseText || null;
                        }

                        if (silentHTTP) {
                            // resolve with an object signalling failure but do not reject
                            resolve({ ok: false, status: xobj.status, statusText, url, body });
                        } else {
                            const err = new Error(`${xobj.status} ${statusText}`);
                            // attach metadata so callers can make decisions (silent fallback, etc.)
                            err.status = xobj.status;
                            err.statusText = statusText;
                            err.url = url;
                            err.body = body;
                            reject(err);
                        }
                    }
                }
            };

            timer = setTimeout(() => {
                try { xobj.abort(); } catch (e) {}
                reject(new Error('timeout'));
            }, timeout);

            xobj.send(null);
        } catch (err) {
            if (timer) clearTimeout(timer);
            reject(err);
        }
    });

    return new Promise((resolve, reject) => {
        let attempt = 0;
        const tryOnce = () => {
            doRequest()
                .then(resolve)
                .catch(err => {
                    if (attempt < retries) {
                        attempt += 1;
                        setTimeout(tryOnce, 300 * attempt);
                    } else {
                        reject(err);
                    }
                });
        };
        tryOnce();
    });
}