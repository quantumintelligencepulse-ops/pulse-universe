import { motion, AnimatePresence } from "framer-motion";
import type { PlanetDatum } from "./planetData";

interface Props {
  planet: PlanetDatum | null;
  onBack: () => void;
}

export default function PlanetInfo({ planet, onBack }: Props) {
  if (!planet) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={planet.name}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="absolute top-12 left-0 bottom-12 w-72 z-20 pointer-events-auto overflow-hidden"
      >
        <div className="h-full bg-black/75 backdrop-blur-md border-r border-white/10 flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/30 text-xs tracking-[0.3em] uppercase font-mono">Object Data</span>
              <button
                onClick={onBack}
                className="text-white/30 hover:text-white text-xs tracking-widest uppercase transition-colors font-mono"
              >
                ✕ Close
              </button>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-[0.12em] uppercase mt-2">
              {planet.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-400 text-xs tracking-[0.2em] uppercase">{planet.facts?.["Type"]}</span>
            </div>
          </div>

          <motion.div
            className="h-px bg-blue-500/40 mx-0"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0" style={{ scrollbarWidth: "none" }}>
            {Object.entries(planet.facts).map(([key, value], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="py-2.5 border-b border-white/[0.07] flex flex-col gap-0.5"
              >
                <span className="text-white/30 text-xs tracking-[0.25em] uppercase font-mono">{key}</span>
                <span className="text-white text-sm font-semibold tracking-wide font-mono">{value}</span>
              </motion.div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-white/10">
            <p className="text-white/45 text-xs leading-relaxed font-mono">
              {planet.description}
            </p>
          </div>

          <div className="absolute top-12 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/60" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/60" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
