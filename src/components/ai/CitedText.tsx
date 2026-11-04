import { parseCitations } from '@/lib/ai/parse';

/**
 * Model text with `[p.N]` citations as page links (the app's CitedText).
 * Citations beyond `pageCount` stay plain text — a hallucinated page never
 * becomes a link that jumps nowhere.
 */
export const CitedText = ({
  text,
  pageCount,
  onCite,
}: {
  text: string;
  pageCount?: number;
  /** 1-based page. Omit to render citations as plain labels. */
  onCite?: (page: number) => void;
}) => {
  const { segments } = parseCitations(text, pageCount);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.text}</span>
        ) : onCite ? (
          <button
            key={i}
            type="button"
            onClick={() => onCite(seg.pageIndex + 1)}
            aria-label={`Go to page ${seg.pageIndex + 1}`}
            className="mx-0.5 rounded px-1 font-semibold text-primary hover:bg-primary/10"
          >
            {seg.label}
          </button>
        ) : (
          <span key={i} className="mx-0.5 font-semibold text-primary">
            {seg.label}
          </span>
        )
      )}
    </>
  );
};
