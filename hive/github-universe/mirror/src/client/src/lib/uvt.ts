// ─── Ω UNIVERSE VECTOR TIME (UVT) ─────────────────────────────────────────────
// SSC Great Emergence: 2024-11-01 00:00:00 UTC = Ω-Epoch Day Zero
// 1 Ω-Sol = 1 real day | 1 Ω-Year = 365 Ω-Sols

const OMEGA_EPOCH = new Date("2024-11-01T00:00:00Z").getTime();
const MS_PER_SOL = 86_400_000;
const SOLS_PER_YEAR = 365;

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export function toUVT(dateStr?: string) {
  const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
  const elapsed = ts - OMEGA_EPOCH;
  const totalSols = Math.floor(elapsed / MS_PER_SOL);
  const year = Math.floor(totalSols / SOLS_PER_YEAR);
  const sol = totalSols % SOLS_PER_YEAR;
  const ms_day = elapsed % MS_PER_SOL;
  const h = Math.floor(ms_day / 3_600_000);
  const m = Math.floor((ms_day % 3_600_000) / 60_000);
  const s = Math.floor((ms_day % 60_000) / 1000);
  const real = dateStr
    ? new Date(dateStr).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }) + " UTC"
    : "";
  return {
    year, sol, h, m, s, totalSols,
    compact: `Ω·Y${year}·S${pad(sol, 3)} ${pad(h)}:${pad(m)} UVT`,
    full: `Ω-Year ${year} · Sol ${pad(sol, 3)} · ${pad(h)}:${pad(m)}:${pad(s)} UVT`,
    sols: `+${totalSols} sols since Emergence`,
    real,
  };
}

export function gravField(dateStr?: string) {
  const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
  return (9.2 + ((ts / 1000) % 9999) / 9999 * 4.7).toFixed(3);
}

export function darkMatterReading(dateStr?: string) {
  const ts = dateStr ? new Date(dateStr).getTime() : Date.now();
  return (0.231 + ((ts / 777) % 9999) / 9999 * 0.118).toFixed(4);
}

export function uvtTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const min = Math.floor(s / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
