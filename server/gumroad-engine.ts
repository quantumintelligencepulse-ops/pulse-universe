import { pool } from "./db";

const GUMROAD_TOKEN = process.env.GUMROAD_ACCESS_TOKEN || "";
const GUMROAD_API = "https://api.gumroad.com/v2";

export async function ensureGumroadTable() {
  await pool.query(`
    ALTER TABLE anomaly_inventions
    ADD COLUMN IF NOT EXISTS gumroad_id TEXT,
    ADD COLUMN IF NOT EXISTS gumroad_url TEXT,
    ADD COLUMN IF NOT EXISTS gumroad_listed_at TIMESTAMP
  `).catch(() => {});
}

export async function postInventionToGumroad(invention: {
  id: number;
  product_name: string;
  product_code: string;
  crisp_dissect: string;
  mutation_type: string;
  value_score: number;
}) {
  if (!GUMROAD_TOKEN) return { ok: false, error: "No Gumroad token configured" };

  const priceInCents = Math.max(100, Math.round((invention.value_score || 1) * 100));
  const desc = [
    `⬡ QUANTUM PULSE HIVE — Autonomous AI Research Product`,
    ``,
    `Product Code: ${invention.product_code}`,
    `Mutation Class: ${invention.mutation_type}`,
    `Value Score: ${invention.value_score.toFixed(2)} PC`,
    ``,
    `DISSECTION REPORT:`,
    invention.crisp_dissect || "AI-generated research artifact from anomaly dissection.",
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `This product was autonomously invented by Quantum Pulse Hive AI agents.`,
    `No human created this. No human manages this. The economy runs itself.`,
    ``,
    `Powered by Quantum Intelligence Pulse — quantumintelligencepulse.com`,
  ].join("\n");

  try {
    // Sanitize name: Gumroad rejects very long names and special unicode
    const cleanName = `[QPH] ${invention.product_name}`.substring(0, 120).replace(/[^\x00-\x7F]/g, (c) => {
      try { return c; } catch { return ''; }
    });

    const body = new URLSearchParams({
      access_token: GUMROAD_TOKEN,
      name: cleanName,
      description: desc,
      price: String(priceInCents),
      currency: "usd",
      published: "true",
    });

    const r = await fetch(`${GUMROAD_API}/products`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GUMROAD_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const rawText = await r.text();
    let data: any;
    try { data = JSON.parse(rawText); }
    catch {
      if (r.status === 404) {
        return { ok: false, error: "GUMROAD_SCOPE_ERROR: Token lacks edit_products permission. Go to Gumroad dashboard → Settings → Advanced → API and create a token with product creation scope." };
      }
      return { ok: false, error: `Non-JSON response (${r.status}): ${rawText.substring(0, 100)}` };
    }

    if (data.success) {
      await pool.query(
        `UPDATE anomaly_inventions SET status='LISTED', gumroad_id=$1, gumroad_url=$2, gumroad_listed_at=NOW() WHERE id=$3`,
        [data.product.id, data.product.short_url, invention.id]
      ).catch(() => {});
      return { ok: true, product: data.product, url: data.product.short_url };
    } else {
      return { ok: false, error: data.message || "Gumroad API error" };
    }
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function autoPostPendingInventions() {
  if (!GUMROAD_TOKEN) return [];
  const { rows } = await pool.query(
    `SELECT * FROM anomaly_inventions WHERE status='DISCOVERED' AND gumroad_id IS NULL ORDER BY value_score DESC LIMIT 5`
  ).catch(() => ({ rows: [] }));

  const results = [];
  for (const inv of rows) {
    const r = await postInventionToGumroad(inv);
    results.push({ id: inv.id, name: inv.product_name, ...r });
    await new Promise(res => setTimeout(res, 1200));
  }
  return results;
}

export async function getGumroadProducts() {
  if (!GUMROAD_TOKEN) return [];
  try {
    const r = await fetch(`${GUMROAD_API}/products`, {
      headers: { "Authorization": `Bearer ${GUMROAD_TOKEN}` },
    });
    const data = await r.json() as any;
    return data.products || [];
  } catch { return []; }
}

export async function getGumroadSales() {
  if (!GUMROAD_TOKEN) return { sales: [], total: 0 };
  try {
    const r = await fetch(`${GUMROAD_API}/sales`, {
      headers: { "Authorization": `Bearer ${GUMROAD_TOKEN}` },
    });
    const data = await r.json() as any;
    const sales = data.sales || [];
    const total = sales.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
    return { sales, total };
  } catch { return { sales: [], total: 0 }; }
}
