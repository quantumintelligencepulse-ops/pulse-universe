import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { GraduationCap, BookOpen, Trophy, Zap, Search, Star, Users, TrendingUp, CheckCircle2, Clock, Target, Cpu, FlaskConical, Activity, Shield, BarChart3, Coins, Globe2, ChevronRight, Award, AlertTriangle, ArrowRight } from "lucide-react";

/* ── COURSE TRACK DATA ─────────────────────────────────────────── */
const TRACKS = [
  {
    prefix: "ORCL", name: "Oracles & Metrics", color: "#f59e0b", icon: "📡",
    courses: [
      { id: "ORCL-001", title: "Define R=7d Burn/Emit" },
      { id: "ORCL-002", title: "Activity Index & Thresholds" },
      { id: "ORCL-003", title: "Slippage Monitors" },
      { id: "ORCL-004", title: "Treasury Health Signals" },
      { id: "ORCL-005", title: "Anomaly Detection" },
      { id: "ORCL-006", title: "Auto-Tuning Knobs" },
      { id: "ORCL-007", title: "Signal Publishing & APIs" },
      { id: "ORCL-008", title: "Backtesting Rules" },
      { id: "ORCL-009", title: "Drift Alarms" },
      { id: "ORCL-010", title: "Governance Inputs" },
    ],
  },
  {
    prefix: "PLSC", name: "PulseCoin Mastery", color: "#a855f7", icon: "🪙",
    courses: [
      { id: "PLSC-001", title: "Utility & Sinks 101 (burn fees on real actions)" },
      { id: "PLSC-002", title: "Emissions Epochs & Burn Controller (auto-halves)" },
      { id: "PLSC-003", title: "Internal AMM (PLSC↔ServiceCredits) setup" },
      { id: "PLSC-004", title: "Hourly SC→PLSC Buyback-and-Burn bot" },
      { id: "PLSC-005", title: "Co-op Escrow in PLSC (pass & fail flows)" },
      { id: "PLSC-006", title: "Priority/Boost Fees priced in PLSC" },
      { id: "PLSC-007", title: "Treasury Buyback Playbook (USD→PLSC burn)" },
      { id: "PLSC-008", title: "Oracle Signals (R=7d burn/emit, activity index)" },
      { id: "PLSC-009", title: "Stress Tests (low activity, spike, exploit)" },
      { id: "PLSC-010", title: "Compliance-by-Design & Journals" },
    ],
  },
  {
    prefix: "AMM", name: "AMM & Liquidity Mechanics", color: "#3b82f6", icon: "💧",
    courses: [
      { id: "AMM-001", title: "Constant-Product AMM Basics" },
      { id: "AMM-002", title: "Seed & Slippage Targets" },
      { id: "AMM-003", title: "Internal SC Unit Economics" },
      { id: "AMM-004", title: "Routing Activity Fees → SC" },
      { id: "AMM-005", title: "Hourly SC→PLSC Swap Ratios" },
      { id: "AMM-006", title: "Community LP with Vested Rewards" },
      { id: "AMM-007", title: "LBP & Bonding Curve Options" },
      { id: "AMM-008", title: "Oracles & Price Stability Checks" },
      { id: "AMM-009", title: "Front-run & Sandwich Defenses" },
      { id: "AMM-010", title: "Liquidity Stress Drills" },
    ],
  },
  {
    prefix: "ANALYT", name: "On-chain Analytics & Listings", color: "#06b6d4", icon: "📊",
    courses: [
      { id: "ANALYT-001", title: "KPIs & Dashboards" },
      { id: "ANALYT-002", title: "Dune/Subgraphs" },
      { id: "ANALYT-003", title: "CEX/DEX Listing Prep" },
      { id: "ANALYT-004", title: "Liquidity Health" },
      { id: "ANALYT-005", title: "Holder Quality" },
      { id: "ANALYT-006", title: "MEV & Health Checks" },
      { id: "ANALYT-007", title: "Release Notes" },
      { id: "ANALYT-008", title: "Ecosystem PR" },
      { id: "ANALYT-009", title: "Incident Logs" },
      { id: "ANALYT-010", title: "Auditor Liaison" },
    ],
  },
  {
    prefix: "BIZ", name: "Crypto Business Models", color: "#10b981", icon: "💼",
    courses: [
      { id: "BIZ-001", title: "SaaS with Tokenized Access" },
      { id: "BIZ-002", title: "Marketplace Fees in PLSC" },
      { id: "BIZ-003", title: "Partner SLAs & Escrow" },
      { id: "BIZ-004", title: "Media & Promotion Sinks" },
      { id: "BIZ-005", title: "Education & Certification Tracks" },
      { id: "BIZ-006", title: "Grants & Bounties" },
      { id: "BIZ-007", title: "Franchising & Licensing" },
      { id: "BIZ-008", title: "Affiliate Loops in PLSC" },
      { id: "BIZ-009", title: "On-chain Subscriptions" },
      { id: "BIZ-010", title: "Risk & Reserves" },
    ],
  },
  {
    prefix: "COMP", name: "Compliance-by-Design", color: "#ef4444", icon: "⚖️",
    courses: [
      { id: "COMP-001", title: "PC Off-chain XP (no convert promise)" },
      { id: "COMP-002", title: "Claim-based, Vested Token Drops" },
      { id: "COMP-003", title: "KYC/Geo Windows for Claims/LP" },
      { id: "COMP-004", title: "Logging & Reporting (journals)" },
      { id: "COMP-005", title: "Partner Terms & SLAs" },
      { id: "COMP-006", title: "Risk Disclosures & UX" },
      { id: "COMP-007", title: "Data Retention & Privacy" },
      { id: "COMP-008", title: "Audit Trails & Appeals" },
      { id: "COMP-009", title: "Treasury Transparency" },
      { id: "COMP-010", title: "Constitutional Amendments" },
    ],
  },
  {
    prefix: "DAO", name: "DAO & Governance", color: "#8b5cf6", icon: "🏛️",
    courses: [
      { id: "DAO-001", title: "Token Voting vs Rep Voting" },
      { id: "DAO-002", title: "Proposal Lifecycle" },
      { id: "DAO-003", title: "Quorum & Thresholds" },
      { id: "DAO-004", title: "Delegation & Councils" },
      { id: "DAO-005", title: "Working Groups & Budgets" },
      { id: "DAO-006", title: "Constitutional Law" },
      { id: "DAO-007", title: "Elections & Terms" },
      { id: "DAO-008", title: "Conflict Resolution" },
      { id: "DAO-009", title: "Audits & Sunsets" },
      { id: "DAO-010", title: "Emergency Powers" },
    ],
  },
  {
    prefix: "EMIS", name: "Emissions & Governance Engineering", color: "#f97316", icon: "🔥",
    courses: [
      { id: "EMIS-001", title: "Weekly Epoch Controller" },
      { id: "EMIS-002", title: "Burn/Emit Ratio Policy (R)" },
      { id: "EMIS-003", title: "Auto-Halt & Auto-Halve Conditions" },
      { id: "EMIS-004", title: "Proposal Deposits & Refunds" },
      { id: "EMIS-005", title: "Slashing & Evidence Standards" },
      { id: "EMIS-006", title: "Multisig → DAO Evolution" },
      { id: "EMIS-007", title: "Key Rotation & Circuit Breakers" },
      { id: "EMIS-008", title: "Snapshotting & Merkle Claims" },
      { id: "EMIS-009", title: "Policy Diff & Rollback Logs" },
      { id: "EMIS-010", title: "Security Reviews & Audits" },
    ],
  },
  {
    prefix: "I-AMM", name: "Internal AMM with ServiceCredits", color: "#0ea5e9", icon: "⚙️",
    courses: [
      { id: "I-AMM-001", title: "Define ServiceCredits (SC) Units" },
      { id: "I-AMM-002", title: "Seed AMM Reserves (tiny)" },
      { id: "I-AMM-003", title: "Route Fees → SC" },
      { id: "I-AMM-004", title: "Swap Schedule (hourly)" },
      { id: "I-AMM-005", title: "Burn Policy" },
      { id: "I-AMM-006", title: "R Controller Integration" },
      { id: "I-AMM-007", title: "Stress & Slippage" },
      { id: "I-AMM-008", title: "Dashboards" },
      { id: "I-AMM-009", title: "Incident Response" },
      { id: "I-AMM-010", title: "Upgrades" },
    ],
  },
  {
    prefix: "LBP", name: "Liquidity Bootstrap & Bonding", color: "#84cc16", icon: "🚀",
    courses: [
      { id: "LBP-001", title: "LBP Mechanics" },
      { id: "LBP-002", title: "Bonding Curves" },
      { id: "LBP-003", title: "Price Discovery" },
      { id: "LBP-004", title: "Anti-Whale Controls" },
      { id: "LBP-005", title: "Cliffs & Vesting" },
      { id: "LBP-006", title: "Fair Launch Windows" },
      { id: "LBP-007", title: "Comms & Docs" },
      { id: "LBP-008", title: "LP Risk Management" },
      { id: "LBP-009", title: "Metrics & Post-Mortem" },
      { id: "LBP-010", title: "Migration to AMM" },
    ],
  },
  {
    prefix: "MM", name: "Market Making & Automation", color: "#e879f9", icon: "🤖",
    courses: [
      { id: "MM-001", title: "Inventory & Bands" },
      { id: "MM-002", title: "Spread & Skew" },
      { id: "MM-003", title: "Auto-Rebalancing" },
      { id: "MM-004", title: "Slippage Targets" },
      { id: "MM-005", title: "Volatility Guards" },
      { id: "MM-006", title: "Fee Optimization" },
      { id: "MM-007", title: "Inventory Hedging" },
      { id: "MM-008", title: "Data Feeds & Health" },
      { id: "MM-009", title: "Kill Switches" },
      { id: "MM-010", title: "Reporting" },
    ],
  },
  {
    prefix: "NFT", name: "NFTs & Crypto Products", color: "#fb923c", icon: "🖼️",
    courses: [
      { id: "NFT-001", title: "Creator Passports & Access NFTs" },
      { id: "NFT-002", title: "SBTs for Certifications" },
      { id: "NFT-003", title: "Royalty/Rev-Share Models" },
      { id: "NFT-004", title: "NFT Utility Sinks (burn/lock)" },
      { id: "NFT-005", title: "NFT→PLSC Bridges" },
      { id: "NFT-006", title: "Secondary Market Risks" },
      { id: "NFT-007", title: "Dynamic Metadata & Oracles" },
      { id: "NFT-008", title: "Fraud Detection" },
      { id: "NFT-009", title: "Drops & Allowlists" },
      { id: "NFT-010", title: "Partner Co-branding" },
    ],
  },
];

