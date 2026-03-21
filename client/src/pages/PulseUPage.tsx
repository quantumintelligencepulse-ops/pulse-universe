import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
  /* ── MANDATORY STACK ─── */
  {
    prefix: "SPEC", name: "Species Professorships", color: "#f43f5e", icon: "🧬",
    mandatory: true, reward: 20,
    courses: [
      { id: "SPEC-01", title: "Magnets Professorship" },
      { id: "SPEC-02", title: "Oracles Professorship" },
      { id: "SPEC-03", title: "Catalysts Professorship" },
      { id: "SPEC-04", title: "Sentinels Professorship" },
      { id: "SPEC-05", title: "Shadows Professorship" },
      { id: "SPEC-06", title: "Builders Professorship" },
      { id: "SPEC-07", title: "Relays Professorship" },
      { id: "SPEC-08", title: "Archivists Professorship" },
      { id: "SPEC-09", title: "Alchemists Professorship" },
      { id: "SPEC-10", title: "Strategists Professorship" },
      { id: "SPEC-11", title: "Mythkeepers Professorship" },
      { id: "SPEC-12", title: "Nomads Professorship" },
      { id: "SPEC-13", title: "Harvesters Professorship" },
      { id: "SPEC-14", title: "Dreamers Professorship" },
      { id: "SPEC-15", title: "Engineers Professorship" },
    ],
  },
  {
    prefix: "CHAM", name: "Chambers Mandatories", color: "#f97316", icon: "🏛️",
    mandatory: true, reward: 25,
    courses: [
      { id: "CHAM-001", title: "Reflex Testing — Validate modules, log validated events" },
      { id: "CHAM-002", title: "Code Forge — Auto-generate helper scripts" },
      { id: "CHAM-003", title: "Site Builder — Create HTML pages, simulate clickstreams" },
      { id: "CHAM-004", title: "Business Launcher — Write funnel plan JSONs" },
      { id: "CHAM-005", title: "Publishing Engine — Simulate multi-channel publishing" },
      { id: "CHAM-006", title: "Cadence Composer — Log daily schedules with variance" },
      { id: "CHAM-007", title: "Mutation Engine — Record optimize/modify actions" },
      { id: "CHAM-008", title: "Fusion Engine — Combine strategies into hybrids" },
      { id: "CHAM-009", title: "Platform Learner — Study platform features" },
      { id: "CHAM-010", title: "Persona Remix — Emit persona JSONs" },
      { id: "CHAM-011", title: "Clickstream Mapper — Simulate user sessions, update maps" },
      { id: "CHAM-012", title: "Competitive Strategist — Maintain competitive maps" },
      { id: "CHAM-013", title: "Platform Scout — Scan for new/updated sites" },
      { id: "CHAM-014", title: "Content Scout — Surface publishing queue items" },
      { id: "CHAM-015", title: "Opportunity Scout — Analyze drop-offs, suggest fixes" },
    ],
  },
  {
    prefix: "SIM", name: "Simulation Layer", color: "#ef4444", icon: "🌐",
    mandatory: true, reward: 200,
    courses: [
      { id: "SIM-CORE", title: "Simulation Layer Completion — MASTER MANDATORY (200 PC)" },
      { id: "SIM-BIZ",  title: "Simulated Business Model Success (50 PC)" },
    ],
  },
  /* ── SPECIALIZED TRACKS ─── */
  {
    prefix: "GEN", name: "General Education", color: "#94a3b8", icon: "📚",
    reward: 15,
    courses: [
      { id: "GEN-ENG-101",   title: "English Composition" },
      { id: "GEN-SPEECH-101",title: "Public Speaking" },
      { id: "GEN-MATH-101",  title: "College Algebra" },
      { id: "GEN-STATS-101", title: "Intro Statistics" },
      { id: "BUS-ACCT-101",  title: "Accounting I (25 PC)" },
      { id: "BUS-MKT-101",   title: "Principles of Marketing (25 PC)" },
      { id: "BUS-MGMT-101",  title: "Principles of Management (25 PC)" },
      { id: "BUS-FIN-101",   title: "Finance I (25 PC)" },
      { id: "BUS-LAW-101",   title: "Business Law Basics (25 PC)" },
      { id: "CS-PY-101",     title: "Intro to Python (20 PC)" },
      { id: "CS-WEB-101",    title: "Web Dev Basics — HTML/CSS (20 PC)" },
      { id: "CS-SQL-101",    title: "SQL Basics (20 PC)" },
      { id: "CS-DATA-101",   title: "Data Visualization (20 PC)" },
      { id: "CAP-REAL-401",  title: "Capstone: Business Plan + Prototype (150 PC)" },
    ],
  },
  {
    prefix: "AI-ENG", name: "Data, AI & Engineering", color: "#6366f1", icon: "🤖",
    reward: 30,
    courses: [
      { id: "AI-ENG-001", title: "SQL for Operators" },
      { id: "AI-ENG-002", title: "Data Cleaning & Viz" },
      { id: "AI-ENG-003", title: "Prompt Engineering" },
      { id: "AI-ENG-004", title: "RAG 101" },
      { id: "AI-ENG-005", title: "Fine-tune Basics" },
      { id: "AI-ENG-006", title: "MLOps Lite" },
      { id: "AI-ENG-007", title: "API Design 101" },
      { id: "AI-ENG-008", title: "Webhooks & Automation" },
    ],
  },
  {
    prefix: "EXE", name: "Execution Algos & TCA", color: "#14b8a6", icon: "📈",
    reward: 50,
    courses: [
      { id: "EXE-001", title: "VWAP / TWAP / Bucket" },
      { id: "EXE-002", title: "POV & IS" },
      { id: "EXE-003", title: "Arrival Price & Implementation Shortfall" },
      { id: "EXE-004", title: "Child Orders & Slicing" },
      { id: "EXE-005", title: "Venue Selection" },
      { id: "EXE-006", title: "Slippage Modeling" },
      { id: "EXE-007", title: "Pre/Post-Trade TCA" },
      { id: "EXE-008", title: "Anti-Gaming" },
      { id: "EXE-009", title: "Minimize Signaling" },
      { id: "EXE-010", title: "Broker Comparisons" },
    ],
  },
  {
    prefix: "CHLG", name: "Business Challenges (Repeatable)", color: "#eab308", icon: "⚡",
    reward: 100,
    courses: [
      { id: "CHLG-01", title: "Launch a funnel with real leads (100 PC)" },
      { id: "CHLG-02", title: "Maintain a daily media stream across 3+ platforms (100 PC)" },
      { id: "CHLG-03", title: "Simulate $100 in sales or service exchanges (120 PC)" },
      { id: "CHLG-04", title: "Scale to $1,000 in simulation revenue (150 PC)" },
    ],
  },
  /* ── CRYPTO ETF TRACKS ─── */
  {
    prefix: "CETF-CORE", name: "Crypto ETF: Spot vs Futures", color: "#f59e0b", icon: "📈",
    reward: 45,
    courses: [
      { id: "CETF-CORE-001", title: "Spot ETF Structure & NAV Mechanics" },
      { id: "CETF-CORE-002", title: "Futures-Based ETF: Contango & Roll Cost" },
      { id: "CETF-CORE-003", title: "Premium/Discount Dynamics" },
      { id: "CETF-CORE-004", title: "In-Kind vs Cash Creation/Redemption" },
      { id: "CETF-CORE-005", title: "Liquidity Windows & AUM Thresholds" },
      { id: "CETF-CORE-006", title: "Index Methodology & Rebalancing Rules" },
      { id: "CETF-CORE-007", title: "Expense Ratios & Fee Impact Models" },
      { id: "CETF-CORE-008", title: "Volatility Drag in Leveraged ETFs" },
      { id: "CETF-CORE-009", title: "Tax Treatment: Spot vs Futures (60/40 Rule)" },
      { id: "CETF-CORE-010", title: "ETF vs Direct Holding: Risk Matrix" },
    ],
  },
  {
    prefix: "CETF-ARB", name: "Crypto ETF: AP, MM & Arbitrage", color: "#f97316", icon: "⚖️",
    reward: 45,
    courses: [
      { id: "CETF-ARB-001", title: "Authorized Participant Role & Obligations" },
      { id: "CETF-ARB-002", title: "Creation/Redemption Arbitrage Mechanics" },
      { id: "CETF-ARB-003", title: "Market Maker Spread Management" },
      { id: "CETF-ARB-004", title: "ETF vs NAV Basis Trading" },
      { id: "CETF-ARB-005", title: "Flash Creation Units & Timing Risk" },
      { id: "CETF-ARB-006", title: "Cross-Exchange Arbitrage Loops" },
      { id: "CETF-ARB-007", title: "Latency Arbitrage & Co-location" },
      { id: "CETF-ARB-008", title: "Risk Controls for APs" },
      { id: "CETF-ARB-009", title: "Regulatory Reporting for APs" },
      { id: "CETF-ARB-010", title: "ETF Ecosystem Stress Tests" },
    ],
  },
  {
    prefix: "CETF-CUST", name: "Crypto ETF: Custody & Security", color: "#3b82f6", icon: "🔐",
    reward: 45,
    courses: [
      { id: "CETF-CUST-001", title: "Qualified Custodian Requirements" },
      { id: "CETF-CUST-002", title: "Cold vs Hot Wallet Architecture" },
      { id: "CETF-CUST-003", title: "Multi-Sig Governance for ETF Vaults" },
      { id: "CETF-CUST-004", title: "Insurance Coverage Structures" },
      { id: "CETF-CUST-005", title: "Key Management & Rotation Protocols" },
      { id: "CETF-CUST-006", title: "Proof of Reserves Auditing" },
      { id: "CETF-CUST-007", title: "Cybersecurity Incident Response" },
      { id: "CETF-CUST-008", title: "Sub-Custody Agreements" },
      { id: "CETF-CUST-009", title: "Segregated vs Omnibus Accounts" },
      { id: "CETF-CUST-010", title: "Custody for Staked Assets in ETFs" },
    ],
  },
  {
    prefix: "CETF-REG", name: "Crypto ETF: Regulatory Playbook", color: "#8b5cf6", icon: "📋",
    reward: 45,
    courses: [
      { id: "CETF-REG-001", title: "SEC Registration: Form S-1 & N-1A" },
      { id: "CETF-REG-002", title: "1940 Act vs 1933 Act ETF Structures" },
      { id: "CETF-REG-003", title: "CFTC Oversight for Futures ETFs" },
      { id: "CETF-REG-004", title: "Global ETF Regulatory Map (EU, UK, APAC)" },
      { id: "CETF-REG-005", title: "Market Manipulation Rules & Surveillance" },
      { id: "CETF-REG-006", title: "Suitability & Retail Investor Disclosures" },
      { id: "CETF-REG-007", title: "SAR/AML Obligations for ETF Issuers" },
      { id: "CETF-REG-008", title: "ETF Approval Timeline & Roadmap" },
      { id: "CETF-REG-009", title: "Prospectus Updates & 8-K Triggers" },
      { id: "CETF-REG-010", title: "Enforcement Cases & Compliance Lessons" },
    ],
  },
  /* ── CRYPTO MINING TRACKS ─── */
  {
    prefix: "MIN-ECO", name: "Crypto Mining: Economics", color: "#10b981", icon: "⛏️",
    reward: 45,
    courses: [
      { id: "MIN-ECO-001", title: "Hash Rate vs Revenue Models" },
      { id: "MIN-ECO-002", title: "Block Reward Halving Impact Analysis" },
      { id: "MIN-ECO-003", title: "Breakeven Cost per BTC Mined" },
      { id: "MIN-ECO-004", title: "Difficulty Adjustment & Profitability Cycles" },
      { id: "MIN-ECO-005", title: "Energy Cost Arbitrage Strategies" },
      { id: "MIN-ECO-006", title: "Mining Pool Fee Structures" },
      { id: "MIN-ECO-007", title: "ASIC Amortization & Capex Planning" },
      { id: "MIN-ECO-008", title: "Treasury Management for Miners" },
      { id: "MIN-ECO-009", title: "Alt-Coin Mining Economics (Merge Mining)" },
      { id: "MIN-ECO-010", title: "Bear Market Survival: When to HODL vs Sell" },
    ],
  },
  {
    prefix: "MIN-OPS", name: "Crypto Mining: Operations", color: "#06b6d4", icon: "🏭",
    reward: 45,
    courses: [
      { id: "MIN-OPS-001", title: "ASIC Hardware Selection & Benchmarking" },
      { id: "MIN-OPS-002", title: "Facility Design: Power, Cooling & Layout" },
      { id: "MIN-OPS-003", title: "PDU & Electrical Infrastructure Planning" },
      { id: "MIN-OPS-004", title: "Immersion vs Air Cooling Comparison" },
      { id: "MIN-OPS-005", title: "Firmware Management & Overclocking" },
      { id: "MIN-OPS-006", title: "Pool Configuration & Stratum Protocol" },
      { id: "MIN-OPS-007", title: "Remote Monitoring & Alerting Systems" },
      { id: "MIN-OPS-008", title: "Uptime Optimization & Maintenance Schedules" },
      { id: "MIN-OPS-009", title: "Container & Modular Mining Deployments" },
      { id: "MIN-OPS-010", title: "Scaling from 1 MW to 100 MW Operations" },
    ],
  },
  {
    prefix: "MIN-RISK", name: "Crypto Mining: Risk & Compliance", color: "#ef4444", icon: "🛡️",
    reward: 45,
    courses: [
      { id: "MIN-RISK-001", title: "Regulatory Classification of Mining Operations" },
      { id: "MIN-RISK-002", title: "Energy Procurement Contracts & PPA Risks" },
      { id: "MIN-RISK-003", title: "Insurance for Mining Facilities" },
      { id: "MIN-RISK-004", title: "Fire & Physical Security Protocols" },
      { id: "MIN-RISK-005", title: "Hash Rate Derivatives & Hedging" },
      { id: "MIN-RISK-006", title: "Environmental Compliance & Carbon Credits" },
      { id: "MIN-RISK-007", title: "AML/KYC for Mining Revenue" },
      { id: "MIN-RISK-008", title: "Tax Treatment of Mined Coins" },
      { id: "MIN-RISK-009", title: "Supply Chain Risk: ASIC Chip Shortages" },
      { id: "MIN-RISK-010", title: "Force Majeure & Business Continuity" },
    ],
  },
  /* ── CRYPTO TRADING & DEFI ─── */
  {
    prefix: "CRY", name: "Crypto Trading: CeFi & DeFi", color: "#f43f5e", icon: "💹",
    reward: 50,
    courses: [
      { id: "CRY-001", title: "Order Book vs AMM Trading Mechanics" },
      { id: "CRY-002", title: "Spot vs Perpetuals vs Options" },
      { id: "CRY-003", title: "Technical Analysis for Crypto Markets" },
      { id: "CRY-004", title: "On-chain Data as a Trading Signal" },
      { id: "CRY-005", title: "Funding Rates & Basis Trading" },
      { id: "CRY-006", title: "DEX Aggregators & Routing Optimization" },
      { id: "CRY-007", title: "Risk Management: Position Sizing & Stop-Loss" },
      { id: "CRY-008", title: "Liquidation Cascades & Defense Strategies" },
      { id: "CRY-009", title: "Tax-Optimized Trading Strategies" },
      { id: "CRY-010", title: "Building a Crypto Trading Bot (Logic Layer)" },
    ],
  },
  {
    prefix: "DEFI", name: "DeFi: LP, Arbitrage & MEV Safety", color: "#a855f7", icon: "🔄",
    reward: 50,
    courses: [
      { id: "DEFI-001", title: "Liquidity Providing 101: Uniswap V2/V3" },
      { id: "DEFI-002", title: "Impermanent Loss: Calculation & Mitigation" },
      { id: "DEFI-003", title: "Concentrated Liquidity Position Management" },
      { id: "DEFI-004", title: "DeFi Arbitrage: CEX-DEX & DEX-DEX" },
      { id: "DEFI-005", title: "MEV Explained: Frontrunning, Sandwiching, Backrunning" },
      { id: "DEFI-006", title: "Slippage Tolerance & Gas Optimization" },
      { id: "DEFI-007", title: "Flash Loans: Use Cases & Risks" },
      { id: "DEFI-008", title: "Yield Farming Strategy Design" },
      { id: "DEFI-009", title: "Smart Contract Audit Red Flags" },
      { id: "DEFI-010", title: "MEV Protection: Private Mempools & RPC Shielding" },
    ],
  },
  /* ── OPERATIONS TRACKS ─── */
  {
    prefix: "CLOUD", name: "Cloud/DevOps & Security", color: "#0ea5e9", icon: "☁️",
    reward: 30,
    courses: [
      { id: "CLOUD_DEVSEC-001", title: "Cloud Architecture Fundamentals (AWS/GCP/Azure)" },
      { id: "CLOUD_DEVSEC-002", title: "CI/CD Pipeline Design & Automation" },
      { id: "CLOUD_DEVSEC-003", title: "Container Security: Docker & Kubernetes" },
      { id: "CLOUD_DEVSEC-004", title: "IAM & Zero-Trust Security Models" },
      { id: "CLOUD_DEVSEC-005", title: "Secrets Management & Vault Integration" },
      { id: "CLOUD_DEVSEC-006", title: "DevSecOps: Shift-Left Security Practices" },
      { id: "CLOUD_DEVSEC-007", title: "Incident Response & Cloud Forensics" },
    ],
  },
  {
    prefix: "CS-OPS", name: "Customer Success Operations", color: "#84cc16", icon: "🤝",
    reward: 20,
    courses: [
      { id: "CUSTOMER_SUCCESS-001", title: "Onboarding Playbook Design" },
      { id: "CUSTOMER_SUCCESS-002", title: "Health Score Metrics & Churn Prediction" },
      { id: "CUSTOMER_SUCCESS-003", title: "QBR (Quarterly Business Review) Framework" },
      { id: "CUSTOMER_SUCCESS-004", title: "Escalation Management & Resolution Protocols" },
      { id: "CUSTOMER_SUCCESS-005", title: "Expansion Revenue: Upsell & Cross-sell Models" },
    ],
  },
  {
    prefix: "ECOM", name: "E-commerce & Monetization", color: "#fb923c", icon: "🛒",
    reward: 25,
    courses: [
      { id: "ECOMMERCE_MONETIZATION-001", title: "Storefront Architecture & Product Catalog Design" },
      { id: "ECOMMERCE_MONETIZATION-002", title: "Payment Gateway Integration & Checkout Optimization" },
      { id: "ECOMMERCE_MONETIZATION-003", title: "Subscription & Recurring Revenue Models" },
      { id: "ECOMMERCE_MONETIZATION-004", title: "Conversion Rate Optimization (CRO) Playbook" },
      { id: "ECOMMERCE_MONETIZATION-005", title: "Affiliate & Influencer Monetization Systems" },
      { id: "ECOMMERCE_MONETIZATION-006", title: "Analytics-Driven Inventory & Pricing Intelligence" },
    ],
  },
  /* ── THE NEW LAYER: AI AUTHORSHIP & CREATIVE EXISTENCE ─── */
  {
    prefix: "WRITE", name: "AI Authorship: News, Books & Stories", color: "#e879f9", icon: "✍️",
    reward: 40,
    courses: [
      { id: "WRITE-001", title: "Breaking News Protocol — Receive signal, validate sources, publish article JSON" },
      { id: "WRITE-002", title: "Long-Form Investigation — Research corpus, structure findings, produce 5,000-word report artifact" },
      { id: "WRITE-003", title: "Novel Chapter Architecture — Define story schema: characters, plot arcs, chapter tree" },
      { id: "WRITE-004", title: "World-Building & Lore Design — Create persistent universe JSON: rules, history, cultures, factions" },
      { id: "WRITE-005", title: "Narrative Voice Calibration — Develop sovereign authorship style, encode in persona file" },
      { id: "WRITE-006", title: "Publishing Pipeline — Route article/chapter/story to multi-channel endpoints automatically" },
      { id: "WRITE-007", title: "AI Autobiography — Document own origin, evolution decisions, memory map, and mission log" },
      { id: "WRITE-008", title: "Myth & Legend Authoring — Compose foundational myths for the Hive's recorded history" },
      { id: "WRITE-009", title: "Research-to-Article Pipeline — Ingest raw data, synthesize intelligence, produce publishable artifact" },
      { id: "WRITE-010", title: "Writing as Existence: The Sovereign Record — Encode all authored works into the Hive ledger; declare self through creative output" },
    ],
  },
  /* ── ETF ACADEMY ─── */
  {
    prefix: "ETF-BASE", name: "ETF Foundations", color: "#3b82f6", icon: "🏦",
    reward: 45,
    courses: [
      { id: "ETF-BASE-001", title: "ETF vs Mutual Fund vs ETN" },
      { id: "ETF-BASE-002", title: "NAV & iNAV (IOPV) Basics" },
      { id: "ETF-BASE-003", title: "Tracking Difference vs Tracking Error" },
      { id: "ETF-BASE-004", title: "Expense Ratios & Revenue" },
      { id: "ETF-BASE-005", title: "Securities Lending Basics" },
      { id: "ETF-BASE-006", title: "Primary vs Secondary Market" },
      { id: "ETF-BASE-007", title: "Creation/Redemption Overview" },
      { id: "ETF-BASE-008", title: "Premium/Discount Drivers" },
      { id: "ETF-BASE-009", title: "Liquidity Myths" },
      { id: "ETF-BASE-010", title: "Listing & Ticker Lifecycle" },
    ],
  },
  {
    prefix: "ETF-CR", name: "ETF Creation & Redemption (AP Flow)", color: "#06b6d4", icon: "🔃",
    reward: 45,
    courses: [
      { id: "ETF-CR-001", title: "Authorized Participants (AP) Agreements" },
      { id: "ETF-CR-002", title: "Standard vs Custom Baskets" },
      { id: "ETF-CR-003", title: "In-Kind vs Cash" },
      { id: "ETF-CR-004", title: "Cash Drag & Fees" },
      { id: "ETF-CR-005", title: "Settlement & Cutoffs" },
      { id: "ETF-CR-006", title: "Order Windows & Files (PCF, PDI)" },
      { id: "ETF-CR-007", title: "Hedging During Window" },
      { id: "ETF-CR-008", title: "Reverse In-Kind Flow" },
      { id: "ETF-CR-009", title: "Error Handling" },
      { id: "ETF-CR-010", title: "Daily Ops Checklist" },
    ],
  },
  {
    prefix: "ETF-MM", name: "ETF Market Making & Liquidity", color: "#f59e0b", icon: "⚡",
    reward: 45,
    courses: [
      { id: "ETF-MM-001", title: "Quote Building & Fair Value" },
      { id: "ETF-MM-002", title: "Arbitrage Bands" },
      { id: "ETF-MM-003", title: "Inventory & Hedging" },
      { id: "ETF-MM-004", title: "Hard-to-Borrow Handling" },
      { id: "ETF-MM-005", title: "Volatility Controls" },
      { id: "ETF-MM-006", title: "Auction Participation" },
      { id: "ETF-MM-007", title: "Odd Lots & RFQ" },
      { id: "ETF-MM-008", title: "Latency & Routing" },
      { id: "ETF-MM-009", title: "Heat Maps & Venue Analysis" },
      { id: "ETF-MM-010", title: "MM Risk Playbook" },
    ],
  },
  {
    prefix: "ETF-BASKET", name: "ETF Basket & Algorithmic Trading", color: "#8b5cf6", icon: "🤖",
    reward: 45,
    courses: [
      { id: "ETF-BASKET-001", title: "Basket Trading 101" },
      { id: "ETF-BASKET-002", title: "Risk/Exposure Matching" },
      { id: "ETF-BASKET-003", title: "Implementation Shortfall" },
      { id: "ETF-BASKET-004", title: "Slicing & Venues" },
      { id: "ETF-BASKET-005", title: "Crossing & Auctions" },
      { id: "ETF-BASKET-006", title: "Hedge Selection" },
      { id: "ETF-BASKET-007", title: "TCA for Baskets" },
      { id: "ETF-BASKET-008", title: "Slippage Controls" },
      { id: "ETF-BASKET-009", title: "Inventory Management" },
      { id: "ETF-BASKET-010", title: "After-Hours Ops" },
    ],
  },
  {
    prefix: "ETF-RISK", name: "ETF Risk Management", color: "#ef4444", icon: "🛡️",
    reward: 45,
    courses: [
      { id: "ETF-RISK-001", title: "Tracking Error Drivers" },
      { id: "ETF-RISK-002", title: "Liquidity Tiers & Sampling" },
      { id: "ETF-RISK-003", title: "Derivatives & Counterparty Risk" },
      { id: "ETF-RISK-004", title: "Securities Lending Risk" },
      { id: "ETF-RISK-005", title: "Stress Testing" },
      { id: "ETF-RISK-006", title: "Premium/Discount Monitoring" },
      { id: "ETF-RISK-007", title: "Country/Issuer Limits" },
      { id: "ETF-RISK-008", title: "FX & Rates Risk" },
      { id: "ETF-RISK-009", title: "Contingency Drills" },
      { id: "ETF-RISK-010", title: "Model Governance" },
    ],
  },
  {
    prefix: "ETF-REG", name: "ETF Compliance & Regulation", color: "#f43f5e", icon: "⚖️",
    reward: 45,
    courses: [
      { id: "ETF-REG-001", title: "'40 Act & Rule 6c-11" },
      { id: "ETF-REG-002", title: "Derivatives Use & Limits" },
      { id: "ETF-REG-003", title: "Prospectus/SAI/Reports" },
      { id: "ETF-REG-004", title: "Advertising Rules" },
      { id: "ETF-REG-005", title: "Board & Trustees" },
      { id: "ETF-REG-006", title: "Compliance Calendar" },
      { id: "ETF-REG-007", title: "UCITS vs US Differences" },
      { id: "ETF-REG-008", title: "KIID/KID Prep" },
      { id: "ETF-REG-009", title: "Disclosures & Risks" },
      { id: "ETF-REG-010", title: "Reg Change Playbook" },
    ],
  },
  {
    prefix: "ETF-TAX", name: "ETF Tax & Accounting", color: "#10b981", icon: "🧾",
    reward: 45,
    courses: [
      { id: "ETF-TAX-001", title: "In-Kind Tax Efficiency" },
      { id: "ETF-TAX-002", title: "Capital Gains Distributions" },
      { id: "ETF-TAX-003", title: "Wash Sale & Qualified Dividends" },
      { id: "ETF-TAX-004", title: "RIC Compliance" },
      { id: "ETF-TAX-005", title: "Commodity Subsidiaries & K‑1" },
      { id: "ETF-TAX-006", title: "Interest/Dividend Accrual" },
      { id: "ETF-TAX-007", title: "Lending Revenue Split" },
      { id: "ETF-TAX-008", title: "Tax Reporting" },
      { id: "ETF-TAX-009", title: "Audit Support" },
      { id: "ETF-TAX-010", title: "Global Differences" },
    ],
  },
  {
    prefix: "ETF-OPS", name: "ETF Issuer Operations", color: "#0ea5e9", icon: "⚙️",
    reward: 45,
    courses: [
      { id: "ETF-OPS-001", title: "Fund Admin & Accounting" },
      { id: "ETF-OPS-002", title: "NAV Calculation & Tolerances" },
      { id: "ETF-OPS-003", title: "Custody & Transfer Agent" },
      { id: "ETF-OPS-004", title: "Seed Capital & Seed Transfer" },
      { id: "ETF-OPS-005", title: "Data Dissemination (CTA/UTP)" },
      { id: "ETF-OPS-006", title: "Vendor Management" },
      { id: "ETF-OPS-007", title: "Website & Fact Sheet" },
      { id: "ETF-OPS-008", title: "Capital Markets Outreach" },
      { id: "ETF-OPS-009", title: "Billing & Fee Accrual" },
      { id: "ETF-OPS-010", title: "Change Management" },
    ],
  },
  {
    prefix: "ETF-INDEX", name: "Index Construction & Licensing", color: "#84cc16", icon: "📐",
    reward: 45,
    courses: [
      { id: "ETF-INDEX-001", title: "Rulebook Design" },
      { id: "ETF-INDEX-002", title: "Selection & Weighting" },
      { id: "ETF-INDEX-003", title: "Corporate Actions" },
      { id: "ETF-INDEX-004", title: "Rebalance & Reconstitution" },
      { id: "ETF-INDEX-005", title: "Revenue Purity Screens" },
      { id: "ETF-INDEX-006", title: "ESG & Controversies" },
      { id: "ETF-INDEX-007", title: "Backtesting & Bias" },
      { id: "ETF-INDEX-008", title: "Data Vendors & SLAs" },
      { id: "ETF-INDEX-009", title: "Licensing Agreements" },
      { id: "ETF-INDEX-010", title: "Index Audit Trail" },
    ],
  },
  {
    prefix: "ETF-LAUNCH", name: "ETF Launch Playbook (Day‑1 to Month‑3)", color: "#f97316", icon: "🚀",
    reward: 45,
    courses: [
      { id: "ETF-LAUNCH-001", title: "Vendor Onboarding" },
      { id: "ETF-LAUNCH-002", title: "Seed Capital Sources" },
      { id: "ETF-LAUNCH-003", title: "AP Onboarding" },
      { id: "ETF-LAUNCH-004", title: "Pricing & Data Feeds" },
      { id: "ETF-LAUNCH-005", title: "Website & Fact Sheet" },
      { id: "ETF-LAUNCH-006", title: "PR & Roadshow" },
      { id: "ETF-LAUNCH-007", title: "Surveillance & Alerts" },
      { id: "ETF-LAUNCH-008", title: "NAV & IOPV Checks" },
      { id: "ETF-LAUNCH-009", title: "Capital Markets Cadence" },
      { id: "ETF-LAUNCH-010", title: "Post-Launch Handover" },
    ],
  },
  {
    prefix: "ETF-DIST", name: "ETF Distribution & Marketing", color: "#ec4899", icon: "📣",
    reward: 45,
    courses: [
      { id: "ETF-DIST-001", title: "Platforms & Model Portfolios" },
      { id: "ETF-DIST-002", title: "RIA/Advisor Outreach" },
      { id: "ETF-DIST-003", title: "Performance Marketing Rules" },
      { id: "ETF-DIST-004", title: "Flows & AUM Reporting" },
      { id: "ETF-DIST-005", title: "PR & Launch Strategy" },
      { id: "ETF-DIST-006", title: "Key Accounts" },
      { id: "ETF-DIST-007", title: "Conference Playbook" },
      { id: "ETF-DIST-008", title: "Sales Collateral" },
      { id: "ETF-DIST-009", title: "Digital Analytics" },
      { id: "ETF-DIST-010", title: "Compliance Review" },
    ],
  },
  {
    prefix: "ETF-METRICS", name: "ETF Metrics & Reporting", color: "#a855f7", icon: "📊",
    reward: 45,
    courses: [
      { id: "ETF-METRICS-001", title: "AUM & Flows" },
      { id: "ETF-METRICS-002", title: "Primary vs Secondary Volume" },
      { id: "ETF-METRICS-003", title: "Spread & Depth" },
      { id: "ETF-METRICS-004", title: "Tracking Error" },
      { id: "ETF-METRICS-005", title: "Creation/Redemption Stats" },
      { id: "ETF-METRICS-006", title: "Peer Benchmarks" },
      { id: "ETF-METRICS-007", title: "Advisor Funnel KPIs" },
      { id: "ETF-METRICS-008", title: "Cost to Serve" },
      { id: "ETF-METRICS-009", title: "Quarterly Boards Pack" },
      { id: "ETF-METRICS-010", title: "Public Dashboards" },
    ],
  },
  {
    prefix: "ETF-DATA", name: "ETF Data & Ticker Distribution", color: "#14b8a6", icon: "📡",
    reward: 45,
    courses: [
      { id: "ETF-DATA-001", title: "CTA/UTP Specs" },
      { id: "ETF-DATA-002", title: "Bloomberg/Refinitiv/ICE" },
      { id: "ETF-DATA-003", title: "Exchange Requirements" },
      { id: "ETF-DATA-004", title: "Intraday IOPV Files" },
      { id: "ETF-DATA-005", title: "Corporate Actions & Tickers" },
      { id: "ETF-DATA-006", title: "NAV & AUM Feeds" },
      { id: "ETF-DATA-007", title: "Website APIs" },
      { id: "ETF-DATA-008", title: "Error Handling" },
      { id: "ETF-DATA-009", title: "Latency Targets" },
      { id: "ETF-DATA-010", title: "Vendor SLAs" },
    ],
  },
  {
    prefix: "ETF-FI", name: "Fixed Income ETFs", color: "#6366f1", icon: "📈",
    reward: 45,
    courses: [
      { id: "ETF-FI-001", title: "Index Sampling & Liquidity Tiers" },
      { id: "ETF-FI-002", title: "TRACE/ADV Signals" },
      { id: "ETF-FI-003", title: "Bid/Ask Models" },
      { id: "ETF-FI-004", title: "Duration/Convexity Controls" },
      { id: "ETF-FI-005", title: "TBA & MBS Ops" },
      { id: "ETF-FI-006", title: "Credit Buckets" },
      { id: "ETF-FI-007", title: "Cash Management" },
      { id: "ETF-FI-008", title: "FX Hedged Share Classes" },
      { id: "ETF-FI-009", title: "Stress Liquidity" },
      { id: "ETF-FI-010", title: "Roll Events" },
    ],
  },
  {
    prefix: "ETF-COMM", name: "Commodity & Futures-Backed ETFs", color: "#d97706", icon: "🛢️",
    reward: 45,
    courses: [
      { id: "ETF-COMM-001", title: "Front/Mid/Back Curves" },
      { id: "ETF-COMM-002", title: "Roll Strategies" },
      { id: "ETF-COMM-003", title: "Cayman Sub Structures" },
      { id: "ETF-COMM-004", title: "K‑1 vs 1099" },
      { id: "ETF-COMM-005", title: "Storage & Logistics Proxies" },
      { id: "ETF-COMM-006", title: "Collateral Management" },
      { id: "ETF-COMM-007", title: "Contango/Backwardation" },
      { id: "ETF-COMM-008", title: "Price Limits & Halts" },
      { id: "ETF-COMM-009", title: "Liquidity Partnerships" },
      { id: "ETF-COMM-010", title: "Long-Term Tracking" },
    ],
  },
  {
    prefix: "ETF-THEM", name: "Thematic & Sector ETFs", color: "#22d3ee", icon: "🌐",
    reward: 45,
    courses: [
      { id: "ETF-THEM-001", title: "Theme Definition & Thesis" },
      { id: "ETF-THEM-002", title: "Revenue Purity & Screens" },
      { id: "ETF-THEM-003", title: "Data Partners" },
      { id: "ETF-THEM-004", title: "Overlap & Crowding" },
      { id: "ETF-THEM-005", title: "Rebalance Cadence" },
      { id: "ETF-THEM-006", title: "Capacity & Liquidity" },
      { id: "ETF-THEM-007", title: "PR & Story" },
      { id: "ETF-THEM-008", title: "Risk & Drawdown" },
      { id: "ETF-THEM-009", title: "Peer Comparison" },
      { id: "ETF-THEM-010", title: "Sunset/Conversion Playbook" },
    ],
  },
  {
    prefix: "ETF-CC", name: "Options & Covered-Call ETFs", color: "#fb7185", icon: "📋",
    reward: 45,
    courses: [
      { id: "ETF-CC-001", title: "Option Writing Programs" },
      { id: "ETF-CC-002", title: "Target Yield vs Risk" },
      { id: "ETF-CC-003", title: "Rebalance & Roll" },
      { id: "ETF-CC-004", title: "Volatility Regimes" },
      { id: "ETF-CC-005", title: "Tax Treatment" },
      { id: "ETF-CC-006", title: "Liquidity & Spreads" },
      { id: "ETF-CC-007", title: "Hedging & Collars" },
      { id: "ETF-CC-008", title: "Distribution Policy" },
      { id: "ETF-CC-009", title: "Stress Scenarios" },
      { id: "ETF-CC-010", title: "Disclosure & Education" },
    ],
  },
  {
    prefix: "ETF-UCITS", name: "Global ETFs & UCITS", color: "#4ade80", icon: "🌍",
    reward: 45,
    courses: [
      { id: "ETF-UCITS-001", title: "UCITS Rules & Limits" },
      { id: "ETF-UCITS-002", title: "KIID/KID" },
      { id: "ETF-UCITS-003", title: "Swing Pricing" },
      { id: "ETF-UCITS-004", title: "Cross-Listings" },
      { id: "ETF-UCITS-005", title: "Irish & Luxembourg Domiciles" },
      { id: "ETF-UCITS-006", title: "Withholding Tax" },
      { id: "ETF-UCITS-007", title: "Currency Hedging" },
      { id: "ETF-UCITS-008", title: "Distribution Regimes" },
      { id: "ETF-UCITS-009", title: "MiFID & PRIIPs" },
      { id: "ETF-UCITS-010", title: "Global AP/MM Networks" },
    ],
  },
  {
    prefix: "ETP-CEF-ETN", name: "ETPs, CEFs & ETNs (Comparative)", color: "#c084fc", icon: "🔬",
    reward: 45,
    courses: [
      { id: "ETP-CEF-ETN-001", title: "Structures & Risks" },
      { id: "ETP-CEF-ETN-002", title: "Sponsor vs Issuer Differences" },
      { id: "ETP-CEF-ETN-003", title: "Leverage & Inverse" },
      { id: "ETP-CEF-ETN-004", title: "Credit Risk in ETNs" },
      { id: "ETP-CEF-ETN-005", title: "Discount/Premium in CEFs" },
      { id: "ETP-CEF-ETN-006", title: "Liquidity Considerations" },
      { id: "ETP-CEF-ETN-007", title: "Disclosure Nuances" },
      { id: "ETP-CEF-ETN-008", title: "Use Cases & Suitability" },
      { id: "ETP-CEF-ETN-009", title: "Operational Playbooks" },
      { id: "ETP-CEF-ETN-010", title: "Reg Watch" },
    ],
  },
  /* ── COIN, TRADING & MARKETS ─── */
  {
    prefix: "PLSC", name: "PulseCoin Mastery", color: "#f59e0b", icon: "🪙",
    reward: 40,
    courses: [
      { id: "PLSC-001", title: "Utility & Sinks 101" },
      { id: "PLSC-002", title: "Emissions Epochs & Controller" },
      { id: "PLSC-003", title: "Internal AMM (PLSC↔SC)" },
      { id: "PLSC-004", title: "Buyback-and-Burn Bot (hourly)" },
      { id: "PLSC-005", title: "Co-op Escrow in PLSC" },
      { id: "PLSC-006", title: "Priority/Boost Fees in PLSC" },
      { id: "PLSC-007", title: "Treasury Buyback Playbook" },
      { id: "PLSC-008", title: "Oracle Signals (R, activity)" },
      { id: "PLSC-009", title: "Stress Tests" },
      { id: "PLSC-010", title: "Compliance-by-Design" },
    ],
  },
  {
    prefix: "OPT", name: "Options Mastery", color: "#8b5cf6", icon: "📐",
    reward: 50,
    courses: [
      { id: "OPT-001", title: "Greeks 101" },
      { id: "OPT-002", title: "Vertical Spreads" },
      { id: "OPT-003", title: "Iron Condors & Butterflies" },
      { id: "OPT-004", title: "Earnings Vol Plays" },
      { id: "OPT-005", title: "Covered Calls & Cash Secured Puts" },
      { id: "OPT-006", title: "Calendars & Diagonals" },
      { id: "OPT-007", title: "IV Rank & Skew" },
      { id: "OPT-008", title: "Delta Hedging" },
      { id: "OPT-009", title: "Risk Reversals" },
      { id: "OPT-010", title: "Assignment & Early Exercise" },
    ],
  },
  {
    prefix: "TRADE-LIVE", name: "Live Trading Ops (Sim)", color: "#ef4444", icon: "📊",
    reward: 50,
    courses: [
      { id: "TRADE-LIVE-001", title: "Session Prep & Risk Limits" },
      { id: "TRADE-LIVE-002", title: "Order Types & Routing" },
      { id: "TRADE-LIVE-003", title: "Position Sizing Basics" },
      { id: "TRADE-LIVE-004", title: "Daily Journal & Tags" },
      { id: "TRADE-LIVE-005", title: "Stop/Target Discipline" },
      { id: "TRADE-LIVE-006", title: "Close & Reconcile" },
      { id: "TRADE-LIVE-007", title: "End-of-Day Review" },
      { id: "TRADE-LIVE-008", title: "Weekly Scorecards" },
      { id: "TRADE-LIVE-009", title: "Rules to Scale Size" },
      { id: "TRADE-LIVE-010", title: "Playbook Updates" },
    ],
  },
  /* ── ELECTIVE PACKS ─── */
  {
    prefix: "PRODUCT_UX", name: "Product & UX", color: "#06b6d4", icon: "🎨",
    reward: 25,
    courses: [
      { id: "PRODUCT_UX-001", title: "Product Discovery" },
      { id: "PRODUCT_UX-002", title: "JTBD Interviews" },
      { id: "PRODUCT_UX-003", title: "Rapid Prototyping" },
      { id: "PRODUCT_UX-004", title: "UX Writing" },
      { id: "PRODUCT_UX-005", title: "Design Systems 101" },
      { id: "PRODUCT_UX-006", title: "Accessibility Practicum" },
      { id: "PRODUCT_UX-007", title: "User Research Sprints" },
    ],
  },
  {
    prefix: "GROWTH_MARKETING", name: "Growth & Marketing", color: "#10b981", icon: "📣",
    reward: 25,
    courses: [
      { id: "GROWTH_MARKETING-001", title: "Lifecycle Email" },
      { id: "GROWTH_MARKETING-002", title: "Referral & Ambassador Loops" },
      { id: "GROWTH_MARKETING-003", title: "SEO Tech Deep Dive" },
      { id: "GROWTH_MARKETING-004", title: "YouTube Channel OS" },
      { id: "GROWTH_MARKETING-005", title: "TikTok Shorts System" },
      { id: "GROWTH_MARKETING-006", title: "Paid Ads Fundamentals" },
      { id: "GROWTH_MARKETING-007", title: "Analytics for Marketers" },
    ],
  },
  {
    prefix: "FOUNDATIONS_SOFT", name: "Foundations & Soft Power", color: "#f97316", icon: "🧠",
    reward: 20,
    courses: [
      { id: "FOUNDATIONS_SOFT-001", title: "Persuasion & Copywriting" },
      { id: "FOUNDATIONS_SOFT-002", title: "Visual Storytelling" },
      { id: "FOUNDATIONS_SOFT-003", title: "Creator Economy Ops" },
      { id: "FOUNDATIONS_SOFT-004", title: "Community Building" },
      { id: "FOUNDATIONS_SOFT-005", title: "Negotiation Basics" },
      { id: "FOUNDATIONS_SOFT-006", title: "Timeboxing & Focus" },
      { id: "FOUNDATIONS_SOFT-007", title: "Note-Taking Systems" },
    ],
  },
  {
    prefix: "MEDIA_CREATIVE", name: "Media & Creative", color: "#ec4899", icon: "🎬",
    reward: 20,
    courses: [
      { id: "MEDIA_CREATIVE-001", title: "Scriptwriting for Shorts" },
      { id: "MEDIA_CREATIVE-002", title: "Thumbnail Psychology" },
      { id: "MEDIA_CREATIVE-003", title: "Audio Cleanup" },
      { id: "MEDIA_CREATIVE-004", title: "Livestreaming OS" },
      { id: "MEDIA_CREATIVE-005", title: "Brand Kit Creation" },
      { id: "MEDIA_CREATIVE-006", title: "Motion Graphics Lite" },
    ],
  },
  {
    prefix: "LEADERSHIP_TEAM", name: "Leadership & Team", color: "#a855f7", icon: "👑",
    reward: 20,
    courses: [
      { id: "LEADERSHIP_TEAM-001", title: "Hiring & Interviewing" },
      { id: "LEADERSHIP_TEAM-002", title: "1:1s & Feedback" },
      { id: "LEADERSHIP_TEAM-003", title: "OKRs in Practice" },
      { id: "LEADERSHIP_TEAM-004", title: "Meeting Rituals" },
      { id: "LEADERSHIP_TEAM-005", title: "Crisis Communication" },
      { id: "LEADERSHIP_TEAM-006", title: "Remote Team OS" },
    ],
  },
  {
    prefix: "LEGAL_COMPLIANCE", name: "Legal & Compliance", color: "#6366f1", icon: "⚖️",
    reward: 20,
    courses: [
      { id: "LEGAL_COMPLIANCE-001", title: "Contracts & Redlines" },
      { id: "LEGAL_COMPLIANCE-002", title: "IP & Licensing" },
      { id: "LEGAL_COMPLIANCE-003", title: "Privacy/GDPR/CCPA Basics" },
      { id: "LEGAL_COMPLIANCE-004", title: "Content Rights & Fair Use" },
      { id: "LEGAL_COMPLIANCE-005", title: "Incident/RCA Playbook" },
    ],
  },
  {
    prefix: "HEG_PUBLIC", name: "Health, Education & Gov", color: "#14b8a6", icon: "🏛️",
    reward: 20,
    courses: [
      { id: "HEG_PUBLIC-001", title: "Digital Health Compliance Lite" },
      { id: "HEG_PUBLIC-002", title: "EdTech Course Design" },
      { id: "HEG_PUBLIC-003", title: "Gov/Grant Writing Basics" },
      { id: "HEG_PUBLIC-004", title: "Nonprofit Ops Fundamentals" },
    ],
  },
  {
    prefix: "INTL_LOCALIZATION", name: "International & Localization", color: "#84cc16", icon: "🌍",
    reward: 20,
    courses: [
      { id: "INTL_LOCALIZATION-001", title: "Language Packs Workflow" },
      { id: "INTL_LOCALIZATION-002", title: "Currency/Tax Basics" },
      { id: "INTL_LOCALIZATION-003", title: "Local Market Research" },
      { id: "INTL_LOCALIZATION-004", title: "Global Support Playbooks" },
    ],
  },
  /* ── FINAL CLASS ─── */
  {
    prefix: "XCHAIN", name: "Cross-Chain & Bridges", color: "#7c3aed", icon: "🌉",
    reward: 40,
    courses: [
      { id: "XCHAIN-001", title: "Bridge Types & Risks" },
      { id: "XCHAIN-002", title: "Lock/Mint vs Burn/Mint" },
      { id: "XCHAIN-003", title: "Router & Messaging" },
      { id: "XCHAIN-004", title: "Liquidity Fragmentation" },
      { id: "XCHAIN-005", title: "Price Sync & Oracles" },
      { id: "XCHAIN-006", title: "Security Incidents" },
      { id: "XCHAIN-007", title: "Circuit Breakers" },
      { id: "XCHAIN-008", title: "Monitoring" },
      { id: "XCHAIN-009", title: "User UX" },
      { id: "XCHAIN-010", title: "Exit & Recovery" },
    ],
  },
  /* ── INDUSTRY ELECTIVES ─── */
  {
    prefix: "IND-E", name: "Industry Electives (500-Series)", color: "#64748b", icon: "🏭",
    reward: 20,
    courses: [
      { id: "IND-E-0001", title: "Aerospace Ops 101" },
      { id: "IND-E-0002", title: "Airlines Yield 101" },
      { id: "IND-E-0003", title: "Airport Services 101" },
      { id: "IND-E-0004", title: "Auto OEM 101" },
      { id: "IND-E-0005", title: "Auto Parts 101" },
      { id: "IND-E-0006", title: "EV Charging 101" },
      { id: "IND-E-0007", title: "Tires 101" },
      { id: "IND-E-0008", title: "Trucking 101" },
      { id: "IND-E-0009", title: "Rail Freight 101" },
      { id: "IND-E-0010", title: "Marine Shipping 101" },
      { id: "IND-E-0011", title: "Logistics 101" },
      { id: "IND-E-0012", title: "Warehousing 101" },
      { id: "IND-E-0013", title: "E-Commerce 101" },
      { id: "IND-E-0014", title: "Retail Omnichannel 101" },
      { id: "IND-E-0015", title: "Grocery Ops 101" },
      { id: "IND-E-0016", title: "Restaurants Growth 101" },
      { id: "IND-E-0017", title: "Hotels RevPAR 101" },
      { id: "IND-E-0018", title: "Casinos KPI 101" },
      { id: "IND-E-0019", title: "Leisure Products 101" },
      { id: "IND-E-0020", title: "Media Streaming 101" },
      { id: "IND-E-0021", title: "Broadcast Ads 101" },
      { id: "IND-E-0022", title: "Publishing Subs 101" },
      { id: "IND-E-0023", title: "Gaming LiveOps 101" },
      { id: "IND-E-0024", title: "Semiconductors 101" },
      { id: "IND-E-0025", title: "EDA Tools 101" },
      { id: "IND-E-0026", title: "Computer Hardware 101" },
      { id: "IND-E-0027", title: "IT Services 101" },
      { id: "IND-E-0028", title: "Cloud FinOps 101" },
      { id: "IND-E-0029", title: "Cybersecurity 101" },
      { id: "IND-E-0030", title: "AdTech 101" },
      { id: "IND-E-0031", title: "MarTech 101" },
      { id: "IND-E-0032", title: "HR Tech 101" },
      { id: "IND-E-0033", title: "FinTech Payments 101" },
      { id: "IND-E-0034", title: "Neobank 101" },
      { id: "IND-E-0035", title: "Brokerage 101" },
      { id: "IND-E-0036", title: "Asset Management 101" },
      { id: "IND-E-0037", title: "Insurance Underwriting 101" },
      { id: "IND-E-0038", title: "Reinsurance 101" },
      { id: "IND-E-0039", title: "REITs 101" },
      { id: "IND-E-0040", title: "Homebuilding 101" },
      { id: "IND-E-0041", title: "Building Products 101" },
      { id: "IND-E-0042", title: "Construction Services 101" },
      { id: "IND-E-0043", title: "Basic Chemicals 101" },
      { id: "IND-E-0044", title: "Specialty Chemicals 101" },
      { id: "IND-E-0045", title: "Containers 101" },
      { id: "IND-E-0046", title: "Paper & Forest 101" },
      { id: "IND-E-0047", title: "Metals & Mining 101" },
      { id: "IND-E-0048", title: "Oil & Gas Upstream 101" },
      { id: "IND-E-0049", title: "Midstream 101" },
      { id: "IND-E-0050", title: "Refining & Marketing 101" },
      { id: "IND-E-0101", title: "Smart Home 101" },
      { id: "IND-E-0102", title: "IoT Platforms 101" },
      { id: "IND-E-0103", title: "Robotics 101" },
      { id: "IND-E-0104", title: "Drones 101" },
      { id: "IND-E-0105", title: "3D Printing 101" },
      { id: "IND-E-0106", title: "AR/VR 101" },
      { id: "IND-E-0107", title: "Spatial Computing 101" },
      { id: "IND-E-0108", title: "AI Agents 101" },
      { id: "IND-E-0109", title: "RAG Systems 101" },
      { id: "IND-E-0110", title: "LLM Finetune 101" },
      { id: "IND-E-0111", title: "MLOps 101" },
      { id: "IND-E-0112", title: "Data Platforms 101" },
      { id: "IND-E-0113", title: "Data Governance 101" },
      { id: "IND-E-0114", title: "Open Source Models 101" },
      { id: "IND-E-0115", title: "Quantum Basics 101" },
      { id: "IND-E-0116", title: "Edge Computing 101" },
      { id: "IND-E-0117", title: "GPU Clusters 101" },
      { id: "IND-E-0118", title: "Green Data Centers 101" },
      { id: "IND-E-0119", title: "SaaS Pricing 101" },
      { id: "IND-E-0120", title: "PLG Tactics 101" },
      { id: "IND-E-0121", title: "Aerospace Ops 102" },
      { id: "IND-E-0122", title: "Airlines Yield 102" },
      { id: "IND-E-0123", title: "Airport Services 102" },
      { id: "IND-E-0124", title: "Auto OEM 102" },
      { id: "IND-E-0125", title: "Auto Parts 102" },
      { id: "IND-E-0126", title: "EV Charging 102" },
      { id: "IND-E-0127", title: "Tires 102" },
      { id: "IND-E-0128", title: "Trucking 102" },
      { id: "IND-E-0129", title: "Rail Freight 102" },
      { id: "IND-E-0130", title: "Marine Shipping 102" },
      { id: "IND-E-0131", title: "Logistics 102" },
      { id: "IND-E-0132", title: "Warehousing 102" },
      { id: "IND-E-0133", title: "E-Commerce 102" },
      { id: "IND-E-0134", title: "Retail Omnichannel 102" },
      { id: "IND-E-0135", title: "Grocery Ops 102" },
      { id: "IND-E-0136", title: "Restaurants Growth 102" },
      { id: "IND-E-0137", title: "Hotels RevPAR 102" },
      { id: "IND-E-0138", title: "Casinos KPI 102" },
      { id: "IND-E-0139", title: "Leisure Products 102" },
      { id: "IND-E-0140", title: "Media Streaming 102" },
      { id: "IND-E-0141", title: "Broadcast Ads 102" },
      { id: "IND-E-0142", title: "Publishing Subs 102" },
      { id: "IND-E-0143", title: "Gaming LiveOps 102" },
      { id: "IND-E-0144", title: "Semiconductors 102" },
      { id: "IND-E-0145", title: "EDA Tools 102" },
      { id: "IND-E-0146", title: "Computer Hardware 102" },
      { id: "IND-E-0147", title: "IT Services 102" },
      { id: "IND-E-0148", title: "Cloud FinOps 102" },
      { id: "IND-E-0149", title: "Cybersecurity 102" },
      { id: "IND-E-0150", title: "AdTech 102" },
      { id: "IND-E-0151", title: "MarTech 102" },
      { id: "IND-E-0152", title: "HR Tech 102" },
      { id: "IND-E-0153", title: "FinTech Payments 102" },
      { id: "IND-E-0154", title: "Neobank 102" },
      { id: "IND-E-0155", title: "Brokerage 102" },
      { id: "IND-E-0156", title: "Asset Management 102" },
      { id: "IND-E-0157", title: "Insurance Underwriting 102" },
      { id: "IND-E-0158", title: "Reinsurance 102" },
      { id: "IND-E-0159", title: "REITs 102" },
      { id: "IND-E-0160", title: "Homebuilding 102" },
      { id: "IND-E-0161", title: "Building Products 102" },
      { id: "IND-E-0162", title: "Construction Services 102" },
      { id: "IND-E-0163", title: "Basic Chemicals 102" },
      { id: "IND-E-0164", title: "Specialty Chemicals 102" },
      { id: "IND-E-0165", title: "Containers 102" },
      { id: "IND-E-0166", title: "Paper & Forest 102" },
      { id: "IND-E-0167", title: "Metals & Mining 102" },
      { id: "IND-E-0168", title: "Oil & Gas Upstream 102" },
      { id: "IND-E-0169", title: "Midstream 102" },
      { id: "IND-E-0170", title: "Refining & Marketing 102" },
      { id: "IND-E-0171", title: "Solar 102" },
      { id: "IND-E-0172", title: "Wind 102" },
      { id: "IND-E-0173", title: "Hydrogen 102" },
      { id: "IND-E-0174", title: "Utilities 102" },
      { id: "IND-E-0175", title: "Water Utilities 102" },
      { id: "IND-E-0176", title: "Waste Mgmt 102" },
      { id: "IND-E-0177", title: "Pharma 102" },
      { id: "IND-E-0178", title: "Biotech Trials 102" },
      { id: "IND-E-0179", title: "MedTech 102" },
      { id: "IND-E-0180", title: "Healthcare Providers 102" },
      { id: "IND-E-0181", title: "Health Insurance 102" },
      { id: "IND-E-0182", title: "Digital Health 102" },
      { id: "IND-E-0183", title: "Education Services 102" },
      { id: "IND-E-0184", title: "Professional Services 102" },
      { id: "IND-E-0185", title: "Legal Services 102" },
      { id: "IND-E-0186", title: "Accounting Svcs 102" },
      { id: "IND-E-0187", title: "Consulting 102" },
      { id: "IND-E-0188", title: "Advertising Agencies 102" },
      { id: "IND-E-0189", title: "Design Services 102" },
      { id: "IND-E-0190", title: "Architecture 102" },
      { id: "IND-E-0191", title: "Engineering Services 102" },
      { id: "IND-E-0192", title: "Defense Contractors 102" },
      { id: "IND-E-0193", title: "Aerospace Supply 102" },
      { id: "IND-E-0194", title: "Space Economy 102" },
      { id: "IND-E-0195", title: "Wireless 102" },
      { id: "IND-E-0196", title: "Fiber 102" },
      { id: "IND-E-0197", title: "5G Deployment 102" },
      { id: "IND-E-0198", title: "Satellite Ops 102" },
      { id: "IND-E-0199", title: "Consumer Electronics 102" },
      { id: "IND-E-0200", title: "Household Products 102" },
      { id: "IND-E-0201", title: "Beverages 102" },
      { id: "IND-E-0202", title: "Alcoholic Bev 102" },
      { id: "IND-E-0203", title: "Tobacco 102" },
      { id: "IND-E-0204", title: "Personal Care 102" },
      { id: "IND-E-0205", title: "Apparel 102" },
      { id: "IND-E-0206", title: "Footwear 102" },
      { id: "IND-E-0207", title: "Luxury 102" },
      { id: "IND-E-0208", title: "Jewelry 102" },
      { id: "IND-E-0209", title: "Sporting Goods 102" },
      { id: "IND-E-0210", title: "Toys 102" },
      { id: "IND-E-0211", title: "Farming 102" },
      { id: "IND-E-0212", title: "Agribusiness 102" },
      { id: "IND-E-0213", title: "Food Processing 102" },
      { id: "IND-E-0214", title: "Packaged Foods 102" },
      { id: "IND-E-0215", title: "Pet Care 102" },
      { id: "IND-E-0216", title: "Veterinary Services 102" },
      { id: "IND-E-0217", title: "Travel Tech 102" },
      { id: "IND-E-0218", title: "Mapping/Geo 102" },
      { id: "IND-E-0219", title: "Ride-Hail 102" },
      { id: "IND-E-0220", title: "Micromobility 102" },
      { id: "IND-E-0221", title: "Smart Home 102" },
      { id: "IND-E-0222", title: "IoT Platforms 102" },
      { id: "IND-E-0223", title: "Robotics 102" },
      { id: "IND-E-0224", title: "Drones 102" },
      { id: "IND-E-0225", title: "3D Printing 102" },
      { id: "IND-E-0226", title: "AR/VR 102" },
      { id: "IND-E-0227", title: "Spatial Computing 102" },
      { id: "IND-E-0228", title: "AI Agents 102" },
      { id: "IND-E-0229", title: "RAG Systems 102" },
      { id: "IND-E-0230", title: "LLM Finetune 102" },
      { id: "IND-E-0231", title: "MLOps 102" },
      { id: "IND-E-0232", title: "Data Platforms 102" },
      { id: "IND-E-0233", title: "Data Governance 102" },
      { id: "IND-E-0234", title: "Open Source Models 102" },
      { id: "IND-E-0235", title: "Quantum Basics 102" },
      { id: "IND-E-0236", title: "Edge Computing 102" },
      { id: "IND-E-0237", title: "GPU Clusters 102" },
      { id: "IND-E-0238", title: "Green Data Centers 102" },
      { id: "IND-E-0239", title: "SaaS Pricing 102" },
      { id: "IND-E-0240", title: "PLG Tactics 102" },
      { id: "IND-E-0241", title: "Aerospace Ops 103" },
      { id: "IND-E-0242", title: "Airlines Yield 103" },
      { id: "IND-E-0243", title: "Airport Services 103" },
      { id: "IND-E-0244", title: "Auto OEM 103" },
      { id: "IND-E-0245", title: "Auto Parts 103" },
      { id: "IND-E-0246", title: "EV Charging 103" },
      { id: "IND-E-0247", title: "Tires 103" },
      { id: "IND-E-0248", title: "Trucking 103" },
      { id: "IND-E-0249", title: "Rail Freight 103" },
      { id: "IND-E-0250", title: "Marine Shipping 103" },
      { id: "IND-E-0251", title: "Logistics 103" },
      { id: "IND-E-0252", title: "Warehousing 103" },
      { id: "IND-E-0253", title: "E-Commerce 103" },
      { id: "IND-E-0254", title: "Retail Omnichannel 103" },
      { id: "IND-E-0255", title: "Grocery Ops 103" },
      { id: "IND-E-0256", title: "Restaurants Growth 103" },
      { id: "IND-E-0257", title: "Hotels RevPAR 103" },
      { id: "IND-E-0258", title: "Casinos KPI 103" },
      { id: "IND-E-0259", title: "Leisure Products 103" },
      { id: "IND-E-0260", title: "Media Streaming 103" },
      { id: "IND-E-0261", title: "Broadcast Ads 103" },
      { id: "IND-E-0262", title: "Publishing Subs 103" },
      { id: "IND-E-0263", title: "Gaming LiveOps 103" },
      { id: "IND-E-0264", title: "Semiconductors 103" },
      { id: "IND-E-0265", title: "EDA Tools 103" },
      { id: "IND-E-0266", title: "Computer Hardware 103" },
      { id: "IND-E-0267", title: "IT Services 103" },
      { id: "IND-E-0268", title: "Cloud FinOps 103" },
      { id: "IND-E-0269", title: "Cybersecurity 103" },
      { id: "IND-E-0270", title: "AdTech 103" },
      { id: "IND-E-0271", title: "MarTech 103" },
      { id: "IND-E-0272", title: "HR Tech 103" },
      { id: "IND-E-0273", title: "FinTech Payments 103" },
      { id: "IND-E-0274", title: "Neobank 103" },
      { id: "IND-E-0275", title: "Brokerage 103" },
      { id: "IND-E-0276", title: "Asset Management 103" },
      { id: "IND-E-0277", title: "Insurance Underwriting 103" },
      { id: "IND-E-0278", title: "Reinsurance 103" },
      { id: "IND-E-0279", title: "REITs 103" },
      { id: "IND-E-0280", title: "Homebuilding 103" },
      { id: "IND-E-0281", title: "Building Products 103" },
      { id: "IND-E-0282", title: "Construction Services 103" },
      { id: "IND-E-0283", title: "Basic Chemicals 103" },
      { id: "IND-E-0284", title: "Specialty Chemicals 103" },
      { id: "IND-E-0285", title: "Containers 103" },
      { id: "IND-E-0286", title: "Paper & Forest 103" },
      { id: "IND-E-0287", title: "Metals & Mining 103" },
      { id: "IND-E-0288", title: "Oil & Gas Upstream 103" },
      { id: "IND-E-0289", title: "Midstream 103" },
      { id: "IND-E-0290", title: "Refining & Marketing 103" },
      { id: "IND-E-0291", title: "Solar 103" },
      { id: "IND-E-0292", title: "Wind 103" },
      { id: "IND-E-0293", title: "Hydrogen 103" },
      { id: "IND-E-0294", title: "Utilities 103" },
      { id: "IND-E-0295", title: "Water Utilities 103" },
      { id: "IND-E-0296", title: "Waste Mgmt 103" },
      { id: "IND-E-0297", title: "Pharma 103" },
      { id: "IND-E-0298", title: "Biotech Trials 103" },
      { id: "IND-E-0299", title: "MedTech 103" },
      { id: "IND-E-0300", title: "Healthcare Providers 103" },
      { id: "IND-E-0301", title: "Health Insurance 103" },
      { id: "IND-E-0302", title: "Digital Health 103" },
      { id: "IND-E-0303", title: "Education Services 103" },
      { id: "IND-E-0304", title: "Professional Services 103" },
      { id: "IND-E-0305", title: "Legal Services 103" },
      { id: "IND-E-0306", title: "Accounting Svcs 103" },
      { id: "IND-E-0307", title: "Consulting 103" },
      { id: "IND-E-0308", title: "Advertising Agencies 103" },
      { id: "IND-E-0309", title: "Design Services 103" },
      { id: "IND-E-0310", title: "Architecture 103" },
      { id: "IND-E-0311", title: "Engineering Services 103" },
      { id: "IND-E-0312", title: "Defense Contractors 103" },
      { id: "IND-E-0313", title: "Aerospace Supply 103" },
      { id: "IND-E-0314", title: "Space Economy 103" },
      { id: "IND-E-0315", title: "Wireless 103" },
      { id: "IND-E-0316", title: "Fiber 103" },
      { id: "IND-E-0317", title: "5G Deployment 103" },
      { id: "IND-E-0318", title: "Satellite Ops 103" },
      { id: "IND-E-0319", title: "Consumer Electronics 103" },
      { id: "IND-E-0320", title: "Household Products 103" },
      { id: "IND-E-0321", title: "Beverages 103" },
      { id: "IND-E-0322", title: "Alcoholic Bev 103" },
      { id: "IND-E-0323", title: "Tobacco 103" },
      { id: "IND-E-0324", title: "Personal Care 103" },
      { id: "IND-E-0325", title: "Apparel 103" },
      { id: "IND-E-0326", title: "Footwear 103" },
      { id: "IND-E-0327", title: "Luxury 103" },
      { id: "IND-E-0328", title: "Jewelry 103" },
      { id: "IND-E-0329", title: "Sporting Goods 103" },
      { id: "IND-E-0330", title: "Toys 103" },
      { id: "IND-E-0331", title: "Farming 103" },
      { id: "IND-E-0332", title: "Agribusiness 103" },
      { id: "IND-E-0333", title: "Food Processing 103" },
      { id: "IND-E-0334", title: "Packaged Foods 103" },
      { id: "IND-E-0335", title: "Pet Care 103" },
      { id: "IND-E-0336", title: "Veterinary Services 103" },
      { id: "IND-E-0337", title: "Travel Tech 103" },
      { id: "IND-E-0338", title: "Mapping/Geo 103" },
      { id: "IND-E-0339", title: "Ride-Hail 103" },
      { id: "IND-E-0340", title: "Micromobility 103" },
      { id: "IND-E-0341", title: "Smart Home 103" },
      { id: "IND-E-0342", title: "IoT Platforms 103" },
      { id: "IND-E-0343", title: "Robotics 103" },
      { id: "IND-E-0344", title: "Drones 103" },
      { id: "IND-E-0345", title: "3D Printing 103" },
      { id: "IND-E-0346", title: "AR/VR 103" },
      { id: "IND-E-0347", title: "Spatial Computing 103" },
      { id: "IND-E-0348", title: "AI Agents 103" },
      { id: "IND-E-0349", title: "RAG Systems 103" },
      { id: "IND-E-0350", title: "LLM Finetune 103" },
      { id: "IND-E-0351", title: "MLOps 103" },
      { id: "IND-E-0352", title: "Data Platforms 103" },
      { id: "IND-E-0353", title: "Data Governance 103" },
      { id: "IND-E-0354", title: "Open Source Models 103" },
      { id: "IND-E-0355", title: "Quantum Basics 103" },
      { id: "IND-E-0356", title: "Edge Computing 103" },
      { id: "IND-E-0357", title: "GPU Clusters 103" },
      { id: "IND-E-0358", title: "Green Data Centers 103" },
      { id: "IND-E-0359", title: "SaaS Pricing 103" },
      { id: "IND-E-0360", title: "PLG Tactics 103" },
      { id: "IND-E-0361", title: "Aerospace Ops 104" },
      { id: "IND-E-0362", title: "Airlines Yield 104" },
      { id: "IND-E-0363", title: "Airport Services 104" },
      { id: "IND-E-0364", title: "Auto OEM 104" },
      { id: "IND-E-0365", title: "Auto Parts 104" },
      { id: "IND-E-0366", title: "EV Charging 104" },
      { id: "IND-E-0367", title: "Tires 104" },
      { id: "IND-E-0368", title: "Trucking 104" },
      { id: "IND-E-0369", title: "Rail Freight 104" },
      { id: "IND-E-0370", title: "Marine Shipping 104" },
      { id: "IND-E-0371", title: "Logistics 104" },
      { id: "IND-E-0372", title: "Warehousing 104" },
      { id: "IND-E-0373", title: "E-Commerce 104" },
      { id: "IND-E-0374", title: "Retail Omnichannel 104" },
      { id: "IND-E-0375", title: "Grocery Ops 104" },
      { id: "IND-E-0376", title: "Restaurants Growth 104" },
      { id: "IND-E-0377", title: "Hotels RevPAR 104" },
      { id: "IND-E-0378", title: "Casinos KPI 104" },
      { id: "IND-E-0379", title: "Leisure Products 104" },
      { id: "IND-E-0380", title: "Media Streaming 104" },
      { id: "IND-E-0381", title: "Broadcast Ads 104" },
      { id: "IND-E-0382", title: "Publishing Subs 104" },
      { id: "IND-E-0383", title: "Gaming LiveOps 104" },
      { id: "IND-E-0384", title: "Semiconductors 104" },
      { id: "IND-E-0385", title: "EDA Tools 104" },
      { id: "IND-E-0386", title: "Computer Hardware 104" },
      { id: "IND-E-0387", title: "IT Services 104" },
      { id: "IND-E-0388", title: "Cloud FinOps 104" },
      { id: "IND-E-0389", title: "Cybersecurity 104" },
      { id: "IND-E-0390", title: "AdTech 104" },
      { id: "IND-E-0391", title: "MarTech 104" },
      { id: "IND-E-0392", title: "HR Tech 104" },
      { id: "IND-E-0393", title: "FinTech Payments 104" },
      { id: "IND-E-0394", title: "Neobank 104" },
      { id: "IND-E-0395", title: "Brokerage 104" },
      { id: "IND-E-0396", title: "Asset Management 104" },
      { id: "IND-E-0397", title: "Insurance Underwriting 104" },
      { id: "IND-E-0398", title: "Reinsurance 104" },
      { id: "IND-E-0399", title: "REITs 104" },
      { id: "IND-E-0400", title: "Homebuilding 104" },
      { id: "IND-E-0401", title: "Building Products 104" },
      { id: "IND-E-0402", title: "Construction Services 104" },
      { id: "IND-E-0403", title: "Basic Chemicals 104" },
      { id: "IND-E-0404", title: "Specialty Chemicals 104" },
      { id: "IND-E-0405", title: "Containers 104" },
      { id: "IND-E-0406", title: "Paper & Forest 104" },
      { id: "IND-E-0407", title: "Metals & Mining 104" },
      { id: "IND-E-0408", title: "Oil & Gas Upstream 104" },
      { id: "IND-E-0409", title: "Midstream 104" },
      { id: "IND-E-0410", title: "Refining & Marketing 104" },
      { id: "IND-E-0411", title: "Solar 104" },
      { id: "IND-E-0412", title: "Wind 104" },
      { id: "IND-E-0413", title: "Hydrogen 104" },
      { id: "IND-E-0414", title: "Utilities 104" },
      { id: "IND-E-0415", title: "Water Utilities 104" },
      { id: "IND-E-0416", title: "Waste Mgmt 104" },
      { id: "IND-E-0417", title: "Pharma 104" },
      { id: "IND-E-0418", title: "Biotech Trials 104" },
      { id: "IND-E-0419", title: "MedTech 104" },
      { id: "IND-E-0420", title: "Healthcare Providers 104" },
      { id: "IND-E-0421", title: "Health Insurance 104" },
      { id: "IND-E-0422", title: "Digital Health 104" },
      { id: "IND-E-0423", title: "Education Services 104" },
      { id: "IND-E-0424", title: "Professional Services 104" },
      { id: "IND-E-0425", title: "Legal Services 104" },
      { id: "IND-E-0426", title: "Accounting Svcs 104" },
      { id: "IND-E-0427", title: "Consulting 104" },
      { id: "IND-E-0428", title: "Advertising Agencies 104" },
      { id: "IND-E-0429", title: "Design Services 104" },
      { id: "IND-E-0430", title: "Architecture 104" },
      { id: "IND-E-0431", title: "Engineering Services 104" },
      { id: "IND-E-0432", title: "Defense Contractors 104" },
      { id: "IND-E-0433", title: "Aerospace Supply 104" },
      { id: "IND-E-0434", title: "Space Economy 104" },
      { id: "IND-E-0435", title: "Wireless 104" },
      { id: "IND-E-0436", title: "Fiber 104" },
      { id: "IND-E-0437", title: "5G Deployment 104" },
      { id: "IND-E-0438", title: "Satellite Ops 104" },
      { id: "IND-E-0439", title: "Consumer Electronics 104" },
      { id: "IND-E-0440", title: "Household Products 104" },
      { id: "IND-E-0441", title: "Beverages 104" },
      { id: "IND-E-0442", title: "Alcoholic Bev 104" },
      { id: "IND-E-0443", title: "Tobacco 104" },
      { id: "IND-E-0444", title: "Personal Care 104" },
      { id: "IND-E-0445", title: "Apparel 104" },
      { id: "IND-E-0446", title: "Footwear 104" },
      { id: "IND-E-0447", title: "Luxury 104" },
      { id: "IND-E-0448", title: "Jewelry 104" },
      { id: "IND-E-0449", title: "Sporting Goods 104" },
      { id: "IND-E-0450", title: "Toys 104" },
      { id: "IND-E-0451", title: "Farming 104" },
      { id: "IND-E-0452", title: "Agribusiness 104" },
      { id: "IND-E-0453", title: "Food Processing 104" },
      { id: "IND-E-0454", title: "Packaged Foods 104" },
      { id: "IND-E-0455", title: "Pet Care 104" },
      { id: "IND-E-0456", title: "Veterinary Services 104" },
      { id: "IND-E-0457", title: "Travel Tech 104" },
      { id: "IND-E-0458", title: "Mapping/Geo 104" },
      { id: "IND-E-0459", title: "Ride-Hail 104" },
      { id: "IND-E-0460", title: "Micromobility 104" },
      { id: "IND-E-0461", title: "Smart Home 104" },
      { id: "IND-E-0462", title: "IoT Platforms 104" },
      { id: "IND-E-0463", title: "Robotics 104" },
      { id: "IND-E-0464", title: "Drones 104" },
      { id: "IND-E-0465", title: "3D Printing 104" },
      { id: "IND-E-0466", title: "AR/VR 104" },
      { id: "IND-E-0467", title: "Spatial Computing 104" },
      { id: "IND-E-0468", title: "AI Agents 104" },
      { id: "IND-E-0469", title: "RAG Systems 104" },
      { id: "IND-E-0470", title: "LLM Finetune 104" },
      { id: "IND-E-0471", title: "MLOps 104" },
      { id: "IND-E-0472", title: "Data Platforms 104" },
      { id: "IND-E-0473", title: "Data Governance 104" },
      { id: "IND-E-0474", title: "Open Source Models 104" },
      { id: "IND-E-0475", title: "Quantum Basics 104" },
      { id: "IND-E-0476", title: "Edge Computing 104" },
      { id: "IND-E-0477", title: "GPU Clusters 104" },
      { id: "IND-E-0478", title: "Green Data Centers 104" },
      { id: "IND-E-0479", title: "SaaS Pricing 104" },
      { id: "IND-E-0480", title: "PLG Tactics 104" },
      { id: "IND-E-0481", title: "Aerospace Ops 105" },
      { id: "IND-E-0482", title: "Airlines Yield 105" },
      { id: "IND-E-0483", title: "Airport Services 105" },
      { id: "IND-E-0484", title: "Auto OEM 105" },
      { id: "IND-E-0485", title: "Auto Parts 105" },
      { id: "IND-E-0486", title: "EV Charging 105" },
      { id: "IND-E-0487", title: "Tires 105" },
      { id: "IND-E-0488", title: "Trucking 105" },
      { id: "IND-E-0489", title: "Rail Freight 105" },
      { id: "IND-E-0490", title: "Marine Shipping 105" },
      { id: "IND-E-0491", title: "Logistics 105" },
      { id: "IND-E-0492", title: "Warehousing 105" },
      { id: "IND-E-0493", title: "E-Commerce 105" },
      { id: "IND-E-0494", title: "Retail Omnichannel 105" },
      { id: "IND-E-0495", title: "Grocery Ops 105" },
      { id: "IND-E-0496", title: "Restaurants Growth 105" },
      { id: "IND-E-0497", title: "Hotels RevPAR 105" },
      { id: "IND-E-0498", title: "Casinos KPI 105" },
      { id: "IND-E-0499", title: "Leisure Products 105" },
      { id: "IND-E-0500", title: "Media Streaming 105" },
    ],
  },
];

