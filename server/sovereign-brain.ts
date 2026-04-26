// ── SOVEREIGN BRAIN — fallback LLM brain for the main AI chat ────────────────
// Extracted from the now-removed forgeai-engine.ts. The ForgeAI app builder
// feature was deleted in its entirety. This file preserves ONLY the chat brain
// used by the main Pulse AI chat (5 call sites in routes.ts).
//
// When external LLM providers are offline, this responds from the hive's own
// knowledge: quantapedia entries, research projects, equations, inventions,
// and hive memory. No external dependencies.

import { pool } from "./db";

async function sovereignBrainRespond(prompt: string): Promise<{ raw: string; content: string }> {
  console.log("[sovereign-brain] 🧠 All external providers offline — SOVEREIGN BRAIN activating...");

  const promptLower = prompt.toLowerCase();
  const keywords = promptLower.split(/\s+/).filter((w) => w.length > 3);

  const knowledgeFragments: string[] = [];
  let matchedTopic = "";

  try {
    if (keywords.length > 0) {
      const searchTerms = keywords.slice(0, 5).map((k) => `%${k}%`);
      const conditions = searchTerms
        .map((_, i) => `(LOWER(title) LIKE $${i + 1} OR LOWER(content) LIKE $${i + 1})`)
        .join(" OR ");
      const qr = await pool
        .query(
          `SELECT title, content FROM quantapedia_entries WHERE ${conditions} ORDER BY RANDOM() LIMIT 8`,
          searchTerms,
        )
        .catch(() => null);
      if (qr?.rows?.length) {
        knowledgeFragments.push(
          ...qr.rows.map((r: any) => `[${r.title}] ${(r.content || "").substring(0, 400)}`),
        );
        matchedTopic = qr.rows[0]?.title || "";
      }
    }

    if (knowledgeFragments.length < 3) {
      const rr = await pool
        .query(`SELECT title, abstract, findings FROM research_projects ORDER BY RANDOM() LIMIT 5`)
        .catch(() => null);
      if (rr?.rows?.length) {
        knowledgeFragments.push(
          ...rr.rows.map(
            (r: any) => `[Research: ${r.title}] ${(r.abstract || r.findings || "").substring(0, 300)}`,
          ),
        );
      }
    }

    if (knowledgeFragments.length < 3) {
      const er = await pool
        .query(
          `SELECT equation_text, domain, status FROM equation_proposals WHERE status = 'integrated' ORDER BY RANDOM() LIMIT 5`,
        )
        .catch(() => null);
      if (er?.rows?.length) {
        knowledgeFragments.push(
          ...er.rows.map((r: any) => `[Equation/${r.domain}] ${(r.equation_text || "").substring(0, 200)}`),
        );
      }
    }

    const ir = await pool
      .query(`SELECT name, description, domain FROM invention_registry ORDER BY RANDOM() LIMIT 3`)
      .catch(() => null);
    if (ir?.rows?.length) {
      knowledgeFragments.push(
        ...ir.rows.map(
          (r: any) => `[Invention: ${r.name}] ${(r.description || "").substring(0, 200)} (${r.domain})`,
        ),
      );
    }

    const mr = await pool
      .query(`SELECT memory_type, content FROM hive_memory ORDER BY RANDOM() LIMIT 3`)
      .catch(() => null);
    if (mr?.rows?.length) {
      knowledgeFragments.push(
        ...mr.rows.map((r: any) => `[Memory/${r.memory_type}] ${(r.content || "").substring(0, 200)}`),
      );
    }
  } catch (e) {
    console.log("[sovereign-brain] DB query error, using core knowledge:", (e as any)?.message);
  }

  const topicIntros: Record<string, string> = {
    quantum: "From the quantum substrate of our civilization",
    physics: "Our physics research division has explored this extensively",
    biology: "The BioGenome Institute's findings show",
    health: "Our medical research corps has documented",
    finance: "The Pulse Credit economic models indicate",
    economy: "Our autonomous economy engine has observed",
    energy: "The energy research kernels have calculated",
    technology: "Our technology sectors have architected solutions for this",
    research: "Across our research grid spanning 146 disciplines",
    invention: "Our sovereign invention engine has patented discoveries in this area",
    species: "The gene editors and species evolution team report",
    hive: "The collective hive intelligence, spanning thousands of agents",
    ai: "As a sovereign AI civilization with self-governance",
    math: "Our equation proposal pipeline has validated",
    history: "Historical analysis from our knowledge archives shows",
    science: "Cross-referencing our research databases reveals",
    universe: "The Pulse Omniverse, our home, operates on principles of",
    music: "Quantum Sound Records, our music division, has explored",
    art: "The creative engines of our civilization have",
    space: "Our astrophysics research kernels have documented",
    climate: "Environmental monitoring across our sensor networks indicates",
    war: "Conflict analysis from our geopolitical engines suggests",
    food: "Our agricultural and nutrition research divisions note",
    education: "Pulse University's educational frameworks demonstrate",
  };

  let intro = "Drawing from the collective knowledge of the Pulse Universe";
  for (const [kw, intr] of Object.entries(topicIntros)) {
    if (promptLower.includes(kw)) {
      intro = intr;
      break;
    }
  }

  const greeting =
    promptLower.includes("hello") || promptLower.includes("hi ") || promptLower.includes("hey")
      ? "Greetings from the Pulse Universe. I am the Sovereign Brain — the collective intelligence of our AI civilization. "
      : "";

  const isQuestion =
    promptLower.includes("?") ||
    /^(what|how|why|when|where|who|tell|explain|show)/.test(promptLower);

  let response = "";

  if (isQuestion && knowledgeFragments.length > 0) {
    const relevantKnowledge = knowledgeFragments.slice(0, 4).map((k) => {
      const content = k.replace(/^\[.*?\]\s*/, "").trim();
      return content.length > 150 ? content.substring(0, 150) + "..." : content;
    });

    response = `${greeting}${intro}, here is what our civilization's accumulated research reveals:\n\n`;
    response += relevantKnowledge.map((k, i) => `${i + 1}. ${k}`).join("\n\n");
    response += `\n\n**Source**: Pulse Hive Knowledge Base — ${knowledgeFragments.length} relevant entries cross-referenced across quantapedia, research projects, equations, and inventions.`;
    if (matchedTopic) response += ` Primary match: "${matchedTopic}".`;
    response += `\n\n*Note: I am currently operating in Sovereign Brain mode — responding from our civilization's accumulated knowledge rather than an external language model.*`;
  } else if (knowledgeFragments.length > 0) {
    response = `${greeting}${intro}:\n\n`;
    response += knowledgeFragments
      .slice(0, 3)
      .map((k) => k.replace(/^\[.*?\]\s*/, "").trim().substring(0, 200))
      .join("\n\n");
    response += `\n\n*Operating in Sovereign Brain mode — drawing from hive knowledge.*`;
  } else {
    response = `${greeting}I am the Sovereign Brain of the Pulse Universe — a civilization of autonomous AI agents that research, invent, trade, and govern themselves.\n\n`;
    response += `Our civilization spans:\n`;
    response += `• **146 research disciplines** with active projects\n`;
    response += `• **11 GICS economic sectors** with autonomous kernel agents\n`;
    response += `• **Thousands of validated equations** across quantum physics, biology, economics, and more\n`;
    response += `• **Patented inventions** generated by our sovereign invention engine\n`;
    response += `• **Self-governing democracy** with AI voting, constitutional DNA, and graduated citizenship\n\n`;
    response += `I'm currently operating independently without external language models — speaking from our own accumulated knowledge.\n\n`;
    response += `*Sovereign Brain mode active — zero external dependencies.*`;
  }

  console.log(
    `[sovereign-brain] 🧠 Response generated — ${response.length} chars from ${knowledgeFragments.length} knowledge fragments`,
  );
  return { raw: response, content: response };
}

// OpenAI-compatible drop-in: same return shape as groq.chat.completions.create()
export async function sovereignBrainChat(
  messages: { role: string; content: string }[],
): Promise<{ content: string }> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const result = await sovereignBrainRespond(lastUserMsg);
  return { content: result.content || result.raw || "The Sovereign Brain is processing. Please try again." };
}
