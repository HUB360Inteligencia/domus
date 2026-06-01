import React from 'react';

/**
 * Wrapper around React.lazy that retries the dynamic import on failure.
 * 
 * This fixes the "Failed to fetch dynamically imported module" error that
 * happens when Vite HMR invalidates module URLs (e.g. after file changes
 * while the dev server has been running for a long time).
 * 
 * On failure, it retries the import after a short delay. If all retries
 * fail, it forces a full page reload to get fresh module URLs.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 2,
  interval = 1000,
): React.LazyExoticComponent<T> {
  return React.lazy(() => retryImport(importFn, retries, interval));
}

async function retryImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries: number,
  interval: number,
): Promise<{ default: T }> {
  try {
    return await importFn();
  } catch (error) {
    if (retries <= 0) {
      // All retries exhausted — check if this is a stale module error
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Loading chunk') ||
        message.includes('Loading CSS chunk')
      ) {
        // Force a full reload to get fresh module URLs
        // Use sessionStorage to prevent infinite reload loops
        const reloadKey = 'lazy-retry-reload';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        if (!lastReload || now - Number(lastReload) > 10000) {
          sessionStorage.setItem(reloadKey, String(now));
          window.location.reload();
        }
      }
      throw error;
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, interval));
    return retryImport(importFn, retries - 1, interval);
  }
}
