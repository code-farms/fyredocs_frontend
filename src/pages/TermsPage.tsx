import { Seo } from '@/components/common/Seo';

const TermsPage = () => {
  return (
    <>
      <Seo title="Terms of Service" description="The terms that apply when you use Fyredocs online PDF tools and services." path="/terms" />
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 17, 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Fyredocs's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground">
                Fyredocs provides online PDF tools including but not limited to: PDF merging, splitting, compression, conversion, OCR, and security features. Our services are provided "as is" and we reserve the right to modify or discontinue any feature at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Upload files containing malware, viruses, or malicious code</li>
                <li>Use the service to process illegal or unauthorized content</li>
                <li>Attempt to circumvent usage limits or security measures</li>
                <li>Resell or redistribute our services without permission</li>
                <li>Use automated tools to access the service in excessive amounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
              <p className="text-muted-foreground">
                You retain ownership of all files you upload. By using our service, you grant us a limited license to process your files solely for the purpose of providing the requested service. We claim no ownership rights over your content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Fyredocs is not liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services. Our total liability shall not exceed the amount you paid for the service in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
              <p className="text-muted-foreground">
                Paid subscriptions are billed in advance on a monthly or annual basis. Refunds are available within 14 days of purchase if you haven't used the service extensively. We reserve the right to change pricing with 30 days notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your access to our services at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through our service. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please contact us at legal@fyredocs.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsPage;
