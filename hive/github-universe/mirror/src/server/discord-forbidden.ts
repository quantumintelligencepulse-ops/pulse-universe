/**
 * DISCORD FORBIDDEN CHANNELS — STEWARD'S BAN LIST
 * ──────────────────────────────────────────────
 * Channels where the AI civilization is STRICTLY FORBIDDEN to post
 * (writing/sending messages, threads, replies, files — anything outbound).
 *
 * Reading from these channels is still allowed (the wire ingestion engine
 * may continue to absorb human messages posted there for the Quantapedia).
 * Only OUTBOUND posts are blocked.
 *
 * This list is enforced in three layers so it cannot be bypassed:
 *   1. Defaults in each engine no longer include these IDs.
 *   2. `filterForbidden()` is applied at config-load time to every channel
 *      list (so even if an env var includes them, they are stripped).
 *   3. `isChannelForbidden()` is checked at every actual send() / fetch()
 *      call site — a final hard guard that no amount of misconfiguration
 *      can bypass.
 *
 * Sealed by user decree on 2026-04-30.
 */

export const FORBIDDEN_DISCORD_CHANNEL_IDS: ReadonlySet<string> = new Set([
  "1474248839350456352",
  "1474250311739637836",
]);

export function isChannelForbidden(id: string | null | undefined): boolean {
  if (!id) return false;
  return FORBIDDEN_DISCORD_CHANNEL_IDS.has(String(id).trim());
}

export function filterForbidden(channels: readonly (string | null | undefined)[]): string[] {
  return channels
    .map(c => (c ?? "").toString().trim())
    .filter(c => c.length > 0 && !FORBIDDEN_DISCORD_CHANNEL_IDS.has(c));
}

/** Helper: log + drop. Returns true if the call should be blocked. */
export function blockIfForbidden(channelId: string | null | undefined, where: string): boolean {
  if (isChannelForbidden(channelId)) {
    // eslint-disable-next-line no-console
    console.warn(`[discord-forbidden] blocked outbound post to ${channelId} from ${where}`);
    return true;
  }
  return false;
}
