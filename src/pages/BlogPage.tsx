import { Seo } from '@/components/common/Seo';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heading, Text } from '@/components/ui/typography';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  readTime: string;
  /** Matching guide in src/config/docs.ts — posts without one render as plain cards. */
  docSlug?: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'How to Reduce PDF File Size Without Losing Quality',
    description:
      'Learn the best techniques for compressing PDFs while maintaining document clarity and readability.',
    category: 'Tips & Tricks',
    date: '2025-01-15',
    readTime: '5 min read',
    docSlug: 'compress-pdf',
  },
  {
    id: 2,
    title: 'The Complete Guide to PDF Accessibility',
    description: 'Making your PDFs accessible to everyone, including users with disabilities.',
    category: 'Guides',
    date: '2025-01-10',
    readTime: '8 min read',
  },
  {
    id: 3,
    title: 'OCR Technology: How It Works and When to Use It',
    description:
      'Understanding optical character recognition and its applications for scanned documents.',
    category: 'Technology',
    date: '2025-01-05',
    readTime: '6 min read',
    docSlug: 'ocr-pdf',
  },
  {
    id: 4,
    title: 'Best Practices for Merging Multiple PDFs',
    description:
      'Tips for organizing and combining PDF documents efficiently for professional results.',
    category: 'Tips & Tricks',
    date: '2024-12-28',
    readTime: '4 min read',
    docSlug: 'merge-pdf',
  },
  {
    id: 5,
    title: 'PDF Security: Protecting Your Sensitive Documents',
    description: 'Learn how to password protect and encrypt your PDF files for maximum security.',
    category: 'Security',
    date: '2024-12-20',
    readTime: '7 min read',
    docSlug: 'protect-pdf',
  },
];

const PostMeta = ({ post, withArrow }: { post: BlogPost; withArrow: boolean }) => (
  <div className="flex items-center justify-between text-body-sm text-muted-foreground">
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1">
        <Calendar className="h-4 w-4" aria-hidden />
        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="h-4 w-4" aria-hidden />
        {post.readTime}
      </span>
    </div>
    {withArrow && (
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
    )}
  </div>
);

const PostCardBody = ({ post, linked }: { post: BlogPost; linked: boolean }) => (
  <>
    <CardHeader>
      <Badge variant="secondary" className="mb-2 w-fit">
        {post.category}
      </Badge>
      <CardTitle className={linked ? 'transition-colors group-hover:text-primary' : undefined}>
        {post.title}
      </CardTitle>
      <CardDescription>{post.description}</CardDescription>
    </CardHeader>
    <CardContent>
      <PostMeta post={post} withArrow={linked} />
    </CardContent>
  </>
);

const BlogPage = () => {
  return (
    <>
      <Seo title="Blog" description="Tips, tutorials, and insights about working with PDFs — compression, OCR, merging, security, and more." path="/blog" />

      <div className="container py-12 md:py-16">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <Heading level="display" responsive>
            Fyredocs <span className="gradient-text">Blog</span>
          </Heading>
          <Text variant="body-lg" tone="muted" className="mt-4">
            Tips, tutorials, and insights about working with PDFs
          </Text>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) =>
            post.docSlug ? (
              <Link key={post.id} to={`/docs/${post.docSlug}`} className="group block">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <PostCardBody post={post} linked />
                </Card>
              </Link>
            ) : (
              <Card key={post.id} className="h-full">
                <PostCardBody post={post} linked={false} />
              </Card>
            ),
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
