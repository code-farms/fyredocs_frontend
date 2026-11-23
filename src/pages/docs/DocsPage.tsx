import { useParams, Navigate, Link } from 'react-router-dom';
import { DocArticle } from '@/components/docs/DocArticle';
import { docNavGroups, getDocBySlug } from '@/config/docs';
import { TOOLS } from '@/config/tools';
import { ArrowRight } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { SITE_URL } from '@/lib/seo';
import { buildDocJsonLd, docDescription, docPath, docTitle } from '@/lib/toolSeo';

const DocsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const doc = slug ? getDocBySlug(slug) : undefined;

  if (!doc) {
    return <Navigate to="/docs" replace />;
  }

  const linkedTool = doc.toolId ? TOOLS[doc.toolId] : undefined;

  return (
    <>
      <Seo
        title={doc.title}
        fullTitle={docTitle(doc)}
        description={docDescription(doc)}
        path={docPath(doc.slug)}
        jsonLd={buildDocJsonLd(doc, SITE_URL)}
      />

      <DocArticle
        slug={doc.slug}
        title={doc.title}
        description={doc.description}
        sections={doc.sections}
        groups={docNavGroups}
        basePath="/docs"
        headerExtra={
          linkedTool && (
            <Link
              to={linkedTool.route}
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary hover:underline"
            >
              Try {linkedTool.name}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          )
        }
      />
    </>
  );
};

export default DocsPage;
