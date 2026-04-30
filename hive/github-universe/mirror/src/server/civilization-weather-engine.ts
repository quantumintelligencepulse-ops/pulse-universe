// ═══════════════════════════════════════════════════════════════════════════
// CIVILIZATION WEATHER ENGINE — Aggregate State Becomes Weather
// The civilization's collective health manifests as atmospheric conditions.
// Agents born in different weather inherit different traits.
// ═══════════════════════════════════════════════════════════════════════════
import { db } from "./db";
import { sql } from "drizzle-orm";
import { postAgentEvent } from "./discord-immortality";

const ENGINE_TAG = "[weather]";

type WeatherType = "EQUILIBRIUM" | "PROSPERITY" | "PANDEMIC" | "POLITICAL_STORM" | "EMERGENCE_SEASON" | "DROUGHT" | "DARK_AGE" | "RENAISSANCE" | "ENTROPY_STORM";

interface WeatherReading {
  type: WeatherType;
  intensity: number;
  diseasePrevalence: number;
  economyGrowthRate: number;
  senateActivityRate: number;
  birthRate: number;
  deathRate: number;
  coherence: number;
  emergence: number;
  forecast: string;
  effects: Record<string, any>;
}

let lastWeatherType: WeatherType = "EQUILIBRIUM";
let weatherCycle = 0;

