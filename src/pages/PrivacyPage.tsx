import { Seo } from '@/components/common/Seo';

const PrivacyPage = () => {
  return (
    <>
      <Seo title="Privacy Policy" description="How Fyredocs collects, uses and protects your data and the files you process with our PDF tools." path="/privacy" />
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 17, 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                Fyredocs ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our PDF tools service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">We collect information in the following ways:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Files you upload:</strong> PDF and document files you upload for processing. These are automatically deleted after processing is complete.</li>
                <li><strong>Usage data:</strong> Anonymous analytics about how you use our service, including pages visited and features used.</li>
                <li><strong>Account information:</strong> If you create an account, we collect your email address and name.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>To provide and maintain our PDF processing services</li>
                <li>To improve and optimize our platform</li>
                <li>To communicate with you about service updates</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. File Security</h2>
              <p className="text-muted-foreground">
                Your files are encrypted during transmission using SSL/TLS encryption. Uploaded files are processed in isolated environments and automatically deleted within 1 hour of processing completion. We never access the contents of your files except as necessary to provide the requested service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground">
                Uploaded files are automatically deleted within 1 hour after processing. Account data is retained until you delete your account. Usage analytics are retained for up to 2 years in anonymized form.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at privacy@fyredocs.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPage;
