import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Refund & Return Policy</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Our Commitment</h2>
            <p>
              At MakeMeUp, we want you to be completely satisfied with your foundation purchases. We understand that 
              color matching can be challenging, which is why we offer a comprehensive refund and return policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Return Eligibility</h2>
            <p className="mb-2">You may return products within 30 days of delivery if:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The product is unused or gently tested (used once for patch testing)</li>
              <li>The product is in its original packaging</li>
              <li>You have proof of purchase (order confirmation email)</li>
              <li>The seal is intact or minimally broken for testing purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Non-Returnable Items</h2>
            <p className="mb-2">The following items cannot be returned for hygiene and safety reasons:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Products with broken seals or significantly used</li>
              <li>Products without original packaging or labels</li>
              <li>Items marked as final sale or clearance</li>
              <li>Gift cards or promotional items</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. How to Initiate a Return</h2>
            <p className="mb-2">To start a return:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Contact our customer support through the platform within 30 days of delivery</li>
              <li>Provide your order number and reason for return</li>
              <li>Wait for return authorization and shipping instructions</li>
              <li>Pack the item securely in its original packaging</li>
              <li>Ship the item to the provided return address</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Return Shipping Costs</h2>
            <p className="mb-2">Return shipping costs are handled as follows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Defective or Incorrect Items:</strong> We provide a prepaid return label at no cost to you</li>
              <li><strong>Color Mismatch or Change of Mind:</strong> Customer is responsible for return shipping costs</li>
              <li><strong>Damaged in Transit:</strong> We provide a prepaid return label and full refund</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Refund Processing</h2>
            <p>
              Once we receive and inspect your returned item (typically 5-7 business days after shipment), we will 
              process your refund within 3-5 business days. Refunds are issued to the original payment method used 
              at checkout (Square payment account). Please allow an additional 5-10 business days for the refund 
              to appear in your account, depending on your financial institution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Exchanges</h2>
            <p>
              We currently do not offer direct exchanges. If you need a different shade or product, please return 
              the original item for a refund and place a new order for the desired product. This ensures you receive 
              the correct item as quickly as possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Defective or Damaged Products</h2>
            <p>
              If you receive a defective or damaged product, please contact us immediately with photos of the damage. 
              We will provide a prepaid return label and issue a full refund or replacement at no cost to you. 
              Please report damaged items within 7 days of delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Wrong Item Shipped</h2>
            <p>
              If we ship the wrong product or shade, we will provide a prepaid return label and ship the correct 
              item at no additional cost. Please contact us within 7 days of delivery with your order details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Partial Refunds</h2>
            <p className="mb-2">Partial refunds may be issued in the following situations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Product shows signs of excessive use beyond patch testing</li>
              <li>Packaging is significantly damaged (not due to shipping)</li>
              <li>Return is made after 30 days but within 45 days (at our discretion)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Cancellations</h2>
            <p>
              Orders can be cancelled within 2 hours of placement at no charge. After this window, orders may have 
              already entered processing and shipping, and standard return policies will apply. Contact us immediately 
              if you need to cancel an order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. AI Recommendation Guarantee</h2>
            <p>
              While we strive for accurate AI-powered color matching, individual results may vary based on lighting, 
              skin texture, and photo quality. We encourage customers to use our virtual try-on feature before 
              purchasing. Returns due to color mismatch are accepted under our standard return policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact for Returns</h2>
            <p>
              For all return and refund inquiries, please contact our customer support team through the platform. 
              Please have your order number ready to expedite the process.
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

export default RefundPolicy;
