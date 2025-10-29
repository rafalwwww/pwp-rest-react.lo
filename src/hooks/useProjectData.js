import { useState, useEffect } from 'react';
import { loadJSON } from '../services/apiUtils.js';
import { testProject, testProject1 } from '../testdata/projectTestData';

export const useProjectData = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [siteName, setSiteName] = useState('');

  // Fetch site info from /wp-json/
  const loadSiteInfo = async () => {
    try {
      // we use root: true so that loadJSON calls https://.../wp-json/
      // Also use cache for site info with a longer TTL (7 days)
      const res = await loadJSON('', { 
        root: true, 
        silentHTTP: true,
        useCache: true,
        cacheTTL: 604800 // 7 days
      });
      // if remote returned an HTTP error and silentHTTP is enabled, res.ok will be false
      if (res && res.ok === false) {
        // try local backup instead of throwing
        try {
          const backup = await fetch('/backup/wp-json.json').then(r => r.ok ? r.json() : null);
          if (backup && backup.name) {
            setSiteName(backup.name);
            return;
          }
        } catch (e) {
          // ignore local backup errors
        }
        // if no local backup, just silently continue with empty siteName
        return;
      }
      const data = res && res.data ? res.data : res;
      setSiteName(data.name || '');
    } catch (err) {
      // If this was an HTTP error with metadata, log a short warning instead of a full stack
      if (err && err.status) {
        console.warn(`[loadSiteInfo] remote ${err.status} ${err.statusText || ''} for ${err.url} — using local backup if available`);
      } else {
        console.error('Błąd pobierania site info:', err);
      }
      // if you have a local backup, set it here
      try {
        const backup = await fetch('/backup/wp-json.json').then(r => r.ok ? r.json() : null);
        if (backup && backup.name) setSiteName(backup.name);
      } catch (e) {}
    }
  };

  const loadAllProjects = async () => {
    const perPage = 100;
    let allProjects = [];
    setIsLoading(true);
    try {
      // first page with caching and retries
      const first = await loadJSON(`pwp/v1/portfolio?_embed=1&per_page=${perPage}&page=1`, { root: true, useCache: true, cacheTTL: 86400, retries: 2, timeout: 8000, silentHTTP: true });
      // If remote responded with an HTTP error and silentHTTP is enabled, use local backup
      if (first && first.ok === false) {
        // fallback to local backup file (public/backup/portfolio_project.json)
        const resp = await fetch('/backup/portfolio_project.json');
        if (resp.ok) {
          const data = await resp.json();
          const projectsData = Array.isArray(data) ? data : (data.data || []);
          setProjects(projectsData);
          
          // Store backup data in cache so it's available on next load
          try {
            const cacheKey = 'loadJSON:https://portfolio.level12.linuxpl.eu/wp-json/pwp/v1/portfolio?_embed=1&per_page=' + perPage + '&page=1';
            const payload = {
              data: projectsData,
              total: projectsData.length,
              totalPages: 1
            };
            localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
          } catch (e) {
            // ignore localStorage errors
          }
          
          setIsLoading(false);
          return;
        } else {
          // couldn't get local backup either
          console.warn('[loadAllProjects] remote unavailable and local backup not found');
          setIsLoading(false);
          return;
        }
      }
      allProjects = allProjects.concat(first.data || first);
      const totalPages = parseInt(first.totalPages, 10) || 1;

      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          // ensure WP REST returns embedded terms so components can read _embedded['wp:term']
          promises.push(loadJSON(`pwp/v1/portfolio?_embed=1&per_page=${perPage}&page=${page}`, { root: true, useCache: true, cacheTTL: 86400, retries: 2, timeout: 8000, silentHTTP: true }));
        }
        const results = await Promise.all(promises);
        for (const res of results) {
          if (res && res.ok === false) {
            // one of the pages failed; prefer local backup instead of partial data
            try {
              const resp = await fetch('/backup/portfolio_project.json');
              if (resp.ok) {
                const data = await resp.json();
                const projectsData = Array.isArray(data) ? data : (data.data || []);
                setProjects(projectsData);
                
                // Store backup data in cache so it's available on next load
                try {
                  const cacheKey = 'loadJSON:https://portfolio.level12.linuxpl.eu/wp-json/pwp/v1/portfolio?_embed=1&per_page=' + perPage + '&page=1';
                  const payload = {
                    data: projectsData,
                    total: projectsData.length,
                    totalPages: 1
                  };
                  localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
                } catch (e) {
                  // ignore localStorage errors
                }
                
                setIsLoading(false);
                return;
              }
            } catch (e) {
              console.warn('[loadAllProjects] partial remote failure and local backup fetch failed', e);
            }
            console.warn('[loadAllProjects] some remote pages failed, aborting and using backup if available');
            setIsLoading(false);
            return;
          }
          allProjects = allProjects.concat((res && res.data) ? res.data : res);
        }
      }

      setProjects(allProjects);
      setIsLoading(false);
    } catch (err) {
      console.error('[loadAllProjects] remote fetch failed, trying local backup:', err);
      // Fallback to local backup file (public/backup/portfolio_project.json)
      try {
        const resp = await fetch('/backup/portfolio_project.json');
        if (resp.ok) {
          const data = await resp.json();
          // assume backup contains an array of projects
          const projectsData = Array.isArray(data) ? data : (data.data || []);
          setProjects(projectsData);
          
          // Store backup data in cache so it's available on next load
          try {
            const cacheKey = 'loadJSON:https://portfolio.level12.linuxpl.eu/wp-json/pwp/v1/portfolio?_embed=1&per_page=' + perPage + '&page=1';
            const payload = {
              data: projectsData,
              total: projectsData.length,
              totalPages: 1
            };
            localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
          } catch (e) {
            // ignore localStorage errors
          }
          
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('[loadAllProjects] local backup failed:', e);
      }

      setIsLoading(false);
    }
  };

  const loadProjectById = async (id) => {
    try {
      const result = await loadJSON(`pwp/v1/portfolio/${id}`, { root: true, silentHTTP: true });
      if (result && result.ok === false) {
        console.warn(`[loadProjectById] remote ${result.status} ${result.statusText} for ${result.url}`);
        return;
      }
      setProjects([result.data]);
    } catch (err) {
      console.error('Błąd pobierania projektu:', err);
    }
  };

  useEffect(() => {
    loadSiteInfo();
    loadAllProjects();
  }, []);

  return {
    projects,
    isLoading,
    siteName
  };
};