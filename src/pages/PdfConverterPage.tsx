import { useMemo } from 'react';
import { Seo } from '@/components/common/Seo';
import { Heading, Text } from '@/components/ui/typography';
import { ToolGrid } from '@/components/home/ToolGrid';
import { NAV_GROUPS } from '@/config/navigation';
import { getAllTools } from '@/config/tools';
import { SITE_URL } from '@/lib/seo';
import {
  PDF_CONVERTER_GROUPS,
  PDF_CONVERTER_PATH,
  PDF_CONVERTER_SEO,
  buildHubJsonLd,
} from '@/lib/toolSeo';

/** Landing page for broad "pdf converter" searches: every convert tool, grouped by direction. */
const PdfConverterPage = () => {
  const groups = useMemo(() => {
    const tools = getAllTools();
    return PDF_CONVERTER_GROUPS.map((id) => ({
      meta: NAV_GROUPS.find((g) => g.id === id),
      tools: tools.filter((t) => t.navGroup === id),
    })).filter((g) => g.meta && g.tools.length > 0);
  }, []);

  const jsonLd = useMemo(
    () =>
      buildHubJsonLd(
        groups.flatMap((g) => g.tools.map((t) => ({ name: t.name, route: t.route }))),
        SITE_URL,
      ),
    [groups],
  );

  return (
    <>
      <Seo
        title={PDF_CONVERTER_SEO.h1}
        fullTitle={PDF_CONVERTER_SEO.title}
        description={PDF_CONVERTER_SEO.metaDescription}
        path={PDF_CONVERTER_PATH}
        jsonLd={jsonLd}
      />

      <div className="container py-12">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <Heading level="display" responsive>
            {PDF_CONVERTER_SEO.h1}
          </Heading>
          <Text variant="body-lg" tone="muted" className="mt-3">
            {PDF_CONVERTER_SEO.intro}
          </Text>
        </div>

        <div className="space-y-12">
          {groups.map(({ meta, tools }) => (
            <section key={meta!.id} aria-labelledby={`group-${meta!.id}`}>
              <Heading level="h2" id={`group-${meta!.id}`} className="mb-6">
                {meta!.title}
              </Heading>
              <ToolGrid tools={tools} />
            </section>
          ))}
        </div>
      </div>
    </>
  );
};

export default PdfConverterPage;
