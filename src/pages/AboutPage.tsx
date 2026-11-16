import { Seo } from '@/components/common/Seo';
import { Lock, Target, Zap } from 'lucide-react';
import { Heading, Text } from '@/components/ui/typography';
import { getAllTools } from '@/config/tools';
import { RETENTION_SENTENCE } from '@/components/pricing/planContent';

const values = [
  {
    icon: Lock,
    title: 'Privacy first',
    description:
      'Files are encrypted in transit, processed only to run the job you asked for, and deleted automatically when your plan’s retention window ends.',
  },
  {
    icon: Zap,
    title: 'Speed matters',
    description: 'Server-side processing tuned to return results in seconds, not minutes.',
  },
  {
    icon: Target,
    title: 'Simplicity',
    description: 'Powerful tools anyone can use — no installs, no manuals, no learning curve.',
  },
];

const AboutPage = () => {
  const toolCount = getAllTools().length;

  const stats = [
    { value: `${toolCount}`, label: 'PDF tools' },
    { value: '15+', label: 'Supported file formats' },
    { value: '0–30 days', label: 'Plan-based file retention' },
  ];

  return (
    <>
      <Seo title="About" description="Fyredocs makes PDF tools accessible, fast, and private. Files are encrypted in transit, processed on our servers, and auto-deleted on a plan-based schedule." path="/about" />

      <div className="container py-12 md:py-16">
        {/* Hero */}
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <Heading level="display" responsive>
            About <span className="gradient-text">Fyredocs</span>
          </Heading>
          <Text variant="body-lg" tone="muted" className="mt-4">
            We&apos;re on a mission to make PDF tools accessible, fast, and private for everyone.
          </Text>
        </div>

        {/* Stat strip */}
        <div className="mx-auto mb-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border bg-card p-6 text-center">
              <div className="text-h1 font-bold text-primary">{stat.value}</div>
              <Text variant="body-sm" tone="muted" className="mt-1">
                {stat.label}
              </Text>
            </div>
          ))}
        </div>

        {/* Story + values */}
        <div className="mx-auto mb-16 grid max-w-5xl gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <Heading level="h2">How we handle your files</Heading>
            <Text tone="muted">
              Fyredocs was born from a simple frustration: working with PDFs shouldn&apos;t be
              complicated, expensive, or a privacy gamble. Every tool runs on our servers, so
              there&apos;s nothing to install — you upload a file over an encrypted HTTPS
              connection, we run exactly the job you requested, and you download the result.
            </Text>
            <Text tone="muted">{RETENTION_SENTENCE}</Text>
            <Text tone="muted">
              We never read, share, or sell your documents. You can use most tools without even
              creating an account.
            </Text>
          </div>

          <div className="space-y-6">
            <Heading level="h2">Our values</Heading>
            <div className="space-y-4">
              {values.map((value) => (
                <div key={value.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                    <value.icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <Heading level="h4" as="h3">
                      {value.title}
                    </Heading>
                    <Text variant="body-sm" tone="muted" className="mt-1">
                      {value.description}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Closing card */}
        <div className="mx-auto max-w-5xl rounded-2xl border bg-card p-8 text-center md:p-12">
          <Heading level="h2" className="mb-4">
            Built for everyday document work
          </Heading>
          <Text tone="muted" className="mx-auto max-w-2xl">
            From one-off merges to recurring conversion workflows, Fyredocs gives you {toolCount}{' '}
            tools that respect your time and your privacy — no account required to start.
          </Text>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
