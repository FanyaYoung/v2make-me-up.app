import Header from '@/components/Header';
import SubscriptionOptions from '@/components/SubscriptionOptions';

export default function SubscriptionPlans() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <SubscriptionOptions />
        </div>
      </div>
    </div>
  );
}