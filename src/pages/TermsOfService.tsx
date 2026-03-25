import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using MakeMeUp's AI-powered skin tone matching and foundation recommendation service, 
              you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, 
              please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Service Description</h2>
            <p>
              MakeMeUp provides AI-powered skin tone analysis and foundation product recommendations. Our service 
              analyzes uploaded photos or manual color inputs to suggest matching foundation products from various brands. 
              We facilitate purchases through affiliate partnerships and direct checkout integrations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <p>
              Users can create accounts via OAuth (Google or Apple sign-in) to save their skin tone analysis results 
              and preferences. You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Product Recommendations</h2>
            <p>
              Our AI-powered recommendations are provided for informational purposes only. While we strive for accuracy, 
              skin tone matching can vary based on lighting conditions, photo quality, and individual skin characteristics. 
              We do not guarantee perfect matches and recommend testing products when possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Purchases and Payments</h2>
            <p>
              Purchases made through our direct checkout flow are processed via Stripe payment systems. All transactions are subject 
              to Stripe's terms and conditions. We do not store credit card information. Prices and product availability 
              are subject to change without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Affiliate Partnerships</h2>
            <p>
              MakeMeUp participates in affiliate marketing programs including Amazon Associates and Rakuten Advertising.
              We may earn commissions on qualifying purchases made through affiliate links. This does not affect the price
              you pay for products. Please review our{" "}
              <Link to="/affiliate-disclosure" className="text-primary hover:underline">Affiliate Disclosure</Link>{" "}
              for important details about affiliate links, pricing, and external retailer checkout terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Privacy and Data Collection</h2>
            <p>
              We collect and process personal information including photos for skin tone analysis and purchase history. 
              Please review our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for 
              detailed information about how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
            <p>
              All content, features, and functionality on the MakeMeUp platform, including but not limited to text, 
              graphics, logos, algorithms, and software, are owned by MakeMeUp and protected by copyright, trademark, 
              and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
            <p>
              MakeMeUp is not liable for any indirect, incidental, special, consequential, or punitive damages resulting 
              from your use of the service, including but not limited to skin reactions, product dissatisfaction, or 
              purchase disputes. Product quality and customer service are the responsibility of the respective brands and retailers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Modifications to Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of the service at any time without notice. 
              We may also update these Terms of Service periodically. Continued use of the service constitutes acceptance 
              of revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us through our support channels on the platform.
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

export default TermsOfService;
