import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useReadAloud } from '@/hooks/useReadAloud';

class FakeUtterance {
  rate = 1;
  lang = '';
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly text: string) {}
}

const spoken: string[] = [];
const synth = {
  speak: vi.fn((u: FakeUtterance) => {
    spoken.push(u.text);
    queueMicrotask(() => u.onend?.());
  }),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: () => [],
};

describe('useReadAloud', () => {
  beforeEach(() => {
    spoken.length = 0;
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true, writable: true });
  });
  afterEach(() => {
    delete (window as { speechSynthesis?: unknown }).speechSynthesis;
    delete (window as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
  });

  const pages = ['First one. Second one.', '', 'Third page here.'];
  const getPageText = async (p: number) => pages[p - 1];

  it('reads sentence by sentence, skips empty pages and follows the page', async () => {
    const onPage = vi.fn();
    const { result } = renderHook(() => useReadAloud({ pageCount: 3, getPageText, onPage }));
    expect(result.current.supported).toBe(true);
    await act(async () => {
      await result.current.start(1);
    });
    expect(spoken).toEqual(['First one.', 'Second one.', 'Third page here.']);
    expect(onPage.mock.calls.map((c) => c[0])).toEqual([1, 3]);
    expect(result.current.status).toBe('idle');
  });

  it('pauses, resumes and stops', async () => {
    synth.speak.mockImplementationOnce((u: FakeUtterance) => spoken.push(u.text)); // never ends
    const { result } = renderHook(() => useReadAloud({ pageCount: 3, getPageText, onPage: vi.fn() }));
    act(() => void result.current.start(1));
    await waitFor(() => expect(result.current.status).toBe('playing'));
    act(() => result.current.pause());
    expect(synth.pause).toHaveBeenCalled();
    expect(result.current.status).toBe('paused');
    act(() => result.current.resume());
    expect(result.current.status).toBe('playing');
    act(() => result.current.stop());
    expect(synth.cancel).toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('reports unsupported browsers and no-ops', async () => {
    delete (window as { speechSynthesis?: unknown }).speechSynthesis;
    const { result } = renderHook(() => useReadAloud({ pageCount: 1, getPageText, onPage: vi.fn() }));
    expect(result.current.supported).toBe(false);
    await act(async () => {
      await result.current.start(1);
    });
    expect(result.current.status).toBe('idle');
  });
});
