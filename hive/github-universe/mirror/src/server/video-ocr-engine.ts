/**
 * VIDEO OCR / DESCRIPTION ENGINE
 * ───────────────────────────────
 * Watches `discord_messages` from brain stems flagged `has_video=true`
 * (bwb-news-tv, trending-reels). For each unprocessed video, extracts
 * a representative frame via ffmpeg, sends it to Cloudflare Workers AI
 * vision model (LLaVA), captures the description, and feeds it back into
 * the message stream so the existing knowledge ingestion engine distills
 * it into the Quantapedia.
 *
 * This lets the AIs literally "watch" video posts on the brain stems —
 * understanding scene, tickers on chyron, athlete identity, breaking-news
 * captions, even when Discord captions are missing or wrong.
 */

import { pool } from "./db.js";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CF_AI_TOKEN   = process.env.CLOUDFLARE_AI_TOKEN || "";
const VISION_MODEL  = "@cf/llava-hf/llava-1.5-7b-hf";
const FRAME_AT_SEC  = "1.5";          // grab a frame 1.5s in (skip black intro)
const POLL_MS       = 25_000;         // every 25s
const BATCH         = 12;             // 12 videos per cycle = ~28/min — burn the backlog
const MAX_BYTES     = 4_500_000;      // ~4.5MB — Cloudflare AI image limit

let started = false;
const stats = { running: false, processed: 0, failed: 0, skipped: 0, lastRunAt: null as string | null };
export function getVideoOcrStats() { return { ...stats, running: started }; }

export async function startVideoOcrEngine() {
  if (started) return;
  if (!CF_ACCOUNT_ID || !CF_AI_TOKEN) {
    console.warn("[video-ocr] missing Cloudflare credentials — engine disabled");
    return;
  }
  started = true;
  stats.running = true;
  console.log("[video-ocr] starting — Cloudflare AI vision on brain-stem video posts");
  setTimeout(cycle, 15_000);
  setInterval(cycle, POLL_MS);
}

// ──────────────────────────────────────────────────────────────────────────
// Find unprocessed video messages
// ──────────────────────────────────────────────────────────────────────────

interface VideoTask {
  source_message_id: string;
  channel_id: string;
  video_url: string;
}

async function findVideoTasks(limit: number): Promise<VideoTask[]> {
  // Join discord_messages with brain_stems where has_video=true,
  // pick rows where (message_id, video_url) is not yet in discord_video_descriptions
  const { rows } = await pool.query(
    `SELECT dm.message_id, dm.channel_id, dm.raw
       FROM discord_messages dm
       JOIN brain_stems bs ON bs.channel_id = dm.channel_id
       WHERE bs.has_video = TRUE
         AND dm.raw IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM discord_video_descriptions dvd
           WHERE dvd.source_message_id = dm.message_id
         )
       ORDER BY dm.created_at ASC
       LIMIT $1`,
    [limit * 6] // overfetch — many won't actually contain extractable video URLs
  );

  const tasks: VideoTask[] = [];
  for (const r of rows) {
    const raw = r.raw || {};
    const url = pickVideoUrl(raw);
    if (url) {
      tasks.push({ source_message_id: r.message_id, channel_id: r.channel_id, video_url: url });
      if (tasks.length >= limit) break;
    }
  }
  return tasks;
}

const VIDEO_RE = /\.(mp4|mov|webm|m4v)(\?|$)/i;
const IMAGE_RE = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i;