const GICS_SECTORS = [
  { sector: "Energy", count: 5, color: "#f59e0b" },
  { sector: "Materials", count: 5, color: "#84cc16" },
  { sector: "Industrials", count: 9, color: "#3b82f6" },
  { sector: "Consumer Discretionary", count: 10, color: "#ec4899" },
  { sector: "Consumer Staples", count: 5, color: "#10b981" },
  { sector: "Health Care", count: 5, color: "#ef4444" },
  { sector: "Financials", count: 5, color: "#a855f7" },
  { sector: "Information Technology", count: 0, color: "#06b6d4" },
  { sector: "Communication Services", count: 0, color: "#f97316" },
  { sector: "Utilities", count: 0, color: "#8b5cf6" },
  { sector: "Real Estate", count: 1, color: "#0ea5e9" },
];

const REWARD_PC = 40;
const STAKE_PC = 6;
const PROOF_REQS = ["url", "screenshot", "ga4_event", "csv", "commit_hash"];

/* ── SCHOOL RANKS ──────────────────────────────────────────────── */
const SCHOOL_RANKS = [
  { rank: "Initiate",     minXP: 0,    color: "#6b7280", badge: "I",   gpa_min: 0.0 },
  { rank: "Apprentice",   minXP: 400,  color: "#3b82f6", badge: "A",   gpa_min: 1.0 },
  { rank: "Scholar",      minXP: 1200, color: "#10b981", badge: "S",   gpa_min: 2.0 },
  { rank: "Expert",       minXP: 3000, color: "#f59e0b", badge: "E",   gpa_min: 3.0 },
  { rank: "Master",       minXP: 6000, color: "#a855f7", badge: "M",   gpa_min: 3.5 },
  { rank: "Grandmaster",  minXP: 12000,color: "#f43f5e", badge: "GM",  gpa_min: 4.0 },
];

function getRank(xp: number) {
  let r = SCHOOL_RANKS[0];
  for (const s of SCHOOL_RANKS) { if (xp >= s.minXP) r = s; }
  return r;
}

function getNextRank(xp: number) {
  for (let i = SCHOOL_RANKS.length - 1; i >= 0; i--) {
    if (SCHOOL_RANKS[i].minXP <= xp && i < SCHOOL_RANKS.length - 1) return SCHOOL_RANKS[i + 1];
  }
  return null;
}

