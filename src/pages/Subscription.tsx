import Header from '@/components/Header';
import { SubscriptionManager } from '@/components/SubscriptionManager';

export default function Subscription() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Unlock premium features and get the best foundation matches with our advanced AI technology.
            </p>
          </div>
          
          <SubscriptionManager />
        </div>
      </div>
    </div>
  );
}