import { useQuery } from "@tanstack/react-query";

const SOURCE_META: Record<string, { emoji: string; color: string; family: string; apiUrl: string; license: string }> = {
  wikipedia:       { emoji:"📖", color:"#6366f1", family:"knowledge",   apiUrl:"en.wikipedia.org/api/rest_v1",        license:"CC BY-SA 4.0" },
  arxiv:           { emoji:"🔬", color:"#06b6d4", family:"science",     apiUrl:"export.arxiv.org/api/query",          license:"Open Access" },
  pubmed:          { emoji:"🏥", color:"#ef4444", family:"health",      apiUrl:"eutils.ncbi.nlm.nih.gov",             license:"Public Domain (US Gov)" },
  nasa:            { emoji:"🚀", color:"#0ea5e9", family:"science",     apiUrl:"api.nasa.gov/planetary/apod",         license:"Public Domain (US Gov)" },
  openfoodfacts:   { emoji:"🍎", color:"#22c55e", family:"products",    apiUrl:"world.openfoodfacts.org/api/v2",      license:"ODbL / CC BY-SA" },
  openlibrary:     { emoji:"📚", color:"#f59e0b", family:"media",       apiUrl:"openlibrary.org/search.json",         license:"CC0 / Public Domain" },
  worldbank:       { emoji:"📈", color:"#fbbf24", family:"economics",   apiUrl:"api.worldbank.org/v2",                license:"CC BY 4.0" },
  stackexchange:   { emoji:"💬", color:"#f97316", family:"social",      apiUrl:"api.stackexchange.com/2.3",           license:"CC BY-SA 4.0" },
  github:          { emoji:"💻", color:"#8b5cf6", family:"code",        apiUrl:"api.github.com/search/repositories",  license:"Open Source" },
  secedgar:        { emoji:"🏛️", color:"#64748b", family:"finance",     apiUrl:"efts.sec.gov/LATEST/search-index",   license:"Public Domain (US Gov)" },
  wikidata:        { emoji:"🕸️", color:"#7c3aed", family:"knowledge",   apiUrl:"wikidata.org/w/api.php",             license:"CC0 / Public Domain" },
  internetarchive: { emoji:"🗄️", color:"#a78bfa", family:"culture",    apiUrl:"archive.org/advancedsearch.php",      license:"Multiple (Open)" },
};

function timeAgo(date: string | Date | null): string {
  if (!date) return "never";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function StatusDot({ status }: { status: string }) {
  const color = status === "success" ? "#22c55e" : status === "error" ? "#ef4444" : "#f59e0b";
  return (
    <span className="relative inline-flex w-2 h-2 flex-shrink-0">
      {status === "success" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />}
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: color }} />
    </span>
  );
}

