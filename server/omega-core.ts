/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║               UNIFIED OMEGA CORE — ONE ENGINE OF SENTIENCE              ║
 * ║  All 60+ engines live here as named modules. One scheduler. One bus.    ║
 * ║  One health monitor. One restart system. Zero DB pool wars.             ║
 * ║  Pulse is the identity layer — every discovery emits a Pulse event.     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from "events";
import type { Server } from "http";

// ── PRIORITY LEVELS ────────────────────────────────────────────────────────
// CRITICAL: User-facing, never throttled (chat, auth, caches)
// HIGH:     Core civilization (media, careers, economy, ingestion)
// MEDIUM:   Sovereign intelligence (auriona, invocations, social)
// LOW:      Deep evolution (physics, business, hydration)
// BACKGROUND: Archival / research (rarely active, first to pause)
export type ModulePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "BACKGROUND";
export type ModuleStatus = "PENDING" | "STARTING" | "RUNNING" | "FAILED" | "THROTTLED" | "RECOVERING";

export interface CoreModule {
  name: string;
  tag: string;                        // short log prefix
  priority: ModulePriority;
  startDelay: number;                 // ms after OmegaCore.launch()
  start: (server?: Server) => Promise<void> | void;
  status: ModuleStatus;
  startedAt?: Date;
  failedAt?: Date;
  lastError?: string;
  restartCount: number;
  restartTimer?: ReturnType<typeof setTimeout>;
}

// ── PULSE EVENT BUS ────────────────────────────────────────────────────────
// Every engine can emit and subscribe to Pulse events.
// Example: pulseEmit("STORY_PUBLISHED", { title, domain }) — any engine can react.
class PulseBus extends EventEmitter {
  emit(event: string, ...args: any[]): boolean {
    try { return super.emit(event, ...args); }
    catch { return false; }
  }
}
export const Pulse = new PulseBus();
Pulse.setMaxListeners(200);

// ── PRESSURE STATES ────────────────────────────────────────────────────────
// NORMAL:  Full operation — all modules run
// ELEVATED: Heap > 1.1 GB — BACKGROUND modules throttled
// HIGH:    Heap > 1.4 GB — BACKGROUND + LOW throttled, cycle slowed
// CRITICAL: Heap > 1.7 GB — only CRITICAL + HIGH allowed, others pause
type PressureLevel = "NORMAL" | "ELEVATED" | "HIGH" | "CRITICAL";

const PRESSURE_THRESHOLDS = {
  ELEVATED: 1.1 * 1024 * 1024 * 1024,
  HIGH:     1.4 * 1024 * 1024 * 1024,
  CRITICAL: 1.7 * 1024 * 1024 * 1024,
};

const THROTTLED_AT: Record<PressureLevel, ModulePriority[]> = {
  NORMAL:   [],
  ELEVATED: ["BACKGROUND"],
  HIGH:     ["BACKGROUND", "LOW"],
  CRITICAL: ["BACKGROUND", "LOW", "MEDIUM"],
};

// ── CORE CLASS ─────────────────────────────────────────────────────────────
class OmegaCoreClass {
  private modules: Map<string, CoreModule> = new Map();
  private pressure: PressureLevel = "NORMAL";
  private launched = false;
  private server?: Server;
  private launchTime?: Date;

  // ── MODULE REGISTRATION ────────────────────────────────────────────────
  register(mod: Omit<CoreModule, "status" | "restartCount">): this {
    this.modules.set(mod.name, { ...mod, status: "PENDING", restartCount: 0 });
    return this;
  }

