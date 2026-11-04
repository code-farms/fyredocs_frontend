/**
 * Signatures placed from the web reader. The model's SignatureAnnotation
 * names its image by `sigRelPath` (a device file in the app); here the path
 * is `web-signature:<id>` and the PNG lives in localStorage, so drafts and
 * re-opened files can find it again in this browser.
 */
import { annotationId, type Annotation } from './model';

export const SIGNATURES_KEY = 'fyredocs.signatures.v1';
export const MAX_SIGNATURES = 10;
const PREFIX = 'web-signature:';

type Store = Record<string, { url: string; at: number }>;

const read = (): Store => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIGNATURES_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
};

/** Stores a PNG data URL and returns the sigRelPath to put on the annotation. */
export const storeSignature = (pngDataUrl: string): string => {
  const id = annotationId();
  const store = read();
  store[id] = { url: pngDataUrl, at: Date.now() };
  const kept = Object.entries(store).sort(([, a], [, b]) => b.at - a.at).slice(0, MAX_SIGNATURES);
  try {
    localStorage.setItem(SIGNATURES_KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // Blocked storage: the signature still works for this session's save.
  }
  return `${PREFIX}${id}`;
};

/** Data URL for a stored web signature, or null (unknown or app-placed). */
export const signatureUrl = (relPath: string): string | null =>
  relPath.startsWith(PREFIX) ? read()[relPath.slice(PREFIX.length)]?.url ?? null : null;

const dataUrlBytes = (url: string): Uint8Array => {
  const b64 = url.slice(url.indexOf(',') + 1);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

/** PNG bytes for every signature the markup uses, plus how many can't be found. */
export const signatureAssets = (pages: Record<number, Annotation[]>) => {
  const signatures = new Map<string, Uint8Array>();
  let missing = 0;
  for (const list of Object.values(pages)) {
    for (const a of list) {
      if (a.kind !== 'signature' || signatures.has(a.sigRelPath)) continue;
      const url = signatureUrl(a.sigRelPath);
      if (url) signatures.set(a.sigRelPath, dataUrlBytes(url));
      else missing++;
    }
  }
  return { signatures, missing };
};

/** Any image data URL → PNG data URL + height/width ratio (pdfAnnots embeds PNG only). */
export const toPngSignature = (dataUrl: string): Promise<{ url: string; aspect: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      resolve({ url: canvas.toDataURL('image/png'), aspect: img.naturalHeight / Math.max(1, img.naturalWidth) });
    };
    img.onerror = () => reject(new Error('unreadable image'));
    img.src = dataUrl;
  });
