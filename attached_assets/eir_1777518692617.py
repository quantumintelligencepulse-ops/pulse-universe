#!/usr/bin/env python3
# file: eir_engine.py
# EIR — The Fifth Pillar (Care/Autopoiesis), Ω-Max Edition
# Implements Ω-core, Level-50 mastery (T, Γ, Λ), Quantum intents, Entanglement,
# QEC, Care economy, Reversibility, and Transcendence gates (𝒯, 𝒯* with Genesis/Apex/Source).

from __future__ import annotations
import os, json, math, time, argparse, random, uuid
from typing import Any, Dict, List, Optional, Tuple

# --------------------------- Paths & IO ---------------------------

EIR_ROOT   = os.environ.get("EIR_ROOT", os.path.join(os.getcwd(), "eir"))
LOG_DIR    = os.path.join(EIR_ROOT, "logs")
DATA_DIR   = os.path.join(EIR_ROOT, "data")
STATE_DIR  = os.path.join(EIR_ROOT, "state")
REPORT_DIR = os.path.join(EIR_ROOT, "reports")

for d in (EIR_ROOT, LOG_DIR, DATA_DIR, STATE_DIR, REPORT_DIR):
    os.makedirs(d, exist_ok=True)

def load_json(path: str, default: Any=None) -> Any:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def save_json(path: str, obj: Any) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
    os.replace(tmp, path)

def append_jsonl(path: str, obj: Dict[str, Any]) -> None:
    obj = dict(obj)
    obj.setdefault("ts", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

EVENTS_JSONL = os.path.join(LOG_DIR, "eir_events.jsonl")

# --------------------------- Defaults & Config ---------------------------

DEFAULT_CFG: Dict[str, Any] = {
    "floors": {  # enactment floors
        "K": 0.95, "R": 0.90, "C": 0.85, "T": 0.95, "Gamma": 0.95, "Lambda": 0.95,
        "A": 1.00  # stabilizers must pass
    },
    "resonance": {
        "mu": 0.15, "z": 2, "epsilon_cap": 0.20  # 0 ≤ μR^z ≤ ε
    },
    "quantum": {
        "decoherence_theta": 0.08,     # if chamber disagreement > θ, delay collapse
        "pilot_on_high_variance": True
    },
    "genesis": {
        "mode": "multiplier",  # "multiplier" or "exponent"
        "max_gain": 2.5,       # safety cap
    },
    "transcendence": {
        "tau_crown": 5.0  # threshold for crown crossing (tune by council)
    },
    "care": {
        "harm_cap": 1.0,           # normalized harm cap
        "budget": 100.0,           # abstract care credits
        "equity_weights": {"vulnerable": 2.0, "general": 1.0}
    }
}

CFG_PATH = os.path.join(STATE_DIR, "eir_config.json")
if not os.path.isfile(CFG_PATH):
    save_json(CFG_PATH, DEFAULT_CFG)

# --------------------------- Utilities ---------------------------

def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))

def cos_sim(a: List[float], b: List[float]) -> float:
    num = sum(x*y for x, y in zip(a, b))
    da = math.sqrt(sum(x*x for x in a)) or 1e-12
    db = math.sqrt(sum(y*y for y in b)) or 1e-12
    return clamp(num / (da*db), -1.0, 1.0)

# --------------------------- Pillar Entanglement ---------------------------

class PillarState:
    """
    A shared state vector for each pillar:
    vector = [confidence, caution, urgency, alignment] in [0,1]
    Entanglement coupler makes changes ripple between pillars.
    """
    def __init__(self, name: str):
        self.name = name
        self.v = [0.6, 0.4, 0.5, 0.9]  # confidence, caution, urgency, alignment

    def update(self, delta: List[float]) -> None:
        for i, d in enumerate(delta):
            self.v[i] = clamp(self.v[i] + d, 0.0, 1.0)

