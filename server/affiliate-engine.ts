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
    `\n💼 [Join our Affiliate Network](${buildAffiliateProgramDBLink()})`,
    `\n---`,
  ].join("\n");
  return text + block;
}

export function getAffiliateStatus() {
  return {
    amazon: { connected: !!AMAZON_TAG, tag: AMAZON_TAG },
    ebay: { connected: !!EBAY_CAMPAIGN, campaignId: EBAY_CAMPAIGN },
    aliexpress: { connected: !!ALIEXPRESS_APP_KEY, appKey: ALIEXPRESS_APP_KEY },
    affiliatedb: { connected: !!AFFILIATEDB_REF, ref: AFFILIATEDB_REF },
  };
}