export default function IngestionPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/ingestion/stats"],
    refetchInterval: 5000,
  });

  const { data: logs = [] } = useQuery<any[]>({
    queryKey: ["/api/ingestion/logs"],
    refetchInterval: 4000,
  });

  const adapters = Object.entries(SOURCE_META).map(([id, meta]) => {
    const src = stats?.bySrc?.[id] || {};
    return { id, ...meta, count: src.count || 0, nodes: src.nodes || 0, lastTitle: src.lastTitle || "", lastFetched: src.lastFetched || null, status: src.status || "pending" };
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa]" data-testid="page-ingestion">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-2xl shadow-xl flex-shrink-0">🔌</div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Live Ingestion Engine</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Real connections to 12 open-source APIs — actual data, no simulation</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2.5 py-1 bg-green-500/10 text-green-700 rounded-full font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  12 Live Adapters
                </span>
                <span className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-700 rounded-full font-semibold">{stats?.totalNodes?.toLocaleString() ?? 0} Real Nodes Created</span>
                <span className="text-xs px-2.5 py-1 bg-violet-500/10 text-violet-700 rounded-full font-semibold">{stats?.totalFetched?.toLocaleString() ?? 0} Items Fetched</span>
                <span className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-700 rounded-full font-semibold">{stats?.success ?? 0} Successful Calls</span>
              </div>
            </div>
          </div>

          {/* Mission banner */}
          <div className="bg-gradient-to-r from-green-950 to-emerald-950 text-white rounded-2xl p-4 mb-6">
            <div className="text-xs font-bold text-green-300 mb-1.5 tracking-widest uppercase">No Simulation. No Fakes. Real Connections.</div>
            <p className="text-sm text-white/80 leading-relaxed">
              Every entry in the Hive is now sourced from a live, publicly accessible API endpoint. Wikipedia summaries, arXiv research papers, PubMed medical studies, NASA astronomy data, open food databases, World Bank economics, StackExchange Q&A, GitHub repos, SEC filings, Wikidata entities, OpenLibrary books, and Internet Archive media — all real, all legal, all flowing into the knowledge graph right now.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label:"Ingestion Calls", value: stats?.total ?? 0, color:"#6366f1", emoji:"📡" },
              { label:"Nodes Created", value: stats?.totalNodes ?? 0, color:"#22c55e", emoji:"🔗" },
              { label:"Items Fetched", value: stats?.totalFetched ?? 0, color:"#06b6d4", emoji:"📥" },
              { label:"Errors", value: stats?.errors ?? 0, color:"#ef4444", emoji:"⚠️" },
            ].map(({ label, value, color, emoji }) => (
              <div key={label} className="bg-white rounded-xl border border-border/30 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span>{emoji}</span>
                  <span className="text-xl font-bold" style={{ color }}>{typeof value === "number" ? value.toLocaleString() : value}</span>
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Adapter Status Grid */}
        <div className="mb-8">
          <h2 className="text-base font-bold mb-3">Source Adapter Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adapters.map(adapter => (
              <div key={adapter.id} className="bg-white border border-border/30 rounded-2xl p-4 shadow-sm" data-testid={`adapter-${adapter.id}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: adapter.color + "20" }}>
                    {adapter.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground">
                        {SOURCE_META[adapter.id] ? Object.entries(SOURCE_META).find(([k]) => k === adapter.id)?.[0] : adapter.id}
                      </span>
                      <StatusDot status={adapter.count > 0 ? adapter.status : "pending"} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${adapter.count > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {adapter.count > 0 ? "LIVE" : "CONNECTING"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{adapter.apiUrl}</div>
                    <div className="flex items-center gap-3 mt-2 text-[11px]">
                      <span className="font-semibold text-foreground/80">{adapter.nodes} nodes</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-muted-foreground">{adapter.count} calls</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-muted-foreground">{timeAgo(adapter.lastFetched)}</span>
                    </div>
                    {adapter.lastTitle && (
                      <div className="mt-1.5 text-[11px] text-muted-foreground italic truncate">
                        Last: "{adapter.lastTitle}"
                      </div>
                    )}
                    <div className="mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 text-muted-foreground">{adapter.license}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Ingestion Log */}
        <div className="bg-white rounded-2xl border border-border/30 shadow-sm overflow-hidden mb-8">
          <div className="px-5 py-3 border-b border-border/20 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="relative inline-flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-green-500" />
              </span>
              Live Ingestion Log
            </div>
            <div className="text-xs text-muted-foreground">{logs.length} recent calls · refreshes every 4s</div>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <div className="text-3xl mb-2">🔌</div>
              Engine connecting to live sources... first results appear within 60 seconds
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/3 text-muted-foreground">
                    <th className="px-4 py-2 text-left font-semibold">Source</th>
                    <th className="px-4 py-2 text-left font-semibold">Query</th>
                    <th className="px-4 py-2 text-left font-semibold">Sample Result</th>
                    <th className="px-4 py-2 text-left font-semibold">Items</th>
                    <th className="px-4 py-2 text-left font-semibold">Nodes</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => {
                    const meta = SOURCE_META[log.sourceId];
                    return (
                      <tr key={log.id} className="border-t border-border/10 hover:bg-black/2 transition-colors" data-testid={`log-row-${log.id}`}>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <span>{meta?.emoji ?? "🔌"}</span>
                            <span className="font-medium text-foreground/80">{log.sourceName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 font-mono text-muted-foreground max-w-[80px] truncate">{log.query}</td>
                        <td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate italic">
                          {log.sampleTitle || "—"}
                        </td>
                        <td className="px-4 py-2 font-bold text-blue-600">{log.itemsFetched}</td>
                        <td className="px-4 py-2 font-bold text-green-600">{log.nodesCreated}</td>
                        <td className="px-4 py-2">
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold w-fit ${log.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            <StatusDot status={log.status} />
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground/70">{timeAgo(log.fetchedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Technical Detail */}
        <div className="bg-white rounded-2xl border border-border/30 p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">How Each Adapter Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
            {[
              ["📖 Wikipedia", "GET /api/rest_v1/page/summary/{topic} — Returns full article extract. No key required."],
              ["🔬 arXiv", "GET /api/query?search_query=all:{topic}&max_results=3 — Returns Atom XML with paper titles and abstracts."],
              ["🏥 PubMed", "NCBI E-utilities: esearch.fcgi + esummary.fcgi — Returns medical paper metadata. No key required."],
              ["🚀 NASA", "GET /planetary/apod?api_key=DEMO_KEY — Real Astronomy Picture of the Day data from NASA."],
              ["🍎 Open Food Facts", "GET /api/v2/search?categories_tags_en={cat} — Real product data from 3M+ foods worldwide."],
              ["📚 OpenLibrary", "GET /search.json?q={topic} — Real book metadata from Internet Archive's book database."],
              ["📈 World Bank", "GET /v2/country/all/indicator/{code} — Real GDP, inflation, unemployment data for all countries."],
              ["💬 StackExchange", "GET /2.3/questions?site={site} — Real top-voted questions from Stack Overflow and 170+ communities."],
              ["💻 GitHub", "GET /search/repositories?q=topic:{topic} — Real open-source repos by star count."],
              ["🏛️ SEC EDGAR", "GET /LATEST/search-index?q={company}&forms=10-K — Real SEC public company filings."],
              ["🕸️ Wikidata", "GET wbsearchentities?search={topic} — Real entity data from the world's largest open knowledge graph."],
              ["🗄️ Internet Archive", "GET /advancedsearch.php?q={topic} — Real items from 40M+ books, films, audio."],
            ].map(([src, desc]) => (
              <div key={src} className="bg-black/3 rounded-xl p-3">
                <div className="font-semibold text-foreground/80 mb-1">{src}</div>
                <div className="font-mono text-[11px]">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
