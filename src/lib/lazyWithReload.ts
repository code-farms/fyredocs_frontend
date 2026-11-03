import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Session flag set just before a recovery reload. It lets the next failure
 * after that reload surface instead of looping: a chunk that is missing even
 * from a freshly loaded index.html is a real outage, not a stale tab.
 */
const RELOAD_FLAG = 'fyredocs:chunk-reload';

const readFlag = () => {
  try {
    return sessionStorage.getItem(RELOAD_FLAG) !== null;
  } catch {
    return false;
  }
};

/** Returns false when storage is unavailable, so the caller never reloads without a loop guard. */
const writeFlag = (on: boolean) => {
  try {
    if (on) sessionStorage.setItem(RELOAD_FLAG, '1');
    else sessionStorage.removeItem(RELOAD_FLAG);
    return true;
  } catch {
    return false;
  }
};

/**
 * Wraps a dynamic-import factory so a failed chunk load reloads the page once.
 * Each build deletes the previous build's hashed chunks, so a tab opened before
 * the deploy fails every route it has not visited yet with "Failed to fetch
 * dynamically imported module", and the ErrorBoundary's "Try again" re-requests
 * the same deleted file. Reloading fetches the new index.html and its current
 * chunk names.
 *
 * The reload happens at most once per failure streak. A successful load clears
 * the guard, so a later deploy in the same session recovers too. Exported
 * separately from lazyWithReload so it can be tested without rendering.
 */
export const withReload =
  <M>(factory: () => Promise<M>) =>
  async (): Promise<M> => {
    try {
      const mod = await factory();
      writeFlag(false);
      return mod;
    } catch (err) {
      if (!readFlag() && writeFlag(true)) {
        window.location.reload();
        // Keep Suspense showing its fallback until the reload replaces the page.
        return new Promise<M>(() => {});
      }
      writeFlag(false);
      throw err;
    }
  };

/** React.lazy that survives a deploy; see withReload. */
export function lazyWithReload<T extends ComponentType<any>>( // eslint-disable-line @typescript-eslint/no-explicit-any
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(withReload(factory));
}
