import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { BookOpen, Wrench, FileText, Shield, HelpCircle } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { STATIC_PAGE_SEO } from '@/lib/toolSeo';
import { Heading, Text } from '@/components/ui/typography';

const categories = [
  {
    title: 'Getting Started',
    description: 'Learn how Fyredocs works and start using PDF tools in minutes.',
    icon: BookOpen,
    href: '/docs/getting-started',
    color: 'text-primary',
  },
  {
    title: 'Tool Guides',
    description: 'Detailed guides for every PDF tool — merge, split, compress, convert, and more.',
    icon: Wrench,
    href: '/docs/merge-pdf',
    color: 'text-category-organize',
  },
  {
    title: 'Supported Formats',
    description: 'See all file formats and size limits supported by each tool.',
    icon: FileText,
    href: '/docs/supported-formats',
    color: 'text-info',
  },
  {
    title: 'Security & Privacy',
    description: 'How we keep your files safe, encrypted, and automatically deleted.',
    icon: Shield,
    href: '/docs/security-privacy',
    color: 'text-category-security',
  },
  {
    title: 'FAQ',
    description: 'Quick answers to common questions about using Fyredocs.',
    icon: HelpCircle,
    href: '/docs/faq',
    color: 'text-category-convert-from',
  },
];

const DocsIndexPage = () => {
  return (
    <>
      <Seo
        title="Help Guides"
        fullTitle={STATIC_PAGE_SEO['/docs'].title}
        description={STATIC_PAGE_SEO['/docs'].description}
        path="/docs"
      />
      <div className="px-8 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level="display" responsive className="mb-6">
            <span className="text-gradient-primary">Documentation</span>
          </Heading>
          <Text variant="body-lg" tone="muted">
            Everything you need to know about using Fyredocs PDF tools
          </Text>
        </div>

        <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link key={cat.title} to={cat.href}>
              <Card className="h-full hover:shadow-lg transition-shadow hover:border-primary/30">
                <CardHeader>
                  <cat.icon className={`w-8 h-8 mb-2 ${cat.color}`} aria-hidden />
                  <CardTitle className="text-lg">{cat.title}</CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default DocsIndexPage;