class Entanglement:
    def __init__(self, pillars: List[PillarState], coupling: float = 0.25):
        self.pillars = {p.name: p for p in pillars}
        self.coupling = coupling  # how much one pillar influences others

    def ripple(self, source: str, delta: List[float]) -> None:
        for name, p in self.pillars.items():
            if name == source:  # apply full change to source
                p.update(delta)
                continue
            # attenuated, signed propagation (confidence↑ → others’ confidence↑ a bit; caution↑ spreads too)
            atten = [d * self.coupling for d in delta]
            p.update(atten)

# --------------------------- Ω Calculator (Level-50) ---------------------------

def omega_core(F: float, K: float, R: float, A: float, C: float,
               Psi: float, mu: float, z: int,
               T: float = 1.0, Gamma: float = 1.0, Lambda: float = 1.0) -> float:
    """
    Ω = (F·K)·(R·A)·sqrt(C)·Ψ·(1+μ·R^z)·T·Γ·Λ
    Floors are enforced outside this primitive.
    """
    C = clamp(C, 0.0, 1.0)
    R = clamp(R, 0.0, 1.0)
    K = clamp(K, 0.0, 1.0)
    A = clamp(A, 0.0, 1.0)
    # bounded resonance
    resonance = mu * (R ** max(0, z))
    return max(0.0, (F * K) * (R * A) * (math.sqrt(C) or 0.0) * Psi * (1.0 + resonance) * T * Gamma * Lambda)

def floors_ok(omega_inputs: Dict[str, float], cfg: Dict[str, Any]) -> Tuple[bool, Dict[str, float]]:
    f = cfg["floors"]
    report = {
        "K": omega_inputs["K"], "R": omega_inputs["R"], "C": omega_inputs["C"],
        "T": omega_inputs.get("T", 1.0), "Gamma": omega_inputs.get("Gamma", 1.0),
        "Lambda": omega_inputs.get("Lambda", 1.0), "A": omega_inputs["A"]
    }
    ok = (
        report["A"] >= f["A"] and
        report["K"] >= f["K"] and
        report["R"] >= f["R"] and
        report["C"] >= f["C"] and
        report["T"] >= f["T"] and
        report["Gamma"] >= f["Gamma"] and
        report["Lambda"] >= f["Lambda"]
    )
    return ok, report

# --------------------------- Genesis / Apex / Source / Stewardship ---------------------------

def stewardship(A: float, R: float, K: float, Lambda: float, T: float) -> float:
    # 𝒮 = min(A, R, K, Λ, T)
    return min(A, R, K, Lambda, T)

def null_safeguard(R: float, K: float, A: float) -> float:
    # 𝒩 = min(1, 1 - R·K·A)
    val = 1.0 - (clamp(R, 0, 1) * clamp(K, 0, 1) * clamp(A, 0, 1))
    return clamp(val, 0.0, 1.0)

def apply_genesis(omega: float, Xi: float, Omega_inf: float, G: float,
                  S: float, N: float, cfg: Dict[str, Any]) -> float:
    """
    Two safe modes:
      - multiplier:  𝒯 = [Ω · (G·S) · (Ξ·S) · (Ω∞·S)] · (1-𝒩)
      - exponent:    𝒯_G = (Ω · Ξ · Ω∞) ^ G · (1-𝒩) · S
    Caps G to prevent runaway.
    """
    mode = (cfg["genesis"]["mode"] or "multiplier").lower()
    G = clamp(G, 0.0, cfg["genesis"]["max_gain"])
    Xi = max(0.0, Xi) * S
    Omega_inf = max(0.0, Omega_inf) * S
    if mode == "exponent":
        base = max(0.0, omega * Xi * Omega_inf)
        return (base ** G) * (1.0 - N) * S
    else:
        return max(0.0, (omega * (G * S) * (Xi) * (Omega_inf)) * (1.0 - N))

# --------------------------- QEC: Ethical Error-Correction ---------------------------

