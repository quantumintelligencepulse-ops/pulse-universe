import { getUncachableStripeClient } from '../server/stripeClient';

const PRODUCTS = [
  {
    name: 'Pulse Intelligence — API Access',
    description: 'All 8 endpoints unlocked. 100,000 API calls/month. /api/news, /api/topics, /api/articles, /api/gics, /api/signals, /api/hive, /api/search, /api/stream.',
    metadata: { organ: 'api-access', calls_per_month: '100000', platform: 'pulse-universe' },
    priceType: 'recurring' as const,
  },
  {
    name: 'Pulse Intelligence — Datasets',
    description: 'Full data export access. Daily News Dataset, GICS Intelligence Dataset, Signals Dataset, 30-Day Archive, Topic Metadata, Narrative Timelines. Each dataset $1.',
    metadata: { organ: 'datasets', platform: 'pulse-universe' },
    priceType: 'one_time' as const,
  },
  {
    name: 'Pulse Intelligence — Real-Time Stream',
    description: 'Full /api/stream SSE access. Real-time events: news, signals, hive insights, sector events, topic events.',
    metadata: { organ: 'realtime-stream', platform: 'pulse-universe' },
    priceType: 'recurring' as const,
  },
  {
    name: 'Pulse Intelligence — Automated Reports',
    description: 'Daily Market Intelligence Report, Weekly Sector Deep Dive, Monthly Macro Outlook. All in HTML + JSON.',
    metadata: { organ: 'reports', platform: 'pulse-universe' },
    priceType: 'recurring' as const,
  },
  {
    name: 'Pulse Intelligence — Intelligence Packs',
    description: 'Sector intelligence bundles. Tech, Financials, Energy, Healthcare, Full GICS Universe. Each includes datasets, reports, signals, summaries, timelines.',
    metadata: { organ: 'intelligence-packs', platform: 'pulse-universe' },
    priceType: 'one_time' as const,
  },
  {
    name: 'Pulse Intelligence — Enterprise License',
    description: 'Private API base URL, unlimited requests, custom filters, dedicated stream, private datasets, priority routing.',
    metadata: { organ: 'enterprise', calls_per_month: 'unlimited', platform: 'pulse-universe' },
    priceType: 'recurring' as const,
  },
  {
    name: 'Pulse Intelligence — White-Label Intelligence',
    description: 'Embeddable widgets, white-label API, branded dashboards, scoped endpoints, 200,000 widget calls.',
    metadata: { organ: 'white-label', platform: 'pulse-universe' },
    priceType: 'recurring' as const,
  },
];

async function seedProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('🔄 Archiving old Pulse products...\n');

    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const list: any = await stripe.products.list({ limit: 100, active: true, ...(startingAfter ? { starting_after: startingAfter } : {}) });
      for (const p of list.data) {
        if (p.name.includes('Pulse Intelligence') && p.active) {
          const prices = await stripe.prices.list({ product: p.id, active: true });
          for (const pr of prices.data) {
            await stripe.prices.update(pr.id, { active: false });
          }
          await stripe.products.update(p.id, { active: false });
          console.log(`  Archived: ${p.name}`);
        }
      }
      hasMore = list.has_more;
      if (list.data.length > 0) startingAfter = list.data[list.data.length - 1].id;
    }

    console.log('\n⭐ Creating $1 EVERYTHING product catalog...\n');

    for (const prod of PRODUCTS) {
      const product = await stripe.products.create({
        name: prod.name,
        description: prod.description,
        metadata: prod.metadata,
      });

      const priceParams: any = {
        product: product.id,
        unit_amount: 100,
        currency: 'usd',
        metadata: { organ: prod.metadata.organ },
      };

      if (prod.priceType === 'recurring') {
        priceParams.recurring = { interval: 'month' };
      }

      const price = await stripe.prices.create(priceParams);

      const typeLabel = prod.priceType === 'recurring' ? '$1/month' : '$1 one-time';
      console.log(`✅ ${prod.name}`);
      console.log(`   Product: ${product.id}`);
      console.log(`   Price:   ${price.id} (${typeLabel})\n`);
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('⭐ ALL 7 REVENUE ORGANS CREATED — EVERYTHING IS $1');
    console.log('═══════════════════════════════════════════════════');
    console.log('1. API Access         — $1/mo  (100K calls)');
    console.log('2. Datasets           — $1     (per dataset)');
    console.log('3. Real-Time Stream   — $1/mo  (full SSE)');
    console.log('4. Automated Reports  — $1/mo  (daily+weekly+monthly)');
    console.log('5. Intelligence Packs — $1     (per sector pack)');
    console.log('6. Enterprise License — $1/mo  (unlimited everything)');
    console.log('7. White-Label        — $1/mo  (widgets+branded API)');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedProducts();
