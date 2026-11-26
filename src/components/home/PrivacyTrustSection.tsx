import { Lock, RefreshCw, Server, Timer, type LucideIcon } from 'lucide-react';
import { Heading, Text } from '@/components/ui/typography';
import { RETENTION_SENTENCE } from '@/components/pricing/planContent';
import { PLAN_LIMIT_FALLBACKS } from '@/config/planLimits';

const retentionChips = [
  { plan: 'Guest', retention: `${PLAN_LIMIT_FALLBACKS.guest.retentionDays} days` },
  { plan: 'Free', retention: `${PLAN_LIMIT_FALLBACKS.free.retentionDays} days` },
  { plan: 'Pro', retention: `${PLAN_LIMIT_FALLBACKS.pro.retentionDays} days` },
];

interface TrustCard {
  icon: LucideIcon;
  title: string;
  description: string;
  chips?: typeof retentionChips;
}

const cards: TrustCard[] = [
  {
    icon: Lock,
    title: 'Encrypted in transit',
    description:
      'Every upload and download travels over HTTPS, so your files are encrypted between your browser and our servers.',
  },
  {
    icon: Timer,
    title: 'Plan-based auto-deletion',
    description: RETENTION_SENTENCE,
    chips: retentionChips,
  },
  {
    icon: Server,
    title: 'Processed on our servers',
    description:
      'The heavy lifting happens server-side — nothing to install, and it works from any browser on any device.',
  },
  {
    icon: RefreshCw,
    title: 'Resumable uploads for big files',
    description:
      'Large files upload in chunks. If your connection drops, the upload resumes right where it left off.',
  },
];

export const PrivacyTrustSection = () => {
  return (
    <section className="bg-muted/30 py-12 md:py-16">
      <div className="container">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Heading level="h2" responsive className="mb-3">
            Private by design
          </Heading>
          <Text variant="body-lg" tone="muted">
            Your documents are yours. Here is exactly how we handle them — no vague promises.
          </Text>
        </div>

        {/* Trust cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border bg-card p-6 transition-all duration-base hover:border-primary/20 hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                <card.icon className="h-6 w-6 text-primary" aria-hidden />
              </div>
              <Heading level="h4" as="h3" className="mb-2">
                {card.title}
              </Heading>
              <Text variant="body-sm" tone="muted">
                {card.description}
              </Text>
              {card.chips && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {card.chips.map((chip) => (
                    <span
                      key={chip.plan}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-caption"
                    >
                      <span className="font-medium text-foreground">{chip.plan}</span>
                      <span className="text-muted-foreground">{chip.retention}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