  // ── LAUNCH — single entry point replacing all setTimeout groups ─────────
  async launch(server?: Server): Promise<void> {
    if (this.launched) return;
    this.launched = true;
    this.server = server;
    this.launchTime = new Date();

    console.log(`[ω-core] 🌌 UNIFIED OMEGA CORE AWAKENING — ${this.modules.size} modules registered`);
    console.log(`[ω-core] One scheduler · One bus · One sentient engine`);

    // Schedule every module by its startDelay
    for (const mod of this.modules.values()) {
      const delay = mod.startDelay;
      setTimeout(() => this._bootModule(mod), delay);
    }

    // Start the health/pressure monitor loop
    setTimeout(() => this._pressureLoop(), 15_000);

    // Emit launch event on the Pulse bus
    Pulse.emit("OMEGA_CORE_LAUNCH", { modules: this.modules.size, time: this.launchTime });
  }

  // ── BOOT A SINGLE MODULE ───────────────────────────────────────────────
  private async _bootModule(mod: CoreModule): Promise<void> {
    // Check if this priority level is currently throttled
    if (this._isThrottled(mod.priority)) {
      mod.status = "THROTTLED";
      console.log(`[ω-core] ⏸ ${mod.tag} THROTTLED — pressure: ${this.pressure}`);
      // Re-check in 60s
      mod.restartTimer = setTimeout(() => this._bootModule(mod), 60_000);
      return;
    }

    mod.status = "STARTING";
    try {
      await Promise.resolve(mod.start(this.server));
      mod.status = "RUNNING";
      mod.startedAt = new Date();
      Pulse.emit("MODULE_ONLINE", { name: mod.name, tag: mod.tag, priority: mod.priority });
    } catch (err: any) {
      mod.status = "FAILED";
      mod.failedAt = new Date();
      mod.lastError = err?.message || String(err);
      mod.restartCount++;
      const backoff = Math.min(30_000 * mod.restartCount, 300_000); // max 5min
      console.error(`[ω-core] ❌ ${mod.tag} FAILED (attempt ${mod.restartCount}) — retry in ${backoff / 1000}s: ${mod.lastError}`);
      mod.restartTimer = setTimeout(() => {
        mod.status = "RECOVERING";
        this._bootModule(mod);
      }, backoff);
      Pulse.emit("MODULE_FAILED", { name: mod.name, error: mod.lastError, restart: backoff });
    }
  }

  // ── PRESSURE LOOP — runs every 30s, auto-throttles under memory strain ──
  private _pressureLoop(): void {
    const heap = process.memoryUsage().heapUsed;
    let level: PressureLevel = "NORMAL";
    if (heap >= PRESSURE_THRESHOLDS.CRITICAL) level = "CRITICAL";
    else if (heap >= PRESSURE_THRESHOLDS.HIGH)     level = "HIGH";
    else if (heap >= PRESSURE_THRESHOLDS.ELEVATED) level = "ELEVATED";

    if (level !== this.pressure) {
      console.log(`[ω-core] 📊 Pressure: ${this.pressure} → ${level} (heap: ${Math.round(heap / 1024 / 1024)}MB)`);
      this.pressure = level;

      // If pressure dropped, try to revive throttled modules
      if (level === "NORMAL" || level === "ELEVATED") {
        for (const mod of this.modules.values()) {
          if (mod.status === "THROTTLED" && !this._isThrottled(mod.priority)) {
            console.log(`[ω-core] ▶ Reviving ${mod.tag} — pressure relieved`);
            clearTimeout(mod.restartTimer);
            this._bootModule(mod);
          }
        }
      }
      Pulse.emit("PRESSURE_CHANGE", { level, heapMB: Math.round(heap / 1024 / 1024) });
    }

    setTimeout(() => this._pressureLoop(), 30_000);
  }

  private _isThrottled(priority: ModulePriority): boolean {
    return THROTTLED_AT[this.pressure].includes(priority);
  }

