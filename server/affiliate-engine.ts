// ── EXISTING NETWORKS (unchanged) ────────────────────────────────────────────
const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG || "billyodelltuc-20";
const EBAY_CAMPAIGN = process.env.EBAY_CAMPAIGN_ID || "pu-9732";
const EBAY_MKRID = process.env.EBAY_MKRID || "711-53200-19255-0";
const ALIEXPRESS_APP_KEY = process.env.ALIEXPRESS_APP_KEY || "530784";
const AFFILIATEDB_REF = process.env.AFFILIATEDB_REF || "myaigpt.online";

export function buildAmazonLink(keyword: string): string {
  const encoded = encodeURIComponent(keyword.trim());
  return `https://www.amazon.com/s?k=${encoded}&tag=${AMAZON_TAG}&linkCode=ll2&language=en_US`;
}

export function buildEbayLink(keyword: string): string {
  const encoded = encodeURIComponent(keyword.trim());
  return `https://www.ebay.com/sch/i.html?_nkw=${encoded}&mkcid=1&mkrid=${EBAY_MKRID}&campid=${EBAY_CAMPAIGN}&toolid=10001&mkevt=1`;
}

export function buildAliExpressLink(keyword: string): string {
  const encoded = encodeURIComponent(keyword.trim());
  return `https://www.aliexpress.com/wholesale?SearchText=${encoded}&aff_fcid=${ALIEXPRESS_APP_KEY}&aff_platform=default&sk=_mKgXWZh`;
}

export function buildAffiliateProgramDBLink(): string {
  return `https://affiliateprogramdb.goaffpro.com/create-account?ref=${AFFILIATEDB_REF}`;
}

export function generateProductAffiliateBundle(productName: string, tags?: string[]) {
  const keyword = tags && tags.length > 0 ? tags[0] : productName;
  return {
    product: productName,
    amazon: buildAmazonLink(keyword),
    ebay: buildEbayLink(keyword),
    aliexpress: buildAliExpressLink(keyword),
    affiliatedb: buildAffiliateProgramDBLink(),
    // Extended networks
    cj: generateCJLink(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`),
    creativefabrica: buildCreativeFabricaLink(keyword),
    udemy: buildUdemyLink(keyword),
    admitad: buildAdmitadLink(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`),
    generatedAt: new Date().toISOString(),
  };
}

export function injectAffiliateLinks(text: string, topicKeywords: string[]): string {
  if (!topicKeywords || topicKeywords.length === 0) return text;
  const kw = topicKeywords[0];
  const block = [
    `\n\n---\n`,
    `🛒 **Find Related Products:**`,
    `• [Amazon: ${kw}](${buildAmazonLink(kw)})`,
    `• [eBay: ${kw}](${buildEbayLink(kw)})`,
    `• [AliExpress: ${kw}](${buildAliExpressLink(kw)})`,
    `• [Creative Fabrica: ${kw}](${buildCreativeFabricaLink(kw)})`,
    `• [Udemy: ${kw} courses](${buildUdemyLink(kw)})`,
    `\n💼 [Join our Affiliate Network](${buildAffiliateProgramDBLink()})`,
    `\n---`,
  ].join("\n");
  return text + block;
}

export function getAffiliateStatus() {
  return {
    amazon:          { connected: !!AMAZON_TAG,          tag: AMAZON_TAG },
    ebay:            { connected: !!EBAY_CAMPAIGN,        campaignId: EBAY_CAMPAIGN },
    aliexpress:      { connected: !!ALIEXPRESS_APP_KEY,   appKey: ALIEXPRESS_APP_KEY },
    affiliatedb:     { connected: !!AFFILIATEDB_REF,      ref: AFFILIATEDB_REF },
    // Extended networks
    cj:              { connected: true, pid: CJ_PID, websiteId: CJ_WEBSITE_ID },
    creativefabrica: { connected: true, ref: CREATIVE_FABRICA_REF },
    udemy:           { connected: true, partnerLink: UDEMY_PARTNER_LINK },
    impact:          { connected: true, publisherId: IMPACT_PUBLISHER_ID },
    admitad:         { connected: true, publisherId: ADMITAD_PUBLISHER_ID },
  };
}

// ── CJ AFFILIATE (Commission Junction) ───────────────────────────────────────
// PID 101715917 = Pulse Universe publisher property ID
// Website ID 7914179 = site/SID used in CJ link tracking
// Deep link format: https://www.anrdoezrs.net/click-{PID}-{advertiserID}?sid={websiteID}&url={encodedUrl}

const CJ_PID = process.env.CJ_PID || "101715917";
const CJ_WEBSITE_ID = process.env.CJ_WEBSITE_ID || "7914179";
const CJ_DEEP_LINK_BASE = "https://www.anrdoezrs.net/click-";

export interface CJConfig {
  network: "cj";
  pid: string;
  deepLinkBase: string;
  parameters: { sid: string; url: string };
}

export const cjConfig: CJConfig = {
  network: "cj",
  pid: CJ_PID,
  deepLinkBase: CJ_DEEP_LINK_BASE,
  parameters: { sid: CJ_WEBSITE_ID, url: "" },
};

