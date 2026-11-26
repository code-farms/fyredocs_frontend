import { Link } from 'react-router-dom';
import { Seo } from '@/components/common/Seo';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { usePlans } from '@/hooks/usePlans';
import {
  PLAN_TIERS,
  PlanLimits,
  PlanTierId,
  RETENTION_SENTENCE,
  formatFileSize,
  formatRetention,
  resolvePlanLimits,
} from '@/components/pricing/planContent';
import { PlanComparisonTable } from '@/components/pricing/PlanComparisonTable';
import { PricingFaq } from '@/components/pricing/PricingFaq';

const PricingPage = () => {
  const { data: plans } = usePlans();

  const limits = PLAN_TIERS.reduce(
    (acc, tier) => {
      acc[tier.id] = resolvePlanLimits(tier, plans);
      return acc;
    },
    {} as Record<PlanTierId, PlanLimits>,
  );

  return (
    <>
      <Seo title="Pricing" description="Simple, transparent pricing for Fyredocs PDF tools. Use tools as a guest for free, or create an account for bigger limits and longer file retention." path="/pricing" />

      <div className="container py-12 md:py-16">
        {/* Hero */}
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <Heading level="display" responsive>
            Simple, honest <span className="gradient-text">pricing</span>
          </Heading>
          <Text variant="body-lg" tone="muted" className="mt-4">
            Every tool works without an account. Sign up when you need bigger files, more files
            per job, or longer retention.
          </Text>
        </div>

        {/* Tier cards */}
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3 md:gap-8">
          {PLAN_TIERS.map((tier) => {
            const tierLimits = limits[tier.id];
            return (
              <Card
                key={tier.id}
                className={cn(
                  'relative flex flex-col rounded-2xl',
                  tier.highlighted && 'border-primary shadow-brand ring-1 ring-primary',
                )}
              >
                {tier.comingSoon ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="outline">Coming soon</Badge>
                  </div>
                ) : tier.highlighted ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Most popular</Badge>
                  </div>
                ) : null}
                <CardHeader>
                  <CardTitle className="text-h3">{tier.name}</CardTitle>
                  <CardDescription>{tier.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6">
                  <div>
                    <span className="text-h1 font-bold text-foreground">{tier.price}</span>
                    <Text as="span" variant="body-sm" tone="muted" className="ml-2">
                      {tier.period}
                    </Text>
                  </div>

                  {/* Live limits */}
                  <ul className="space-y-2 rounded-lg bg-muted/50 p-4">
                    <li className="flex items-center justify-between gap-2">
                      <Text as="span" variant="body-sm" tone="muted">
                        Max file size
                      </Text>
                      <Text as="span" variant="body-sm" className="font-medium">
                        {formatFileSize(tierLimits.maxFileSizeMb)}
                      </Text>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <Text as="span" variant="body-sm" tone="muted">
                        Files per job
                      </Text>
                      <Text as="span" variant="body-sm" className="font-medium">
                        {tierLimits.maxFilesPerJob}
                      </Text>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <Text as="span" variant="body-sm" tone="muted">
                        OCR pages per scan
                      </Text>
                      <Text as="span" variant="body-sm" className="font-medium">
                        {tierLimits.maxOcrPages}
                      </Text>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <Text as="span" variant="body-sm" tone="muted">
                        File retention
                      </Text>
                      <Text as="span" variant="body-sm" className="font-medium">
                        {formatRetention(tierLimits.retentionDays)}
                      </Text>
                    </li>
                  </ul>

                  <ul className="space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                        <Text as="span" variant="body-sm">
                          {feature}
                        </Text>
                      </li>
                    ))}
                  </ul>

                  {tier.comingSoon ? (
                    <Button className="mt-auto w-full" variant="outline" disabled>
                      Coming soon
                    </Button>
                  ) : (
                    <Button
                      className="mt-auto w-full"
                      variant={tier.highlighted ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to={tier.cta.href}>{tier.cta.label}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Text variant="body-sm" tone="muted" className="mx-auto mt-8 max-w-2xl text-center">
          {RETENTION_SENTENCE}
        </Text>

        {/* Comparison table */}
        <section className="mx-auto mt-16 max-w-5xl">
          <Heading level="h2" responsive className="mb-6 text-center">
            Compare plans
          </Heading>
          <PlanComparisonTable limits={limits} />
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-2xl">
          <Heading level="h2" responsive className="mb-6 text-center">
            Frequently asked questions
          </Heading>
          <PricingFaq />
        </section>
      </div>
    </>
  );
};

export default PricingPage;
