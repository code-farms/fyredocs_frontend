import { useCallback, useEffect, useRef, useState } from 'react';
import { chunkForSpeech, splitSentences } from '@/lib/tts/sentences';
import { languageFor, pickVoice, SPEECH_CHUNK_CHARS, speechSupported } from '@/lib/reader/speech';

export type ReadAloudStatus = 'idle' | 'playing' | 'paused';

interface Options {
  pageCount: number;
  /** Text of a 1-based page. */
  getPageText: (page: number) => Promise<string>;
  /** Called when reading moves to a new page (1-based), so the view can follow. */
  onPage: (page: number) => void;
}

/**
 * Sentence-by-sentence read-aloud over the page text layer. Each sentence is
 * queued as its own short utterance(s), so pause/resume/stop are exact and
 * Chrome's long-utterance cut-off never triggers. A run token guards against
 * the stale onend/onerror events speechSynthesis.cancel() fires.
 */
export const useReadAloud = ({ pageCount, getPageText, onPage }: Options) => {
  const supported = speechSupported();
  const [status, setStatus] = useState<ReadAloudStatus>('idle');
  const [page, setPage] = useState<number | null>(null);
  const [rate, setRate] = useState(1);
  const run = useRef(0);
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const onPageRef = useRef(onPage);
  onPageRef.current = onPage;

  const stop = useCallback(() => {
    run.current += 1;
    if (supported) window.speechSynthesis?.cancel();
    setStatus('idle');
    setPage(null);
  }, [supported]);

  useEffect(() => stop, [stop]);

  const speak = (text: string, lang: 'hi' | 'en', token: number) =>
    new Promise<boolean>((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rateRef.current;
      u.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      const voice = pickVoice(window.speechSynthesis.getVoices(), lang);
      if (voice) u.voice = voice as SpeechSynthesisVoice;
      u.onend = () => resolve(run.current === token);
      u.onerror = () => resolve(false);
      window.speechSynthesis.speak(u);
    });

  const start = useCallback(
    async (fromPage: number) => {
      if (!supported) return;
      run.current += 1;
      const token = run.current;
      window.speechSynthesis.cancel();
      setStatus('playing');
      for (let p = Math.max(1, fromPage); p <= pageCount; p++) {
        let text = '';
        try {
          text = await getPageText(p);
        } catch {
          // Unreadable page: skip it, keep reading.
        }
        if (run.current !== token) return;
        const sentences = splitSentences(text);
        if (sentences.length === 0) continue;
        setPage(p);
        onPageRef.current(p);
        const lang = languageFor(text);
        for (const sentence of sentences) {
          for (const chunk of chunkForSpeech(sentence, SPEECH_CHUNK_CHARS)) {
            if (!(await speak(chunk, lang, token))) return;
          }
        }
      }
      if (run.current === token) {
        setStatus('idle');
        setPage(null);
      }
    },
    [supported, pageCount, getPageText]
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus('playing');
  }, [supported]);

  return { supported, status, page, rate, setRate, start, pause, resume, stop };
};