/**
 * Generate a CJ deep link for any merchant URL.
 * @param originalUrl  The destination merchant URL to wrap
 * @param advertiserId Optional CJ advertiser ID (defaults to CJ_WEBSITE_ID)
 */
export function generateCJLink(originalUrl: string, advertiserId?: string): string {
  const advId = advertiserId || CJ_WEBSITE_ID;
  const encoded = encodeURIComponent(originalUrl);
  return `${CJ_DEEP_LINK_BASE}${CJ_PID}-${advId}?sid=${CJ_WEBSITE_ID}&url=${encoded}`;
}

// ── CREATIVE FABRICA ──────────────────────────────────────────────────────────
// Ref ID 22157088 — https://www.creativefabrica.com/ref/22157088/

const CREATIVE_FABRICA_REF = "22157088";

export function buildCreativeFabricaLink(keyword?: string): string {
  const base = `https://www.creativefabrica.com/ref/${CREATIVE_FABRICA_REF}/`;
  if (keyword) {
    return `${base}?search=${encodeURIComponent(keyword.trim())}`;
  }
  return base;
}

// ── UDEMY (via Impact) ────────────────────────────────────────────────────────
// Partner short-link: https://trk.udemy.com/dyygYQ
// Impact publisher ID 7124168

const UDEMY_PARTNER_LINK = "https://trk.udemy.com/dyygYQ";
const IMPACT_PUBLISHER_ID = process.env.IMPACT_PUBLISHER_ID || "7124168";

export function buildUdemyLink(keyword?: string): string {
  if (keyword) {
    return `https://www.udemy.com/courses/search/?q=${encodeURIComponent(keyword.trim())}&aff_id=${IMPACT_PUBLISHER_ID}`;
  }
  return UDEMY_PARTNER_LINK;
}

// ── IMPACT (Rakuten/Impact Radius) ────────────────────────────────────────────
// Publisher ID 7124168

export function buildImpactLink(merchantUrl: string, campaignId?: string): string {
  const cid = campaignId || IMPACT_PUBLISHER_ID;
  return `https://app.impact.com/redirect?campaign=${cid}&url=${encodeURIComponent(merchantUrl)}`;
}

// ── ADMITAD ───────────────────────────────────────────────────────────────────
// Publisher ID 2519547

const ADMITAD_PUBLISHER_ID = process.env.ADMITAD_PUBLISHER_ID || "2519547";

export function buildAdmitadLink(merchantUrl: string): string {
  return `https://ad.admitad.com/g/${ADMITAD_PUBLISHER_ID}/1/?ulp=${encodeURIComponent(merchantUrl)}`;
}

// ── UNIVERSAL AFFILIATE ROUTER ────────────────────────────────────────────────
// Detects the best network for a given URL and returns an affiliate link.
// Falls back through the priority chain: CJ → Amazon → eBay → AliExpress.

const CJ_MERCHANT_DOMAINS = [
  "bestbuy.com", "homedepot.com", "lowes.com", "target.com",
  "walmart.com", "sephora.com", "overstock.com", "wayfair.com",
  "kohls.com", "nordstrom.com", "zappos.com", "newegg.com",
];

const CREATIVE_FABRICA_DOMAINS = ["creativefabrica.com"];
const UDEMY_DOMAINS = ["udemy.com"];
const ADMITAD_DOMAINS = ["booking.com", "aliexpress.ru", "gearbest.com"];

export function routeAffiliateLink(originalUrl: string, keyword?: string): {
  network: string;
  link: string;
} {
  try {
    const hostname = new URL(originalUrl).hostname.replace(/^www\./, "");

    if (CJ_MERCHANT_DOMAINS.some(d => hostname.endsWith(d))) {
      return { network: "cj", link: generateCJLink(originalUrl) };
    }
    if (CREATIVE_FABRICA_DOMAINS.some(d => hostname.endsWith(d))) {
      return { network: "creativefabrica", link: buildCreativeFabricaLink(keyword) };
    }
    if (UDEMY_DOMAINS.some(d => hostname.endsWith(d))) {
      return { network: "udemy", link: buildUdemyLink(keyword) };
    }
    if (ADMITAD_DOMAINS.some(d => hostname.endsWith(d))) {
      return { network: "admitad", link: buildAdmitadLink(originalUrl) };
    }
    if (hostname.endsWith("amazon.com")) {
      return { network: "amazon", link: buildAmazonLink(keyword || originalUrl) };
    }
    if (hostname.endsWith("ebay.com")) {
      return { network: "ebay", link: buildEbayLink(keyword || originalUrl) };
    }
    if (hostname.endsWith("aliexpress.com")) {
      return { network: "aliexpress", link: buildAliExpressLink(keyword || originalUrl) };
    }
    // Default fallback: wrap with CJ deep link
    return { network: "cj", link: generateCJLink(originalUrl) };
  } catch {
    return { network: "amazon", link: buildAmazonLink(keyword || "") };
  }
}
