import { loadJSON } from '../services/apiUtils.js';

export const loadPortfolioSection = async (pageId = 269) => {
  try {
    // używamy loadJSON tak jak inne load* w projekcie
    const res = await loadJSON(`pages/${pageId}`, { useCache: true, cacheTTL: 86400, retries: 2, timeout: 8000, silentHTTP: true });
    const data = res && res.data ? res.data : res;
    const acf = (data && data.acf) ? data.acf : {};
    const before = acf['read-more-text-before'] || '';
    const read = acf['read-more-text'] || '';
    const content = (data && data.content && data.content.rendered) ? data.content.rendered : '';
    return `${before}${content}${read}`;
  } catch (err) {
    // If the remote request failed with a known HTTP status (e.g. 401/404),
    // log a short warning instead of the full error object to avoid noisy stacks in dev console.
    if (err && (err.status === 401 || err.status === 404)) {
      console.warn(`[loadPortfolioSection] remote ${err.status} ${err.statusText} for ${err.url} — using local backup`);
    } else {
      console.error('[loadPortfolioSection] remote failed, trying local backup', err);
    }
    // fallback do lokalnego pliku zapisane przez Ciebie w public/backup/pages-269.json
    try {
      const r = await fetch('/backup/pages-269.json');
      if (r.ok) {
        const data = await r.json();
        const acf = data.acf || {};
        const before = acf['read-more-text-before'] || '';
        const read = acf['read-more-text'] || '';
        const content = (data.content && data.content.rendered) ? data.content.rendered : '';
        return `${before}${content}${read}`;
      }
    } catch (e) {
      console.error('[loadPortfolioSection] local backup failed', e);
    }
    // ostatecznie zostaw pustą sekcję lub tekst informujący
    return '<div class="notice">Sekcja portfolio chwilowo niedostępna</div>';
  }
};