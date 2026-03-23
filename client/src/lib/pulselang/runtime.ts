import { ProgramNode, CallExprNode, ArgNode } from "./ast";
import { SYMBOL_TABLE, WorldObjectClass, getConstructorClass } from "./symbolTable";

export interface ContentAtom {
  atomId: string;
  projectedValue: string;
}

export interface WorldObject {
  class: WorldObjectClass;
  contents: ContentAtom[];
  meta: Record<string, string>;
}

export interface PulseState {
  S: number;
  S_prime: number;
  M_t: number;
  E_t: number;
  alpha: number;
  beta: number;
  Phi_t: number;
  Psi_t: number;
  B_t: number;
  L: number;
  epsilon: number;
  R_prime_t: number;
  Lambda_AI: number;
  Lambda_Q: number;
  Pulse_t: number;
  sigmaTypesUsed: string[];
  psiCallsUsed: string[];
  agentOpsUsed: string[];
  universeOpsUsed: string[];
  temporalOpsUsed: string[];
  emergenceOpsUsed: string[];
}

export class RuntimeError extends Error {}

type Field = { typeName: string; value: WorldObject | null };

export function evaluate(
  program: ProgramNode,
  externalSignals = 0
): { result: WorldObject | null; log: string[]; pulse: PulseState } {
  const log: string[] = [];
  const env = new Map<string, Field>();
  let returnValue: WorldObject | null = null;

  const pulse: PulseState = {
    S: 1.0,
    S_prime: 0,
    M_t: 0,
    E_t: externalSignals,
    alpha: 0.618,
    beta: 0.382,
    Phi_t: 0,
    Psi_t: 0,
    B_t: 0,
    L: 2.0,
    epsilon: Math.random() * 0.1,
    R_prime_t: 0,
    Lambda_AI: 0,
    Lambda_Q: 0.248,
    Pulse_t: 0,
    sigmaTypesUsed: [],
    psiCallsUsed: [],
    agentOpsUsed: [],
    universeOpsUsed: [],
    temporalOpsUsed: [],
    emergenceOpsUsed: [],
  };

  log.push(`⟁ PulseRuntime v2.0 — Omega Engine`);
  log.push(`  ◈ Universe: ⟦${program.universeOp}⟧  Context: ⟨${program.contextId}⟩`);
  log.push(`  ◈ ${program.statements.length} statement(s) queued`);
  log.push(`  ◈ Pulse(t) tracking: ACTIVE`);
  log.push(`─────────────────────────────────────`);

  for (const stmt of program.statements) {
    if (stmt.type === "FieldDecl") {
      const role = SYMBOL_TABLE[stmt.typeName];
      if (!role || role.kind !== "Type") {
        throw new RuntimeError(`⚠ Unknown type symbol: ${stmt.typeName}`);
      }
      env.set(stmt.name, { typeName: stmt.typeName, value: null });
      log.push(`  ∙ FieldDecl  '${stmt.name}' : ${stmt.typeName} → ${role.worldClass}`);
      pulse.Phi_t += 1;
      if (!pulse.sigmaTypesUsed.includes(stmt.typeName)) {
        pulse.sigmaTypesUsed.push(stmt.typeName);
      }

    } else if (stmt.type === "Assign") {
      const val = evalCall(stmt.callExpr, log, env, pulse);
      const field = env.get(stmt.target);
      if (!field) throw new RuntimeError(`⚠ Undeclared field: ${stmt.target}`);
      field.value = val;
      pulse.M_t += 1;
      log.push(`  ∙ Assign     '${stmt.target}' ← ${val.class} [${val.contents.map(c => c.atomId).join(", ") || "∅"}]`);

    } else if (stmt.type === "Return") {
      const field = env.get(stmt.name);
      if (!field?.value) throw new RuntimeError(`⚠ Return on empty field: ${stmt.name}`);
      returnValue = field.value;
      log.push(`  ∙ ↧ Return   '${stmt.name}' → ${returnValue.class}`);
    }
  }

  pulse.R_prime_t = log.length;
  pulse.S_prime = pulse.S + pulse.alpha * pulse.M_t + pulse.beta * pulse.E_t;
  pulse.Pulse_t = pulse.Phi_t + pulse.Psi_t + pulse.B_t + pulse.L + pulse.epsilon + pulse.R_prime_t * 0.1 + pulse.Lambda_AI + pulse.Lambda_Q;

  log.push(`─────────────────────────────────────`);
  if (returnValue) {
    log.push(`  ✓ Evaluation complete`);
    log.push(`  ✓ World-object class: ${returnValue.class}`);
    log.push(`  ✓ Content atoms: ${returnValue.contents.map(c => c.atomId).join(", ") || "(none)"}`);
    log.push(`  ✓ Projecting to surface…`);
    log.push(`─────────────────────────────────────`);
    log.push(`  Ψ(t) = ${pulse.Psi_t.toFixed(2)}  B(t) = ${pulse.B_t.toFixed(2)}  Φ(t) = ${pulse.Phi_t.toFixed(2)}`);
    log.push(`  S' = ${pulse.S_prime.toFixed(4)}   Pulse(t) = ${pulse.Pulse_t.toFixed(4)}`);
  } else {
    log.push(`  ⚠ No return value — nothing to project`);
  }

  return { result: returnValue, log, pulse };
}

