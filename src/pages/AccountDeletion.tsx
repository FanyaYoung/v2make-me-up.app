import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const AccountDeletion = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Make Me Up Account and Data Deletion</h1>

        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">How to Request Deletion</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Open the Make Me Up app and sign in to the account you want deleted.</li>
              <li>Use the support or contact channel available in the app to request account deletion.</li>
              <li>Include the email address or OAuth account used to sign in so we can identify the correct account.</li>
              <li>We may contact you to verify the request before deletion is completed.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">What Data Is Deleted</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your account profile and authentication association with Make Me Up</li>
              <li>Saved shade matches, analysis history, and preferences stored with your account</li>
              <li>Photos and related analysis records associated with your account, subject to technical backup retention</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">What Data May Be Retained</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Transaction, order, payout, fraud-prevention, tax, and legal compliance records that must be retained</li>
              <li>Limited backup or log records for a short retention period until routine deletion cycles complete</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Retention Timing</h2>
            <p>
              Account deletion requests are processed as quickly as reasonably possible. Some records may remain
              in backups or legally required retention systems for a limited period after the request is completed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Related Policies</h2>
            <p>
              For more information, review our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
              and{" "}
              <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
