import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

if (!secretKey) {
  console.warn('[stripe] ⚠ STRIPE_SECRET_KEY not set — Stripe features disabled');
}
if (secretKey) {
  console.log('[stripe] ✅ Stripe keys loaded (live mode)');
}

export async function getUncachableStripeClient() {
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(secretKey);
}

export async function getStripePublishableKey() {
  if (!publishableKey) throw new Error('STRIPE_PUBLISHABLE_KEY not configured');
  return publishableKey;
}

export async function getStripeSecretKey() {
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured');
  return secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured');
    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