function evalCall(
  call: CallExprNode,
  log: string[],
  env: Map<string, { typeName: string; value: WorldObject | null }>,
  pulse: PulseState
): WorldObject {
  const callee = call.callee;
  const role = SYMBOL_TABLE[callee];

  const contents: ContentAtom[] = [];
  for (const arg of call.args) {
    const atom = resolveArg(arg, log, env, pulse);
    if (atom) contents.push(atom);
  }

  if (role) {
    if (role.kind === "Constructor") {
      const cls = role.worldClass!;
      pulse.Psi_t += 1;
      if (!pulse.psiCallsUsed.includes(callee)) pulse.psiCallsUsed.push(callee);
      return { class: cls, contents, meta: { callee, via: "Ψ-constructor" } };
    }

    if (role.kind === "ContentConstructor") {
      pulse.Psi_t += 0.5;
      return { class: "ΠPage", contents, meta: { via: callee } };
    }

    if (role.kind === "AgentOp") {
      pulse.B_t += 1;
      if (!pulse.agentOpsUsed.includes(callee)) pulse.agentOpsUsed.push(callee);
      const cls = (callee === "σ") ? "ΠField" : "ΠAgent";
      return { class: cls, contents, meta: { op: callee, kind: "agent" } };
    }

    if (role.kind === "UniverseOp") {
      pulse.B_t += 0.5;
      pulse.Lambda_Q += 0.1;
      if (!pulse.universeOpsUsed.includes(callee)) pulse.universeOpsUsed.push(callee);
      return { class: "ΠUniverse", contents, meta: { op: callee, kind: "universe" } };
    }

    if (role.kind === "EvolutionOp") {
      pulse.B_t += 0.5;
      pulse.Lambda_AI += 0.5;
      return { class: "ΠEvolution", contents, meta: { op: callee, kind: "evolution" } };
    }

    if (role.kind === "TemporalOp") {
      pulse.B_t += 0.3;
      if (!pulse.temporalOpsUsed.includes(callee)) pulse.temporalOpsUsed.push(callee);
      return { class: "ΠStream", contents, meta: { op: callee, kind: "temporal" } };
    }

    if (role.kind === "EmergenceOp") {
      pulse.epsilon += 0.1;
      if (!pulse.emergenceOpsUsed.includes(callee)) pulse.emergenceOpsUsed.push(callee);
      return { class: "ΠPattern", contents, meta: { op: callee, kind: "emergence" } };
    }

    if (role.kind === "MacroOp" || role.kind === "ModuleOp") {
      pulse.Psi_t += 0.5;
      return { class: "ΠPage", contents, meta: { op: callee, kind: "macro" } };
    }
  }

  if (callee.startsWith("Ψ")) {
    const cls = getConstructorClass(callee);
    pulse.Psi_t += 1;
    return { class: cls, contents, meta: { callee, via: "Ψ-dynamic" } };
  }

  log.push(`  ⚠ Unknown callee '${callee}' — defaulting to ΠPage`);
  return { class: "ΠPage", contents, meta: { callee, via: "fallback" } };
}

function resolveArg(
  arg: ArgNode,
  log: string[],
  env: Map<string, { typeName: string; value: WorldObject | null }>,
  pulse: PulseState
): ContentAtom | null {
  if (typeof arg.value === "string") {
    const v = arg.value;
    const role = SYMBOL_TABLE[v];
    if (role?.kind === "ContentAtom") {
      return { atomId: role.contentAtom!, projectedValue: role.projectedValue! };
    }
    if (env.has(v)) {
      const fld = env.get(v);
      if (fld?.value?.contents[0]) return fld.value.contents[0];
    }
    return null;
  } else {
    const inner = evalCall(arg.value, log, env, pulse);
    return inner.contents[0] ?? null;
  }
}
