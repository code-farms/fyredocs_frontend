import { useState } from 'react';
import { AlertTriangle, Contact, Eye, EyeOff, FileDown, Table } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { docTypeLabel, expiryWarning, fieldRows, formPairs, maskId, type Extraction } from '@/lib/ai/extraction';
import { checkIdNumber } from '@/lib/ai/idNumbers';
import { safeFileStem, toCsv } from '@/lib/export/csv';
import { buildVCard, contactFromFields } from '@/lib/export/vcard';

const saveText = (name: string, body: string, type: string) => {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * What AI understood about the document (the app's DetailsCard +
 * ExtractionActions, minus library-only actions): type, typed fields, form
 * fields and tables, with CSV/vCard downloads. ID numbers render masked
 * (last 4) until revealed. Suggestions never apply themselves.
 */
export const DetailsCard = ({
  extraction,
  docName,
  onDownloadAs,
}: {
  extraction: Extraction;
  docName: string;
  /** Downloads the PDF under a suggested name; omitted when that isn't possible. */
  onDownloadAs?: (fileName: string) => void;
}) => {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const label = docTypeLabel(extraction);
  const rows = fieldRows(extraction);
  const pairs = formPairs(extraction);
  const expiry = expiryWarning(extraction);
  const idCheck =
    extraction.docType === 'id_document' && typeof extraction.fields.documentNumber === 'string'
      ? checkIdNumber(extraction.subtype, extraction.fields.documentNumber)
      : null;
  const suggestedName = extraction.title && extraction.title !== docName ? extraction.title : null;

  const toggle = (key: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const warn = (text: string) => (
    <div className="flex items-center gap-1.5 text-destructive">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      <Text variant="caption" as="span" className="text-destructive">
        {text}
      </Text>
    </div>
  );

  return (
    <section className="space-y-3 rounded-lg border p-3" aria-label="Document details">
      <div className="flex items-center justify-between gap-2">
        <Text variant="body-sm" className="font-semibold">
          Details
        </Text>
        <div className="flex gap-1.5">
          {extraction.confidence > 0 && extraction.confidence < 0.5 && <Badge variant="warning">Low confidence</Badge>}
          <Badge variant="info">{label}</Badge>
        </div>
      </div>

      {expiry && warn(expiry === 'expired' ? 'This document has expired' : 'Expires within 60 days')}
      {idCheck === 'invalid' && warn(`This number doesn't match the ${label} format — check it against the card`)}

      {rows.length > 0 ? (
        <dl className="space-y-1.5 text-body-sm">
          {rows.map((r) => {
            const hidden = r.sensitive && !revealed.has(r.key);
            return (
              <div key={r.key} className="flex items-start gap-3">
                <dt className="w-28 shrink-0 text-muted-foreground">{r.label}</dt>
                <dd className="min-w-0 flex-1 break-words">{hidden ? maskId(r.value) : r.key === 'category' ? cap(r.value) : r.value}</dd>
                {r.sensitive && (
                  <button
                    type="button"
                    onClick={() => toggle(r.key)}
                    aria-label={hidden ? `Show ${r.label.toLowerCase()}` : `Hide ${r.label.toLowerCase()}`}
                    className="text-primary"
                  >
                    {hidden ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
                  </button>
                )}
              </div>
            );
          })}
        </dl>
      ) : (
        <Text variant="body-sm" tone="muted">
          No specific fields were found.
        </Text>
      )}

      {pairs.length > 0 && (
        <dl className="space-y-1 text-body-sm">
          {pairs.map((p, i) => (
            <div key={i} className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted-foreground">{p.key}</dt>
              <dd className="min-w-0 flex-1 break-words">{p.value || '—'}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap gap-2">
        {extraction.docType === 'business_card' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const contact = contactFromFields(extraction.fields);
              saveText(`${safeFileStem(contact.name ?? docName, 'contact')}.vcf`, buildVCard(contact), 'text/vcard;charset=utf-8');
            }}
          >
            <Contact aria-hidden />
            Save contact (.vcf)
          </Button>
        )}
        {extraction.tables.map((t, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            onClick={() =>
              saveText(
                `${safeFileStem(`${docName} ${t.title || `table ${i + 1}`}`)}.csv`,
                toCsv([t.header, ...t.rows]),
                'text/csv;charset=utf-8'
              )
            }
          >
            <Table aria-hidden />
            {t.title || `Table ${i + 1}`} ({t.rows.length}×{t.header.length}) CSV
          </Button>
        ))}
        {suggestedName && onDownloadAs && (
          <Button variant="outline" size="sm" onClick={() => onDownloadAs(`${safeFileStem(suggestedName, 'document')}.pdf`)}>
            <FileDown aria-hidden />
            Download as “{suggestedName}”
          </Button>
        )}
      </div>

      <Text variant="caption" tone="muted">
        Detected by AI — check against the original.
      </Text>
    </section>
  );
};