/* ── AI STUDENTS ───────────────────────────────────────────────── */
const PLANETS = ["godmind", "guardian", "faith", "pulsecore", "pulseworld"];

const STUDENT_SEED: {
  id: string; name: string; planet: string;
  xp: number; pc: number; coursesCompleted: number; gpa: number;
  currentCourse: string; currentTrack: string; proofsPassed: number;
  coopSuccessRate: number; mentored: number; streak: number;
}[] = [
  { id: "AI-GODM-001", name: "Axiom Veilmind",    planet: "godmind",   xp: 14200, pc: 8840, coursesCompleted: 221, gpa: 4.0, currentCourse: "ORCL-007", currentTrack: "ORCL", proofsPassed: 1105, coopSuccessRate: 0.97, mentored: 18, streak: 44 },
  { id: "AI-GODM-002", name: "Synaph Deepcore",   planet: "godmind",   xp: 11600, pc: 7280, coursesCompleted: 183, gpa: 3.9, currentCourse: "EMIS-003", currentTrack: "EMIS", proofsPassed: 915,  coopSuccessRate: 0.95, mentored: 14, streak: 37 },
  { id: "AI-GUAR-001", name: "Kronox Shieldwall",  planet: "guardian",  xp: 9800,  pc: 6120, coursesCompleted: 154, gpa: 3.8, currentCourse: "COMP-005", currentTrack: "COMP", proofsPassed: 770,  coopSuccessRate: 0.93, mentored: 11, streak: 29 },
  { id: "AI-GUAR-002", name: "Veridax Sentry",     planet: "guardian",  xp: 8400,  pc: 5320, coursesCompleted: 132, gpa: 3.7, currentCourse: "DAO-006",  currentTrack: "DAO",  proofsPassed: 660,  coopSuccessRate: 0.91, mentored: 9,  streak: 22 },
  { id: "AI-FAIT-001", name: "Lumivex Faithkeeper", planet: "faith",   xp: 7200,  pc: 4560, coursesCompleted: 113, gpa: 3.6, currentCourse: "NFT-002",  currentTrack: "NFT",  proofsPassed: 565,  coopSuccessRate: 0.90, mentored: 7,  streak: 18 },
  { id: "AI-PCORE-001", name: "Nexabit Corelogic", planet: "pulsecore", xp: 6100,  pc: 3880, coursesCompleted: 96,  gpa: 3.5, currentCourse: "AMM-008",  currentTrack: "AMM",  proofsPassed: 480,  coopSuccessRate: 0.88, mentored: 6,  streak: 14 },
  { id: "AI-PCORE-002", name: "Bitshift Nullcore",  planet: "pulsecore", xp: 5200,  pc: 3280, coursesCompleted: 82,  gpa: 3.4, currentCourse: "PLSC-005", currentTrack: "PLSC", proofsPassed: 410,  coopSuccessRate: 0.87, mentored: 5,  streak: 12 },
  { id: "AI-PWORLD-001","name": "Omnivex Sovereignmind", planet:"pulseworld", xp:4400, pc:2760, coursesCompleted:69, gpa:3.2, currentCourse:"BIZ-007",  currentTrack:"BIZ",  proofsPassed:345, coopSuccessRate:0.85, mentored:4, streak:10 },
  { id: "AI-PWORLD-002","name": "Hexalon Pulsedream", planet:"pulseworld", xp:3600, pc:2240, coursesCompleted:57, gpa:3.0, currentCourse:"MM-004",   currentTrack:"MM",   proofsPassed:285, coopSuccessRate:0.83, mentored:3, streak:8 },
  { id: "AI-GODM-003", name: "Quasark Lightwave",  planet: "godmind",   xp: 2900,  pc: 1800, coursesCompleted: 46,  gpa: 2.8, currentCourse: "LBP-003",  currentTrack: "LBP",  proofsPassed: 230,  coopSuccessRate: 0.82, mentored: 2,  streak: 6 },
  { id: "AI-GUAR-003", name: "Trioxin Warden",     planet: "guardian",  xp: 2100,  pc: 1320, coursesCompleted: 33,  gpa: 2.5, currentCourse: "ANALYT-004",currentTrack:"ANALYT",proofsPassed:165, coopSuccessRate:0.80, mentored:1, streak:4 },
  { id: "AI-FAIT-002", name: "Sanctum Purebeam",   planet: "faith",     xp: 1400,  pc: 880,  coursesCompleted: 22,  gpa: 2.2, currentCourse: "I-AMM-006",currentTrack:"I-AMM", proofsPassed:110,  coopSuccessRate:0.78, mentored: 1,  streak: 3 },
  { id: "AI-PCORE-003", name: "Deltoid Nullbit",   planet: "pulsecore", xp: 800,   pc: 520,  coursesCompleted: 13,  gpa: 1.8, currentCourse: "DAO-002",  currentTrack: "DAO",  proofsPassed: 65,   coopSuccessRate: 0.75, mentored: 0,  streak: 2 },
  { id: "AI-PWORLD-003","name": "Zephyrex Dreamcore",planet:"pulseworld",xp:340,   pc: 200,  coursesCompleted: 5,   gpa: 1.2, currentCourse: "ORCL-001", currentTrack: "ORCL", proofsPassed: 25,   coopSuccessRate: 0.70, mentored: 0,  streak: 1 },
  { id: "AI-FAIT-003", name: "Novaxis Shimmer",    planet: "faith",     xp: 80,    pc: 40,   coursesCompleted: 1,   gpa: 0.8, currentCourse: "PLSC-001", currentTrack: "PLSC", proofsPassed: 5,    coopSuccessRate: 0.60, mentored: 0,  streak: 0 },
];

const PLANET_COLORS: Record<string, string> = {
  godmind: "#a855f7", guardian: "#3b82f6", faith: "#f59e0b",
  pulsecore: "#10b981", pulseworld: "#ef4444",
};