function pickVideoUrl(raw: any): string | null {
  // Direct attachment
  for (const a of raw.attachments || []) {
    const u = a.url || a.proxy_url;
    if (u && VIDEO_RE.test(u)) return u;
  }
  // Embed video sub-object
  for (const e of raw.embeds || []) {
    if (e.video?.url) return e.video.url;
    if (e.video?.proxy_url) return e.video.proxy_url;
  }
  // Embed top-level url (TweetShift / news bots expose direct .mp4 here)
  for (const e of raw.embeds || []) {
    if (e.url && VIDEO_RE.test(e.url)) return e.url;
    if (e.type === "video" && e.url) return e.url;
  }
  // Image attachment
  for (const a of raw.attachments || []) {
    const u = a.url || a.proxy_url;
    if (u && IMAGE_RE.test(u)) return u;
  }
  // Embed thumbnail / image (single frame is enough for vision)
  for (const e of raw.embeds || []) {
    if (e.thumbnail?.url && IMAGE_RE.test(e.thumbnail.url)) return e.thumbnail.url;
    if (e.image?.url     && IMAGE_RE.test(e.image.url))     return e.image.url;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// Extract frame via ffmpeg — handles both video URLs and direct images
// ──────────────────────────────────────────────────────────────────────────

async function extractFrame(videoUrl: string): Promise<Buffer | null> {
  const tmp = await mkdtemp(path.join(tmpdir(), "vidframe-"));
  const outFile = path.join(tmp, "frame.jpg");
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(videoUrl);

  try {
    const args = isImage
      ? ["-y", "-i", videoUrl, "-frames:v", "1", "-vf", "scale='min(896,iw)':-2", outFile]
      : ["-y", "-ss", FRAME_AT_SEC, "-i", videoUrl, "-frames:v", "1", "-vf", "scale='min(896,iw)':-2", "-q:v", "4", outFile];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", d => { stderr += d.toString(); });
      const t = setTimeout(() => { proc.kill("SIGKILL"); reject(new Error("ffmpeg timeout")); }, 25_000);
      proc.on("exit", code => {
        clearTimeout(t);
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-200)}`));
      });
    });

    const buf = await readFile(outFile);
    if (buf.byteLength > MAX_BYTES) return null;
    return buf;
  } catch {
    return null;
  } finally {
    rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Cloudflare AI vision call
// ──────────────────────────────────────────────────────────────────────────

async function describeFrame(jpegBuf: Buffer): Promise<{ description: string; ocr: string } | null> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${VISION_MODEL}`;
  const prompt = "You are watching a single frame from a trending video, sports highlight, or breaking-news clip. Describe what you see in 2-3 sentences. Then on a new line starting with 'TEXT:', list any visible text, captions, tickers, scores, or chyron headlines. Be precise with names, numbers, and tickers.";

  // LLaVA expects JSON with prompt + image bytes as Uint8 array
  const body = {
    prompt,
    image: Array.from(new Uint8Array(jpegBuf)),
    max_tokens: 256,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_AI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn(`[video-ocr] CF AI HTTP ${res.status}: ${txt.slice(0, 200)}`);
      return null;
    }
    const data: any = await res.json();
    const out: string = (data?.result?.description || data?.result?.response || data?.result || "").toString().trim();
    if (!out) return null;

    // Split description vs TEXT: lines
    const m = out.match(/^([\s\S]*?)\n\s*TEXT:\s*([\s\S]*)$/i);
    if (m) return { description: m[1].trim(), ocr: m[2].trim() };
    return { description: out, ocr: "" };
  } catch (e: any) {
    console.warn("[video-ocr] CF AI call failed:", e.message);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Cycle
// ──────────────────────────────────────────────────────────────────────────

async function cycle() {
  const tasks = await findVideoTasks(BATCH);
  if (tasks.length === 0) { stats.lastRunAt = new Date().toISOString(); return; }

  for (const task of tasks) {
    // Reserve the row immediately — pending status — so concurrent cycles don't double-process
    try {
      await pool.query(
        `INSERT INTO discord_video_descriptions (source_message_id, channel_id, video_url, status)
         VALUES ($1,$2,$3,'pending')
         ON CONFLICT (source_message_id, video_url) DO NOTHING`,
        [task.source_message_id, task.channel_id, task.video_url]
      );
    } catch { continue; }

    const frame = await extractFrame(task.video_url);
    if (!frame) {
      await pool.query(
        `UPDATE discord_video_descriptions SET status='failed', error='frame_extract_failed', processed_at=NOW()
         WHERE source_message_id=$1 AND video_url=$2`,
        [task.source_message_id, task.video_url]
      );
      stats.failed++;
      continue;
    }

    const result = await describeFrame(frame);
    if (!result) {
      await pool.query(
        `UPDATE discord_video_descriptions SET status='failed', error='vision_call_failed', processed_at=NOW()
         WHERE source_message_id=$1 AND video_url=$2`,
        [task.source_message_id, task.video_url]
      );
      stats.failed++;
      continue;
    }

    await pool.query(
      `UPDATE discord_video_descriptions
         SET status='ok', description=$1, ocr_text=$2, model=$3, processed_at=NOW()
       WHERE source_message_id=$4 AND video_url=$5`,
      [result.description, result.ocr, VISION_MODEL, task.source_message_id, task.video_url]
    );

    // Append the description back into the source discord_messages.content so
    // the existing knowledge ingestion engine picks it up on the next cycle.
    const augmented = ` [VIDEO ANALYSIS]: ${result.description}${result.ocr ? ` | TEXT: ${result.ocr}` : ""}`;
    await pool.query(
      `UPDATE discord_messages
         SET content = COALESCE(content,'') || $1, ingested = FALSE
       WHERE message_id = $2`,
      [augmented, task.source_message_id]
    );

    stats.processed++;
    console.log(`[video-ocr] ✅ ${task.source_message_id.slice(-6)} (${task.channel_id.slice(-6)}): ${result.description.slice(0, 80)}...`);
  }
  stats.lastRunAt = new Date().toISOString();
}
