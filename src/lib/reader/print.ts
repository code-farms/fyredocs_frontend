/**
 * Prints PDF bytes through the browser's own PDF viewer: a hidden iframe on a
 * blob URL, then print() once it loads. Printing the canvases instead would
 * re-render every page at print resolution in JS; the native viewer already
 * prints vector text.
 */
const CLEANUP_MS = 60_000;

export const printPdfBytes = (bytes: Uint8Array): void => {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.setAttribute('aria-hidden', 'true');
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      // Some browsers block print() on PDF frames — fall back to a new tab.
      window.open(url, '_blank', 'noopener');
    }
  };
  document.body.appendChild(frame);
  // The print dialog is modal in most browsers; give it time before tearing down.
  setTimeout(() => {
    frame.remove();
    URL.revokeObjectURL(url);
  }, CLEANUP_MS);
};