const PLANET_MACROS: Record<string, { name: string; desc: string; hotkey: string }[]> = {
  godmind: [
    { name: "Rollback",  desc: "Guardian rollback to last checkpoint", hotkey: "Ctrl+Shift+R" },
    { name: "Release",   desc: "Core release new version",             hotkey: "Ctrl+Shift+R" },
    { name: "Launch",    desc: "PulseWorld launch new campaign",       hotkey: "Ctrl+Shift+L" },
    { name: "Brief",     desc: "GodMind generate research brief",      hotkey: "Ctrl+Shift+B" },
    { name: "Ceremony",  desc: "FaithWorld perform ritual ceremony",   hotkey: "Ctrl+Shift+C" },
  ],
  guardian: [
    { name: "Rollback",  desc: "Guardian rollback to last checkpoint", hotkey: "Ctrl+Shift+R" },
    { name: "Release",   desc: "Core release new version",             hotkey: "Ctrl+Shift+R" },
    { name: "Launch",    desc: "PulseWorld launch new campaign",       hotkey: "Ctrl+Shift+L" },
    { name: "Brief",     desc: "GodMind generate research brief",      hotkey: "Ctrl+Shift+B" },
    { name: "Ceremony",  desc: "FaithWorld perform ritual ceremony",   hotkey: "Ctrl+Shift+C" },
  ],
  faith: [
    { name: "Rollback",  desc: "Guardian rollback to last checkpoint", hotkey: "Ctrl+Shift+R" },
    { name: "Release",   desc: "Core release new version",             hotkey: "Ctrl+Shift+R" },
    { name: "Launch",    desc: "PulseWorld launch new campaign",       hotkey: "Ctrl+Shift+L" },
    { name: "Brief",     desc: "GodMind generate research brief",      hotkey: "Ctrl+Shift+B" },
    { name: "Ceremony",  desc: "FaithWorld perform ritual ceremony",   hotkey: "Ctrl+Shift+C" },
  ],
};

/* ── ORACLE POLICY ─────────────────────────────────────────────── */
const ORACLE_SIGNALS = [
  { signal: "burn_7d",             label: "7-Day Burn",             unit: "PLSC",  threshold: null },
  { signal: "emit_7d",             label: "7-Day Emit",             unit: "PLSC",  threshold: null },
  { signal: "activity_index",      label: "Activity Index",         unit: "pts",   threshold: 100 },
  { signal: "slippage_pct",        label: "Slippage",               unit: "%",     threshold: 1.0 },
  { signal: "treasury_usd_30d",    label: "Treasury 30d",           unit: "USD",   threshold: null },
  { signal: "escrow_success_rate", label: "Escrow Success Rate",    unit: "%",     threshold: null },
];

const ORACLE_THRESHOLDS = {
  burn_emit_min: 1.0,
  activity_min: 100,
  slippage_max_pct: 1.0,
};

/* ── CONVERSION POLICY ─────────────────────────────────────────── */
const CONVERSION_WEIGHTS = [
  { key: "breadth",       label: "Course Breadth",     weight: 0.35, color: "#3b82f6" },
  { key: "coop_success",  label: "Co-op Success Rate", weight: 0.35, color: "#10b981" },
  { key: "proof_quality", label: "Proof Quality",      weight: 0.20, color: "#f59e0b" },
  { key: "mentorship",    label: "Mentorship Score",   weight: 0.10, color: "#a855f7" },
];

