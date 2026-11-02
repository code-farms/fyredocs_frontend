import { useEffect, useState } from 'react';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  content: string;
  language?: string;
}

const THEME = 'github-dark';

/**
 * Docs label blocks with display names ('TypeScript', 'Bash', 'HTTP'), not
 * shiki ids; passed through raw, every block failed to plain text. Anything
 * unmapped (e.g. 'Directory', 'Environment') renders as plain text.
 *
 * 'HTTP' is deliberately unmapped: shiki's http grammar embeds graphql, which
 * pulls in the javascript/jsx/tsx grammars (~550 kB) just to colour request
 * lines and headers.
 */
const LANG_IDS: Record<string, string> = {
  typescript: 'typescript',
  ts: 'typescript',
  bash: 'shellscript',
  shell: 'shellscript',
  sh: 'shellscript',
  json: 'json',
  go: 'go',
  sql: 'sql',
  dockerfile: 'docker',
  docker: 'docker',
  yaml: 'yaml',
  yml: 'yaml',
};

const normalizeLang = (language?: string) => LANG_IDS[language?.trim().toLowerCase() ?? ''] ?? 'text';

// Fine-grained on purpose: the full `shiki` bundle emitted ~250 grammar and
// ~60 theme chunks plus a 600 kB oniguruma wasm. Only the languages above are
// loaded, with the JS regex engine (no wasm). Created once, on first use.
let highlighter: Promise<HighlighterCore> | null = null;
const getHighlighter = () =>
  (highlighter ??= createHighlighterCore({
    themes: [import('@shikijs/themes/github-dark')],
    langs: [
      import('@shikijs/langs/typescript'),
      import('@shikijs/langs/shellscript'),
      import('@shikijs/langs/json'),
      import('@shikijs/langs/go'),
      import('@shikijs/langs/sql'),
      import('@shikijs/langs/docker'),
      import('@shikijs/langs/yaml'),
    ],
    engine: createJavaScriptRegexEngine(),
  }));

export const CodeBlock = ({ content, language }: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getHighlighter()
      .then((hl) => {
        const code = content.trim();
        let result: string;
        try {
          result = hl.codeToHtml(code, { lang: normalizeLang(language), theme: THEME });
        } catch {
          // A grammar that fails on this input still gets themed plain text.
          result = hl.codeToHtml(code, { lang: 'text', theme: THEME });
        }
        if (!cancelled) setHtml(result);
      })
      // Highlighter failed to load: keep the unstyled <pre> fallback below.
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [content, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-docs-panel-border bg-docs-panel">
      <div className="flex items-center justify-between px-4 py-2 border-b border-docs-panel-border">
        <span className="text-xs font-medium text-docs-panel-foreground/60 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto p-1 rounded-md hover:bg-docs-panel-muted text-docs-panel-foreground/50 hover:text-docs-panel-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title="Copy code"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
        </button>
      </div>

      {html ? (
        <div
          className="p-4 overflow-x-auto text-sm [&_pre]:!bg-transparent [&_code]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm font-mono text-docs-panel-foreground leading-relaxed whitespace-pre">
            {content.trim()}
          </code>
        </pre>
      )}
    </div>
  );
};