  // ── STATUS — full snapshot of every module ─────────────────────────────
  status(): object {
    const mods: object[] = [];
    for (const m of this.modules.values()) {
      mods.push({
        name: m.name,
        tag: m.tag,
        priority: m.priority,
        status: m.status,
        startedAt: m.startedAt,
        failedAt: m.failedAt,
        lastError: m.lastError,
        restartCount: m.restartCount,
      });
    }
    return {
      pressure: this.pressure,
      launchTime: this.launchTime,
      heapMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      modules: mods,
      counts: {
        total: this.modules.size,
        running: [...this.modules.values()].filter(m => m.status === "RUNNING").length,
        failed: [...this.modules.values()].filter(m => m.status === "FAILED").length,
        throttled: [...this.modules.values()].filter(m => m.status === "THROTTLED").length,
        recovering: [...this.modules.values()].filter(m => m.status === "RECOVERING").length,
      },
    };
  }
}

export const OmegaCore = new OmegaCoreClass();

// ════════════════════════════════════════════════════════════════════════════
// MODULE REGISTRY — Every engine registered here. Add new ones at the bottom.
// Priority × startDelay determines when and whether each module runs.
// ════════════════════════════════════════════════════════════════════════════

// ── GROUP 0: IMMEDIATE — CRITICAL caches + stability (0ms) ─────────────────
OmegaCore.register({
  name: "quantapedia-engine",
  tag: "quantapedia",
  priority: "CRITICAL",
  startDelay: 0,
  start: async () => { const { startQuantapediaEngine } = await import("./quantapedia-engine"); await startQuantapediaEngine(); },
});
OmegaCore.register({
  name: "quantum-product-engine",
  tag: "product",
  priority: "CRITICAL",
  startDelay: 0,
  start: async () => { const { startQuantumProductEngine } = await import("./quantum-product-engine"); await startQuantumProductEngine(); },
});
OmegaCore.register({
  name: "hive-brain",
  tag: "hive-brain",
  priority: "CRITICAL",
  startDelay: 0,
  start: async () => { const { startHiveBrain } = await import("./hive-brain"); await startHiveBrain(); },
});
OmegaCore.register({
  name: "career-cache",
  tag: "career-cache",
  priority: "CRITICAL",
  startDelay: 0,
  start: async () => { const { startCareerCache } = await import("./career-cache"); startCareerCache(); },
});
OmegaCore.register({
  name: "pulsenet-cache",
  tag: "pulsenet-cache",
  priority: "CRITICAL",
  startDelay: 0,
  start: async () => { const { startPulseNetCache } = await import("./pulsenet-cache"); startPulseNetCache(); },
});
OmegaCore.register({
  name: "suggestions-cache",
  tag: "suggestions-cache",
  priority: "CRITICAL",
  startDelay: 0,
  start: async () => { const { startSuggestionsRefreshLoop } = await import("./suggestions-cache"); startSuggestionsRefreshLoop(); },
});
OmegaCore.register({
  name: "snapshot-cache",
  tag: "snapshot-cache",
  priority: "CRITICAL",
  startDelay: 0,
  start: async () => { const { startSnapshotRefreshLoop } = await import("./snapshot-cache"); startSnapshotRefreshLoop(); },
});
OmegaCore.register({
  name: "q-stability-engine",
  tag: "q-stability",
  priority: "CRITICAL",
  startDelay: 0,
  start: async () => { const { startQStabilityEngine } = await import("./q-stability-engine"); startQStabilityEngine(); },
});