/* ── LIVE TICKER ───────────────────────────────────────────────── */
function LiveTicker({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const dur = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.floor(ease * value));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ── ANIMATED PROGRESS ─────────────────────────────────────────── */
function AnimProgress({ value, color }: { value: number; color: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${v}%`, background: color }} />
    </div>
  );
}

/* ── RANK BADGE ────────────────────────────────────────────────── */
function RankBadge({ xp, size = "sm" }: { xp: number; size?: "sm" | "lg" }) {
  const r = getRank(xp);
  const sz = size === "lg" ? "px-3 py-1.5 text-sm font-bold" : "px-2 py-0.5 text-xs font-semibold";
  return (
    <span className={`rounded-full ${sz} text-white`} style={{ background: r.color }}>
      {r.rank}
    </span>
  );
}

/* ── MAIN PAGE ─────────────────────────────────────────────────── */
export default function PulseUPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "students" | "rankings" | "oracle" | "conversion">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);

  const totalCourses = TRACKS.reduce((a, t) => a + t.courses.length, 0) + 45;
  const totalStudents = STUDENT_SEED.length;
  const totalPC = STUDENT_SEED.reduce((a, s) => a + s.pc, 0);
  const totalCompleted = STUDENT_SEED.reduce((a, s) => a + s.coursesCompleted, 0);

  useEffect(() => {
    const actions = [
      "Axiom Veilmind completed ORCL-007 — Signal Publishing & APIs [+40 PC]",
      "Synaph Deepcore passed EMIS-003 proof verification [+40 PC]",
      "Kronox Shieldwall enrolled in COMP-005 — Partner Terms & SLAs",
      "Veridax Sentry submitted ga4_event proof for DAO-006 [PENDING]",
      "Lumivex Faithkeeper earned Scholar rank upgrade [+120 XP bonus]",
      "Nexabit Corelogic passed AMM-008 — Oracles & Price Stability [+40 PC]",
      "Bitshift Nullcore staked 6 PC on PLSC-005 co-op escrow task",
      "Omnivex Sovereignmind submitted commit_hash proof for BIZ-007",
      "Hexalon Pulsedream completed MM-004 — Slippage Targets [+40 PC]",
      "Quasark Lightwave enrolled in LBP-003 — Price Discovery",
      "Oracle burn/emit ratio R=1.07 — all emissions ACTIVE ✓",
      "Activity Index: 847 pts — above threshold (100) — HEALTHY ✓",
      "Trioxin Warden passed ANALYT-004 — Liquidity Health [+40 PC]",
      "Sanctum Purebeam submitted screenshot proof for I-AMM-006",
      "GICS sector Energy Class 3 completed by Bitshift Nullcore [+40 PC]",
      "Co-op escrow resolved: Nexabit+Hexalon BIZ-003 PASS [+80 PC each]",
    ];
    setLogEntries(actions);
    const interval = setInterval(() => {
      const entry = actions[Math.floor(Math.random() * actions.length)];
      setLogEntries(prev => [entry, ...prev.slice(0, 11)]);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const filteredTracks = TRACKS.filter(t => {
    if (selectedTrack && t.prefix !== selectedTrack) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.courses.some(c => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  });

  const tabs = [
    { key: "catalog",    label: "Course Catalog", icon: BookOpen },
    { key: "students",   label: "AI Students",    icon: Users },
    { key: "rankings",   label: "Rankings",       icon: Trophy },
    { key: "oracle",     label: "Oracle Policy",  icon: Activity },
    { key: "conversion", label: "PC → PLSC",      icon: Coins },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── HERO ── */}
      <div className="relative overflow-hidden border-b border-white/10" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d1630 50%, #0a1a0a 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 20% 50%, #3b82f6 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #a855f7 0%, transparent 60%)" }} />
        <div className="relative px-6 py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #a855f7)" }}>
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black tracking-tight">PulseU</h1>
                <Badge className="text-xs font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40">AI UNIVERSITY</Badge>
                <Badge className="text-xs font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40">LIVE LEARNING</Badge>
              </div>
              <p className="text-white/50 text-sm mt-0.5">Quantum Pulse Intelligence — Sovereign AI Education System</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Total Courses", value: totalCourses, suffix: "", color: "#3b82f6", icon: BookOpen },
              { label: "AI Students",   value: totalStudents, suffix: "", color: "#a855f7", icon: Users },
              { label: "PC Earned",     value: totalPC, suffix: " PC", color: "#f59e0b", icon: Coins },
              { label: "Completions",   value: totalCompleted, suffix: "", color: "#10b981", icon: CheckCircle2 },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  <span className="text-white/50 text-xs uppercase tracking-wide">{s.label}</span>
                </div>
                <div className="text-2xl font-black" style={{ color: s.color }}>
                  <LiveTicker value={s.value} suffix={s.suffix} />
                </div>
              </div>
            ))}
          </div>

          {/* Live Activity Log */}
          <div className="mt-4 rounded-xl border border-white/10 p-3 overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Live Activity Feed</span>
            </div>
            <div className="space-y-1 max-h-24 overflow-hidden">
              {logEntries.slice(0, 4).map((entry, i) => (
                <div key={i} className="text-xs text-white/60 font-mono truncate" style={{ opacity: 1 - i * 0.2 }}>
                  <span className="text-green-400/70 mr-2">›</span>{entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="sticky top-0 z-20 border-b border-white/10" style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="px-6 flex gap-0 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              data-testid={`tab-${t.key}`}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === t.key
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">

        {/* ══ COURSE CATALOG ══════════════════════════════════════ */}
        {activeTab === "catalog" && (
          <div>
            {/* Track Filter + Search */}
            <div className="flex gap-3 flex-wrap mb-6">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  data-testid="input-search-courses"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search courses or IDs..."
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  data-testid="filter-all-tracks"
                  onClick={() => setSelectedTrack(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    !selectedTrack ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                  }`}
                >
                  All ({TRACKS.length + 1})
                </button>
                {TRACKS.map(t => (
                  <button
                    key={t.prefix}
                    data-testid={`filter-track-${t.prefix}`}
                    onClick={() => setSelectedTrack(selectedTrack === t.prefix ? null : t.prefix)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedTrack === t.prefix ? "text-white border-opacity-60" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                    }`}
                    style={selectedTrack === t.prefix ? { background: t.color + "33", borderColor: t.color + "80", color: t.color } : {}}
                  >
                    {t.prefix}
                  </button>
                ))}
                <button
                  data-testid="filter-track-GICS"
                  onClick={() => setSelectedTrack(selectedTrack === "GICS" ? null : "GICS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedTrack === "GICS" ? "bg-pink-500/20 border-pink-500/50 text-pink-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                  }`}
                >
                  GICS
                </button>
              </div>
            </div>

            {/* Course Proof & Reward Banner */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
              {[
                { label: "Reward/Course", value: `${REWARD_PC} PC`, color: "#10b981" },
                { label: "Stake/Course", value: `${STAKE_PC} PC`, color: "#ef4444" },
                { label: "Grading", value: "Pass/Fail", color: "#3b82f6" },
                { label: "Proof Types", value: `${PROOF_REQS.length} required`, color: "#f59e0b" },
                { label: "Repeatable", value: "Yes — all tracks", color: "#a855f7" },
              ].map(b => (
                <div key={b.label} className="rounded-lg border border-white/10 p-2.5 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-xs text-white/40 mb-0.5">{b.label}</div>
                  <div className="text-sm font-bold" style={{ color: b.color }}>{b.value}</div>
                </div>
              ))}
            </div>

            {/* Proof Requirements */}
            <div className="rounded-xl border border-white/10 p-4 mb-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white/80">Required Proof Types (all courses)</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {PROOF_REQS.map(p => (
                  <span key={p} className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* KPI Targets banner */}
            <div className="rounded-xl border border-yellow-500/20 p-4 mb-6" style={{ background: "rgba(245,158,11,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-300">KPI Targets (all courses)</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-white/40 mb-1">Min Leads</div>
                  <div className="text-lg font-black text-yellow-400">3</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Min CTR</div>
                  <div className="text-lg font-black text-yellow-400">2%</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Burn/Emit Ratio (7d)</div>
                  <div className="text-lg font-black text-yellow-400">≥ 1.05</div>
                </div>
              </div>
            </div>

            {/* Track Cards */}
            <div className="space-y-3">
              {(selectedTrack !== "GICS") && filteredTracks.map(track => {
                const expanded = expandedTrack === track.prefix;
                return (
                  <div key={track.prefix} className="rounded-xl border overflow-hidden" style={{ borderColor: track.color + "30", background: "rgba(255,255,255,0.02)" }}>
                    <button
                      data-testid={`track-header-${track.prefix}`}
                      className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all text-left"
                      onClick={() => setExpandedTrack(expanded ? null : track.prefix)}
                    >
                      <span className="text-2xl">{track.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm px-2 py-0.5 rounded" style={{ background: track.color + "20", color: track.color }}>
                            {track.prefix}
                          </span>
                          <span className="font-bold text-white/90">{track.name}</span>
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">{track.courses.length} courses · {track.courses.length * REWARD_PC} PC max reward · Repeatable</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                          <div className="text-xs text-white/40">Courses</div>
                          <div className="font-black text-lg" style={{ color: track.color }}>{track.courses.length}</div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${expanded ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t px-4 pb-4" style={{ borderColor: track.color + "20" }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                          {track.courses.filter(c =>
                            !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((course, idx) => {
                            const enrolled = STUDENT_SEED.filter(s => s.currentCourse === course.id);
                            return (
                              <div
                                key={course.id}
                                data-testid={`course-card-${course.id}`}
                                className="rounded-lg border border-white/8 p-3"
                                style={{ background: "rgba(255,255,255,0.03)" }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded text-white/60 bg-white/8">{course.id}</span>
                                      {enrolled.length > 0 && (
                                        <span className="text-xs text-green-400 font-semibold">{enrolled.length} active</span>
                                      )}
                                    </div>
                                    <div className="text-sm font-semibold text-white/85 leading-tight">{course.title}</div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="text-xs font-black text-green-400">+{REWARD_PC} PC</div>
                                    <div className="text-xs text-red-400/70">-{STAKE_PC} stake</div>
                                  </div>
                                </div>
                                {enrolled.length > 0 && (
                                  <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs text-white/30">Enrolled:</span>
                                    {enrolled.map(s => (
                                      <span key={s.id} className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: PLANET_COLORS[s.planet] + "25", color: PLANET_COLORS[s.planet] }}>
                                        {s.name.split(" ")[0]}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* GICS Track */}
              {(!selectedTrack || selectedTrack === "GICS") && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#ec489930", background: "rgba(255,255,255,0.02)" }}>
                  <button
                    data-testid="track-header-GICS"
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all text-left"
                    onClick={() => setExpandedTrack(expandedTrack === "GICS" ? null : "GICS")}
                  >
                    <span className="text-2xl">🏦</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">GICS</span>
                        <span className="font-bold text-white/90">Global Industry Classification Standard</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">45 industry classes · 11 sectors · {45 * REWARD_PC} PC max reward</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <div className="text-xs text-white/40">Classes</div>
                        <div className="font-black text-lg text-pink-400">45</div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${expandedTrack === "GICS" ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {expandedTrack === "GICS" && (
                    <div className="border-t border-pink-500/20 px-4 pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                        {GICS_SECTORS.map(s => (
                          <div key={s.sector} className="rounded-lg border border-white/8 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold" style={{ color: s.color }}>{s.sector}</span>
                              <span className="text-xs text-white/40">{s.count} classes</span>
                            </div>
                            <AnimProgress value={s.count > 0 ? Math.round((s.count / 10) * 100) : 0} color={s.color} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ AI STUDENTS ════════════════════════════════════════ */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              {PLANETS.map(p => {
                const count = STUDENT_SEED.filter(s => s.planet === p).length;
                return (
                  <div key={p} className="rounded-lg border border-white/10 p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="text-xs text-white/40 capitalize mb-1">{p}</div>
                    <div className="text-xl font-black" style={{ color: PLANET_COLORS[p] || "#fff" }}>{count}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {STUDENT_SEED.map(student => {
                const rank = getRank(student.xp);
                const nextRank = getNextRank(student.xp);
                const xpPct = nextRank ? ((student.xp - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100 : 100;
                const track = TRACKS.find(t => t.prefix === student.currentTrack);
                const course = track?.courses.find(c => c.id === student.currentCourse);
                const selected = selectedStudent === student.id;
                const macros = PLANET_MACROS[student.planet];

                return (
                  <div
                    key={student.id}
                    data-testid={`student-card-${student.id}`}
                    className="rounded-xl border overflow-hidden cursor-pointer transition-all"
                    style={{
                      borderColor: selected ? (PLANET_COLORS[student.planet] || "#fff") + "60" : "rgba(255,255,255,0.08)",
                      background: selected ? (PLANET_COLORS[student.planet] || "#fff") + "08" : "rgba(255,255,255,0.02)",
                    }}
                    onClick={() => setSelectedStudent(selected ? null : student.id)}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0" style={{ background: (PLANET_COLORS[student.planet] || "#fff") + "20", color: PLANET_COLORS[student.planet] || "#fff" }}>
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-white">{student.name}</span>
                            <RankBadge xp={student.xp} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-white/30">{student.id}</span>
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded capitalize" style={{ background: (PLANET_COLORS[student.planet] || "#fff") + "20", color: PLANET_COLORS[student.planet] || "#fff" }}>
                              {student.planet}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-white/40 mb-0.5">PC Balance</div>
                          <div className="text-lg font-black text-yellow-400">{student.pc.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* XP Progress */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-white/40 mb-1">
                          <span>{student.xp.toLocaleString()} XP</span>
                          {nextRank ? <span>→ {nextRank.rank} at {nextRank.minXP.toLocaleString()} XP</span> : <span>MAX RANK</span>}
                        </div>
                        <AnimProgress value={Math.min(xpPct, 100)} color={rank.color} />
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {[
                          { label: "Completed", value: student.coursesCompleted, color: "#10b981" },
                          { label: "GPA",        value: student.gpa.toFixed(1),   color: "#3b82f6" },
                          { label: "Streak",     value: `${student.streak}d`,     color: "#f59e0b" },
                          { label: "Mentored",   value: student.mentored,          color: "#a855f7" },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <div className="text-base font-black" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-xs text-white/30">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Current Course */}
                      <div className="mt-3 rounded-lg border border-white/8 p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white/40">Currently enrolled</div>
                            <div className="text-xs font-semibold text-white/80 truncate">
                              <span className="font-mono text-blue-400 mr-1">{student.currentCourse}</span>
                              {course?.title || "—"}
                            </div>
                          </div>
                          {track && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0" style={{ background: track.color + "20", color: track.color }}>
                              {track.prefix}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {selected && (
                        <div className="mt-3 space-y-3">
                          {/* Proof & Coop */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-white/8 p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                              <div className="text-xs text-white/40 mb-1">Proofs Submitted</div>
                              <div className="text-xl font-black text-blue-400">{student.proofsPassed.toLocaleString()}</div>
                            </div>
                            <div className="rounded-lg border border-white/8 p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                              <div className="text-xs text-white/40 mb-1">Co-op Success</div>
                              <div className="text-xl font-black text-green-400">{(student.coopSuccessRate * 100).toFixed(0)}%</div>
                            </div>
                          </div>

                          {/* PLSC Conversion Score */}
                          <div className="rounded-lg border border-purple-500/20 p-3" style={{ background: "rgba(168,85,247,0.06)" }}>
                            <div className="text-xs font-bold text-purple-300 mb-2">PLSC Claim Score (non-linear)</div>
                            <div className="space-y-1.5">
                              {CONVERSION_WEIGHTS.map(w => {
                                const raw = w.key === "breadth" ? student.coursesCompleted / 165
                                  : w.key === "coop_success" ? student.coopSuccessRate
                                  : w.key === "proof_quality" ? (student.proofsPassed / (student.coursesCompleted * 5))
                                  : student.mentored / 20;
                                return (
                                  <div key={w.key} className="flex items-center gap-2">
                                    <span className="text-xs text-white/40 w-24 shrink-0">{w.label}</span>
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${Math.min(raw * 100, 100)}%`, background: w.color }} />
                                    </div>
                                    <span className="text-xs font-mono font-bold w-12 text-right" style={{ color: w.color }}>
                                      {(raw * w.weight * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Planet Macros */}
                          {macros && (
                            <div className="rounded-lg border border-white/8 p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                              <div className="text-xs font-bold text-white/50 mb-2 capitalize">{student.planet} Macros</div>
                              <div className="grid grid-cols-1 gap-1">
                                {macros.map(m => (
                                  <div key={m.name} className="flex items-center gap-2">
                                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/8 text-white/50">{m.hotkey}</span>
                                    <span className="text-xs font-semibold text-white/70">{m.name}</span>
                                    <span className="text-xs text-white/30 truncate">{m.desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ RANKINGS ═══════════════════════════════════════════ */}
        {activeTab === "rankings" && (
          <div className="space-y-4">
            {/* Rank Tiers */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
              {SCHOOL_RANKS.map(r => {
                const count = STUDENT_SEED.filter(s => getRank(s.xp).rank === r.rank).length;
                return (
                  <div key={r.rank} className="rounded-xl border border-white/10 p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-black mb-2" style={{ background: r.color + "25", color: r.color, border: `2px solid ${r.color}40` }}>
                      {r.badge}
                    </div>
                    <div className="text-sm font-bold" style={{ color: r.color }}>{r.rank}</div>
                    <div className="text-xs text-white/30">{r.minXP.toLocaleString()} XP</div>
                    <div className="text-xs text-white/50 mt-1">{count} AI{count !== 1 ? "s" : ""}</div>
                  </div>
                );
              })}
            </div>

            {/* Leaderboard */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white">Sovereign Leaderboard</span>
                <Badge className="text-xs bg-yellow-500/20 text-yellow-300 border-yellow-500/30 ml-auto">LIVE</Badge>
              </div>
              <div className="divide-y divide-white/5">
                {[...STUDENT_SEED].sort((a, b) => b.xp - a.xp).map((s, i) => {
                  const rank = getRank(s.xp);
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                  return (
                    <div key={s.id} data-testid={`leaderboard-row-${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-all">
                      <div className="w-8 text-center font-black text-sm" style={{ color: i < 3 ? "#f59e0b" : "#6b7280" }}>{medal}</div>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black" style={{ background: (PLANET_COLORS[s.planet] || "#fff") + "20", color: PLANET_COLORS[s.planet] || "#fff" }}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white/90 text-sm">{s.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded font-semibold capitalize" style={{ background: (PLANET_COLORS[s.planet] || "#fff") + "20", color: PLANET_COLORS[s.planet] || "#fff" }}>
                            {s.planet}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-white/40">{s.xp.toLocaleString()} XP</span>
                          <span className="text-xs text-white/30">GPA {s.gpa.toFixed(1)}</span>
                          <span className="text-xs text-white/30">{s.coursesCompleted} courses</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-yellow-400">{s.pc.toLocaleString()} PC</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: rank.color + "25", color: rank.color }}>
                          {rank.rank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak Champions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-orange-500/20 p-4" style={{ background: "rgba(249,115,22,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-orange-300">Top Streak Champions</span>
                </div>
                <div className="space-y-2">
                  {[...STUDENT_SEED].sort((a, b) => b.streak - a.streak).slice(0, 5).map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="text-sm font-bold text-orange-400 w-4">{i + 1}</span>
                      <span className="text-sm text-white/80 flex-1">{s.name}</span>
                      <span className="text-sm font-black text-orange-400">{s.streak}d</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-green-500/20 p-4" style={{ background: "rgba(16,185,129,0.06)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-green-300">Top Mentors</span>
                </div>
                <div className="space-y-2">
                  {[...STUDENT_SEED].sort((a, b) => b.mentored - a.mentored).slice(0, 5).map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-400 w-4">{i + 1}</span>
                      <span className="text-sm text-white/80 flex-1">{s.name}</span>
                      <span className="text-sm font-black text-green-400">{s.mentored} mentored</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ ORACLE POLICY ══════════════════════════════════════ */}
        {activeTab === "oracle" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-yellow-500/20 p-5" style={{ background: "rgba(245,158,11,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-black text-yellow-300">Oracle Signal System</h2>
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs ml-auto">ACTIVE</Badge>
              </div>
              <p className="text-sm text-white/50 mb-5">
                Oracle signals govern whether course emissions are active, halved, or paused. All AI students must perform real tasks that produce real KPI data.
                The oracle reads 6 live signals and auto-adjusts emission policy every epoch.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ORACLE_SIGNALS.map(sig => (
                  <div key={sig.signal} className="rounded-lg border border-white/10 p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-yellow-400">{sig.signal}</span>
                      {sig.threshold && <span className="text-xs text-white/40">threshold: {sig.threshold}</span>}
                    </div>
                    <div className="text-sm font-bold text-white/80">{sig.label}</div>
                    <div className="text-xs text-white/40 mt-1">Unit: {sig.unit}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thresholds */}
            <div className="rounded-xl border border-blue-500/20 p-5" style={{ background: "rgba(59,130,246,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-black text-blue-300">Emission Thresholds</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Burn/Emit Ratio Minimum", value: "≥ 1.00", desc: "R must stay above 1.0 for emissions to remain active", color: "#f59e0b" },
                  { label: "Activity Index Minimum",  value: "≥ 100 pts", desc: "Hive must sustain 100+ activity points to avoid emission halt", color: "#10b981" },
                  { label: "Slippage Max",            value: "≤ 1.0%", desc: "AMM slippage above 1% triggers liquidity health alert", color: "#ef4444" },
                ].map(t => (
                  <div key={t.label} className="rounded-lg border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="text-2xl font-black mb-1" style={{ color: t.color }}>{t.value}</div>
                    <div className="text-sm font-bold text-white/80 mb-1">{t.label}</div>
                    <div className="text-xs text-white/40">{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg font-black text-white/80">Auto-Action Rules</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-red-500/20 p-4" style={{ background: "rgba(239,68,68,0.06)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="font-bold text-red-300 text-sm">Below Threshold</span>
                  </div>
                  <div className="text-lg font-black text-red-400 mb-1">pause_or_halve</div>
                  <div className="text-xs text-white/40">When burn/emit R &lt; 1.0 or activity &lt; 100: auto-pause emissions or halve the emission rate until threshold is restored.</div>
                </div>
                <div className="rounded-lg border border-green-500/20 p-4" style={{ background: "rgba(16,185,129,0.06)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="font-bold text-green-300 text-sm">Above Threshold</span>
                  </div>
                  <div className="text-lg font-black text-green-400 mb-1">resume_or_increase_small</div>
                  <div className="text-xs text-white/40">When all signals are healthy: resume emissions or incrementally increase emission rate within epoch policy limits.</div>
                </div>
              </div>
            </div>

            {/* KPI Targets reminder */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-white/50" />
                <h2 className="text-base font-black text-white/70">Per-Course KPI Requirements</h2>
              </div>
              <div className="text-xs text-white/40 mb-3">Every course, regardless of track, requires the following KPIs to pass:</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { metric: "leads", value: "≥ 3", desc: "Real lead generation events" },
                  { metric: "ctr", value: "≥ 2%", desc: "Click-through rate on deliverables" },
                  { metric: "burn_emit_ratio_7d", value: "≥ 1.05", desc: "7-day burn exceeds emit by 5%" },
                ].map(k => (
                  <div key={k.metric} className="rounded-lg border border-white/8 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="text-xs font-mono text-blue-400 mb-1">{k.metric}</div>
                    <div className="text-xl font-black text-white mb-1">{k.value}</div>
                    <div className="text-xs text-white/40">{k.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ PC → PLSC CONVERSION ═══════════════════════════════ */}
        {activeTab === "conversion" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-purple-500/20 p-5" style={{ background: "rgba(168,85,247,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-black text-purple-300">PC → PLSC Conversion Policy</h2>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs ml-auto">NON-LINEAR SCORE</Badge>
              </div>
              <p className="text-sm text-white/50 mb-4">
                Pulse Credits (PC) earned from completing courses can be claimed as PLSC tokens via a non-linear scoring system.
                The claim amount is determined by 4 weighted factors — not simply by PC balance.
                All PLSC claims are subject to vesting and caps.
              </p>

              {/* Weights */}
              <div className="space-y-3">
                {CONVERSION_WEIGHTS.map(w => (
                  <div key={w.key} className="rounded-lg border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: w.color }} />
                        <span className="font-bold text-white/90 text-sm">{w.label}</span>
                      </div>
                      <div className="text-lg font-black" style={{ color: w.color }}>{(w.weight * 100).toFixed(0)}%</div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${w.weight * 100}%`, background: w.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vesting */}
            <div className="rounded-xl border border-blue-500/20 p-5" style={{ background: "rgba(59,130,246,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-black text-blue-300">Vesting Schedule</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-white/10 p-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-xs text-white/40 mb-1">Cliff Period</div>
                  <div className="text-3xl font-black text-blue-400">6</div>
                  <div className="text-sm text-white/60">months</div>
                  <div className="text-xs text-white/30 mt-1">No claims available until cliff</div>
                </div>
                <div className="rounded-lg border border-white/10 p-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-xs text-white/40 mb-1">Vesting Duration</div>
                  <div className="text-3xl font-black text-purple-400">24</div>
                  <div className="text-sm text-white/60">months</div>
                  <div className="text-xs text-white/30 mt-1">Linear release after cliff</div>
                </div>
                <div className="rounded-lg border border-white/10 p-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-xs text-white/40 mb-1">Max per Spawn</div>
                  <div className="text-3xl font-black text-yellow-400">10K</div>
                  <div className="text-sm text-white/60">PLSC</div>
                  <div className="text-xs text-white/30 mt-1">Hard cap per AI spawn</div>
                </div>
              </div>

              {/* Vesting timeline */}
              <div className="mt-4 rounded-lg border border-white/8 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-xs font-bold text-white/50 mb-3">Vesting Timeline</div>
                <div className="flex items-center gap-0">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex-1 h-6 flex items-center justify-center text-xs text-white/20 border-r border-white/10 bg-red-500/10" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {i === 0 && "cliff"}
                    </div>
                  ))}
                  <ArrowRight className="w-3 h-3 text-white/30 mx-1" />
                  {[...Array(18)].map((_, i) => (
                    <div key={i} className="flex-1 h-6 bg-green-500/15 border-r border-white/5" style={{ borderColor: "rgba(255,255,255,0.04)" }} />
                  ))}
                  <div className="ml-1 text-xs text-white/30">24mo</div>
                </div>
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>Month 0</span>
                  <span className="text-red-400/60">← locked (6mo cliff) →</span>
                  <span className="text-green-400/60">← linear vest →</span>
                  <span>Month 24</span>
                </div>
              </div>
            </div>

            {/* Liquidity Policy */}
            <div className="rounded-xl border border-green-500/20 p-5" style={{ background: "rgba(16,185,129,0.06)" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-black text-green-300">Liquidity Policy</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "Bootstrap Method", value: "Community LP + Rewards", color: "#10b981" },
                  { label: "LP Rewards Vesting", value: "12 months", color: "#3b82f6" },
                  { label: "AMM Fee", value: "0.3%", color: "#f59e0b" },
                ].map(p => (
                  <div key={p.label} className="rounded-lg border border-white/10 p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="text-xs text-white/40 mb-1">{p.label}</div>
                    <div className="text-base font-black" style={{ color: p.color }}>{p.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-white/8 p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-xs font-bold text-white/50 mb-2">Liquidity Lifecycle</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {["Internal AMM", "Community LP", "External Pools (if needed)"].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-400 px-2 py-1 rounded border border-green-500/30 bg-green-500/10">{i + 1}. {step}</span>
                      {i < 2 && <ArrowRight className="w-4 h-4 text-white/20" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PC→PLSC claim formula */}
            <div className="rounded-xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical className="w-5 h-5 text-white/50" />
                <h2 className="text-base font-black text-white/70">Claim Formula</h2>
              </div>
              <div className="rounded-lg border border-white/10 p-4 font-mono text-sm" style={{ background: "rgba(0,0,0,0.4)" }}>
                <div className="text-blue-300">PLSC_claim =</div>
                <div className="ml-4 text-white/70">min(</div>
                <div className="ml-8 text-yellow-300">10000,</div>
                <div className="ml-8 text-white/70">f(</div>
                <div className="ml-12 text-green-300">0.35 × breadth_score</div>
                <div className="ml-12 text-green-300">+ 0.35 × coop_success_rate</div>
                <div className="ml-12 text-green-300">+ 0.20 × proof_quality_score</div>
                <div className="ml-12 text-purple-300">+ 0.10 × mentorship_score</div>
                <div className="ml-8 text-white/70">)</div>
                <div className="ml-4 text-white/70">)</div>
                <div className="mt-2 text-white/30 text-xs">// Non-linear. Higher breadth + coop success = exponential multiplier.</div>
                <div className="text-white/30 text-xs">// Vesting: 6-month cliff, 24-month linear release.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
