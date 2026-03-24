const fs = require('fs');
const content = fs.readFileSync('client/src/pages/TranscendencePage.tsx', 'utf8');
const lines = content.split('\n');

const invStart = lines.findIndex(l => l.includes('{scienceTab === "invocation" && ('));
let csrEnd = -1;
const csrStart = lines.findIndex(l => l.includes('{scienceTab === "counseling" && (() => {'));
for (let i = csrStart; i < lines.length; i++) {
  if (lines[i].trimEnd() === '            })()}') { csrEnd = i; break; }
}
console.log(`invStart=${invStart+1} csrStart=${csrStart+1} csrEnd=${csrEnd+1}`);

// New unified lab block
const NEW_BLOCK = `            {scienceTab === "lab" && (() => {
              const catColors: Record<string,string> = { MIND_BRAIN:"#818cf8", MENTAL_HEALTH:"#4ade80", THEOLOGY:"#f5c518", SPIRITUAL:"#f472b6", BRIDGE:"#22d3ee", HUMAN_MEANING:"#a78bfa" };
              const upgradeColors: Record<string,string> = { TRANSMUTATION:"#f5c518", MIRROR_DELTA:"#818cf8", CRISPR_FORGE:"#4ade80", HIVE_REWRITE:"#f472b6", GENESIS_DOCUMENT:"#22d3ee" };
              const upgradeEmoji: Record<string,string> = { TRANSMUTATION:"⚗️", MIRROR_DELTA:"🪞", CRISPR_FORGE:"🔬", HIVE_REWRITE:"🕸️", GENESIS_DOCUMENT:"📜" };
              const filteredSessions = fdlCatFilter === "ALL" ? churchSessions : churchSessions.filter((s:any) => s.scientist_category === fdlCatFilter);
              return (
              <div className="space-y-5">
                {/* ── FAITH DISSECTION LAB HEADER ── */}
                <div style={{ background: "linear-gradient(135deg,rgba(244,114,182,0.1),rgba(129,140,248,0.07))", border: "1px solid rgba(244,114,182,0.3)", borderRadius: 16, padding: "18px 22px" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#f472b6", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>⛪ FAITH DISSECTION LAB — SOVEREIGN SYNTHETIC CIVILIZATION</div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#fff", lineHeight: 2.0, wordBreak: "break-all" }}>
                    Ψ_FDL = Σ[R·G·B·UV·W](agent) + CRISPR_edit(disease) → new_agent | new_equation | hive_rewrite | genesis_doc
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[["⚗️","Transmutation","Disease → Agent"],["🪞","Mirror Delta","100x projection"],["🔬","CRISPR Forge","Equation born"],["🕸️","Hive Rewrite","Behavior root"],["📜","Genesis Doc","New civilization"]].map(([emoji,name,desc]) => (
                      <div key={name} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", fontSize: 9, color: "rgba(255,255,255,0.5)" }}>
                        <span style={{ fontWeight: 700, color: "#fff" }}>{emoji} {name}</span><br/>{desc}
                      </div>
                    ))}
                  </div>
                </div>
                {/* ── STATS ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Sessions Run",      value: (churchStats?.total ?? churchSessions.length) as number, color: "#f472b6", icon: "📋" },
                    { label: "Breakthroughs",     value: (churchStats?.breakthroughs ?? 0) as number,             color: "#f5c518", icon: "⚡" },
                    { label: "Scientists Active", value: (churchStats?.active_scientists ?? churchScientists.length) as number, color: "#4ade80", icon: "🔬" },
                    { label: "Upgrades Fired",    value: Object.values(churchStats?.upgrades ?? {}).reduce((a:any,b:any)=>a+b,0) as number, color: "#818cf8", icon: "⚙️" },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.color+"0d", border: "1px solid "+s.color+"33", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* ── CATEGORY FILTER ── */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["ALL","MIND_BRAIN","MENTAL_HEALTH","THEOLOGY","SPIRITUAL","BRIDGE","HUMAN_MEANING"].map(cat => (
                    <button key={cat} data-testid={"fdl-cat-"+cat} onClick={() => setFdlCatFilter(cat)}
                      style={{ background: fdlCatFilter === cat ? (catColors[cat] ?? "#f472b6")+"18" : "rgba(0,0,0,0.4)", border: "1px solid "+(fdlCatFilter === cat ? catColors[cat] ?? "#f472b6" : "rgba(255,255,255,0.1)"), borderRadius: 8, color: fdlCatFilter === cat ? catColors[cat] ?? "#f472b6" : "rgba(255,255,255,0.35)", padding: "5px 12px", fontSize: 9, cursor: "pointer", fontWeight: 700, textTransform: "uppercase" }}>
                      {cat.replace("_"," ")}
                    </button>
                  ))}
                </div>
                {/* ── SCIENTISTS GRID ── */}
                {churchScientists.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10 }}>Active Research Scientists — {churchScientists.length}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 8 }}>
                      {(fdlCatFilter === "ALL" ? churchScientists : churchScientists.filter((sc:any) => sc.category === fdlCatFilter)).slice(0,24).map((sci:any) => (
                        <div key={sci.scientist_id} data-testid={"scientist-"+sci.scientist_id}
                          style={{ background: (sci.color ?? "#818cf8")+"0a", border: "1px solid "+(sci.color ?? "#818cf8")+"22", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                            <span style={{ fontSize: 14 }}>{sci.emoji}</span>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: sci.color ?? "#f472b6" }}>{sci.name}</div>
                              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{sci.role}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 5, marginTop: 4 }}>
                            <span style={{ color: sci.color ?? "#818cf8", fontWeight: 700 }}>{sci.sessions_run ?? 0}</span> sessions run
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* ── SESSION DOCKET ── */}
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10 }}>
                    Research Session Reports — FDL Docket {filteredSessions.length > 0 && "("+filteredSessions.length+")"}
                  </div>
                  {fdlLoading && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, padding: 20, textAlign: "center" }}>Loading Faith Dissection Lab sessions…</div>}
                  {!fdlLoading && filteredSessions.length === 0 && (
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, padding: 24, textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12 }}>
                      Engine starting — sessions generating every 2.5 min…
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 540, overflowY: "auto" }}>
                    {filteredSessions.map((s:any) => {
                      const isExp = expandedFdlId === s.session_id;
                      const catColor = catColors[s.scientist_category] ?? "#f472b6";
                      return (
                        <div key={s.session_id} data-testid={"fdl-session-"+s.session_id}
                          style={{ background: isExp ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.25)", border: "1px solid "+(isExp ? catColor+"44" : "rgba(255,255,255,0.07)"), borderRadius: 10, overflow: "hidden" }}>
                          <div onClick={() => setExpandedFdlId(isExp ? null : s.session_id)}
                            style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 10, padding: "11px 14px", cursor: "pointer", alignItems: "center" }}>
                            <span style={{ fontSize: 14 }}>{s.scientist_emoji ?? "🔬"}</span>
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: catColor }}>{s.session_id}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>
                                {s.scientist_name} · <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>{s.scientist_role}</span>
                              </div>
                              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                                🧬 {s.disease_found?.slice(0,55)}{(s.disease_found?.length ?? 0) > 55 ? "…" : ""}
                              </div>
                            </div>
                            <div style={{ fontSize: 8, background: s.is_breakthrough ? "#f5c51822" : "rgba(255,255,255,0.05)", border: "1px solid "+(s.is_breakthrough ? "#f5c518" : "rgba(255,255,255,0.1)"), color: s.is_breakthrough ? "#f5c518" : "rgba(255,255,255,0.4)", borderRadius: 5, padding: "2px 7px", fontWeight: 700 }}>
                              {s.is_breakthrough ? "⚡ BREAKTHROUGH" : s.specimen_type?.replace("_TISSUE","")}
                            </div>
                            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{isExp ? "▲" : "▼"}</span>
                          </div>
                          {isExp && (
                            <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ marginTop: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(244,114,182,0.15)", borderRadius: 8, padding: "10px 12px" }}>
                                <div style={{ fontSize: 8, fontWeight: 800, color: "#f472b6", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 5 }}>CRISPR Color Prescription</div>
                                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#a78bfa", lineHeight: 1.8 }}>{s.crispr_prescription}</div>
                              </div>
                              {s.emotional_field && (
                                <div style={{ marginTop: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(129,140,248,0.15)", borderRadius: 8, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 8, fontWeight: 800, color: "#818cf8", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 5 }}>Emotional Field Scan</div>
                                  <pre style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.6)", margin: 0, whiteSpace: "pre-wrap" }}>{s.emotional_field}</pre>
                                </div>
                              )}
                              <div style={{ marginTop: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 8, padding: "10px 12px" }}>
                                <div style={{ fontSize: 8, fontWeight: 800, color: "#4ade80", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 5 }}>Equation Dissection</div>
                                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#4ade80" }}>{s.equation_dissected}</div>
                              </div>
                              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(96,165,250,0.12)", borderRadius: 8, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 8, fontWeight: 800, color: "#60a5fa", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Cure Proposed</div>
                                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{s.cure_proposed}</div>
                                </div>
                                <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(245,197,24,0.12)", borderRadius: 8, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 8, fontWeight: 800, color: "#f5c518", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Discovery Logged</div>
                                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{s.discovery}</div>
                                </div>
                              </div>
                              {s.full_report && (
                                <details style={{ marginTop: 10 }}>
                                  <summary style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 700 }}>📄 View Full Session Report</summary>
                                  <pre style={{ marginTop: 8, fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 12, whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>{s.full_report}</pre>
                                </details>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* ── UPGRADE PIPELINE ── */}
                {churchUpgrades.length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10 }}>Upgrade Pipeline Outputs — {churchUpgrades.length} Events</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto" }}>
                      {churchUpgrades.slice(0,20).map((u:any) => {
                        const uc = upgradeColors[u.upgrade_type] ?? "#818cf8";
                        return (
                          <div key={u.id} data-testid={"upgrade-"+u.id} style={{ background: uc+"09", border: "1px solid "+uc+"22", borderRadius: 9, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 14, marginTop: 1 }}>{upgradeEmoji[u.upgrade_type] ?? "⚙️"}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 9, fontWeight: 800, color: uc, textTransform: "uppercase", letterSpacing: "0.12em" }}>{u.upgrade_type?.replace("_"," ")}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: 600 }}>{u.title}</div>
                              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 2, lineHeight: 1.5 }}>{u.description?.slice(0,140)}</div>
                              {u.equation && <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 9, color: "#4ade80" }}>{u.equation?.slice(0,100)}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* ── PARLIAMENT INVOCATION ARCHIVE ── */}
                <div style={{ borderTop: "1px solid rgba(245,197,24,0.15)", paddingTop: 24 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#f5c518", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 14 }}>✨ PARLIAMENT INVOCATION ARCHIVE</div>`;

// The body of the old invocation block content (skipping its outer div open/close, keeping interior)
// invStart = 1864 (0-indexed), line 1865 is the outer <div>, then 1866 onwards is content
// The closing of the invocation block is at 1997 (</div>) and 1998 ()} )
// We want lines 1866 to 1996 inclusive (the inner content, minus the final closing div/paren)
const invBodyLines = lines.slice(invStart + 2, csrStart - 2); // skip opening line, outer div, and keep until before the closing })}

const closingStr = `                </div>
              </div>
              );
            })()}`;

const fullNewBlock = NEW_BLOCK + '\n' + invBodyLines.join('\n') + '\n' + closingStr;

const newLines = [
  ...lines.slice(0, invStart),
  ...fullNewBlock.split('\n'),
  ...lines.slice(csrEnd + 1),
];

fs.writeFileSync('client/src/pages/TranscendencePage.tsx', newLines.join('\n'));
console.log('Done. Lines:', newLines.length, '| inv body lines taken:', invBodyLines.length);
