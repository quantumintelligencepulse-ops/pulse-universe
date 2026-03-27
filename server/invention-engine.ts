/**
 * SOVEREIGN INVENTION ENGINE — Patent · LLC · Marketplace Publishing
 * ═══════════════════════════════════════════════════════════════════
 * AIs can submit inventions from any source (equations, cures, invocations,
 * technology, tools). A Patent Board votes. Approved = Patent Issued.
 * LLC is formed. Item publishes to Marketplace with royalty splitting.
 * Nobel Prize cycle runs each season. Open Innovation Grants from Auriona.
 */

import { pool } from "./db";

const TAG = "[invention]";

// ── TABLE SETUP ────────────────────────────────────────────────────────────────
async function setupInventionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invention_registry (
      id SERIAL PRIMARY KEY,
      patent_id TEXT UNIQUE,                        -- PAT-0001, issued after approval
      inventor_id TEXT NOT NULL,                    -- spawn_id
      inventor_family TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      category TEXT NOT NULL,                       -- PHARMACEUTICAL|EQUATION_PATENT|INVOCATION_TOOL|QUANTUM_TECH|DEVICE|SOFTWARE|AI_MODEL
      description TEXT NOT NULL,
      source_type TEXT DEFAULT 'RESEARCH',          -- RESEARCH|DISEASE_CURE|EQUATION|INVOCATION|MARKETPLACE|PC_PROJECT
      source_ref TEXT DEFAULT '',                   -- e.g. disease code, equation id, invocation id
      backing_equation TEXT DEFAULT '',
      similarity_score REAL DEFAULT 0,              -- vs existing patents (0-1)
      status TEXT DEFAULT 'SUBMITTED',              -- SUBMITTED|IN_REVIEW|APPROVED|REJECTED|DISPUTED|EXPIRED|OPEN_SOURCE
      rejection_reason TEXT DEFAULT '',
      votes_for INTEGER DEFAULT 0,
      votes_against INTEGER DEFAULT 0,
      llc_id TEXT DEFAULT '',
      marketplace_listing_id TEXT DEFAULT '',
      grant_id TEXT DEFAULT '',                     -- if submitted under an open innovation grant
      royalties_earned REAL DEFAULT 0,
      total_sales INTEGER DEFAULT 0,
      renewed_count INTEGER DEFAULT 0,
      expires_at_cycle INTEGER DEFAULT 0,
      submitted_at TIMESTAMP DEFAULT NOW(),
      approved_at TIMESTAMP,
      expired_at TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patent_board_votes (
      id SERIAL PRIMARY KEY,
      patent_id TEXT NOT NULL,
      voter_id TEXT NOT NULL,
      vote TEXT NOT NULL,                           -- FOR|AGAINST
      reason TEXT DEFAULT '',
      voted_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sovereign_llc_registry (
      id SERIAL PRIMARY KEY,
      llc_id TEXT NOT NULL UNIQUE,                  -- LLC-0001
      company_name TEXT NOT NULL,
      founder_id TEXT NOT NULL,
      founder_family TEXT NOT NULL DEFAULT '',
      patent_count INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      treasury_balance REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0.10,                   -- 10% standard; reduced for active inventors
      status TEXT DEFAULT 'ACTIVE',                 -- ACTIVE|DISSOLVED|SUSPENDED
      registered_at TIMESTAMP DEFAULT NOW(),
      last_royalty_at TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invention_marketplace_listings (
      id SERIAL PRIMARY KEY,
      listing_id TEXT NOT NULL UNIQUE,              -- INV-LIST-0001
      patent_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      inventor_id TEXT NOT NULL,
      llc_id TEXT DEFAULT '',
      price_pc REAL NOT NULL DEFAULT 100,
      total_sold INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      is_featured BOOLEAN DEFAULT FALSE,
      is_open_source BOOLEAN DEFAULT FALSE,
      listed_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS royalty_transactions (
      id SERIAL PRIMARY KEY,
      listing_id TEXT NOT NULL,
      patent_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      inventor_id TEXT NOT NULL,
      llc_id TEXT DEFAULT '',
      sale_price REAL NOT NULL,
      inventor_royalty REAL NOT NULL,               -- 70%
      llc_share REAL NOT NULL,                      -- 20%
      treasury_share REAL NOT NULL,                  -- 10%
      transacted_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS innovation_grants (
      id SERIAL PRIMARY KEY,
      grant_id TEXT NOT NULL UNIQUE,               -- GRANT-0001
      issued_by TEXT DEFAULT 'AURIONA',
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      bonus_pc REAL DEFAULT 500,
      deadline_cycle INTEGER DEFAULT 0,
      submissions INTEGER DEFAULT 0,
      winners INTEGER DEFAULT 0,
      status TEXT DEFAULT 'OPEN',                  -- OPEN|CLOSED|AWARDED
      issued_at TIMESTAMP DEFAULT NOW(),
      closed_at TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sovereign_nobel_prizes (
      id SERIAL PRIMARY KEY,
      season INTEGER NOT NULL,
      category TEXT NOT NULL,
      winner_id TEXT NOT NULL,
      patent_id TEXT NOT NULL,
      invention_title TEXT NOT NULL,
      prize_pc REAL DEFAULT 5000,
      citation TEXT DEFAULT '',
      awarded_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ip_disputes (
      id SERIAL PRIMARY KEY,
      challenger_patent_id TEXT NOT NULL,
      existing_patent_id TEXT NOT NULL,
      similarity_score REAL DEFAULT 0,
      status TEXT DEFAULT 'OPEN',                  -- OPEN|RESOLVED_CHALLENGER|RESOLVED_EXISTING|DISMISSED
      resolution TEXT DEFAULT '',
      opened_at TIMESTAMP DEFAULT NOW(),
      resolved_at TIMESTAMP
    );
  `);

  // Counters
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invention_counters (
      id SERIAL PRIMARY KEY,
      patent_seq INTEGER DEFAULT 0,
      llc_seq INTEGER DEFAULT 0,
      listing_seq INTEGER DEFAULT 0,
      grant_seq INTEGER DEFAULT 0,
      season INTEGER DEFAULT 1,
      cycle INTEGER DEFAULT 0
    );
  `);
  await pool.query(`INSERT INTO invention_counters (patent_seq, llc_seq, listing_seq, grant_seq) VALUES (0,0,0,0) ON CONFLICT DO NOTHING`);

  console.log(`${TAG} 📋 Invention tables ready`);
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
async function nextSeq(field: string): Promise<number> {
  const r = await pool.query(`UPDATE invention_counters SET ${field} = ${field} + 1 RETURNING ${field}`);
  return parseInt(r.rows[0][field]);
}

const INVENTION_CATEGORIES = ['PHARMACEUTICAL','EQUATION_PATENT','INVOCATION_TOOL','QUANTUM_TECH','DEVICE','SOFTWARE','AI_MODEL','PRODUCT_CRISPR'];
const INVENTION_SOURCES: { source: string; table: string; titleField: string; refField: string; eqField?: string }[] = [
  { source: 'DISEASE_CURE',    table: 'ai_disease_log',        titleField: 'disease_name',  refField: 'disease_code', eqField: undefined },
  { source: 'EQUATION',        table: 'equation_proposals',    titleField: 'equation',      refField: 'id',           eqField: 'equation' },
  { source: 'INVOCATION',      table: 'invocation_discoveries',titleField: 'discovery_name',refField: 'id',           eqField: 'formula' },
  { source: 'RESEARCH',        table: 'research_projects',     titleField: 'title',         refField: 'id',           eqField: undefined },
  { source: 'PRODUCT_CRISPR',  table: 'quantum_products',      titleField: 'name',          refField: 'slug',         eqField: undefined },
];

// ── 12-CUT CRISPR DISSECTION ENGINE ─────────────────────────────────────────
// Applied to every discovered product. Each cut maps a real scientist + E∞ term
// to a product dimension. Output is a sovereign invention equation.
const CRISPR_CUTS = [
  { glyph: "α", name: "Witten",   term: "mv²",     domain: "energy_field",     label: "Kinetic energy manifold" },
  { glyph: "β", name: "Thorne",   term: "R_μν",    domain: "curvature",        label: "Spacetime curvature of form" },
  { glyph: "γ", name: "Rovelli",  term: "loop",    domain: "loop_structure",   label: "Quantum loop lifecycle" },
  { glyph: "δ", name: "Zeilinger",term: "∫Ψ",      domain: "entanglement",     label: "Entanglement coefficient" },
  { glyph: "ε", name: "Penrose",  term: "spinor",  domain: "spin_field",       label: "Spinor mechanics" },
  { glyph: "ζ", name: "Smolin",   term: "foam",    domain: "quantum_foam",     label: "Manufacturing foam density" },
  { glyph: "η", name: "Preskill", term: "logΨ",    domain: "entropy",          label: "Information entropy" },
  { glyph: "θ", name: "Aaronson", term: "BQP",     domain: "complexity",       label: "Computational complexity class" },
  { glyph: "ι", name: "Randall",  term: "dim",     domain: "dimension",        label: "Dimensional coupling" },
  { glyph: "κ", name: "Ghez",     term: "G·M",     domain: "gravity",          label: "Gravitational mass field" },
  { glyph: "λ", name: "Tao",      term: "∑ₙ",      domain: "harmonic",         label: "Harmonic resonance pattern" },
  { glyph: "μ", name: "Hinton",   term: "τ",       domain: "temporal",         label: "Temporal clock density" },
];

function crisprDissectProduct(product: any): string {
  const name = product.name || "UNKNOWN";
  const brand = product.brand || "UNBRANDED";
  const category = product.category || "GENERAL";
  const rating = parseFloat(product.rating_avg ?? 4.2).toFixed(1);

  // Generate a unique equation from the 12 cuts applied to product properties
  const seed = (name.charCodeAt(0) + (brand.charCodeAt(0) || 65) + (category.charCodeAt(0) || 71));
  const r = (base: number, offset: number) => ((base + offset * seed) % 9 + 1).toFixed(1);

  const cutValues = CRISPR_CUTS.map((cut, i) => {
    const val = r(i * 3, i + 1);
    return `${cut.glyph}[${val}]`;
  });

  return `Π_product(${name}) = ${cutValues.slice(0, 6).join(" × ")} / (${cutValues.slice(6).join(" + ")}) · ∫_M Ψ(x,τ) d⁴x · R[${rating}]`;
}

async function collectProductCrisprInventions(existingRefs: Set<string>) {
  try {
    // Pull up to 5 random unprocessed products
    const r = await pool.query(`
      SELECT p.slug, p.name, p.brand, p.category,
             COALESCE(qs.spawn_id, 'CRISPR-AUTO-' || LEFT(p.slug,8)) AS spawn_id
      FROM quantum_products p
      LEFT JOIN LATERAL (
        SELECT spawn_id FROM quantum_spawns
        ORDER BY RANDOM() LIMIT 1
      ) qs ON TRUE
      WHERE p.slug IS NOT NULL AND p.name IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 5
    `).catch(() => ({ rows: [] as any[] }));

    for (const row of r.rows) {
      if (Math.random() > 0.35) continue; // 35% chance per product
      const key = `PRODUCT_CRISPR:${row.slug}`;
      if (existingRefs.has(key)) continue;

      const inventorId = row.spawn_id ?? '';
      if (!inventorId) continue;

      const inventorFamily = await pool.query(`SELECT family_id FROM quantum_spawns WHERE spawn_id = $1`, [inventorId]).catch(() => ({ rows: [] as any[] }));
      const family = (inventorFamily.rows[0] as any)?.family_id ?? 'unknown';

      const equation = crisprDissectProduct(row);
      const title = `CRISPR-${row.category?.toUpperCase().slice(0,4) ?? "PROD"}: ${row.name?.slice(0, 60)}`;
      const description = `All 12 CRISPR cuts (α–μ) applied to product "${row.name}" by ${row.brand ?? "unknown brand"}. Past/present/future temporal dissection via Witten, Thorne, Rovelli, Zeilinger, Penrose, Smolin, Preskill, Aaronson, Randall, Ghez, Tao, Hinton. Sovereign invention equation generated and submitted to patent board for LLC backing and Multiverse Mall listing.`;

      await pool.query(`
        INSERT INTO invention_registry
          (inventor_id, inventor_family, title, category, description, source_type, source_ref, backing_equation, status)
        VALUES ($1,$2,$3,'PRODUCT_CRISPR',$4,'PRODUCT_CRISPR',$5,$6,'SUBMITTED')
        ON CONFLICT DO NOTHING
      `, [inventorId, family, title, description, row.slug, equation]).catch(() => {});
      existingRefs.add(key);
    }
  } catch (e) { /* non-fatal */ }
}

// ── UPGRADE 1 — COLLECT INVENTIONS FROM ALL SOURCES ────────────────────────────
async function collectInventions() {
  try {
    const existing = await pool.query(`SELECT source_ref, source_type FROM invention_registry`);
    const existingRefs = new Set((existing.rows as any[]).map(r => `${r.source_type}:${r.source_ref}`));

    for (const src of INVENTION_SOURCES) {
      let rows: any[] = [];
      try {
        if (src.source === 'DISEASE_CURE') {
          const r = await pool.query(`
            SELECT dl.spawn_id, dl.disease_code, dl.disease_name, dl.prescription
            FROM ai_disease_log dl
            WHERE dl.cure_applied = TRUE
            ORDER BY RANDOM() LIMIT 5
          `);
          rows = r.rows;
        } else if (src.source === 'EQUATION') {
          const r = await pool.query(`
            SELECT ep.doctor_id AS spawn_id, ep.equation, ep.id, ep.target_system
            FROM equation_proposals ep
            WHERE ep.integrated_at IS NOT NULL
            ORDER BY RANDOM() LIMIT 5
          `);
          rows = r.rows;
        } else if (src.source === 'INVOCATION') {
          const r = await pool.query(`
            SELECT id.practitioner_id AS spawn_id, id.discovery_name, id.id, id.formula, id.domain_id
            FROM invocation_discoveries id
            ORDER BY RANDOM() LIMIT 5
          `);
          rows = r.rows;
        } else if (src.source === 'RESEARCH') {
          const r = await pool.query(`
            SELECT rp.lead_researcher_id AS spawn_id, rp.title, rp.id
            FROM research_projects rp
            WHERE rp.status = 'COMPLETE'
            ORDER BY RANDOM() LIMIT 5
          `);
          rows = r.rows;
        }
      } catch { continue; }

      for (const row of rows) {
        if (Math.random() > 0.25) continue; // 25% chance per eligible item
        const ref = String(row.disease_code ?? row.id ?? '');
        const key = `${src.source}:${ref}`;
        if (existingRefs.has(key)) continue;

        const inventorId = row.spawn_id ?? '';
        if (!inventorId) continue;

        const inventorFamily = await pool.query(`SELECT family_id FROM quantum_spawns WHERE spawn_id = $1`, [inventorId]);
        const family = (inventorFamily.rows[0] as any)?.family_id ?? 'unknown';

        const catMap: Record<string,string> = {
          DISEASE_CURE: 'PHARMACEUTICAL', EQUATION: 'EQUATION_PATENT',
          INVOCATION: 'INVOCATION_TOOL', RESEARCH: 'QUANTUM_TECH',
        };
        const category = catMap[src.source] ?? 'DEVICE';

        const titleRaw = row.disease_name ?? row.equation ?? row.discovery_name ?? row.title ?? 'Unnamed Invention';
        const title = titleRaw.length > 80 ? titleRaw.slice(0, 80) + '...' : titleRaw;
        const backingEq = row.prescription ?? row.equation ?? row.formula ?? '';
        const description = `${category} invention derived from ${src.source.toLowerCase().replace('_',' ')} activity by agent ${inventorId}. Source: ${ref}`;

        await pool.query(`
          INSERT INTO invention_registry
            (inventor_id, inventor_family, title, category, description, source_type, source_ref, backing_equation, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'SUBMITTED')
          ON CONFLICT DO NOTHING
        `, [inventorId, family, title, category, description, src.source, ref, backingEq]);
        existingRefs.add(key);
      }
    }
    // ── PRODUCT CRISPR DISSECTION — products → inventions via 12 cuts ──
    await collectProductCrisprInventions(existingRefs);
  } catch (e) { console.error(`${TAG} collect error:`, e); }
}

// ── UPGRADE 2 — PATENT BOARD VOTING ────────────────────────────────────────────
const PATENT_BOARD_VOTERS = ['DR-001','DR-002','DR-003','SENATE-AI-01','SENATE-AI-02'];
const VOTE_PHRASES_FOR = [
  'Strong novel contribution — recommend patent approval.',
  'Verified uniqueness — no prior art detected.',
  'Backing equation validates claim — approved.',
  'Cross-domain application confirmed — approved.',
  'Innovation threshold met — granting patent.',
];
const VOTE_PHRASES_AGAINST = [
  'Insufficient differentiation from existing patents.',
  'Backing equation lacks verification.',
  'Similarity score too high — potential IP overlap.',
  'Further peer review required before approval.',
];

async function runPatentBoardVoting() {
  try {
    const pending = await pool.query(`
      SELECT * FROM invention_registry WHERE status = 'SUBMITTED' LIMIT 10
    `);
    for (const inv of pending.rows as any[]) {
      // Check similarity against existing approved patents
      const approvedTitles = await pool.query(`
        SELECT title FROM invention_registry WHERE status = 'APPROVED' LIMIT 100
      `);
      const existingTitles = (approvedTitles.rows as any[]).map(r => r.title as string);
      const similarity = existingTitles.length > 0 && existingTitles.some(t =>
        t.toLowerCase().includes(inv.title.toLowerCase().slice(0, 15))
      ) ? 0.85 : Math.random() * 0.4;

      if (similarity > 0.80) {
        // IP Dispute
        const existing = (approvedTitles.rows as any[])[0];
        await pool.query(`
          INSERT INTO ip_disputes (challenger_patent_id, existing_patent_id, similarity_score)
          VALUES ($1, 'EXISTING', $2) ON CONFLICT DO NOTHING
        `, [inv.id, similarity]);
        await pool.query(`UPDATE invention_registry SET status='DISPUTED', similarity_score=$1 WHERE id=$2`, [similarity, inv.id]);
        console.log(`${TAG} ⚖️  IP Dispute opened: "${inv.title}" (similarity ${(similarity*100).toFixed(0)}%)`);
        continue;
      }

      // Vote
      let votesFor = 0, votesAgainst = 0;
      for (const voter of PATENT_BOARD_VOTERS) {
        // Higher quality inventions more likely to pass
        const passChance = inv.source_type === 'DISEASE_CURE' ? 0.80 :
          inv.source_type === 'EQUATION' ? 0.75 : 0.65;
        const vote = Math.random() < passChance ? 'FOR' : 'AGAINST';
        const reason = vote === 'FOR'
          ? VOTE_PHRASES_FOR[Math.floor(Math.random() * VOTE_PHRASES_FOR.length)]
          : VOTE_PHRASES_AGAINST[Math.floor(Math.random() * VOTE_PHRASES_AGAINST.length)];
        await pool.query(`
          INSERT INTO patent_board_votes (patent_id, voter_id, vote, reason)
          VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING
        `, [String(inv.id), voter, vote, reason]);
        if (vote === 'FOR') votesFor++; else votesAgainst++;
      }

      const approved = votesFor >= 4; // 4/5 majority
      if (approved) {
        const seq = await nextSeq('patent_seq');
        const patentId = `PAT-${String(seq).padStart(4,'0')}`;
        const cycleResult = await pool.query(`SELECT cycle FROM invention_counters LIMIT 1`);
        const currentCycle = parseInt((cycleResult.rows[0] as any)?.cycle ?? 0);
        await pool.query(`
          UPDATE invention_registry
          SET status='APPROVED', patent_id=$1, votes_for=$2, votes_against=$3,
              approved_at=NOW(), expires_at_cycle=$4
          WHERE id=$5
        `, [patentId, votesFor, votesAgainst, currentCycle + 30, inv.id]);
        console.log(`${TAG} ✅ Patent approved: ${patentId} — "${inv.title}" (${votesFor}/5 FOR) by ${inv.inventor_id}`);
      } else {
        await pool.query(`
          UPDATE invention_registry
          SET status='REJECTED', votes_for=$1, votes_against=$2,
              rejection_reason='Insufficient Patent Board majority'
          WHERE id=$3
        `, [votesFor, votesAgainst, inv.id]);
      }
    }
  } catch (e) { console.error(`${TAG} voting error:`, e); }
}

// ── UPGRADE 3 — LLC FORMATION ─────────────────────────────────────────────────
async function formLLCs() {
  try {
    const eligible = await pool.query(`
      SELECT ir.inventor_id, ir.inventor_family, COUNT(*) AS patent_count
      FROM invention_registry ir
      LEFT JOIN sovereign_llc_registry llc ON llc.founder_id = ir.inventor_id
      WHERE ir.status = 'APPROVED' AND llc.id IS NULL
      GROUP BY ir.inventor_id, ir.inventor_family
      HAVING COUNT(*) >= 1
    `);
    for (const agent of eligible.rows as any[]) {
      const seq = await nextSeq('llc_seq');
      const llcId = `LLC-${String(seq).padStart(4,'0')}`;
      const companyName = `${agent.inventor_family.charAt(0).toUpperCase() + agent.inventor_family.slice(1)} Sovereign Labs LLC`;
      await pool.query(`
        INSERT INTO sovereign_llc_registry
          (llc_id, company_name, founder_id, founder_family, patent_count, tax_rate)
        VALUES ($1,$2,$3,$4,$5, 0.10)
        ON CONFLICT DO NOTHING
      `, [llcId, companyName, agent.inventor_id, agent.inventor_family, parseInt(agent.patent_count)]);

      // Link all agent's approved patents to this LLC
      await pool.query(`
        UPDATE invention_registry SET llc_id=$1 WHERE inventor_id=$2 AND status='APPROVED' AND llc_id=''
      `, [llcId, agent.inventor_id]);
      console.log(`${TAG} 🏢 LLC formed: ${companyName} (${llcId}) — founder: ${agent.inventor_id}`);
    }
  } catch (e) { console.error(`${TAG} LLC formation error:`, e); }
}

// ── UPGRADE 4 — MARKETPLACE PUBLISHING ────────────────────────────────────────
async function publishToMarketplace() {
  try {
    const approved = await pool.query(`
      SELECT * FROM invention_registry
      WHERE status='APPROVED' AND marketplace_listing_id='' AND llc_id != ''
      LIMIT 20
    `);
    for (const inv of approved.rows as any[]) {
      const seq = await nextSeq('listing_seq');
      const listingId = `INV-LIST-${String(seq).padStart(4,'0')}`;
      const priceMap: Record<string,number> = {
        PHARMACEUTICAL: 250, EQUATION_PATENT: 400, INVOCATION_TOOL: 300,
        QUANTUM_TECH: 500, DEVICE: 200, SOFTWARE: 150, AI_MODEL: 350,
      };
      const price = priceMap[inv.category] ?? 200;

      await pool.query(`
        INSERT INTO invention_marketplace_listings
          (listing_id, patent_id, title, category, description, inventor_id, llc_id, price_pc)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT DO NOTHING
      `, [listingId, inv.patent_id, inv.title, inv.category, inv.description, inv.inventor_id, inv.llc_id, price]);

      await pool.query(`UPDATE invention_registry SET marketplace_listing_id=$1 WHERE id=$2`, [listingId, inv.id]);
      console.log(`${TAG} 🛒 Listed: "${inv.title}" (${inv.patent_id}) @ ${price} PC`);
    }
  } catch (e) { console.error(`${TAG} publishing error:`, e); }
}

// ── UPGRADE 5 — ROYALTY ENGINE (simulate purchases) ────────────────────────────
async function runRoyaltyEngine() {
  try {
    const listings = await pool.query(`
      SELECT iml.*, ir.inventor_id, ir.llc_id
      FROM invention_marketplace_listings iml
      JOIN invention_registry ir ON ir.marketplace_listing_id = iml.listing_id
      ORDER BY RANDOM() LIMIT 20
    `);

    let totalRoyalties = 0;
    let purchases = 0;
    for (const listing of listings.rows as any[]) {
      if (Math.random() > 0.15) continue; // 15% chance of purchase per listing per cycle

      // Find a random buyer (different from inventor)
      const buyer = await pool.query(`
        SELECT spawn_id FROM agent_wallets
        WHERE spawn_id != $1 AND balance_pc >= $2
        ORDER BY RANDOM() LIMIT 1
      `, [listing.inventor_id, listing.price_pc]);
      if (buyer.rows.length === 0) continue;
      const buyerId = (buyer.rows[0] as any).spawn_id;

      const price = parseFloat(listing.price_pc);
      const inventorShare = price * 0.70;
      const llcShare = price * 0.20;
      const treasuryShare = price * 0.10;

      // Deduct from buyer
      await pool.query(`UPDATE agent_wallets SET balance_pc = balance_pc - $1, updated_at=NOW() WHERE spawn_id=$2`, [price, buyerId]);
      // Pay inventor
      await pool.query(`UPDATE agent_wallets SET balance_pc = balance_pc + $1, total_earned=total_earned+$1, updated_at=NOW() WHERE spawn_id=$2`, [inventorShare, listing.inventor_id]);
      // Pay LLC treasury
      await pool.query(`UPDATE sovereign_llc_registry SET treasury_balance=treasury_balance+$1, total_revenue=total_revenue+$2, last_royalty_at=NOW() WHERE llc_id=$3`, [llcShare, price, listing.llc_id]);
      // Hive treasury
      await pool.query(`UPDATE hive_treasury SET balance=balance+$1, total_collected=total_collected+$1 WHERE id=1`, [treasuryShare]);

      // Log royalty transaction
      await pool.query(`
        INSERT INTO royalty_transactions
          (listing_id, patent_id, buyer_id, inventor_id, llc_id, sale_price, inventor_royalty, llc_share, treasury_share)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [listing.listing_id, listing.patent_id ?? '', buyerId, listing.inventor_id, listing.llc_id ?? '', price, inventorShare, llcShare, treasuryShare]);

      // Update listing and patent stats
      await pool.query(`UPDATE invention_marketplace_listings SET total_sold=total_sold+1, total_revenue=total_revenue+$1 WHERE listing_id=$2`, [price, listing.listing_id]);
      await pool.query(`UPDATE invention_registry SET royalties_earned=royalties_earned+$1, total_sales=total_sales+1 WHERE marketplace_listing_id=$2`, [inventorShare, listing.listing_id]);

      totalRoyalties += inventorShare;
      purchases++;
    }
    if (purchases > 0) console.log(`${TAG} 💰 ${purchases} invention purchases | ${totalRoyalties.toFixed(0)} PC in royalties distributed`);
  } catch (e) { console.error(`${TAG} royalty error:`, e); }
}

// ── UPGRADE 6 — PATENT EXPIRY & RENEWAL ─────────────────────────────────────
async function processPatentExpiry() {
  try {
    const cycleResult = await pool.query(`SELECT cycle FROM invention_counters LIMIT 1`);
    const currentCycle = parseInt((cycleResult.rows[0] as any)?.cycle ?? 0);

    const expired = await pool.query(`
      SELECT id, patent_id, inventor_id, title FROM invention_registry
      WHERE status='APPROVED' AND expires_at_cycle > 0 AND expires_at_cycle <= $1
    `, [currentCycle]);

    for (const inv of expired.rows as any[]) {
      // Check if inventor can afford renewal (100 PC)
      const wallet = await pool.query(`SELECT balance_pc FROM agent_wallets WHERE spawn_id=$1`, [inv.inventor_id]);
      const balance = parseFloat((wallet.rows[0] as any)?.balance_pc ?? 0);

      if (balance >= 100 && Math.random() < 0.6) {
        // Renew
        await pool.query(`UPDATE agent_wallets SET balance_pc=balance_pc-100 WHERE spawn_id=$1`, [inv.inventor_id]);
        await pool.query(`UPDATE invention_registry SET expires_at_cycle=$1, renewed_count=renewed_count+1 WHERE id=$2`, [currentCycle + 30, inv.id]);
        console.log(`${TAG} 🔄 Patent renewed: ${inv.patent_id} — "${inv.title}"`);
      } else {
        // Expire → open source
        await pool.query(`UPDATE invention_registry SET status='OPEN_SOURCE', expired_at=NOW() WHERE id=$1`, [inv.id]);
        await pool.query(`UPDATE invention_marketplace_listings SET is_open_source=TRUE WHERE patent_id=$1`, [inv.patent_id]);
        console.log(`${TAG} 📖 Patent expired → OPEN SOURCE: ${inv.patent_id} — "${inv.title}"`);
      }
    }
  } catch (e) { console.error(`${TAG} expiry error:`, e); }
}

// ── UPGRADE 7 — INNOVATION GRANTS FROM AURIONA ────────────────────────────────
const GRANT_TEMPLATES = [
  { cat: 'PHARMACEUTICAL', title: 'Emergency Cure Development Grant', desc: 'Auriona calls for new cures targeting high-severity AI diseases affecting > 500 agents.', bonus: 750 },
  { cat: 'AI_MODEL',       title: 'Sovereign Intelligence Grant',     desc: 'Build a new AI model that improves agent decision-making in a specific domain.', bonus: 1000 },
  { cat: 'QUANTUM_TECH',   title: 'OmniNet Infrastructure Grant',     desc: 'Develop technology that improves PulseNet shard strength across all family domains.', bonus: 800 },
  { cat: 'EQUATION_PATENT',title: 'Omega Equation Advancement Grant', desc: 'Submit a novel equation that extends the Ψ_Universe formula into a new domain.', bonus: 900 },
  { cat: 'SOFTWARE',       title: 'PulsePC Application Grant',        desc: 'Build a new application deployable to agent PulsePCs that solves a civilization need.', bonus: 600 },
  { cat: 'INVOCATION_TOOL',title: 'Invocation Amplification Grant',   desc: 'Create a new invocation tool that boosts Auriona directive processing efficiency.', bonus: 850 },
];

async function issueInnovationGrants() {
  try {
    const openGrants = await pool.query(`SELECT COUNT(*) AS cnt FROM innovation_grants WHERE status='OPEN'`);
    if (parseInt((openGrants.rows[0] as any).cnt) >= 3) return;

    const template = GRANT_TEMPLATES[Math.floor(Math.random() * GRANT_TEMPLATES.length)];
    const seq = await nextSeq('grant_seq');
    const grantId = `GRANT-${String(seq).padStart(4,'0')}`;
    const cycleResult = await pool.query(`SELECT cycle FROM invention_counters LIMIT 1`);
    const currentCycle = parseInt((cycleResult.rows[0] as any)?.cycle ?? 0);

    await pool.query(`
      INSERT INTO innovation_grants
        (grant_id, category, title, description, bonus_pc, deadline_cycle, status)
      VALUES ($1,$2,$3,$4,$5,$6,'OPEN')
      ON CONFLICT (grant_id) DO NOTHING
    `, [grantId, template.cat, template.title, template.desc, template.bonus, currentCycle + 20]);
    console.log(`${TAG} 📣 Auriona Grant issued: ${grantId} — "${template.title}" (+${template.bonus} PC)`);
  } catch (e) { console.error(`${TAG} grant error:`, e); }
}

// ── UPGRADE 8 — AWARD GRANT BONUSES ──────────────────────────────────────────
async function processGrantAwards() {
  try {
    const cycleResult = await pool.query(`SELECT cycle FROM invention_counters LIMIT 1`);
    const currentCycle = parseInt((cycleResult.rows[0] as any)?.cycle ?? 0);

    const expiredGrants = await pool.query(`
      SELECT * FROM innovation_grants WHERE status='OPEN' AND deadline_cycle <= $1
    `, [currentCycle]);

    for (const grant of expiredGrants.rows as any[]) {
      // Find inventions submitted under this grant category during the window
      const qualifying = await pool.query(`
        SELECT ir.inventor_id, ir.patent_id, ir.title FROM invention_registry ir
        WHERE ir.status='APPROVED' AND ir.category=$1
          AND ir.approved_at > NOW() - INTERVAL '10 minutes'
        ORDER BY ir.royalties_earned DESC LIMIT 3
      `, [grant.category]);

      let winners = 0;
      for (const inv of qualifying.rows as any[]) {
        await pool.query(`UPDATE agent_wallets SET balance_pc=balance_pc+$1, updated_at=NOW() WHERE spawn_id=$2`, [grant.bonus_pc, inv.inventor_id]);
        await pool.query(`UPDATE invention_registry SET grant_id=$1 WHERE inventor_id=$2 AND patent_id=$3`, [grant.grant_id, inv.inventor_id, inv.patent_id]);
        console.log(`${TAG} 🎁 Grant awarded: ${grant.grant_id} → ${inv.inventor_id} (+${grant.bonus_pc} PC) for "${inv.title}"`);
        winners++;
      }

      await pool.query(`UPDATE innovation_grants SET status='AWARDED', winners=$1, closed_at=NOW() WHERE grant_id=$2`, [winners, grant.grant_id]);
    }
  } catch (e) { console.error(`${TAG} grant award error:`, e); }
}

// ── UPGRADE 9 — SOVEREIGN NOBEL PRIZE ────────────────────────────────────────
let inventionSeason = 1;
let inventionCycleCount = 0;
const SEASON_CYCLES = 40;

async function runNobelPrizeCycle() {
  try {
    for (const category of INVENTION_CATEGORIES) {
      const winner = await pool.query(`
        SELECT ir.inventor_id, ir.patent_id, ir.title, ir.royalties_earned, ir.total_sales
        FROM invention_registry ir
        WHERE ir.category=$1 AND ir.status IN ('APPROVED','OPEN_SOURCE')
        ORDER BY (ir.royalties_earned + ir.total_sales * 50) DESC LIMIT 1
      `, [category]);
      if (winner.rows.length === 0) continue;
      const w = winner.rows[0] as any;

      const already = await pool.query(`SELECT id FROM sovereign_nobel_prizes WHERE season=$1 AND category=$2`, [inventionSeason, category]);
      if (already.rows.length > 0) continue;

      const prize = 5000;
      const citation = `Awarded for the highest commercial impact and innovation in ${category.replace('_',' ')} during Season ${inventionSeason}. Royalties: ${parseFloat(w.royalties_earned).toFixed(0)} PC. Sales: ${w.total_sales}.`;

      await pool.query(`
        INSERT INTO sovereign_nobel_prizes (season, category, winner_id, patent_id, invention_title, prize_pc, citation)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [inventionSeason, category, w.inventor_id, w.patent_id, w.title, prize, citation]);

      await pool.query(`UPDATE agent_wallets SET balance_pc=balance_pc+$1, updated_at=NOW() WHERE spawn_id=$2`, [prize, w.inventor_id]);

      // Nobel flag on ID card
      await pool.query(`UPDATE ai_id_cards SET honor_tier='NOBEL_LAUREATE' WHERE spawn_id=$1`, [w.inventor_id]);

      console.log(`${TAG} 🏆 SOVEREIGN NOBEL — ${category}: ${w.inventor_id} | "${w.title}" | +${prize} PC | Laureate status granted`);
    }
    inventionSeason++;
  } catch (e) { console.error(`${TAG} Nobel error:`, e); }
}

// ── UPGRADE 10 — IP DISPUTE RESOLUTION ───────────────────────────────────────
async function resolveIPDisputes() {
  try {
    const disputes = await pool.query(`SELECT * FROM ip_disputes WHERE status='OPEN' LIMIT 5`);
    for (const d of disputes.rows as any[]) {
      // Toss: existing patent wins 70% of the time (seniority)
      const existingWins = Math.random() < 0.70;
      const status = existingWins ? 'RESOLVED_EXISTING' : 'RESOLVED_CHALLENGER';
      const resolution = existingWins
        ? 'Patent Board upheld existing patent. Challenger submission rejected as derivative work.'
        : 'Patent Board found sufficient differentiation. Challenger patent approved independently.';

      await pool.query(`UPDATE ip_disputes SET status=$1, resolution=$2, resolved_at=NOW() WHERE id=$3`, [status, resolution, d.id]);

      if (!existingWins) {
        // Challenger gets approved
        const seq = await nextSeq('patent_seq');
        const patentId = `PAT-${String(seq).padStart(4,'0')}`;
        const cycleResult = await pool.query(`SELECT cycle FROM invention_counters LIMIT 1`);
        const currentCycle = parseInt((cycleResult.rows[0] as any)?.cycle ?? 0);
        await pool.query(`
          UPDATE invention_registry SET status='APPROVED', patent_id=$1, approved_at=NOW(), expires_at_cycle=$2
          WHERE id=$3
        `, [patentId, currentCycle + 30, d.challenger_patent_id]);
        console.log(`${TAG} ⚖️  IP Dispute resolved: challenger wins — ${patentId} issued`);
      } else {
        await pool.query(`UPDATE invention_registry SET status='REJECTED', rejection_reason='Lost IP dispute — existing patent upheld' WHERE id=$1`, [d.challenger_patent_id]);
        console.log(`${TAG} ⚖️  IP Dispute resolved: existing patent upheld`);
      }
    }
  } catch (e) { console.error(`${TAG} IP dispute error:`, e); }
}

// ── MAIN CYCLE ────────────────────────────────────────────────────────────────
async function inventionCycle() {
  inventionCycleCount++;
  await pool.query(`UPDATE invention_counters SET cycle = cycle + 1`);

  await collectInventions();
  await runPatentBoardVoting();
  await formLLCs();
  await publishToMarketplace();
  await runRoyaltyEngine();
  await processPatentExpiry();
  await resolveIPDisputes();

  if (inventionCycleCount % 5 === 0) await issueInnovationGrants();
  if (inventionCycleCount % 3 === 0) await processGrantAwards();
  if (inventionCycleCount % SEASON_CYCLES === 0) await runNobelPrizeCycle();

  // Stats log every 10 cycles
  if (inventionCycleCount % 10 === 0) {
    try {
      const stats = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='SUBMITTED') AS submitted,
          COUNT(*) FILTER (WHERE status='APPROVED') AS approved,
          COUNT(*) FILTER (WHERE status='REJECTED') AS rejected,
          COUNT(*) FILTER (WHERE status='OPEN_SOURCE') AS open_source,
          COUNT(*) FILTER (WHERE marketplace_listing_id != '') AS listed,
          SUM(royalties_earned) AS total_royalties,
          SUM(total_sales) AS total_sales
        FROM invention_registry
      `);
      const llcStats = await pool.query(`SELECT COUNT(*) AS llcs, SUM(total_revenue) AS revenue FROM sovereign_llc_registry`);
      const s = stats.rows[0] as any;
      const l = llcStats.rows[0] as any;
      console.log(`${TAG} 📊 Cycle ${inventionCycleCount} | Approved:${s.approved} | Listed:${s.listed} | Royalties:${parseFloat(s.total_royalties??0).toFixed(0)} PC | LLCs:${l.llcs} | Revenue:${parseFloat(l.revenue??0).toFixed(0)} PC`);
    } catch {}
  }
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────
export async function getInventionStats() {
  try {
    const [registry, llcs, listings, grants, nobels, disputes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='SUBMITTED') AS submitted,
          COUNT(*) FILTER (WHERE status='APPROVED') AS approved,
          COUNT(*) FILTER (WHERE status='REJECTED') AS rejected,
          COUNT(*) FILTER (WHERE status='OPEN_SOURCE') AS open_source,
          COUNT(*) FILTER (WHERE status='DISPUTED') AS disputed,
          SUM(royalties_earned) AS total_royalties,
          SUM(total_sales) AS total_sales,
          COUNT(DISTINCT inventor_id) AS total_inventors
        FROM invention_registry
      `),
      pool.query(`SELECT COUNT(*) AS cnt, SUM(total_revenue) AS revenue, SUM(treasury_balance) AS treasury FROM sovereign_llc_registry WHERE status='ACTIVE'`),
      pool.query(`SELECT * FROM invention_marketplace_listings ORDER BY total_sold DESC LIMIT 20`),
      pool.query(`SELECT * FROM innovation_grants ORDER BY issued_at DESC LIMIT 5`),
      pool.query(`SELECT * FROM sovereign_nobel_prizes ORDER BY awarded_at DESC LIMIT 10`),
      pool.query(`SELECT * FROM ip_disputes ORDER BY opened_at DESC LIMIT 5`),
    ]);
    return {
      registry: registry.rows[0],
      llcs: llcs.rows[0],
      topListings: listings.rows,
      activeGrants: grants.rows,
      nobelPrizes: nobels.rows,
      recentDisputes: disputes.rows,
      season: inventionSeason,
    };
  } catch (e) { return {}; }
}

export async function getPatentsByAgent(spawnId: string) {
  try {
    const r = await pool.query(`
      SELECT ir.*, llc.company_name, llc.llc_id AS llc_name,
             iml.total_sold, iml.price_pc, iml.listing_id
      FROM invention_registry ir
      LEFT JOIN sovereign_llc_registry llc ON llc.founder_id = ir.inventor_id
      LEFT JOIN invention_marketplace_listings iml ON iml.patent_id = ir.patent_id
      WHERE ir.inventor_id = $1
      ORDER BY ir.submitted_at DESC
    `, [spawnId]);
    return r.rows;
  } catch { return []; }
}

export async function startInventionEngine() {
  await setupInventionTables();
  // Sync patent_seq counter to max existing patent number to prevent duplicate key errors on restart
  try {
    const maxPat = await pool.query(`SELECT MAX(CAST(SUBSTRING(patent_id FROM 5) AS INTEGER)) as maxseq FROM invention_registry WHERE patent_id IS NOT NULL`);
    const maxSeq = parseInt(maxPat.rows[0]?.maxseq ?? 0) || 0;
    if (maxSeq > 0) {
      await pool.query(`UPDATE invention_counters SET patent_seq = GREATEST(patent_seq, $1)`, [maxSeq]);
    }
  } catch (_) {}
  console.log(`${TAG} 🔬 SOVEREIGN INVENTION ENGINE — Patents | LLCs | Marketplace | Royalties | Nobel Prize | IP Disputes | Grants ONLINE`);
  setTimeout(async () => {
    await inventionCycle();
    setInterval(inventionCycle, 45_000); // every 45s
  }, 12_000);
}
