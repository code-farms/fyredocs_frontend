import { Seo } from '@/components/common/Seo';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Heading, Text } from '@/components/ui/typography';
import { toast } from '@/lib/toast';
import { submitContact } from '@/lib/contact';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  subject: z.string().trim().min(3, 'Subject is required'),
  message: z.string().trim().min(10, 'Tell us a bit more (at least 10 characters)'),
});

type ContactValues = z.infer<typeof contactSchema>;

const ContactPage = () => {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const handleSubmit = async (values: ContactValues) => {
    try {
      await submitContact(values);
      toast.success('Message sent!', "We'll get back to you as soon as possible.");
      form.reset();
    } catch {
      toast.error('Unable to send message', 'Please try again in a moment.');
    }
  };

  return (
    <>
      <Seo title="Contact" description="Questions about Fyredocs PDF tools? Send us a message or email support@fyredocs.com." path="/contact" />

      <div className="container py-12 md:py-16">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <Heading level="display" responsive>
            Get in <span className="gradient-text">touch</span>
          </Heading>
          <Text variant="body-lg" tone="muted" className="mt-4">
            Have questions? We&apos;d love to hear from you.
          </Text>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll respond within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input autoComplete="name" placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="How can we help?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us more about your inquiry..."
                              rows={5}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={form.formState.isSubmitting}
                    >
                      <Send aria-hidden />
                      {form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                    <Mail className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <Heading level="h4" as="h3" className="mb-1">
                      Email
                    </Heading>
                    <a
                      href="mailto:support@fyredocs.com"
                      className="text-body-sm text-muted-foreground hover:text-primary hover:underline"
                    >
                      support@fyredocs.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                    <BookOpen className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <Heading level="h4" as="h3" className="mb-1">
                      Documentation
                    </Heading>
                    <Text variant="body-sm" tone="muted">
                      Answers to most questions live in our{' '}
                      <Link to="/docs" className="text-primary hover:underline">
                        guides and FAQ
                      </Link>
                      .
                    </Text>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
