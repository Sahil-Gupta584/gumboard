
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function UpgradeToTeamPlan() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', { method: 'POST' });
      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error upgrading to team plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleUpgrade} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Upgrade to Team Plan ($9/mo)'}
    </Button>
  );
}