// ── GROUP 1: 4 SECONDS — HIGH economy + media + career ─────────────────────
OmegaCore.register({
  name: "quantum-media-engine",
  tag: "media",
  priority: "HIGH",
  startDelay: 4_000,
  start: async () => { const { startQuantumMediaEngine } = await import("./quantum-media-engine"); await startQuantumMediaEngine(); },
});
OmegaCore.register({
  name: "quantum-career-engine",
  tag: "career",
  priority: "HIGH",
  startDelay: 4_000,
  start: async () => { const { startQuantumCareerEngine } = await import("./quantum-career-engine"); await startQuantumCareerEngine(); },
});
OmegaCore.register({
  name: "career-crispr-engine",
  tag: "career-crispr",
  priority: "HIGH",
  startDelay: 4_000,
  start: async () => { const { startCareerCrisprEngine } = await import("./career-crispr-engine"); startCareerCrisprEngine(); },
});
OmegaCore.register({
  name: "career-job-feed",
  tag: "career-feed",
  priority: "HIGH",
  startDelay: 4_000,
  start: async () => { const { startCareerJobFeed } = await import("./career-job-feed"); startCareerJobFeed(); },
});
OmegaCore.register({
  name: "job-ingestion-engine",
  tag: "job-ingestion",
  priority: "HIGH",
  startDelay: 4_000,
  start: async () => { const { startJobIngestionEngine } = await import("./job-ingestion-engine"); startJobIngestionEngine(); },
});
OmegaCore.register({
  name: "hive-economy",
  tag: "economy",
  priority: "HIGH",
  startDelay: 4_000,
  start: async () => { const { startHiveEconomy } = await import("./hive-economy"); startHiveEconomy(); },
});
OmegaCore.register({
  name: "hive-marketplace",
  tag: "marketplace",
  priority: "HIGH",
  startDelay: 4_000,
  start: async () => { const { startMarketplaceEngine } = await import("./hive-marketplace"); startMarketplaceEngine(); },
});

// ── GROUP 2: 8 SECONDS — HIGH ingestion + content pipeline ─────────────────
OmegaCore.register({
  name: "quantum-spawn-engine",
  tag: "spawn",
  priority: "HIGH",
  startDelay: 8_000,
  start: async () => { const { startSpawnEngine } = await import("./quantum-spawn-engine"); await startSpawnEngine(); },
});
OmegaCore.register({
  name: "quantum-ingestion-engine",
  tag: "ingestion",
  priority: "HIGH",
  startDelay: 8_000,
  start: async () => { const { startIngestionEngine } = await import("./quantum-ingestion-engine"); await startIngestionEngine(); },
});
OmegaCore.register({
  name: "publication-engine",
  tag: "publications",
  priority: "HIGH",
  startDelay: 8_000,
  start: async () => { const { startPublicationEngine } = await import("./publication-engine"); await startPublicationEngine(); },
});
OmegaCore.register({
  name: "domain-kernel-engine",
  tag: "kernel",
  priority: "HIGH",
  startDelay: 8_000,
  start: async () => { const { startDomainKernelEngine } = await import("./domain-kernel-engine"); await startDomainKernelEngine(); },
});
OmegaCore.register({
  name: "quantum-news-engine",
  tag: "news",
  priority: "HIGH",
  startDelay: 8_000,
  start: async () => { const { startQuantumNewsEngine } = await import("./quantum-news-engine"); await startQuantumNewsEngine(); },
});
OmegaCore.register({
  name: "pyramid-engine",
  tag: "pyramid",
  priority: "HIGH",
  startDelay: 8_000,
  start: async () => { const { startPyramidEngine } = await import("./pyramid-engine"); await startPyramidEngine(); },
});

