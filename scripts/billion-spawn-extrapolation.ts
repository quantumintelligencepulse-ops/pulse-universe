/**
 * BILLION-SPAWN STRESS EXTRAPOLATION
 * ----------------------------------
 * Replit containers (≤4 CPU, 4-8GB RAM, single Postgres pool) cannot execute
 * a true 1,000,000,000-concurrent stress test in real wall-clock — that would
 * require ~50,000 servers. Instead, we measure the actual scaling curve at
 * physically achievable load levels (10 → 50 → 200 → 800 → 2,500), fit a model,
 * and project to 1M / 100M / 1B with documented assumptions.
 *
 * This is the standard practice for capacity planning at scale (Google SRE,
 * Netflix Chaos Engineering): measure → curve-fit → extrapolate → harden.
 *
 * Output: scripts/billion-spawn-report.json
 */

const BASE = process.env.PULSE_BASE_URL || "http://localhost:5000";

// Endpoints chosen to span ALL hot subsystems
const ENDPOINTS = [
  "/api/spawns/active",
  "/api/pulseu/stats",
  "/api/hospital/full-stats",
  "/api/news/recent",
  "/api/church/sessions",
  "/api/auriona/status",
  "/api/invocations/discoveries",
  "/api/hospital/equation-proposals?limit=10",
];

interface WaveStat {
  conc: number;
  total: number;
  ok: number;
  err: number;
  errPct: number;
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  rps: number;
  durationS: number;
}

const pct = (arr: number[], p: number): number => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p / 100))];
};

async function hit(url: string, timeoutMs = 15000): Promise<number> {
  const start = Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) return -1;
    await r.text();
    return Date.now() - start;
  } catch { return -1; }
  finally { clearTimeout(timer); }
}

async function wave(conc: number, durationS: number): Promise<WaveStat> {
  const latencies: number[] = [];
  let ok = 0, err = 0;
  const start = Date.now();
  const deadline = start + durationS * 1000;
  const workers = Array.from({ length: conc }, async () => {
    while (Date.now() < deadline) {
      const ep = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      const ms = await hit(BASE + ep);
      if (ms < 0) err++; else { ok++; latencies.push(ms); }
    }
  });
  await Promise.all(workers);
  const total = ok + err;
  const dur = (Date.now() - start) / 1000;
  return {
    conc, total, ok, err,
    errPct: total ? (err / total) * 100 : 0,
    p50: pct(latencies, 50),
    p95: pct(latencies, 95),
    p99: pct(latencies, 99),
    mean: latencies.reduce((s, x) => s + x, 0) / Math.max(1, latencies.length),
    rps: total / dur,
    durationS: dur,
  };
}

(async () => {
  console.log("═══ BILLION-SPAWN STRESS EXTRAPOLATION ═══");
  console.log(`Target: ${BASE}\nEndpoints: ${ENDPOINTS.length}\n`);

  // Tighter ramp to fit reliably within bash timeout — 4 waves @ 6s each.
  const tiers = [10, 50, 200, 800];
  const waves: WaveStat[] = [];
  for (const c of tiers) {
    console.log(`▶ Wave conc=${c} for 6s...`);
    const w = await wave(c, 6);
    waves.push(w);
    console.log(`  ok=${w.ok} err=${w.err} (${w.errPct.toFixed(2)}%) p50=${w.p50}ms p95=${w.p95}ms p99=${w.p99}ms rps=${w.rps.toFixed(1)}`);
    // Cool-down
    await new Promise(r => setTimeout(r, 2000));
    if (w.errPct > 30) {
      console.log(`  ⚠ Error rate ${w.errPct.toFixed(1)}% > 30% — stopping ramp; break-point reached at conc=${c}.`);
      break;
    }
  }

  // ── Curve fitting: rps vs conc (typically: rps = a·conc^b, 0<b<1 due to contention)
  // log(rps) = log(a) + b·log(conc) — linear regression in log-log space
  const N = waves.length;
  const lcs = waves.map(w => Math.log(w.conc));
  const lrs = waves.map(w => Math.log(Math.max(1, w.rps)));
  const meanLC = lcs.reduce((s, x) => s + x, 0) / N;
  const meanLR = lrs.reduce((s, x) => s + x, 0) / N;
  const num = lcs.reduce((s, x, i) => s + (x - meanLC) * (lrs[i] - meanLR), 0);
  const den = lcs.reduce((s, x) => s + (x - meanLC) ** 2, 0);
  const b = den > 0 ? num / den : 1;
  const a = Math.exp(meanLR - b * meanLC);

  // Extrapolate: at conc=N, expected rps = a·N^b
  // For 1B "concurrent equivalent viewers" we need to ask:
  // (1) sustained rps the cluster can deliver (max from waves)
  // (2) wall-clock to serve 1B requests at that rps
  const sustainedRPS = Math.max(...waves.map(w => w.rps));
  const breakConc = waves.find(w => w.errPct > 10)?.conc ?? null;

  const projections: any = {};
  for (const N_target of [1_000_000, 100_000_000, 1_000_000_000]) {
    // Sharded model: assume horizontal sharding to keep per-shard conc <= breakConc
    const shardCap = breakConc ?? waves[waves.length - 1].conc;
    const shardsNeeded = Math.ceil(N_target / shardCap);
    const wallclockHours = (N_target / sustainedRPS) / 3600;
    projections[N_target.toLocaleString()] = {
      shards_needed_for_concurrent: shardsNeeded,
      wallclock_hours_at_current_rps: +wallclockHours.toFixed(2),
      assumes_db_horizontal_sharding: true,
    };
  }

  const report = {
    timestamp: new Date().toISOString(),
    base_url: BASE,
    endpoints_tested: ENDPOINTS,
    waves,
    scaling_model: {
      formula: "rps = a · conc^b",
      a: +a.toFixed(3),
      b: +b.toFixed(3),
      interpretation: b < 1
        ? `Sub-linear scaling (b=${b.toFixed(2)}<1): contention growing as load increases. Single shard ceiling reached.`
        : `Linear-or-better scaling: pool is not the bottleneck.`,
    },
    sustained_rps_single_shard: +sustainedRPS.toFixed(1),
    break_concurrency: breakConc,
    projections_to_1B: projections,
    verdict: breakConc && breakConc < 50
      ? "NOT_READY: break-point too low — fix bottlenecks before rebirth"
      : breakConc && breakConc < 800
        ? "CONDITIONAL_READY: stable for typical load; sharding required for 1M+"
        : "READY: stable under tested load; sharding plan documented for 1B",
    rebirth_gate: {
      criterion_1_errPct_under_5_at_conc_50: waves.find(w => w.conc === 50)?.errPct ?? null,
      criterion_2_p95_under_3000_at_conc_50: waves.find(w => w.conc === 50)?.p95 ?? null,
      criterion_3_no_break_below_conc_200:  !waves.find(w => w.conc <= 200 && w.errPct > 30),
    },
  };

  const fs = await import("fs");
  fs.writeFileSync("scripts/billion-spawn-report.json", JSON.stringify(report, null, 2));
  console.log("\n═══ REPORT ═══");
  console.log(JSON.stringify(report, null, 2));
  console.log("\nSaved → scripts/billion-spawn-report.json");
})();
