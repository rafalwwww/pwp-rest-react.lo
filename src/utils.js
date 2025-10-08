import './custom-bootstrap.js';
import shave from 'shave';

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
        ? 'https://portfolio.level12.linuxpl.eu/wp-json/'
        : 'https://portfolio.level12.linuxpl.eu/wp-json/wp/v2/';
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

export function equalHeight() {
    let tallest = 0;
    const contents = Array.from(document.querySelectorAll('.grid-item:not(.hover):not(:hover) .content'));

    contents.forEach(function(content) {
        content.style.height = 'auto';
        const thisHeight = content.offsetHeight;
        if (thisHeight > tallest) {
            tallest = thisHeight;
        }
    });

    if (tallest > 0) {
        document.querySelectorAll('.grid-item .content').forEach(function(content) {
            content.style.height = tallest + 'px';
        });
    }
}

export function gridItemShave(callback) {
    function outerHeight(el) {
        const style = getComputedStyle(el);
        return el.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    }

    function cloneForMeasure(el) {
        const clone = el.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.visibility = 'hidden';
        clone.style.left = '-9999px';
        document.body.appendChild(clone);
        return clone;
    }

    function findFirst(el, selector) {
        return el.querySelector(selector);
    }

    function replaceWith(oldEl, newEl) {
        if (oldEl && newEl) {
            oldEl.replaceWith(newEl);
        }
    }

    function addTooltip(el, text) {
        try {
            el.setAttribute('data-bs-toggle', 'tooltip');
            el.setAttribute('data-bs-title', text);
            el.setAttribute('data-bs-placement', 'top');
            if (window.bootstrap && window.bootstrap.Tooltip) {
                new window.bootstrap.Tooltip(el);
            }
        } catch (e) {}
    }

    const gridItems = document.querySelectorAll('.grid-item:not(.truncated)');

    gridItems.forEach(gridItem => {
        const h2 = findFirst(gridItem, 'h2');
        const iconsAction = findFirst(gridItem, '.icons-action');
        const modalBtn = findFirst(gridItem, '.modal-btn');
        const desc = findFirst(gridItem, '.desc');
        const txt = desc ? findFirst(desc, '.txt') : null;

        const h2Height = h2 ? outerHeight(h2) : 0;
        const iconsActionHeight = iconsAction ? outerHeight(iconsAction) : 0;
        const gridItemHeight = outerHeight(gridItem);

        let modalBtnHeight = 0;
        if (modalBtn) {
            const modalBtnClone = cloneForMeasure(modalBtn);
            modalBtnHeight = outerHeight(modalBtnClone);
            modalBtnClone.remove();
        }

        let shaveHeight = gridItemHeight - h2Height - iconsActionHeight - modalBtnHeight - 70;

        const gridItemClone = cloneForMeasure(gridItem);
        const descClone = findFirst(gridItemClone, '.desc');
        if (descClone) descClone.classList.add('display-block');

        if (shave && descClone) {
            const txtToShave = findFirst(descClone, '.txt');
            if (txtToShave && shaveHeight > 0) {
                shave(txtToShave, shaveHeight, { character: '[...]' });
            }
        }

        if (descClone) {
            const shavedCharSpan = descClone.querySelector('span.js-shave-char');
            if (shavedCharSpan) {
                addTooltip(shavedCharSpan, (descClone.querySelector('span.js-shave') || { textContent: '' }).textContent);
            }
            descClone.classList.remove('display-block');
        }

        if (desc && descClone) {
            const origTxt = findFirst(desc, '.txt');
            const cloneTxt = findFirst(descClone, '.txt');
            if (origTxt && cloneTxt) replaceWith(origTxt, cloneTxt);
        }

        gridItemClone.remove();

        if (typeof callback === 'function' && gridItem.dataset && gridItem.dataset.projectId) {
            const projectId = parseInt(gridItem.dataset.projectId, 10);
            const shavedSpan = gridItem.querySelector('span.js-shave');
            const shavedText = shavedSpan ? shavedSpan.textContent || '' : '';
            callback(projectId, shavedText);
        }
    });
}

export function registerColorboxHandlers() {
    if (typeof window.jQuery === 'undefined') return; // guard
    const $ = window.jQuery;
    $('body').off('click.colorbox').on('click.colorbox', '.colorbox', function(e) {
        if (document.body.classList.contains('system-filter-view')) {
            const activeFilter = $('.img-flex.active').data('filter');
            if (!activeFilter) return;

            if (!$(this).hasClass(activeFilter)) {
                e.preventDefault();
                return;
            }

            $(`.colorbox.${activeFilter}`).colorbox({
                rel: `colorbox-${activeFilter}`,
                scalePhotos: true,
                transition: 'elastic',
                maxWidth: '90%',
                fixed: false,
                returnFocus: true
            });
        } else {
            $('.colorbox').colorbox({
                rel: 'colorbox',
                scalePhotos: true,
                transition: 'elastic',
                maxWidth: '90%',
                fixed: false,
                returnFocus: true
            });
        }
        e.preventDefault();
    });
}