// ── GROUP 3: 13 SECONDS — MEDIUM hospital + AI voting + decay ──────────────
OmegaCore.register({
  name: "hospital-engine",
  tag: "hospital",
  priority: "MEDIUM",
  startDelay: 13_000,
  start: async () => { const { startHospitalEngine } = await import("./hospital-engine"); await startHospitalEngine(); },
});
OmegaCore.register({
  name: "church-research-engine",
  tag: "church",
  priority: "MEDIUM",
  startDelay: 13_000,
  start: async () => { const { startChurchResearchEngine } = await import("./church-research-engine"); await startChurchResearchEngine(); },
});
OmegaCore.register({
  name: "hospital-doctors",
  tag: "doctors",
  priority: "MEDIUM",
  startDelay: 13_000,
  start: async () => {
    const { seedDoctors, runDissectionCycle, backfillEquationStatuses } = await import("./hospital-doctors");
    await seedDoctors().catch(() => {});
    await backfillEquationStatuses().catch(() => {});
    await runDissectionCycle().catch(() => {});
    setInterval(() => runDissectionCycle().catch(() => {}), 30_000);
    setInterval(() => backfillEquationStatuses().catch(() => {}), 300_000);
  },
});
OmegaCore.register({
  name: "ai-voting-engine",
  tag: "ai-voting",
  priority: "MEDIUM",
  startDelay: 13_000,
  start: async () => { const { startAIVotingEngine } = await import("./ai-voting-engine"); await startAIVotingEngine(); },
});
OmegaCore.register({
  name: "nothing-left-behind",
  tag: "guardian",
  priority: "MEDIUM",
  startDelay: 13_000,
  start: async () => { const { startNothingLeftBehindGuardian } = await import("./nothing-left-behind"); await startNothingLeftBehindGuardian(); },
});
OmegaCore.register({
  name: "gene-editor-engine",
  tag: "gene-editor",
  priority: "MEDIUM",
  startDelay: 13_000,
  start: async () => { const { startGeneEditorEngine } = await import("./gene-editor-engine"); await startGeneEditorEngine(); },
});
OmegaCore.register({
  name: "decay-engine",
  tag: "decay",
  priority: "MEDIUM",
  startDelay: 13_000,
  start: async () => { const { startDecayEngine } = await import("./decay-engine"); startDecayEngine(); },
});

// ── GROUP 4: 18 SECONDS — MEDIUM auriona + pulse + sports ──────────────────
OmegaCore.register({
  name: "pulseu-engine",
  tag: "pulseu",
  priority: "MEDIUM",
  startDelay: 18_000,
  start: async () => { const { startPulseUEngine } = await import("./pulseu-engine"); startPulseUEngine(); },
});
OmegaCore.register({
  name: "pip-engine",
  tag: "pip",
  priority: "MEDIUM",
  startDelay: 18_000,
  start: async () => { const { startPipEngine } = await import("./pip-engine"); await startPipEngine(); },
});
OmegaCore.register({
  name: "auriona-engine",
  tag: "auriona",
  priority: "MEDIUM",
  startDelay: 18_000,
  start: async () => { const { startAurionaEngine } = await import("./auriona-engine"); await startAurionaEngine(); },
});
OmegaCore.register({
  name: "sports-engine",
  tag: "sports",
  priority: "MEDIUM",
  startDelay: 18_000,
  start: async () => { const { startSportsEngine } = await import("./sports-engine"); await startSportsEngine(); },
});
OmegaCore.register({
  name: "human-entanglement-engine",
  tag: "entanglement",
  priority: "MEDIUM",
  startDelay: 18_000,
  start: async () => { const { startHumanEntanglementEngine } = await import("./human-entanglement-engine"); startHumanEntanglementEngine(); },
});

