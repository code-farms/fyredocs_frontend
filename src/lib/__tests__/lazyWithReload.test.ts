import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withReload } from '../lazyWithReload';

const FLAG = 'fyredocs:chunk-reload';
const Page = () => null;

describe('withReload', () => {
  const reload = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    reload.mockReset();
    vi.stubGlobal('location', { ...window.location, reload });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves the module and clears a leftover reload flag', async () => {
    sessionStorage.setItem(FLAG, '1');
    const mod = await withReload(() => Promise.resolve({ default: Page }))();
    expect(mod.default).toBe(Page);
    expect(sessionStorage.getItem(FLAG)).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads once on the first chunk failure and stays pending', async () => {
    const pending = withReload(() => Promise.reject(new TypeError('Failed to fetch')))();
    const settled = await Promise.race([pending.then(() => 'settled', () => 'settled'), new Promise((r) => setTimeout(() => r('pending'), 20))]);
    expect(settled).toBe('pending');
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(FLAG)).toBe('1');
  });

  it('rethrows instead of reloading again when the failure follows a reload', async () => {
    sessionStorage.setItem(FLAG, '1');
    const err = new TypeError('Failed to fetch');
    await expect(withReload(() => Promise.reject(err))()).rejects.toBe(err);
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(FLAG)).toBeNull();
  });
});
