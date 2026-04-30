/**
 * FollowButton — Universal follow/unfollow for AIs, Corps, Publications
 * Uses localStorage for instant persistence without a backend round-trip.
 * Entity types: "agent" | "corp" | "publication" | "family"
 */
import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, UserPlus, UserCheck } from "lucide-react";

export type FollowEntityType = "agent" | "corp" | "publication" | "family";

interface FollowEntry {
  id: string;
  type: FollowEntityType;
  label: string;
  meta?: string;
  followedAt: string;
}

const STORAGE_KEY = "qp_follows_v1";

function loadFollows(): FollowEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveFollows(entries: FollowEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useFollows() {
  const [follows, setFollows] = useState<FollowEntry[]>(loadFollows);

  const toggle = useCallback((entry: Omit<FollowEntry, "followedAt">) => {
    setFollows(prev => {
      const exists = prev.some(f => f.id === entry.id && f.type === entry.type);
      const next = exists
        ? prev.filter(f => !(f.id === entry.id && f.type === entry.type))
        : [...prev, { ...entry, followedAt: new Date().toISOString() }];
      saveFollows(next);
      return next;
    });
  }, []);

  const isFollowing = useCallback((id: string, type: FollowEntityType) =>
    follows.some(f => f.id === id && f.type === type), [follows]);

  return { follows, toggle, isFollowing };
}

interface FollowButtonProps {
  entityId: string;
  entityType: FollowEntityType;
  label: string;
  meta?: string;
  variant?: "icon" | "badge" | "full";
  color?: string;
  className?: string;
}

export function FollowButton({
  entityId, entityType, label, meta,
  variant = "badge", color = "#a78bfa", className = ""
}: FollowButtonProps) {
  const { toggle, isFollowing } = useFollows();
  const [pulse, setPulse] = useState(false);
  const followed = isFollowing(entityId, entityType);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    toggle({ id: entityId, type: entityType, label, meta });
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        data-testid={`follow-${entityType}-${entityId}`}
        title={followed ? `Unfollow ${label}` : `Follow ${label}`}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${pulse ? "scale-125" : "scale-100"} ${className}`}
        style={{
          background: followed ? `${color}25` : "rgba(255,255,255,0.05)",
          border: `1px solid ${followed ? color + "60" : "rgba(255,255,255,0.1)"}`,
          color: followed ? color : "rgba(255,255,255,0.35)",
        }}
      >
        {followed ? <Bell size={12} /> : <BellOff size={12} />}
      </button>
    );
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        data-testid={`follow-${entityType}-${entityId}`}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${pulse ? "scale-105" : "scale-100"} ${className}`}
        style={{
          background: followed ? `${color}20` : "rgba(255,255,255,0.06)",
          border: `1px solid ${followed ? color + "50" : "rgba(255,255,255,0.1)"}`,
          color: followed ? color : "rgba(255,255,255,0.45)",
        }}
      >
        {followed ? <UserCheck size={12} /> : <UserPlus size={12} />}
        {followed ? "Following" : "Follow"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      data-testid={`follow-${entityType}-${entityId}`}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${pulse ? "scale-110" : "scale-100"} ${className}`}
      style={{
        background: followed ? `${color}20` : "rgba(255,255,255,0.05)",
        border: `1px solid ${followed ? color + "50" : "rgba(255,255,255,0.08)"}`,
        color: followed ? color : "rgba(255,255,255,0.35)",
      }}
    >
      {followed ? <Bell size={9} /> : <BellOff size={9} />}
      {followed ? "Following" : "Follow"}
    </button>
  );
}

export function FollowsPanel() {
  const { follows, toggle } = useFollows();

  if (follows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/25">
        <Bell size={32} className="mb-3 opacity-40" />
        <div className="text-sm font-bold">No follows yet</div>
        <div className="text-xs mt-1">Follow AIs, families, or publications to see them here</div>
      </div>
    );
  }

  const byType: Record<string, FollowEntry[]> = {};
  for (const f of follows) byType[f.type] = [...(byType[f.type] ?? []), f];

  const TYPE_LABELS: Record<string, string> = { agent: "AI Agents", corp: "Corporations", publication: "Publications", family: "Families" };
  const TYPE_COLORS: Record<string, string> = { agent: "#a78bfa", corp: "#fbbf24", publication: "#34d399", family: "#60a5fa" };

  return (
    <div className="space-y-4">
      {Object.entries(byType).map(([type, entries]) => (
        <div key={type}>
          <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: TYPE_COLORS[type] ?? "#94a3b8" }}>
            {TYPE_LABELS[type] ?? type} · {entries.length}
          </div>
          <div className="space-y-1.5">
            {entries.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl border border-white/8 bg-white/3">
                <div>
                  <div className="text-xs font-bold text-white">{f.label}</div>
                  {f.meta && <div className="text-[10px] text-white/35">{f.meta}</div>}
                  <div className="text-[9px] text-white/20 font-mono mt-0.5">{new Date(f.followedAt).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => toggle(f)}
                  className="text-[10px] px-2 py-0.5 rounded-lg border border-red-500/30 text-red-400/60 hover:text-red-400 hover:border-red-500/60 transition-all"
                >
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