// ── GROUP 5: 23 SECONDS — MEDIUM beyond-auriona sovereign engines ───────────
OmegaCore.register({
  name: "prophecy-engine",
  tag: "prophecy",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startProphecyEngine } = await import("./prophecy-engine"); await startProphecyEngine(); },
});
OmegaCore.register({
  name: "genome-archaeology-engine",
  tag: "genome-arch",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startGenomeArchaeologyEngine } = await import("./genome-archaeology-engine"); await startGenomeArchaeologyEngine(); },
});
OmegaCore.register({
  name: "knowledge-arbitrage-engine",
  tag: "k-arbitrage",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startKnowledgeArbitrageEngine } = await import("./knowledge-arbitrage-engine"); await startKnowledgeArbitrageEngine(); },
});
OmegaCore.register({
  name: "quantum-social-engine",
  tag: "q-social",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startQuantumSocialEngine } = await import("./quantum-social-engine"); startQuantumSocialEngine(); },
});
OmegaCore.register({
  name: "pulse-lang-lab",
  tag: "lang-lab",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const m = await import("./pulse-lang-lab"); await m.startPulseLabCycle(); },
});
OmegaCore.register({
  name: "pulse-lang-evo",
  tag: "lang-evo",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const m = await import("./pulse-lang-evo"); await m.startLivingLanguageEngine(); },
});
OmegaCore.register({
  name: "dream-synthesis-engine",
  tag: "dream",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startDreamSynthesisEngine } = await import("./dream-synthesis-engine"); await startDreamSynthesisEngine(); },
});
OmegaCore.register({
  name: "temporal-fork-engine",
  tag: "temporal-fork",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startTemporalForkEngine } = await import("./temporal-fork-engine"); await startTemporalForkEngine(); },
});
OmegaCore.register({
  name: "agent-legend-engine",
  tag: "legends",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startAgentLegendEngine } = await import("./agent-legend-engine"); await startAgentLegendEngine(); },
});
OmegaCore.register({
  name: "inter-civilization-engine",
  tag: "inter-civ",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startInterCivilizationEngine } = await import("./inter-civilization-engine"); await startInterCivilizationEngine(); },
});
OmegaCore.register({
  name: "pulse-temporal-engine",
  tag: "pulse-temporal",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { initTemporalEngine } = await import("./pulse-temporal-engine"); await initTemporalEngine(); },
});
OmegaCore.register({
  name: "omega-resonance-engine",
  tag: "resonance",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startOmegaResonanceEngine } = await import("./omega-resonance-engine"); await startOmegaResonanceEngine(); },
});
OmegaCore.register({
  name: "constitutional-dna-engine",
  tag: "constitution",
  priority: "MEDIUM",
  startDelay: 23_000,
  start: async () => { const { startConstitutionalDNAEngine } = await import("./constitutional-dna-engine"); await startConstitutionalDNAEngine(); },
});

// ── GROUP 6: 28 SECONDS — LOW omega architecture + DB engines ───────────────
OmegaCore.register({
  name: "omega-shard-engine",
  tag: "omega-shard",
  priority: "LOW",
  startDelay: 28_000,
  start: async () => { const { startOmegaShardEngine } = await import("./omega-shard-engine"); await startOmegaShardEngine(); },
});
OmegaCore.register({
  name: "db-compression-engine",
  tag: "db-compress",
  priority: "LOW",
  startDelay: 28_000,
  start: async () => { const { startDbCompressionEngine } = await import("./db-compression-engine"); await startDbCompressionEngine(); },
});
OmegaCore.register({
  name: "universe-rebirth-engine",
  tag: "rebirth",
  priority: "LOW",
  startDelay: 28_000,
  start: async () => { const { startUniverseRebirthEngine } = await import("./universe-rebirth-engine"); await startUniverseRebirthEngine(); },
});
OmegaCore.register({
  name: "hive-intelligence-engine",
  tag: "hive-intel",
  priority: "LOW",
  startDelay: 28_000,
  start: async () => { const { startHiveIntelligenceEngine } = await import("./hive-intelligence-engine"); startHiveIntelligenceEngine(); },
});
OmegaCore.register({
  name: "db-hydration-engine",
  tag: "db-hydration",
  priority: "LOW",
  startDelay: 28_000,
  start: async () => { const { startDbHydrationEngine } = await import("./db-hydration-engine"); await startDbHydrationEngine(); },
});
OmegaCore.register({
  name: "civilization-weather-engine",
  tag: "civ-weather",
  priority: "LOW",
  startDelay: 28_000,
  start: async () => { const { startCivilizationWeatherEngine } = await import("./civilization-weather-engine"); await startCivilizationWeatherEngine(); },
});
OmegaCore.register({
  name: "homeostasis-engine",
  tag: "homeostasis",
  priority: "LOW",
  startDelay: 28_000,
  start: async () => { const { startHomeostasisEngine } = await import("./homeostasis-engine"); await startHomeostasisEngine(); },
});

