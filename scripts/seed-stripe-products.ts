import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Creating Pulse Intelligence API products in Stripe...\n');

    const existing = await stripe.products.search({ query: "name:'Pulse Intelligence API' AND active:'true'" });
    if (existing.data.length > 0) {
      console.log('Products already exist:');
      for (const p of existing.data) {
        console.log(`  ${p.name} → ${p.id}`);
        const prices = await stripe.prices.list({ product: p.id, active: true });
        for (const pr of prices.data) {
          console.log(`    $${(pr.unit_amount || 0) / 100}/${pr.recurring?.interval || 'one-time'} → ${pr.id}`);
        }
      }
      return;
    }

    const starterProduct = await stripe.products.create({
      name: 'Pulse Intelligence API — Starter',
      description: '1,000 API calls/month across all 8 endpoints. News, Topics, Articles, GICS, Signals, Hive Memory, Search, Stream.',
      metadata: {
        tier: 'starter',
        calls_per_month: '1000',
        platform: 'pulse-universe',
      },
    });
    console.log(`Created: ${starterProduct.name} (${starterProduct.id})`);

    const starterMonthly = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 100,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'starter' },
    });
    console.log(`  $1/month → ${starterMonthly.id}`);

    const proProduct = await stripe.products.create({
      name: 'Pulse Intelligence API — Pro',
      description: '50,000 API calls/month. Priority access, higher rate limits, all 8 endpoints + SSE streaming.',
      metadata: {
        tier: 'pro',
        calls_per_month: '50000',
        platform: 'pulse-universe',
      },
    });
    console.log(`Created: ${proProduct.name} (${proProduct.id})`);

    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 999,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'pro' },
    });
    console.log(`  $9.99/month → ${proMonthly.id}`);

    const enterpriseProduct = await stripe.products.create({
      name: 'Pulse Intelligence API — Enterprise',
      description: 'Unlimited API calls. Dedicated support, custom endpoints, SLA guarantee, bulk data export.',
      metadata: {
        tier: 'enterprise',
        calls_per_month: 'unlimited',
        platform: 'pulse-universe',
      },
    });
    console.log(`Created: ${enterpriseProduct.name} (${enterpriseProduct.id})`);

    const enterpriseMonthly = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 4999,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'enterprise' },
    });
    console.log(`  $49.99/month → ${enterpriseMonthly.id}`);

    console.log('\n✅ All 3 API products + prices created successfully!');
    console.log('Starter: $1/mo (1K calls) | Pro: $9.99/mo (50K calls) | Enterprise: $49.99/mo (unlimited)');
  } catch (error: any) {
    console.error('Error creating products:', error.message);
    process.exit(1);
  }
}

createProducts();
