import { Seo } from '@/components/common/Seo';
import { SITE_URL } from '@/lib/seo';
import { buildHomeJsonLd, STATIC_PAGE_SEO } from '@/lib/toolSeo';

const HOME = STATIC_PAGE_SEO['/'];
const HOME_JSON_LD = buildHomeJsonLd(SITE_URL);
import { Link } from 'react-router-dom';
import { Hero } from '@/components/home/Hero';
import { ToolsShowcase } from '@/components/home/ToolsShowcase';
import { PrivacyTrustSection } from '@/components/home/PrivacyTrustSection';
import { PricingTeaser } from '@/components/home/PricingTeaser';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';

const Index = () => {
  return (
    <>
      <Seo title="Home" fullTitle={HOME.title} description={HOME.description} path="/" jsonLd={HOME_JSON_LD} />

      <Hero />

      <ToolsShowcase />

      <PrivacyTrustSection />

      <PricingTeaser />

      {/* Final CTA */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent p-8 text-center md:p-12">
            <Heading level="h2" responsive className="mb-4">
              Ready to work with your PDFs?
            </Heading>
            <Text tone="muted" className="mb-6">
              Browse our complete suite of PDF tools — no sign-up required to get started.
            </Text>
            <Button size="lg" asChild>
              <Link to="/all-tools">Get started</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