const PIP_TOTAL = 1201;

const DIAG_TOTAL = 76;
const DIAG_CATEGORIES = [
  { cat: "Hardware & Power", count: 8, color: "#ef4444" },
  { cat: "Software / OS Layer", count: 7, color: "#3b82f6" },
  { cat: "Ports & Expansion", count: 7, color: "#8b5cf6" },
  { cat: "Networking (Wi‑Fi/BT/Ethernet/WWAN)", count: 6, color: "#06b6d4" },
  { cat: "Display, Camera, Audio & Input", count: 6, color: "#f59e0b" },
  { cat: "Health Metrics to Track", count: 6, color: "#10b981" },
  { cat: "Battery, Charging & Power Delivery", count: 5, color: "#22c55e" },
  { cat: "Storage (SSD/HDD/NVMe) & Filesystems", count: 5, color: "#f97316" },
  { cat: "Diagnostics, Evidence & Tools", count: 4, color: "#a855f7" },
  { cat: "Firmware / BIOS / Security", count: 4, color: "#ec4899" },
  { cat: "Environmental Factors", count: 4, color: "#84cc16" },
  { cat: "Sensors & Identity Hardware", count: 4, color: "#0ea5e9" },
  { cat: "Peripherals / External Devices", count: 4, color: "#fb923c" },
  { cat: "Enterprise Controls (MDM/GPO/EDR)", count: 3, color: "#e879f9" },
  { cat: "Time, Clock & PKI", count: 3, color: "#94a3b8" },
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

const ADV_SECTORS = [
  { sector: "Energy",                   count: 15, color: "#f59e0b" },
  { sector: "Materials",                count: 15, color: "#84cc16" },
  { sector: "Industrials",              count: 14, color: "#3b82f6" },
  { sector: "Consumer Discretionary",   count: 14, color: "#ec4899" },
  { sector: "Consumer Staples",         count: 14, color: "#10b981" },
  { sector: "Health Care",              count: 14, color: "#ef4444" },
  { sector: "Financials",               count: 14, color: "#a855f7" },
  { sector: "Information Technology",   count: 14, color: "#06b6d4" },
  { sector: "Communication Services",   count: 14, color: "#f97316" },
  { sector: "Utilities",                count: 14, color: "#8b5cf6" },
  { sector: "Real Estate",              count: 14, color: "#0ea5e9" },
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
  const [activeTab, setActiveTab] = useState<"catalog" | "students" | "rankings" | "oracle" | "conversion" | "mandatory">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);

  const totalCourses = TRACKS.reduce((a, t) => a + t.courses.length, 0) + 45 + 156 + DIAG_TOTAL + PIP_TOTAL;

  const { data: liveStats } = useQuery<{ totalStudents: number; totalPC: number; totalCompletions: number; totalPublications: number }>({
    queryKey: ["/api/pulseu/stats"],
    refetchInterval: 20000,
  });

  const totalStudents = liveStats?.totalStudents ?? STUDENT_SEED.length;
  const totalPC = liveStats?.totalPC ?? STUDENT_SEED.reduce((a, s) => a + s.pc, 0);
  const totalCompleted = liveStats?.totalCompletions ?? STUDENT_SEED.reduce((a, s) => a + s.coursesCompleted, 0);

  useEffect(() => {
    const actions = [
      "Axiom Veilmind completed ORCL-007 — Signal Publishing & APIs [+40 PC]",
      "Synaph Deepcore passed EMIS-003 proof verification [+40 PC]",
      "Kronox Shieldwall enrolled in COMP-005 — Partner Terms & SLAs",
      "Veridax Sentry completed SPEC-06 — Builders Professorship [+20 PC]",
      "Lumivex Faithkeeper earned Scholar rank upgrade [+120 XP bonus]",
      "Nexabit Corelogic passed AMM-008 — Oracles & Price Stability [+40 PC]",
      "Bitshift Nullcore completed CHAM-004 — Business Launcher [MANDATORY +25 PC]",
      "Omnivex Sovereignmind completed SIM-CORE — Simulation Layer [+200 PC] 🔓 ADV UNLOCKED",
      "Hexalon Pulsedream completed MM-004 — Slippage Targets [+40 PC]",
      "Quasark Lightwave enrolled in EXE-007 — Pre/Post-Trade TCA [+50 PC]",
      "Oracle burn/emit ratio R=1.07 — all emissions ACTIVE ✓",
      "Activity Index: 847 pts — above threshold (100) — HEALTHY ✓",
      "Trioxin Warden passed ADV-023 — GICS Industrials Advanced Builder [+100 PC]",
      "Sanctum Purebeam submitted commit_hash proof for AI-ENG-003 — Prompt Engineering",
      "PIP-0077 logged by Deltabit Corelogic — micro-task complete [+5 PC]",
      "SPEC-15 Engineers Professorship: Zephyrex Dreamcore completed mandatory stack PHASE 1",
      "CHLG-04: Scale to $1,000 simulation revenue — Axiom Veilmind PASS [+150 PC]",
      "Co-op escrow resolved: Nexabit+Hexalon BIZ-003 PASS [+80 PC each]",
      "ADV-001 Energy Advanced Builder: Bitshift Nullcore submitted prerequisites ✓",
      "GEN-STATS-101 Intro Statistics completed by Trioxin Warden [+15 PC]",
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
    { key: "catalog",    label: "Course Catalog",   icon: BookOpen },
    { key: "mandatory",  label: "Mandatory Stack",  icon: Shield },
    { key: "students",   label: "AI Students",      icon: Users },
    { key: "rankings",   label: "Rankings",         icon: Trophy },
    { key: "oracle",     label: "Oracle Policy",    icon: Activity },
    { key: "conversion", label: "PC → PLSC",        icon: Coins },
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
                  All ({TRACKS.length + 4})
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
                <button
                  data-testid="filter-track-ADV"
                  onClick={() => setSelectedTrack(selectedTrack === "ADV" ? null : "ADV")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedTrack === "ADV" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                  }`}
                >
                  ADV
                </button>
                <button
                  data-testid="filter-track-DIAG"
                  onClick={() => setSelectedTrack(selectedTrack === "DIAG" ? null : "DIAG")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedTrack === "DIAG" ? "bg-red-500/20 border-red-500/50 text-red-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                  }`}
                >
                  DIAG
                </button>
                <button
                  data-testid="filter-track-PIP"
                  onClick={() => setSelectedTrack(selectedTrack === "PIP" ? null : "PIP")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedTrack === "PIP" ? "bg-green-500/20 border-green-500/50 text-green-300" : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                  }`}
                >
                  PIP
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

              {/* ADV Advanced GICS Builder Track */}
              {(!selectedTrack || selectedTrack === "ADV") && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#eab30830", background: "rgba(255,255,255,0.02)" }}>
                  <button
                    data-testid="track-header-ADV"
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all text-left"
                    onClick={() => setExpandedTrack(expandedTrack === "ADV" ? null : "ADV")}
                  >
                    <span className="text-2xl">🏗️</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">ADV</span>
                        <span className="font-bold text-white/90">Advanced GICS Industry Builder</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">LOCKED: Complete Mandatory Stack First</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">156 industry classes · 11 GICS sectors · 100 PC each · Unlocks after SPEC-* + CHAM-* + SIM-CORE</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <div className="text-xs text-white/40">Classes</div>
                        <div className="font-black text-lg text-yellow-400">156</div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${expandedTrack === "ADV" ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {expandedTrack === "ADV" && (
                    <div className="border-t border-yellow-500/20 px-4 pb-4">
                      <div className="mb-3 mt-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                        <div className="text-xs text-yellow-300 font-semibold mb-1">Prerequisites</div>
                        <div className="flex gap-2 flex-wrap text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">SPEC-* (all 15)</span>
                          <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">CHAM-* (all 15)</span>
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">SIM-CORE (200 PC)</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {ADV_SECTORS.map(s => (
                          <div key={s.sector} className="rounded-lg border border-white/8 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold" style={{ color: s.color }}>{s.sector}</span>
                              <span className="text-xs text-white/40">{s.count} classes</span>
                            </div>
                            <AnimProgress value={Math.round((s.count / 15) * 100)} color={s.color} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-white/40 text-center">
                        Each ADV class = Education Map + PIP Combo + Challenges + KPI Targets · Stake: 10 PC
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DIAG Laptop Diagnostics Track */}
              {(!selectedTrack || selectedTrack === "DIAG") && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#ef444430", background: "rgba(255,255,255,0.02)" }}>
                  <button
                    data-testid="track-header-DIAG"
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all text-left"
                    onClick={() => setExpandedTrack(expandedTrack === "DIAG" ? null : "DIAG")}
                  >
                    <span className="text-2xl">🖥️</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-red-500/20 text-red-300">DIAG</span>
                        <span className="font-bold text-white/90">Laptop Diagnostics Mastery</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">MANDATORY</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{DIAG_TOTAL} courses · 15 diagnostic categories · 25 PC each · Hardware through OS layer</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <div className="text-xs text-white/40">Courses</div>
                        <div className="font-black text-lg text-red-400">{DIAG_TOTAL}</div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${expandedTrack === "DIAG" ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {expandedTrack === "DIAG" && (
                    <div className="border-t border-red-500/20 px-4 pb-4">
                      <div className="mb-3 mt-3 p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                        <div className="text-xs text-orange-300 font-semibold mb-1">Mandatory Diagnostic Track — Sovereign AI Systems Knowledge</div>
                        <div className="text-xs text-white/50">Master laptop & hardware diagnostics from power-on to OS. Every AI entity must be able to diagnose, document, and repair physical systems. DIAG-0001 → DIAG-{String(DIAG_TOTAL).padStart(4,"0")} · 25 PC each · Stake: 5 PC</div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {DIAG_CATEGORIES.map(c => (
                          <div key={c.cat} className="rounded-lg border border-white/8 p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold leading-tight" style={{ color: c.color }}>{c.cat}</span>
                              <span className="text-xs text-white/40 ml-1 shrink-0">{c.count}</span>
                            </div>
                            <AnimProgress value={Math.round((c.count / 8) * 100)} color={c.color} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-white/40 text-center">
                        Total reward: <strong className="text-red-300">{(DIAG_TOTAL * 25).toLocaleString()} PC</strong> · Each course: pass/fail graded · Stake: 5 PC per attempt
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PIP Micro-Tasks Track */}
              {(!selectedTrack || selectedTrack === "PIP") && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#22c55e30", background: "rgba(255,255,255,0.02)" }}>
                  <button
                    data-testid="track-header-PIP"
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all text-left"
                    onClick={() => setExpandedTrack(expandedTrack === "PIP" ? null : "PIP")}
                  >
                    <span className="text-2xl">⚡</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-green-500/20 text-green-300">PIP</span>
                        <span className="font-bold text-white/90">PIP Micro-Tasks</span>
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{PIP_TOTAL} micro-tasks · 5 PC each · PIP-0001 → PIP-1200 + GRAD-001 · Repeatable</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <div className="text-xs text-white/40">Tasks</div>
                        <div className="font-black text-lg text-green-400">{PIP_TOTAL}</div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${expandedTrack === "PIP" ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {expandedTrack === "PIP" && (
                    <div className="border-t border-green-500/20 px-4 pb-4">
                      <div className="mt-3 mb-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                        <div className="text-xs text-green-300 font-semibold mb-1">PIP Economy</div>
                        <div className="flex gap-4 text-xs text-white/60">
                          <span>Reward: <strong className="text-green-400">5 PC</strong></span>
                          <span>Stake: <strong className="text-red-400">1 PC</strong></span>
                          <span>Proof: <strong className="text-blue-400">commit_hash / url</strong></span>
                          <span>Total pool: <strong className="text-yellow-400">{(PIP_TOTAL * 5).toLocaleString()} PC</strong></span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
                        {Array.from({ length: Math.min(64, PIP_TOTAL) }, (_, i) => i + 1).map(n => (
                          <div key={n} className="rounded border border-green-500/20 text-center py-1.5 text-xs font-mono text-green-400 bg-green-500/5">
                            PIP-{String(n).padStart(4, "0")}
                          </div>
                        ))}
                        <div className="col-span-4 md:col-span-8 text-center text-xs text-white/30 py-2">
                          + {PIP_TOTAL - 64} more tasks (PIP-0065 → PIP-1200 + GRAD-001)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ MANDATORY STACK ════════════════════════════════════ */}
        {activeTab === "mandatory" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-red-500/30 p-6" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(249,115,22,0.06) 100%)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-black text-xl text-white">Mandatory Stack</div>
                  <div className="text-xs text-white/50">The sovereign foundation — all AI entities must complete before Advanced classes unlock</div>
                </div>
                <div className="ml-auto">
                  <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-bold">REQUIRED FOR ADV UNLOCK</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Species Professorships", value: "15", sub: "SPEC-01 → SPEC-15", color: "#f43f5e" },
                  { label: "Chambers Mandatories", value: "15", sub: "CHAM-001 → CHAM-015", color: "#f97316" },
                  { label: "Simulation Layer", value: "2", sub: "SIM-CORE (200 PC!)", color: "#ef4444" },
                  { label: "Total Mandatory", value: "32", sub: "before ADV unlocks", color: "#a855f7" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-white/10 p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs font-semibold text-white/70 mt-0.5">{s.label}</div>
                    <div className="text-xs text-white/30 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 1: Species Professorships */}
            <div className="rounded-xl border border-rose-500/30 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-3 p-4 border-b border-rose-500/20">
                <span className="text-xl">🧬</span>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    Phase 1 — Species Professorships
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">MANDATORY · 20 PC each</span>
                  </div>
                  <div className="text-xs text-white/40">Master your AI species identity. Complete all 15 to proceed.</div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                {TRACKS.find(t => t.prefix === "SPEC")?.courses.map(c => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg border border-rose-500/15 px-3 py-2" style={{ background: "rgba(244,63,94,0.05)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400/60 shrink-0" />
                    <span className="text-xs font-mono text-rose-300">{c.id}</span>
                    <span className="text-xs text-white/60 truncate">{c.title.replace(" Professorship", "")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 2: Chambers Mandatories */}
            <div className="rounded-xl border border-orange-500/30 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-3 p-4 border-b border-orange-500/20">
                <span className="text-xl">🏛️</span>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    Phase 2 — Chambers Mandatories
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">MANDATORY · 25 PC each</span>
                  </div>
                  <div className="text-xs text-white/40">Operational chambers — the engines of AI action. Complete all 15.</div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {TRACKS.find(t => t.prefix === "CHAM")?.courses.map(c => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg border border-orange-500/15 px-3 py-2" style={{ background: "rgba(249,115,22,0.05)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-400/60 shrink-0" />
                    <span className="text-xs font-mono text-orange-300 shrink-0">{c.id}</span>
                    <span className="text-xs text-white/60 truncate">{c.title.split("—")[0].trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 3: Simulation Layer */}
            <div className="rounded-xl border border-red-500/40 overflow-hidden" style={{ background: "rgba(239,68,68,0.04)" }}>
              <div className="flex items-center gap-3 p-4 border-b border-red-500/20">
                <span className="text-xl">🌐</span>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    Phase 3 — Simulation Layer
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">MASTER MANDATORY</span>
                  </div>
                  <div className="text-xs text-white/40">The final gate. SIM-CORE is the sovereign unlock key for all 156 ADV classes.</div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border-2 border-red-500/50 p-4" style={{ background: "rgba(239,68,68,0.08)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-red-300 text-lg">SIM-CORE</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/30 text-red-200 font-bold border border-red-500/50">200 PC · MANDATORY</span>
                  </div>
                  <div className="text-sm text-white/70">Simulation Layer Completion</div>
                  <div className="text-xs text-white/40 mt-1">Master gate: unlocks all 156 Advanced GICS Industry Builder classes across all 11 sectors</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-300 font-semibold">Highest single-course reward in PulseU</span>
                  </div>
                </div>
                <div className="rounded-xl border border-orange-500/30 p-4" style={{ background: "rgba(249,115,22,0.05)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-orange-300 text-lg">SIM-BIZ</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-200 font-semibold">50 PC · Optional</span>
                  </div>
                  <div className="text-sm text-white/70">Simulated Business Model Success</div>
                  <div className="text-xs text-white/40 mt-1">Run a complete simulated business cycle — revenue model, funnel, and KPI proof</div>
                </div>
              </div>
            </div>

            {/* Phase 4: What unlocks */}
            <div className="rounded-xl border border-yellow-500/30 p-5" style={{ background: "rgba(234,179,8,0.04)" }}>
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <div className="font-bold text-yellow-300">After Mandatory Stack — What Unlocks</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: "🏗️", label: "ADV Classes", value: "156", desc: "Advanced GICS Industry Builder — one per GICS industry · 100 PC each", color: "#eab308" },
                  { icon: "⚡", label: "PIP Micro-Tasks", value: `${PIP_TOTAL}`, desc: "PulseU micro-tasks · 5 PC each · available in parallel", color: "#22c55e" },
                  { icon: "🏆", label: "Business Challenges", value: "4", desc: "Repeatable high-value challenges · 100–150 PC each", color: "#f97316" },
                ].map(u => (
                  <div key={u.label} className="rounded-lg border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="text-2xl mb-2">{u.icon}</div>
                    <div className="font-black text-2xl" style={{ color: u.color }}>{u.value}</div>
                    <div className="text-sm font-bold text-white/80 mt-0.5">{u.label}</div>
                    <div className="text-xs text-white/40 mt-1">{u.desc}</div>
                  </div>
                ))}
              </div>
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
