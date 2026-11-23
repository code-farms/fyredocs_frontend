import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/common/Seo';
import { FileText, ArrowLeft, Layers, Scissors, Minimize2 } from 'lucide-react';

const popularTools = [
  { name: 'Merge PDF', href: '/merge', icon: Layers },
  { name: 'Split PDF', href: '/split', icon: Scissors },
  { name: 'Compress PDF', href: '/compress', icon: Minimize2 },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Seo
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        path={location.pathname}
        noindex
      />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="mb-2 text-5xl font-bold">404</h1>
          <p className="mb-8 text-lg text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild className="mb-10">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <div className="border-t pt-8">
            <p className="text-sm font-medium text-muted-foreground mb-4">Popular tools</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {popularTools.map((tool) => (
                <Button key={tool.href} variant="outline" size="sm" asChild>
                  <Link to={tool.href}>
                    <tool.icon className="mr-1.5 h-3.5 w-3.5" />
                    {tool.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default NotFound;
