import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Shipping Policy</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Shipping Overview</h2>
            <p>
              MakeMeUp offers reliable shipping for all foundation products recommended through our AI-powered platform. 
              We partner with trusted carriers to ensure your products arrive safely and on time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Processing Time</h2>
            <p>
              Orders are typically processed within 1-2 business days (Monday-Friday, excluding holidays). Processing 
              includes verification, packaging, and handoff to the shipping carrier. Orders placed after 2 PM EST may 
              be processed the next business day.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Shipping Methods & Delivery Times</h2>
            <p className="mb-2">We offer the following shipping options:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Standard Shipping:</strong> 5-7 business days after processing (Free on orders over $50)</li>
              <li><strong>Express Shipping:</strong> 2-3 business days after processing ($12.99)</li>
              <li><strong>Overnight Shipping:</strong> Next business day after processing ($24.99)</li>
            </ul>
            <p className="mt-2">
              Delivery times are estimates and may vary based on destination, weather conditions, and carrier delays. 
              Weekend and holiday deliveries are not guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Shipping Costs</h2>
            <p className="mb-2">Shipping costs are calculated based on:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Order total value</li>
              <li>Selected shipping method</li>
              <li>Destination address</li>
              <li>Package weight and dimensions</li>
            </ul>
            <p className="mt-2">
              Final shipping costs are displayed at checkout before you complete your purchase. Standard shipping 
              is free on all orders over $50.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Domestic Shipping (United States)</h2>
            <p>
              We ship to all 50 United States, including Alaska, Hawaii, Puerto Rico, and U.S. territories. 
              Additional delivery time may apply to Alaska, Hawaii, and territories. PO Boxes are accepted for 
              standard shipping only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. International Shipping</h2>
            <p>
              We currently ship to select international destinations. International shipping times vary by location 
              (typically 7-21 business days) and customs processing. International orders may be subject to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Customs duties and import taxes (customer's responsibility)</li>
              <li>Additional carrier fees for customs clearance</li>
              <li>Extended delivery times due to customs processing</li>
            </ul>
            <p className="mt-2">
              International shipping costs are calculated at checkout. We are not responsible for customs delays 
              or fees imposed by your country.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Order Tracking</h2>
            <p>
              Once your order ships, you will receive a shipping confirmation email with a tracking number. 
              You can track your package using the provided tracking link or through your account on our platform. 
              Tracking information is typically updated within 24 hours of shipment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Shipping Address</h2>
            <p>
              Please ensure your shipping address is accurate and complete. We are not responsible for orders shipped 
              to incorrect or incomplete addresses provided by the customer. If you need to update your shipping 
              address, contact us within 2 hours of placing your order. After this window, we may not be able to 
              change the address before shipment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Lost or Stolen Packages</h2>
            <p>
              MakeMeUp is not responsible for packages that are lost or stolen after confirmed delivery by the carrier. 
              We recommend shipping to a secure location or requiring a signature for high-value orders. If your package 
              shows as delivered but you have not received it:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Check with neighbors or household members</li>
              <li>Verify the delivery address on your order confirmation</li>
              <li>Check common delivery locations (porch, garage, mailbox)</li>
              <li>Contact the shipping carrier with your tracking number</li>
            </ul>
            <p className="mt-2">
              If the carrier confirms delivery to the correct address, we cannot issue refunds or replacements. 
              We recommend filing a claim with the carrier or your credit card company if applicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Damaged Shipments</h2>
            <p>
              If your package arrives damaged, please refuse delivery or take photos of the damage before opening. 
              Contact us immediately with photos of the damaged packaging and products within 7 days of delivery. 
              We will work with the carrier to file a claim and send you a replacement at no cost.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Undeliverable Packages</h2>
            <p>
              If a package is returned to us as undeliverable due to incorrect address, multiple failed delivery 
              attempts, or refusal of delivery, we will contact you to arrange reshipment. Reshipment fees may apply 
              unless the error was on our part.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Shipping Delays</h2>
            <p>
              While we strive for on-time delivery, delays may occur due to weather conditions, carrier issues, 
              natural disasters, holidays, or high-volume periods. We are not responsible for carrier delays beyond 
              our control. If your order is significantly delayed, please contact us for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Holidays & Peak Seasons</h2>
            <p>
              During peak shopping seasons (Black Friday, Cyber Monday, December holidays), processing and delivery 
              times may be extended due to high order volumes. We recommend ordering early to ensure delivery by 
              specific dates. Holiday shipping cutoff dates will be posted on our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Contact for Shipping Issues</h2>
            <p>
              For questions about shipping, tracking, or delivery issues, please contact our customer support team 
              through the platform. Have your order number ready to expedite assistance.
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

export default ShippingPolicy;