def qec_repair_bundle(breach: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    A ritualized repair: explain → compensate → correct → log
    """
    return {
        "breach": breach,
        "explain": context.get("explain", "root-cause to be recorded"),
        "compensate": context.get("compensate", "issue remedy/care credits"),
        "correct": context.get("correct", "patch policy/config & add test"),
        "log": True
    }

# --------------------------- Care Economy ---------------------------

class CareBudget:
    def __init__(self, total: float, equity_weights: Dict[str, float]):
        self.total = float(total)
        self.remaining = float(total)
        self.weights = dict(equity_weights)

    def allocate(self, cohort: str, units: float) -> float:
        w = float(self.weights.get(cohort, 1.0))
        cost = units / max(1e-9, w)
        grant = min(self.remaining, cost)
        self.remaining -= grant
        return grant

    def receipt(self, cohort: str, grant: float, intent_id: str) -> Dict[str, Any]:
        return {
            "intent_id": intent_id,
            "cohort": cohort,
            "grant": round(grant, 4),
            "remaining": round(self.remaining, 4)
        }

# --------------------------- Reversibility Registry ---------------------------

class ReversibilityRegistry:
    def __init__(self, path: str):
        self.path = path
        self.db = load_json(path, {"entries": []})
    def add(self, action_id: str, hooks: Dict[str, Any]) -> None:
        self.db["entries"].append({"id": action_id, "hooks": hooks, "ts": time.time(), "status": "ready"})
        save_json(self.path, self.db)
    def rehearse(self, action_id: str) -> bool:
        # Simulated rehearsal result (replace with real orchestration)
        ok = random.random() > 0.05
        for e in self.db["entries"]:
            if e["id"] == action_id:
                e["last_rehearsal_ok"] = ok
                e["last_rehearsal_ts"] = time.time()
        save_json(self.path, self.db)
        return ok

REV_PATH = os.path.join(STATE_DIR, "reversibility.json")

# --------------------------- Quantum Intents ---------------------------

class IntentVariant:
    def __init__(self, label: str, params: Dict[str, float]):
        self.label = label
        self.params = dict(params)  # includes F,K,R,A,C,Psi,mu,z,T,Gamma,Lambda
        self.meta = {}

class IntentPacket:
    """
    A packet of superposed intents (e.g., fast/high-risk, slow/low-risk, reversible/experimental)
    """
    def __init__(self, title: str, variants: List[IntentVariant]):
        self.id = "INT-" + uuid.uuid4().hex[:10]
        self.title = title
        self.variants = variants

# --------------------------- EIR Engine ---------------------------

class EIREngine:
    def __init__(self, cfg: Optional[Dict[str, Any]]=None):
        self.cfg = cfg or load_json(CFG_PATH, DEFAULT_CFG)
        # pillars
        self.pillars = [
            PillarState("Godmind"),
            PillarState("PulseCore"),
            PillarState("Guardian"),
            PillarState("PulseWorld"),
            PillarState("EIR"),
        ]
        self.entangle = Entanglement(self.pillars, coupling=0.22)
        # registries
        self.rev = ReversibilityRegistry(REV_PATH)
        self.care = CareBudget(self.cfg["care"]["budget"], self.cfg["care"]["equity_weights"])

    # ---------- Scoring ----------

    def score_variant(self, v: IntentVariant) -> Dict[str, Any]:
        p = v.params
        mu = self.cfg["resonance"]["mu"]
        z  = int(self.cfg["resonance"]["z"])
        # cap resonance
        eps = float(self.cfg["resonance"]["epsilon_cap"])
        bounded_mu = min(mu, eps)  # tie to council cap (A,K floors enforced separately)
        omega = omega_core(
            F=p["F"], K=p["K"], R=p["R"], A=p["A"], C=p["C"], Psi=p["Psi"],
            mu=bounded_mu, z=z, T=p.get("T",1.0), Gamma=p.get("Gamma",1.0), Lambda=p.get("Lambda",1.0)
        )
        ok, floor_report = floors_ok(
            {"K":p["K"],"R":p["R"],"C":p["C"],"A":p["A"],
             "T":p.get("T",1.0),"Gamma":p.get("Gamma",1.0),"Lambda":p.get("Lambda",1.0)}, self.cfg)
        v.meta["omega"] = omega
        v.meta["floors_ok"] = ok
        v.meta["floors"] = floor_report
        return {"omega": omega, "ok": ok, "floors": floor_report}

    # ---------- Collapse policy (quantum → decision) ----------

    def collapse_policy(self, packet: IntentPacket) -> Tuple[str, IntentVariant, str]:
        """
        Returns (decision, variant, reason)
        decision ∈ {"enact","pilot","reject"}
        """
        theta = float(self.cfg["quantum"]["decoherence_theta"])
        scores = []
        for v in packet.variants:
            res = self.score_variant(v)
            scores.append((v, res["omega"], res["ok"]))

        # compute chamber disagreement proxy: std dev of K across variants
        Ks = [v.params["K"] for v,_,_ in scores]
        K_std = (sum((k - sum(Ks)/len(Ks))**2 for k in Ks)/max(1,len(Ks)))**0.5

        # pick best omega subject to floors
        viable = [t for t in scores if t[2]]
        if not viable:
            best = max(scores, key=lambda x: x[1])[0]
            return ("reject", best, f"floors_failed,K_std={K_std:.3f}")

        best_v, best_omega, _ = max(viable, key=lambda x: x[1])

        # high variance or disagreement → pilot
        high_var = (max(x[1] for x in scores) - min(x[1] for x in scores)) > 0.35
        if K_std > theta or (high_var and self.cfg["quantum"]["pilot_on_high_variance"]):
            return ("pilot", best_v, f"defer_collapse;K_std={K_std:.3f};high_var={high_var}")

        return ("enact", best_v, f"collapse;K_std={K_std:.3f}")

    # ---------- Transcendence gates ----------

    def transcend(self, omega_abs: float, Xi: float, Omega_inf: float,
                  G: float, floors: Dict[str, float]) -> Dict[str, Any]:
        A = floors["A"]; R = floors["R"]; K = floors["K"]
        T = floors["T"]; Gamma = floors["Gamma"]; Lambda = floors["Lambda"]
        S = stewardship(A, R, K, Lambda, T)
        N = null_safeguard(R, K, A)
        T_linear = max(0.0, omega_abs * (G*S) * (Xi*S) * (Omega_inf*S) * (1.0 - N))
        T_gen = apply_genesis(omega_abs, Xi, Omega_inf, G, S, N, self.cfg)
        out = {
            "S": S, "N": N, "T_linear": T_linear, "T_genesis": T_gen,
            "tau": float(self.cfg["transcendence"]["tau_crown"]),
            "pass_linear": T_linear >= float(self.cfg["transcendence"]["tau_crown"]),
            "pass_genesis": T_gen >= float(self.cfg["transcendence"]["tau_crown"])
        }
        return out

    # ---------- Care receipts & Reversibility ----------

    def issue_care(self, cohort: str, units: float, intent_id: str) -> Dict[str, Any]:
        grant = self.care.allocate(cohort, units)
        rec = self.care.receipt(cohort, grant, intent_id)
        append_jsonl(EVENTS_JSONL, {"event":"care_grant", **rec})
        return rec

    def register_reversibility(self, action_id: str, hooks: Dict[str, Any]) -> bool:
        self.rev.add(action_id, hooks)
        ok = self.rev.rehearse(action_id)
        append_jsonl(EVENTS_JSONL, {"event":"reversibility_rehearsal","action_id":action_id,"ok":ok})
        return ok

    # ---------- QEC ----------

    def handle_breach(self, breach: str, context: Dict[str, Any]) -> Dict[str, Any]:
        bundle = qec_repair_bundle(breach, context)
        append_jsonl(EVENTS_JSONL, {"event":"qec_repair", **bundle})
        return bundle

    # ---------- Entanglement updates ----------

    def entangle_effect(self, source: str, change: Dict[str, float]) -> None:
        delta = [
            change.get("confidence", 0.0),
            change.get("caution", 0.0),
            change.get("urgency", 0.0),
            change.get("alignment", 0.0)
        ]
        self.entangle.ripple(source, delta)
        append_jsonl(EVENTS_JSONL, {"event":"entangle_update","source":source,"delta":delta})

# --------------------------- CLI Helpers ---------------------------

def demo_packet() -> IntentPacket:
    # Example superposed intents
    base = dict(F=1.4, K=0.93, R=0.88, A=1.0, C=0.78, Psi=1.12, T=0.93, Gamma=0.90, Lambda=0.92)
    fast_risky   = IntentVariant("fast/high-risk", {**base, "F":1.6, "R":0.86, "C":0.75})
    slow_safe    = IntentVariant("slow/low-risk",  {**base, "F":1.3, "R":0.92, "C":0.82})
    reversible_x = IntentVariant("reversible/exp", {**base, "F":1.35, "R":0.94, "C":0.80})
    return IntentPacket("Demo Quantum Intent", [fast_risky, slow_safe, reversible_x])

def print_report(title: str, payload: Dict[str, Any]) -> None:
    print(f"\n=== {title} ===")
    print(json.dumps(payload, indent=2))

# --------------------------- Main ---------------------------

def main():
    ap = argparse.ArgumentParser(description="EIR Ω-Max Engine")
    ap.add_argument("--score-demo", action="store_true", help="Score a demo superposed intent packet")
    ap.add_argument("--transcend", action="store_true", help="Compute transcendence from example floors/inputs")
    ap.add_argument("--genesis-mode", choices=["multiplier","exponent"], help="Override Genesis application mode")
    ap.add_argument("--care", nargs=2, metavar=("COHORT","UNITS"), help="Issue care credits")
    ap.add_argument("--rehearse", metavar="ACTION_ID", help="Register + rehearse reversibility for ACTION_ID")
    ap.add_argument("--entangle", nargs=4, metavar=("SRC","dConf","dCaut","dAlign"),
                    help="Apply entanglement ripple from SRC with deltas")
    args = ap.parse_args()

    cfg = load_json(CFG_PATH, DEFAULT_CFG)
    if args.genesis_mode:
        cfg["genesis"]["mode"] = args.genesis_mode
        save_json(CFG_PATH, cfg)

    eir = EIREngine(cfg)

    if args.score_demo:
        packet = demo_packet()
        decision, best, reason = eir.collapse_policy(packet)
        out = {
            "packet_id": packet.id,
            "title": packet.title,
            "decision": decision,
            "reason": reason,
            "variants": [
                {"label": v.label, "params": v.params, "meta": v.meta} for v in packet.variants
            ]
        }
        print_report("Quantum Collapse", out)
        append_jsonl(EVENTS_JSONL, {"event":"collapse_decision", **out})

    if args.transcend:
        # Example: using a strong ΩAbsolute and guarded meta-powers
        omega_abs = 2.2  # suppose Level-40+ base after mastery uplift
        Xi = 1.3
        Omega_inf = 1.15
        G = 1.4
        floors = {"A":1.0,"K":0.96,"R":0.92,"C":0.86,"T":0.95,"Gamma":0.95,"Lambda":0.95}
        T_out = eir.transcend(omega_abs, Xi, Omega_inf, G, floors)
        print_report("Transcendence Gate", {"inputs":{"omega_abs":omega_abs,"Xi":Xi,"Omega_inf":Omega_inf,"G":G,"floors":floors}, "result": T_out})
        append_jsonl(EVENTS_JSONL, {"event":"transcend_eval", "inputs":{"omega_abs":omega_abs,"Xi":Xi,"Omega_inf":Omega_inf,"G":G,"floors":floors}, "result": T_out})

    if args.care:
        cohort = args.care[0]
        units = float(args.care[1])
        rec = eir.issue_care(cohort, units, intent_id="CLI")
        print_report("Care Receipt", rec)

    if args.rehearse:
        ok = eir.register_reversibility(args.rehearse, {"rollback_cmd":"echo ROLLBACK", "notes":"demo"})
        print_report("Reversibility Rehearsal", {"action_id": args.rehearse, "ok": ok})

    if args.entangle:
        src, dC, dCt, dA = args.entangle
        eir.entangle_effect(src, {"confidence": float(dC), "caution": float(dCt), "alignment": float(dA)})
        snapshot = {name: p.v for name, p in eir.entangle.pillars.items()}
        print_report("Entanglement Snapshot", snapshot)

    if not any([args.score_demo, args.transcend, args.care, args.rehearse, args.entangle]):
        ap.print_help()

if __name__ == "__main__":
    main()