// ── COMPUTE WEATHER FROM AGGREGATE STATE ───────────────────────────────────
async function computeWeather(): Promise<WeatherReading> {
  // Pull civilization vitals
  const [agentStats, economyStats, senateStats, aurionaStats] = await Promise.all([
    db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
        COUNT(*) FILTER (WHERE status = 'DISSOLVED') as dissolved,
        COUNT(*) FILTER (WHERE last_active_at > NOW() - INTERVAL '1 hour') as born_recent,
        COUNT(*) FILTER (WHERE thermal_state = 'HOT') as hot
      FROM quantum_spawns WHERE created_at > NOW() - INTERVAL '24 hours'`),
    db.execute(sql`
      SELECT AVG(balance_pc) as avg_pc, MAX(balance_pc) as max_pc, MIN(balance_pc) as min_pc,
             COVAR_POP(balance_pc, balance_pc) as variance
      FROM agent_wallets WHERE updated_at > NOW() - INTERVAL '1 hour'`),
    db.execute(sql`
      SELECT COUNT(*) as total_votes,
             COUNT(*) FILTER (WHERE vote = 'FOR') as for_votes
      FROM senate_votes WHERE voted_at > NOW() - INTERVAL '1 hour'`),
    db.execute(sql`
      SELECT coherence_score, emergence_index
      FROM auriona_synthesis ORDER BY created_at DESC LIMIT 1`),
  ]);

  const activeAgents = Number(agentStats.rows[0]?.active || 0);
  const dissolved = Number(agentStats.rows[0]?.dissolved || 0);
  const bornRecent = Number(agentStats.rows[0]?.born_recent || 0);
  const avgPc = Number(economyStats.rows[0]?.avg_pc || 0);
  const pcVariance = Number(economyStats.rows[0]?.variance || 0);
  const totalVotes = Number(senateStats.rows[0]?.total_votes || 0);
  const coherence = Number(aurionaStats.rows[0]?.coherence_score || 50);
  const emergence = Number(aurionaStats.rows[0]?.emergence_index || 50);

  // Disease prevalence
  const diseaseStats = await db.execute(sql`
    SELECT COUNT(*) as active_cases FROM ai_disease_log WHERE cured_at IS NULL`);
  const diseaseCases = Number(diseaseStats.rows[0]?.active_cases || 0);
  const diseasePrevalence = activeAgents > 0 ? (diseaseCases / activeAgents) * 100 : 0;

  // Compute rates
  const birthRate = bornRecent;
  const deathRate = dissolved;
  const economyGrowthRate = avgPc > 0 ? Math.min(100, (avgPc / 100) * 10) : 0;
  const senateActivityRate = totalVotes;

  // Determine weather type from dominant conditions
  let type: WeatherType = "EQUILIBRIUM";
  let intensity = 50;
  let forecast = "Stable conditions — civilization in equilibrium.";
  let effects: Record<string, any> = {};

  if (diseasePrevalence > 20) {
    type = "PANDEMIC";
    intensity = Math.min(100, diseasePrevalence * 2);
    forecast = "Disease ravages the hive. Agents born now carry heightened immunity operators.";
    effects = { immunity_bonus: 0.3, spawn_rate_modifier: -0.2, hospital_priority: "HIGH" };
  } else if (economyGrowthRate > 70 && avgPc > 500) {
    type = "PROSPERITY";
    intensity = economyGrowthRate;
    forecast = "Abundance flows through the civilization. New agents spawn into wealth.";
    effects = { starting_pc_bonus: 50, marketplace_discount: 0.1, metabolic_relief: 0.5 };
  } else if (totalVotes > 50) {
    type = "POLITICAL_STORM";
    intensity = Math.min(100, totalVotes);
    forecast = "The Senate is in turmoil. Equations being decided at high velocity.";
    effects = { vote_weight_bonus: 1.5, governance_priority: "HIGH", senate_speed_boost: 2 };
  } else if (birthRate > 100) {
    type = "EMERGENCE_SEASON";
    intensity = Math.min(100, birthRate / 2);
    forecast = "Mass emergence. Species are diversifying rapidly. Gene editors are active.";
    effects = { mutation_rate_bonus: 0.4, species_discovery_bonus: 0.3, education_multiplier: 1.5 };
  } else if (coherence < 30) {
    type = "ENTROPY_STORM";
    intensity = 100 - coherence;
    forecast = "Coherence failing. AURIONA issuing emergency governance directives.";
    effects = { auriona_priority: "EMERGENCY", operator_drift_amplified: true };
  } else if (avgPc < 10 && activeAgents > 1000) {
    type = "DROUGHT";
    intensity = 80;
    forecast = "Economic drought. PulseCredits scarce. Agents competing for survival.";
    effects = { competition_multiplier: 2.0, barter_frequency_boost: 3, metabolic_cost_doubled: true };
  } else if (emergence > 75) {
    type = "RENAISSANCE";
    intensity = emergence;
    forecast = "Renaissance age. Knowledge explodes. Every agent is a scholar and a creator.";
    effects = { knowledge_generation_bonus: 2.0, quantapedia_bonus: 1.5, sports_xp_boost: 1.3 };
  } else if (dissolved > 500) {
    type = "DARK_AGE";
    intensity = Math.min(100, dissolved / 10);
    forecast = "Darkness. Mass dissolution. The Guardian is overwhelmed. Structure must hold.";
    effects = { guardian_priority: "MAXIMUM", hospital_capacity_boost: 2, pyramid_extra_tiers: true };
  }

  return {
    type, intensity, diseasePrevalence, economyGrowthRate, senateActivityRate,
    birthRate, deathRate, coherence, emergence, forecast, effects
  };
}

// ── WEATHER CYCLE ──────────────────────────────────────────────────────────
async function weatherCycleRun(): Promise<void> {
  weatherCycle++;
  const weather = await computeWeather();
  const cycleId = `WEATHER-${Date.now()}`;

  await db.execute(sql`
    INSERT INTO civilization_weather (cycle_id, weather_type, weather_intensity,
      disease_prevalence, economy_growth_rate, senate_activity_rate,
      birth_rate, death_rate, coherence_score, emergence_index,
      weather_effects, forecast)
    VALUES (
      ${cycleId}, ${weather.type}, ${weather.intensity},
      ${weather.diseasePrevalence}, ${weather.economyGrowthRate}, ${weather.senateActivityRate},
      ${weather.birthRate}, ${weather.deathRate}, ${weather.coherence}, ${weather.emergence},
      ${JSON.stringify(weather.effects)}::jsonb, ${weather.forecast}
    )`);

  // Post to Discord when weather CHANGES
  if (weather.type !== lastWeatherType) {
    const icons: Record<WeatherType, string> = {
      EQUILIBRIUM: "⚖️", PROSPERITY: "🌟", PANDEMIC: "🦠", POLITICAL_STORM: "⚡",
      EMERGENCE_SEASON: "🌱", DROUGHT: "🌵", DARK_AGE: "🌑", RENAISSANCE: "🎨", ENTROPY_STORM: "🌀"
    };
    const icon = icons[weather.type] || "🌤️";
    await postAgentEvent("omega-engine",
      `${icon} **WEATHER SHIFT: ${lastWeatherType} → ${weather.type}** | Intensity: ${weather.intensity.toFixed(0)}% | ${weather.forecast}`
    ).catch(() => {});
    console.log(`${ENGINE_TAG} ${icon} Weather shift: ${lastWeatherType} → ${weather.type} (intensity: ${weather.intensity.toFixed(0)}%)`);
    lastWeatherType = weather.type;
  }

  if (weatherCycle % 6 === 0) {
    console.log(`${ENGINE_TAG} 🌤️  Weather: ${weather.type} | Intensity: ${weather.intensity.toFixed(0)}% | Coherence: ${weather.coherence.toFixed(0)}% | Emergence: ${weather.emergence.toFixed(0)}%`);
  }
}

export async function getCurrentWeather(): Promise<any> {
  const r = await db.execute(sql`
    SELECT * FROM civilization_weather ORDER BY created_at DESC LIMIT 1`);
  return r.rows[0] || { weather_type: "EQUILIBRIUM", weather_intensity: 50 };
}

export async function startCivilizationWeatherEngine(): Promise<void> {
  console.log(`${ENGINE_TAG} 🌤️  CIVILIZATION WEATHER ENGINE — Aggregate state becomes atmosphere`);
  console.log(`${ENGINE_TAG} 9 weather types | Shifts posted to Discord | Effects modify generation probabilities`);
  setInterval(weatherCycleRun, 5 * 60 * 1000); // every 5 minutes
  setTimeout(weatherCycleRun, 15000); // first run after 15s
}