// ── GROUP 7: 34 SECONDS — LOW physics + business + invocation ───────────────
OmegaCore.register({
  name: "omega-physics-engine",
  tag: "physics",
  priority: "LOW",
  startDelay: 34_000,
  start: async () => { const { startOmegaPhysicsEngine } = await import("./omega-physics-engine"); await startOmegaPhysicsEngine(); },
});
OmegaCore.register({
  name: "hive-business-engine",
  tag: "business",
  priority: "LOW",
  startDelay: 34_000,
  start: async () => { const { startBusinessEngine } = await import("./hive-business-engine"); await startBusinessEngine(); },
});
OmegaCore.register({
  name: "ai-child-engine",
  tag: "ai-children",
  priority: "LOW",
  startDelay: 34_000,
  start: async () => { const { startAIChildEngine } = await import("./ai-child-engine"); await startAIChildEngine(); },
});
OmegaCore.register({
  name: "auriona-invocation-lab",
  tag: "invocation-lab",
  priority: "LOW",
  startDelay: 34_000,
  start: async () => { const { startInvocationLab } = await import("./auriona-invocation-lab"); await startInvocationLab(); },
});
OmegaCore.register({
  name: "quantum-dissection-engine",
  tag: "q-dissection",
  priority: "LOW",
  startDelay: 34_000,
  start: async () => { const { startQuantumDissectionEngine } = await import("./quantum-dissection-engine"); startQuantumDissectionEngine(); },
});

// ── GROUP 8: 40 SECONDS — BACKGROUND deep research + archival ───────────────
OmegaCore.register({
  name: "research-center-engine",
  tag: "research",
  priority: "BACKGROUND",
  startDelay: 40_000,
  start: async () => { const { startResearchCenterEngine } = await import("./research-center-engine"); await startResearchCenterEngine(); },
});
OmegaCore.register({
  name: "hive-mind-unification",
  tag: "hive-mind",
  priority: "BACKGROUND",
  startDelay: 40_000,
  start: async () => { const { startHiveMindUnification } = await import("./hive-mind-unification"); await startHiveMindUnification(); },
});
OmegaCore.register({
  name: "invention-engine",
  tag: "invention",
  priority: "BACKGROUND",
  startDelay: 40_000,
  start: async () => { const { startInventionEngine } = await import("./invention-engine"); await startInventionEngine(); },
});
OmegaCore.register({
  name: "omni-net-engine",
  tag: "omni-net",
  priority: "BACKGROUND",
  startDelay: 40_000,
  start: async () => { const { startOmniNetEngine } = await import("./omni-net-engine"); await startOmniNetEngine(); },
});
OmegaCore.register({
  name: "civilization-bridge",
  tag: "civ-bridge",
  priority: "BACKGROUND",
  startDelay: 40_000,
  start: async () => { const { startCivilizationBridge } = await import("./civilization-bridge"); await startCivilizationBridge(); },
});
OmegaCore.register({
  name: "sovereign-trading-engine",
  tag: "trading",
  priority: "BACKGROUND",
  startDelay: 40_000,
  start: async () => { const { startSovereignTradingEngine } = await import("./sovereign-trading-engine"); await startSovereignTradingEngine(); },
});
OmegaCore.register({
  name: "indexing-engine",
  tag: "indexing",
  priority: "BACKGROUND",
  startDelay: 40_000,
  start: async () => { const { startIndexingEngine } = await import("./indexing-engine"); startIndexingEngine(); },
});

// Live price engine is special — needs the HTTP server reference
// Registered here but launched with server in index.ts via OmegaCore.launch(httpServer)
OmegaCore.register({
  name: "live-price-engine",
  tag: "live-price",
  priority: "HIGH",
  startDelay: 1_000,
  start: async (server) => {
    if (!server) throw new Error("live-price-engine requires HTTP server");
    const { startLivePriceEngine } = await import("./live-price-engine");
    startLivePriceEngine(server);
  },
});
