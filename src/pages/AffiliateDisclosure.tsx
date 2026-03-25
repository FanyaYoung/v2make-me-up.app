import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const AffiliateDisclosure = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Affiliate Disclosure</h1>

        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Affiliate Relationships</h2>
            <p>
              Make Me Up may include links to third-party retailers, including Amazon and other beauty partners.
              Some of these links are affiliate links.
            </p>
            <p>
              This means we may earn a commission if you click a link and make a qualifying purchase.
              This does not increase your price.
            </p>
            <p>
              As an Amazon Associate, we earn from qualifying purchases.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Pricing and Availability</h2>
            <p>
              Product prices, promotions, stock status, shipping fees, and taxes can change at any time and
              may vary by retailer, location, and account status.
            </p>
            <p>
              Prices shown in Make Me Up are estimates based on the latest information available to us at the
              time of update and are provided for convenience only.
            </p>
            <p>
              The final and authoritative price, availability, shipping, tax, and checkout terms are the values
              shown on the retailer website or app at the time of purchase.
            </p>
            <p>
              If there is any difference between a price shown in Make Me Up and the retailer price, the retailer
              price controls.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. External Retailers</h2>
            <p>
              When you click a retailer link, you leave Make Me Up and are directed to a third-party website or app.
              Purchases made on third-party platforms are governed by that retailer's terms, privacy policy, shipping
              policy, and return/refund policy.
            </p>
            <p>
              Make Me Up is not the seller of record for purchases completed on third-party retailer sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Related Policies</h2>
            <p>
              Please also review our{" "}
              <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Contact</h2>
            <p>
              If you have questions about affiliate links or pricing information, please contact us through
              our support channels in the app.
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

export default AffiliateDisclosure;
