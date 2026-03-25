import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and OAuth provider data (Google or Apple ID)</li>
              <li><strong>Skin Tone Analysis Data:</strong> Photos you upload, detected skin tone hex codes, pigment formulas, and matched products</li>
              <li><strong>Preference Data:</strong> Brand preferences, saved shade matches, and product selections</li>
              <li><strong>Purchase Data:</strong> Order history, product selections, and payment information (processed by Square)</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, and interaction patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
            <p className="mb-2">We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide AI-powered skin tone analysis and foundation recommendations</li>
              <li>Save and retrieve your analysis results and preferences</li>
              <li>Process purchases and manage orders</li>
              <li>Improve our recommendation algorithms and user experience</li>
              <li>Send order confirmations and service updates</li>
              <li>Track affiliate commissions through Amazon and Rakuten partnerships</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Photo Storage and Processing</h2>
            <p>
              Photos you upload for skin tone analysis are processed by Google Gemini AI to extract color information. 
              Photos may be stored in your account to allow you to review past analyses. We do not share your photos 
              with third parties except as necessary for AI processing (Google Gemini API) and as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Third-Party Services</h2>
            <p className="mb-2">We integrate with the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Backend infrastructure, database, and authentication</li>
              <li><strong>Google Gemini AI:</strong> AI-powered skin tone analysis from photos</li>
              <li><strong>Stripe:</strong> Payment processing for direct checkout purchases</li>
              <li><strong>Amazon Associates and Rakuten Advertising:</strong> Affiliate marketing and product link tracking</li>
              <li><strong>Google & Apple OAuth:</strong> Account authentication</li>
            </ul>
            <p className="mt-2">
              Each service has its own privacy policy governing their use of your data. We recommend reviewing their
              policies and our{" "}
              <Link to="/affiliate-disclosure" className="text-primary hover:underline">Affiliate Disclosure</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share data in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With service providers necessary for operation (Supabase, Google AI, Square, Rakuten)</li>
              <li>When required by law or to protect our legal rights</li>
              <li>With your explicit consent</li>
              <li>In aggregated, anonymized form for analytics and improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including encryption in transit 
              (HTTPS), OAuth authentication, and secure backend infrastructure via Supabase. However, no method of 
              transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights and Choices</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, update, or delete your account information</li>
              <li>Delete saved shade matches and analysis results</li>
              <li>Request a copy of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Revoke OAuth permissions for Google or Apple sign-in</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us through the platform or your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Cookies and Tracking</h2>
            <p>
              We use essential cookies for authentication and session management. We do not currently use advertising 
              cookies or third-party tracking cookies. Your browser settings allow you to control cookie preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Children's Privacy</h2>
            <p>
              Our service is not intended for individuals under the age of 13. We do not knowingly collect personal 
              information from children under 13. If we become aware of such collection, we will delete the information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. International Users</h2>
            <p>
              Our service is hosted in the United States. By using MakeMeUp, you consent to the transfer and processing 
              of your data in the United States, which may have different data protection laws than your country.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. 
              We will notify you of significant changes by posting the updated policy on this page with a new "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Us</h2>
            <p>
              For questions about this Privacy Policy or to exercise your privacy rights, please contact us through 
              the support channels available on the platform.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
