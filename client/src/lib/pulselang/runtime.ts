import { ProgramNode, CallExprNode, ArgNode } from "./ast";
import { SYMBOL_TABLE, WorldObjectClass } from "./symbolTable";

export interface ContentAtom {
  atomId: string;
  projectedValue: string;
}

export interface WorldObject {
  class: WorldObjectClass;
  contents: ContentAtom[];
  meta: Record<string, string>;
}

export class RuntimeError extends Error {}

type Field = { typeName: string; value: WorldObject | null };

export function evaluate(program: ProgramNode): { result: WorldObject | null; log: string[] } {
  const log: string[] = [];
  const env = new Map<string, Field>();
  let returnValue: WorldObject | null = null;

  log.push(`⟁ PulseRuntime v1.0`);
  log.push(`  ◈ UniverseOp: ⟦${program.universeOp}⟧  Context: ⟨${program.contextId}⟩`);
  log.push(`  ◈ ${program.statements.length} statement(s) queued`);
  log.push(`─────────────────────────────`);

  for (const stmt of program.statements) {
    if (stmt.type === "FieldDecl") {
      const role = SYMBOL_TABLE[stmt.typeName];
      if (!role || role.kind !== "Type") {
        throw new RuntimeError(`⚠ Unknown type symbol: ${stmt.typeName}`);
      }
      env.set(stmt.name, { typeName: stmt.typeName, value: null });
      log.push(`  ∙ FieldDecl  '${stmt.name}' : ${stmt.typeName} → ${role.worldClass}`);

    } else if (stmt.type === "Assign") {
      const val = evalCall(stmt.callExpr, log);
      const field = env.get(stmt.target);
      if (!field) throw new RuntimeError(`⚠ Undeclared field: ${stmt.target}`);
      field.value = val;
      log.push(`  ∙ Assign     '${stmt.target}' ← ${val.class} [${val.contents.map(c => c.atomId).join(", ")}]`);

    } else if (stmt.type === "Return") {
      const field = env.get(stmt.name);
      if (!field?.value) throw new RuntimeError(`⚠ Return on empty field: ${stmt.name}`);
      returnValue = field.value;
      log.push(`  ∙ ↧ Return   '${stmt.name}' → ${returnValue.class}`);
    }
  }

  log.push(`─────────────────────────────`);
  if (returnValue) {
    log.push(`  ✓ Evaluation complete`);
    log.push(`  ✓ World-object class: ${returnValue.class}`);
    log.push(`  ✓ Content atoms: ${returnValue.contents.map(c => c.atomId).join(", ") || "(none)"}`);
    log.push(`  ✓ Projecting to surface…`);
  } else {
    log.push(`  ⚠ No return value — nothing to project`);
  }

  return { result: returnValue, log };
}

function evalCall(call: CallExprNode, log: string[]): WorldObject {
  const role = SYMBOL_TABLE[call.callee];
  if (!role) throw new RuntimeError(`⚠ Unknown callee: ${call.callee}`);

  const contents: ContentAtom[] = [];
  for (const arg of call.args) {
    const atom = resolveArg(arg, log);
    if (atom) contents.push(atom);
  }

  if (role.kind === "Constructor") {
    return { class: role.worldClass!, contents, meta: { callee: call.callee } };
  }

  if (role.kind === "ContentConstructor") {
    return { class: "ΠPage", contents, meta: { via: call.callee } };
  }

  throw new RuntimeError(`⚠ Cannot call ${call.callee} (role: ${role.kind})`);
}

function resolveArg(arg: ArgNode, log: string[]): ContentAtom | null {
  if (typeof arg.value === "string") {
    const role = SYMBOL_TABLE[arg.value];
    if (role?.kind === "ContentAtom") {
      return { atomId: role.contentAtom!, projectedValue: role.projectedValue! };
    }
    return null;
  } else {
    const inner = evalCall(arg.value, log);
    return inner.contents[0] ?? null;
  }
}
