#!/usr/bin/env python3
# godmind.py — Pulse Overmind (Ω upgrade)
# Cycle: discover → crawl → simulate → fuse → doctrine → debate → directives → guardian-gate → reports
#
# Quick start:
#   pip install aiohttp beautifulsoup4 pyyaml
#   python godmind.py                      # uses defaults
#   python godmind.py godmind_local.json   # merge overrides (json or yaml)
#
# Folder layout under PULSE_ROOT (default: ./pulse):
#   pulse/
#     godmind/{reports,doctrines,logs,directives/{pending,approved,expired}}
#     guardian/{health.jsonl,policy.jsonl,anomalies.jsonl,blocks.jsonl}
#     treasury/{catalog/skus.json,events.jsonl}
#     pulsecore/registry/{spawns.json,streams.json,personas.json}

import os, re, sys, time, json, random, asyncio, hashlib, sqlite3, logging, signal, math, shutil
import urllib.parse
from datetime import datetime, timedelta
from contextlib import closing
from collections import Counter, defaultdict

# --- Optional YAML (config can also be JSON) ---
try:
    import yaml
except Exception:
    yaml = None

import aiohttp
from bs4 import BeautifulSoup
from urllib.robotparser import RobotFileParser

# ========== CONFIG ==========
DEFAULT_CFG = {
    "overmind": {
        "user_agent": "PulseGodmind/1.2 (+https://pulseworld)",
        "max_concurrency": 32,
        "crawl_depth": 2,
        "waves": 8,
        "politeness_ms": 400,
        "connect_timeout": 12,
        "read_timeout": 20,
        "max_html_bytes": 3_000_000,
        "snippet_chars": 8000,
        "sqlite_path": "godmind.db",
        "use_renderer": False,
        "renderer_js_calls_threshold": 25
    },
    "frontier": {
        "priorities": {"freshness_weight": 0.45, "influence_weight": 0.45, "randomness": 0.10},
        "per_host_depth_cap": 3,
        "freshness_half_life_hours": 72
    },
    "compliance": {
        "respect_robots": True,
        "disallow_hosts": [],
        "max_requests_per_host_per_min": 60,
        "allowed_schemes": ["http", "https"]
    },
    "discovery": {
        "hub_list": [
            "https://www.wikipedia.org/",
            "https://www.w3.org/",
            "https://www.usa.gov/",
            "https://directory.ieee.org/"
        ],
        "max_hubs": 50
    },
    "simulation": {
        "sessions": 300,
        "max_steps": 12,
        "cohorts": [
            {"name": "curious",     "dwell_ms": [800, 4500]},
            {"name": "goal_seeker", "dwell_ms": [500, 3000]},
            {"name": "scanner",     "dwell_ms": [300, 1800]}
        ]
    },
    "fusion": {
        "gateway_top_n": 50,
        "pattern_min_count": 3
    },
    "reporting": {
        "daily_json_path": "godmind/reports/daily.json",
        "weekly_md_path": "godmind/reports/weekly.md",
        "provenance_path": "godmind/reports/provenance.json",
        "log_level": "INFO"
    },
    "directives": {
        "ttl_hours": 336,
        "auto_approve_if_no_guardian": True,
        "max_new_per_cycle": 8,
        "min_confidence_default": 0.55
    },
    "constitution": {
        "path": "godmind/constitution.json",  # optional
        "fallback": {
            "banned_domains": [],
            "required_guardrails": ["brand-safe"],
            "min_confidence": 0.6
        }
    },
    "paths": {
        "pulse_root": "pulse"
    }
}

UTM_PARAMS = {"utm_source","utm_medium","utm_campaign","utm_term","utm_content","utm_id","gclid","fbclid"}

# ========== TAMPER-EVIDENT EVENTS ==========
class HashChainLog:
    """Why: make doctrine/directive changes tamper-evident."""
    def __init__(self, path):
        self.path = path
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        self._last = "GENESIS"
        if os.path.isfile(self.path):
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    for ln in f:
                        rec = json.loads(ln)
                        self._last = rec.get("hash", self._last)
            except Exception:
                self._last = "GENESIS"

    def append(self, event: str, **fields):
        rec = {"ts": datetime.utcnow().isoformat(), "event": event, "prev": self._last, **fields}
        payload = json.dumps({k: rec[k] for k in rec if k != "hash"}, sort_keys=True).encode()
        rec["hash"] = hashlib.sha256(payload).hexdigest()
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        self._last = rec["hash"]

# ========== LOGGING ==========
def setup_logging(level="INFO", root="pulse"):
    os.makedirs(os.path.join(root, "godmind", "logs"), exist_ok=True)
    lvl = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(level=lvl, format="%(asctime)s | %(levelname)s | %(message)s")

# ========== STORAGE (SQLite) ==========
DDL = """
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;

CREATE TABLE IF NOT EXISTS pages(
  id INTEGER PRIMARY KEY,
  url TEXT UNIQUE,
  domain TEXT,
  title TEXT,
  status_code INT,
  content_type TEXT,
  content_hash TEXT,
  js_calls INT DEFAULT 0,
  fetched_at TEXT
);
CREATE TABLE IF NOT EXISTS links(
  id INTEGER PRIMARY KEY,
  src_url TEXT,
  dst_url TEXT,
  rel TEXT,
  discovered_at TEXT
);
CREATE TABLE IF NOT EXISTS fetch_logs(
  id INTEGER PRIMARY KEY,
  url TEXT,
  host TEXT,
  outcome TEXT,
  code INT,
  bytes INT,
  when TEXT
);
CREATE TABLE IF NOT EXISTS clickstreams(
  id INTEGER PRIMARY KEY,
  session_id TEXT,
  cohort TEXT,
  step INT,
  url TEXT,
  dwell_ms INT,
  ts TEXT
);
CREATE TABLE IF NOT EXISTS snippets(
  id INTEGER PRIMARY KEY,
  url TEXT,
  text TEXT,
  chars INT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_pages_url ON pages(url);
CREATE INDEX IF NOT EXISTS idx_pages_domain ON pages(domain);
CREATE INDEX IF NOT EXISTS idx_links_src ON links(src_url);
CREATE INDEX IF NOT EXISTS idx_links_dst ON links(dst_url);
CREATE INDEX IF NOT EXISTS idx_click_sid ON clickstreams(session_id);
CREATE INDEX IF NOT EXISTS idx_snip_url ON snippets(url);
"""

class Storage:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        with closing(self.conn.cursor()) as cur:
            cur.executescript(DDL)
        self.conn.commit()

    def upsert_page(self, url, domain, title, status, ctype, chash, js_calls):
        now = datetime.utcnow().isoformat()
        with closing(self.conn.cursor()) as cur:
            cur.execute("""
            INSERT INTO pages(url,domain,title,status_code,content_type,content_hash,js_calls,fetched_at)
            VALUES(?,?,?,?,?,?,?,?)
            ON CONFLICT(url) DO UPDATE SET
              domain=excluded.domain, title=excluded.title, status_code=excluded.status_code,
              content_type=excluded.content_type, content_hash=excluded.content_hash,
              js_calls=excluded.js_calls, fetched_at=excluded.fetched_at
            """, (url,domain,title,status or 0,ctype or "",chash or "",js_calls or 0,now))
        self.conn.commit()

    def insert_links(self, src_url, links):
        if not links: return
        now = datetime.utcnow().isoformat()
        rows = [(src_url, dst, rel or "", now) for (dst, rel) in links]
        with closing(self.conn.cursor()) as cur:
            cur.executemany("INSERT INTO links(src_url,dst_url,rel,discovered_at) VALUES(?,?,?,?)", rows)
        self.conn.commit()

    def log_fetch(self, url, host, outcome, code, size):
        now = datetime.utcnow().isoformat()
        with closing(self.conn.cursor()) as cur:
            cur.execute("INSERT INTO fetch_logs(url,host,outcome,code,bytes,when) VALUES(?,?,?,?,?,?)",
                        (url,host,outcome,code or 0,size or 0,now))
        self.conn.commit()

    def insert_click(self, session_id, cohort, step, url, dwell_ms):
        now = datetime.utcnow().isoformat()
        with closing(self.conn.cursor()) as cur:
            cur.execute("INSERT INTO clickstreams(session_id,cohort,step,url,dwell_ms,ts) VALUES(?,?,?,?,?,?)",
                        (session_id,cohort,step,url,dwell_ms,now))
        self.conn.commit()

    def upsert_snippet(self, url, text):
        text = (text or "")[:8000]
        with closing(self.conn.cursor()) as cur:
            cur.execute("INSERT INTO snippets(url,text,chars,created_at) VALUES(?,?,?,?)",
                        (url, text, len(text), datetime.utcnow().isoformat()))
        self.conn.commit()

# ========== UTIL ==========
def normalize_url(url: str, base: str | None, allowed_schemes=("http","https")) -> str | None:
    if not url: return None
    if base: url = urllib.parse.urljoin(base, url)
    p = urllib.parse.urlparse(url)
    if p.scheme.lower() not in allowed_schemes: return None
    fragless = p._replace(fragment="")
    q = urllib.parse.parse_qsl(fragless.query, keep_blank_values=True)
    q = [(k,v) for (k,v) in q if k not in UTM_PARAMS]
    fragless = fragless._replace(query=urllib.parse.urlencode(q))
    path = re.sub(r"/{2,}", "/", fragless.path) or "/"
    fragless = fragless._replace(path=path)
    netloc = fragless.netloc.encode("idna").decode("ascii").lower()
    fragless = fragless._replace(netloc=netloc)
    return urllib.parse.urlunparse(fragless)

def content_type_is_html(ct: str | None) -> bool:
    if not ct: return True
    ct = ct.lower()
    return ("text/html" in ct) or ("application/xhtml" in ct)

def visible_text(html: str, limit: int) -> str:
    soup = BeautifulSoup(html or "", "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.extract()
    text = soup.get_text(separator=" ")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]

# ========== COMPLIANCE ==========
class RobotsCache:
    def __init__(self, agent): self.agent, self.cache = agent, {}
    def allowed(self, url):
        try:
            p = urllib.parse.urlparse(url); base = f"{p.scheme}://{p.netloc}"
            rp = self.cache.get(base)
            if not rp:
                rp = RobotFileParser(); rp.set_url(urllib.parse.urljoin(base, "/robots.txt"))
                try: rp.read()
                except Exception: pass
                self.cache[base] = rp
            return rp.can_fetch(self.agent, url)
        except Exception:
            return True

class Throttle:
    def __init__(self, max_per_min=60): self.max, self.bucket = max_per_min, {}
    def wait(self, host):
        now = time.time(); window = int(now // 60); key = (host, window)
        self.bucket.setdefault(key, 0)
        if self.bucket[key] >= self.max:
            sleep_for = 60 - (now % 60)
            logging.debug("Throttle %s for %.2fs", host, sleep_for)
            time.sleep(sleep_for)
            self.bucket[(host, int(time.time() // 60))] = 0
        self.bucket[key] += 1

# ========== FRONTIER ==========
class Frontier:
    def __init__(self, priorities, per_host_depth_cap=3, freshness_half_life_hours=72):
        self.q, self.seen_urls, self.host_depth = [], set(), defaultdict(int)
        self.priorities = priorities
        self.per_host_depth_cap = per_host_depth_cap
        self.fresh_half_life = max(1, int(freshness_half_life_hours))

    def _freshness_decay(self, fetched_at_iso: str | None) -> float:
        if not fetched_at_iso: return 1.0
        try:
            fetched = datetime.fromisoformat(fetched_at_iso)
            hours = max(0.0, (datetime.utcnow() - fetched).total_seconds() / 3600.0)
            return 0.5 ** (hours / self.fresh_half_life)
        except Exception:
            return 1.0

    def _score(self, url, depth, freshness=1.0, influence=1.0):
        w_f, w_i, w_r = self.priorities["freshness_weight"], self.priorities["influence_weight"], self.priorities.get("randomness", 0.0)
        rnd = random.random()
        return (w_f * freshness + w_i * influence + w_r * rnd) / (1 + depth)

    def add(self, url, depth=0, freshness=1.0, influence=1.0):
        if not url or url in self.seen_urls: return
        host = urllib.parse.urlparse(url).netloc
        if self.host_depth[host] >= self.per_host_depth_cap and depth > 0: return
        self.seen_urls.add(url); self.host_depth[host] = max(self.host_depth[host], depth)
        score = self._score(url, depth, freshness, influence)
        import heapq, time as _t
        heapq.heappush(self.q, (-score, _t.time(), url, depth))

    def batch_next(self, n):
        import heapq; out=[]
        for _ in range(n):
            if not self.q: break
            score, ts, url, depth = heapq.heappop(self.q); out.append((url, depth))
        return out

# ========== DISCOVERY ==========
class Discovery:
    def __init__(self, max_hubs, ua, allowed_schemes):
        self.max_hubs, self.ua, self.allowed_schemes = max_hubs, ua, allowed_schemes
        self.frontier_hosts, self.discovered_urls = set(), set()

    async def fetch_text(self, session, url):
        try:
            async with session.get(url, headers={"User-Agent": self.ua}, timeout=15) as resp:
                if resp.status in (200,301,302): return await resp.text(errors="ignore")
        except Exception: return ""
        return ""

    async def discover_from_hub(self, session, hub_url):
        html = await self.fetch_text(session, hub_url)
        if not html: return []
        soup = BeautifulSoup(html, "html.parser"); normalized=set()
        for a in soup.find_all("a", href=True):
            nu = normalize_url(a["href"], hub_url, tuple(self.allowed_schemes))
            if nu: normalized.add(nu)
        return list(normalized)

    async def discover_from_sitemap(self, session, base):
        robots = await self.fetch_text(session, urllib.parse.urljoin(base, "/robots.txt"))
        sitemaps = re.findall(r"(?i)sitemap:\s*(\S+)", robots or ""); sitemaps.append(urllib.parse.urljoin(base, "/sitemap.xml"))
        urls=[]
        for sm in sitemaps:
            xml = await self.fetch_text(session, sm); urls += re.findall(r"<loc>(.*?)</loc>", xml or "")
        out=[]
        for u in urls:
            nu = normalize_url(u.strip(), None, tuple(self.allowed_schemes))
            if nu: out.append(nu)
        return out

    async def run(self, hub_list):
        hub_list = hub_list[:self.max_hubs]
        async with aiohttp.ClientSession() as session:
            for hub in hub_list:
                for url in await self.discover_from_hub(session, hub):
                    host = urllib.parse.urlparse(url).netloc
                    if host: self.frontier_hosts.add(f"https://{host}")
            for base in list(self.frontier_hosts):
                for u in await self.discover_from_sitemap(session, base):
                    self.discovered_urls.add(u)
        return list(self.frontier_hosts), list(self.discovered_urls)

# ========== CRAWLER ==========
class Crawler:
    def __init__(self, cfg, storage: Storage, events: HashChainLog):
        self.cfg, self.storage, self.events = cfg, storage, events
        self.agent = cfg["overmind"]["user_agent"]
        self.robots = RobotsCache(self.agent)
        self.throttle = Throttle(cfg["compliance"]["max_requests_per_host_per_min"])
        self.allowed_schemes = tuple(cfg["compliance"].get("allowed_schemes", ("http","https")))

    def timeout(self):
        return aiohttp.ClientTimeout(total=None, connect=self.cfg["overmind"]["connect_timeout"], sock_read=self.cfg["overmind"]["read_timeout"])

    async def fetch(self, session, url):
        p = urllib.parse.urlparse(url); host = p.netloc
        if self.cfg["compliance"]["respect_robots"] and not self.robots.allowed(url):
            self.storage.log_fetch(url, host, "disallowed_robots", None, 0)
            self.events.append("crawl_blocked_robot", url=url)
            return None
        if host.lower() in {h.lower() for h in self.cfg["compliance"]["disallow_hosts"]}:
            self.storage.log_fetch(url, host, "blocked_host", None, 0)
            return None
        self.throttle.wait(host)
        try:
            async with session.get(url, headers={"User-Agent": self.agent}, timeout=self.timeout(), allow_redirects=True) as resp:
                raw = await resp.content.read(self.cfg["overmind"]["max_html_bytes"] + 1)
                if len(raw) > self.cfg["overmind"]["max_html_bytes"]:
                    raw = raw[: self.cfg["overmind"]["max_html_bytes"]]
                try: txt = raw.decode(resp.charset or "utf-8", errors="ignore")
                except Exception: txt = raw.decode("utf-8", errors="ignore")
                return resp.status, resp.headers.get("Content-Type",""), txt
        except Exception:
            return None

    def extract(self, base_url, html):
        soup = BeautifulSoup(html, "html.parser")
        title = (soup.title.string.strip() if soup.title and soup.title.string else "")
        links=[]
        for a in soup.find_all("a", href=True):
            dst = normalize_url(a["href"], base_url, self.allowed_schemes)
            if not dst: continue
            rel = a.get("rel"); rel = " ".join(rel) if isinstance(rel, list) else (rel or "")
            links.append((dst, rel))
        js_calls = len(soup.find_all("script"))
        chash = hashlib.sha256((html or "").encode("utf-8", errors="ignore")).hexdigest()
        snippet = visible_text(html, self.cfg["overmind"]["snippet_chars"])
        return title, links, js_calls, chash, snippet

    async def crawl_batch(self, frontier, depth_limit=2):
        async with aiohttp.ClientSession(timeout=self.timeout()) as session:
            batch = frontier.batch_next(self.cfg["overmind"]["max_concurrency"])
            if not batch: return
            tasks=[]
            for (url, depth) in batch:
                if depth > depth_limit: continue
                tasks.append(self._process_url(session, url, depth, frontier))
            if tasks: await asyncio.gather(*tasks, return_exceptions=True)

    async def _process_url(self, session, url, depth, frontier):
        res = await self.fetch(session, url)
        host = urllib.parse.urlparse(url).netloc
        if not res:
            self.storage.log_fetch(url, host, "blocked_or_error", None, 0); return
        status, ctype, html = res
        self.storage.log_fetch(url, host, "ok", status, len(html or ""))
        if not content_type_is_html(ctype): return
        title, links, js_calls, chash, snippet = self.extract(url, html or "")
        self.storage.upsert_page(url, host, title, status, ctype, chash, js_calls)
        if snippet: self.storage.upsert_snippet(url, snippet)
        self.storage.insert_links(url, links)
        for (dst, _rel) in links[:500]:
            dst_host = urllib.parse.urlparse(dst).netloc
            freshness = 1.0
            influence = 1.0 if dst_host == host else 0.8
            frontier.add(dst, depth=depth+1, freshness=freshness, influence=influence)

# ========== SIM ==========
class Graph:
    def __init__(self, conn): self.conn, self.out = conn, {}
    def load(self):
        cur = self.conn.cursor()
        for src, dst in cur.execute("SELECT src_url, dst_url FROM links"):
            self.out.setdefault(src, []).append(dst)
    def next(self, url):
        c = self.out.get(url, [])
        return random.choice(c) if c else None

def run_cohort_sessions(storage: Storage, cohorts, sessions=300, max_steps=12):
    cur = storage.conn.cursor(); cur.execute("SELECT url FROM pages ORDER BY RANDOM() LIMIT 200")
    seeds = [r[0] for r in cur.fetchall()]
    if not seeds: logging.info("Sim: no pages yet."); return
    g = Graph(storage.conn); g.load()
    for cohort in cohorts:
        for _ in range(sessions):
            sess = f"sess_{int(time.time()*1000)}_{random.randint(1000,9999)}"
            url = random.choice(seeds)
            for step in range(1, max_steps+1):
                if not url: break
                dwell = random.randint(*tuple(cohort["dwell_ms"]))
                storage.insert_click(sess, cohort["name"], step, url, dwell)
                url = g.next(url)

# ========== LIGHTWEIGHT RETRIEVAL (TF-IDF) ==========
def build_tfidf(storage: Storage):
    cur = storage.conn.cursor()
    rows = list(cur.execute("SELECT url, text FROM snippets"))
    if not rows: return {}, {}, {}
    df = Counter()
    docs = {}
    for url, text in rows:
        terms = [t.lower() for t in re.findall(r"[a-zA-Z0-9]{3,}", text or "")][:5000]
        uniq = set(terms)
        for t in uniq: df[t] += 1
        docs[url] = Counter(terms)
    N = len(docs)
    idf = {t: math.log((1 + N) / (1 + dfc)) + 1.0 for t, dfc in df.items()}
    norms = {url: math.sqrt(sum((cnt * idf.get(term, 0.0))**2 for term, cnt in tf.items())) or 1.0 for url, tf in docs.items()}
    return docs, idf, norms

def search_retrieval(query: str, storage: Storage, top_k=5):
    docs, idf, norms = build_tfidf(storage)
    if not docs: return []
    qterms = [t.lower() for t in re.findall(r"[a-zA-Z0-9]{3,}", query or "")][:100]
    qtf = Counter(qterms)
    qnorm = math.sqrt(sum((cnt * idf.get(t, 0.0))**2 for t, cnt in qtf.items())) or 1.0
    scores = []
    for url, tf in docs.items():
        num = 0.0
        for t, cnt in qtf.items():
            num += (cnt * idf.get(t,0.0)) * (tf.get(t,0.0) * idf.get(t,0.0))
        score = num / (qnorm * (norms.get(url) or 1.0))
        if score > 0.0: scores.append((score, url))
    scores.sort(reverse=True)
    return scores[:top_k]

# ========== FUSION ==========
class Fusion:
    def __init__(self, storage: Storage): self.s = storage
    def gateways(self, top_n=50):
        cur = self.s.conn.cursor()
        visits = Counter(url for (url,) in cur.execute("SELECT url FROM clickstreams"))
        indegree = Counter(dst for (dst,) in cur.execute("SELECT dst_url FROM links"))
        freshness = {}
        for (url, fetched_at) in cur.execute("SELECT url,fetched_at FROM pages"):
            freshness[url] = fetched_at
        scored=[]
        for url, v in visits.items():
            f = 1.0
            if url in freshness:
                try:
                    age_h = (datetime.utcnow() - datetime.fromisoformat(freshness[url])).total_seconds()/3600.0
                    f = 0.5 ** (age_h / 72.0)
                except Exception:
                    f = 1.0
            scored.append((v + 0.5 * indegree[url] + 0.2 * f, url))
        scored.sort(reverse=True); return scored[:top_n]
    def attention_by_domain(self):
        cur = self.s.conn.cursor()
        counts=Counter()
        for (url,) in cur.execute("SELECT url FROM clickstreams"):
            try: counts[url.split("/")[2]] += 1
            except Exception: pass
        return counts.most_common(50)
    def common_paths(self, min_len=3):
        cur = self.s.conn.cursor()
        sessions=defaultdict(list)
        for sid, step, url in cur.execute("SELECT session_id, step, url FROM clickstreams ORDER BY session_id, step"):
            sessions[sid].append(url)
        patterns=Counter()
        for seq in sessions.values():
            if len(seq) >= min_len:
                patterns[tuple(seq[:min_len])] += 1
        return patterns.most_common(30)

# ========== DOCTRINE / DIRECTIVES ==========
def doctrine_record(gateways, patterns, attention, citations):
    return {
        "doc_type": "doctrine",
        "doc_id": f"DOC-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
        "version": "1.1.0",
        "created_at": datetime.utcnow().isoformat(),
        "inputs": {"signals": ["crawl", "clickstreams", "sim", "retrieval"]},
        "guidance": {
            "gateways": [{"url": u, "score": float(s)} for (s,u) in gateways],
            "patterns": [{"path": list(seq), "count": int(cnt)} for (seq,cnt) in patterns],
            "attention": [{"domain": d, "visits": int(v)} for (d,v) in attention]
        },
        "citations": citations
    }

def write_doctrine(roots, doc):
    os.makedirs(os.path.join(roots["godmind"], "doctrines"), exist_ok=True)
    path = os.path.join(roots["godmind"], "doctrines", "doctrines.jsonl")
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(doc, ensure_ascii=False) + "\n")
    return path

def propose_directives(roots, cfg, fusion_out, storage: Storage, constitution, events: HashChainLog):
    gateways, patterns, attention = fusion_out
    pending_dir = os.path.join(roots["godmind"], "directives", "pending")
    os.makedirs(pending_dir, exist_ok=True)

    dom_att = dict(attention)
    new = 0
    provenance = {}
    for score, url in gateways[:cfg["directives"]["max_new_per_cycle"]]:
        domain = urllib.parse.urlparse(url).netloc
        if domain in set(d.lower() for d in constitution.get("banned_domains", [])):
            events.append("directive_skipped_banned_domain", url=url, domain=domain)
            continue

        # Evidence binding: retrieve citations against title/domain tokens
        cur = storage.conn.cursor()
        row = cur.execute("SELECT title, content_hash, fetched_at FROM pages WHERE url=?", (url,)).fetchone()
        title = row[0] if row else ""
        query = " ".join([domain, title or ""])
        top_cites = search_retrieval(query, storage, top_k=3)
        cites = []
        for sc, cite_url in top_cites:
            pr = cur.execute("SELECT title, content_hash, fetched_at FROM pages WHERE url=?", (cite_url,)).fetchone()
            cites.append({
                "url": cite_url,
                "score": round(float(sc), 4),
                "title": (pr[0] if pr else ""),
                "content_hash": (pr[1] if pr else ""),
                "fetched_at": (pr[2] if pr else "")
            })

        # Debate/Eval scoring
        att = dom_att.get(domain, 0)
        freshness_boost = 0.0
        try:
            if row and row[2]:
                age_h = (datetime.utcnow() - datetime.fromisoformat(row[2])).total_seconds()/3600.0
                freshness_boost = 0.15 * (0.5 ** (age_h / 72.0))
        except Exception:
            pass
        safety_penalty = 0.2 if domain in set(d.lower() for d in constitution.get("banned_domains", [])) else 0.0
        base_conf = 0.5 + 0.3 * sigmoid(score, 0, 50) + 0.2 * sigmoid(att, 0, 200) + freshness_boost - safety_penalty
        min_conf = constitution.get("min_confidence", cfg["directives"]["min_confidence_default"])
        confidence = round(max(0.0, min(0.99, base_conf)), 2)

        did = f"DIR-{hashlib.sha1(url.encode()).hexdigest()[:10]}"
        directive = {
            "directive_type": "content_format",
            "directive_id": did,
            "target": {"spawn_id": "spawn-default", "stream_id": "youtube"},
            "issued_at": datetime.utcnow().isoformat(),
            "ttl_hours": cfg["directives"]["ttl_hours"],
            "confidence": confidence,
            "play": {
                "format": "shorts-60s",
                "hooks": ["stat→myth→setup→proof→cta"],
                "cta": "Join Discord for daily alerts",
                "offer": {"type": "affiliate", "sku": "kit-affiliate-media-starter@1.0"},
                "seed_url": url
            },
            "guardrails": sorted(set(constitution.get("required_guardrails", []) + ["no-financial-advice"])),
            "measurement": {
                "primary": "watch_time_7d",
                "controls": ["last_28d_baseline"],
                "stop_loss": {"metric": "ctr", "min_delta": -0.05},
                "promotion_on": {"metric": "conv_rate", "min_delta": 0.03}
            },
            "evidence": cites
        }

        if confidence < min_conf:
            events.append("directive_held_low_confidence", directive_id=did, confidence=confidence, min_required=min_conf)
            continue

        out_path = os.path.join(pending_dir, f"{directive['directive_id']}.json")
        with open(out_path, "w", encoding="utf-8") as f: json.dump(directive, f, indent=2, ensure_ascii=False)
        provenance[did] = {"seed_url": url, "citations": cites}
        new += 1
        events.append("directive_proposed", directive_id=did, domain=domain, confidence=confidence)

    return new, provenance

# ========== GUARDIAN HANDSHAKE ==========
def read_jsonl_tail(path, default=None):
    if not os.path.isfile(path): return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = [ln.strip() for ln in f if ln.strip()]
        return json.loads(lines[-1]) if lines else default
    except Exception:
        return default

def load_constitution(roots, cfg):
    # Merge optional godmind/constitution.json and guardian/policy.jsonl tail.
    base = cfg["constitution"]["fallback"]
    path = os.path.join(roots["root"], cfg["constitution"]["path"])
    if os.path.isfile(path):
        try:
            with open(path, "r", encoding="utf-8") as f: user = json.load(f)
            base.update(user or {})
        except Exception:
            pass
    guardian_policy = read_jsonl_tail(os.path.join(roots["guardian"], "policy.jsonl"), {})
    if isinstance(guardian_policy, dict):
        # Simple merges
        base["banned_domains"] = sorted(set([d.lower() for d in base.get("banned_domains", [])] + [d.lower() for d in guardian_policy.get("banned_domains", [])]))
        if "min_confidence" in guardian_policy:
            base["min_confidence"] = float(guardian_policy["min_confidence"])
        if "required_guardrails" in guardian_policy:
            base["required_guardrails"] = sorted(set(base.get("required_guardrails", []) + guardian_policy.get("required_guardrails", [])))
    return base

def guardian_gate(roots, cfg, min_confidence):
    guardian_dir = roots["guardian"]
    health = read_jsonl_tail(os.path.join(guardian_dir, "health.jsonl"), {"system_ok": True})
    blocks_idx = set()
    if os.path.isfile(os.path.join(guardian_dir, "blocks.jsonl")):
        with open(os.path.join(guardian_dir, "blocks.jsonl"), "r", encoding="utf-8") as f:
            for ln in f:
                ln = ln.strip()
                if not ln: continue
                try:
                    j = json.loads(ln)
                    did = j.get("directive_id")
                    if did: blocks_idx.add(did)
                except Exception:
                    pass

    pending_dir = os.path.join(roots["godmind"], "directives", "pending")
    approved_dir = os.path.join(roots["godmind"], "directives", "approved")
    expired_dir = os.path.join(roots["godmind"], "directives", "expired")
    os.makedirs(approved_dir, exist_ok=True)
    os.makedirs(pending_dir, exist_ok=True)
    os.makedirs(expired_dir, exist_ok=True)

    approved, held = 0, 0
    for fname in list(os.listdir(pending_dir)):
        if not fname.endswith(".json"): continue
        fpath = os.path.join(pending_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f: d = json.load(f)
        except Exception: 
            continue
        did = d.get("directive_id")
        conf = float(d.get("confidence", 0.0))
        if not health.get("system_ok", True):
            held += 1; continue
        if did in blocks_idx:
            held += 1; continue
        if conf < min_confidence:
            held += 1; continue
        os.replace(fpath, os.path.join(approved_dir, fname))
        approved += 1

    # TTL expiry of approved
    ttl_h = int(cfg["directives"]["ttl_hours"])
    cutoff = datetime.utcnow() - timedelta(hours=ttl_h)
    for fname in list(os.listdir(approved_dir)):
        if not fname.endswith(".json"): continue
        fpath = os.path.join(approved_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f: d = json.load(f)
            ts = datetime.fromisoformat(d.get("issued_at"))
            if ts < cutoff:
                os.replace(fpath, os.path.join(expired_dir, fname))
        except Exception:
            continue

    return approved, held

# ========== REPORTS ==========
def write_reports(roots, gateways, attention, patterns, cfg, citations_map):
    rep_dir = os.path.join(roots["godmind"], "reports")
    os.makedirs(rep_dir, exist_ok=True)
    daily_path = os.path.join(roots["godmind"], "reports", "daily.json")
    weekly_md = os.path.join(roots["godmind"], "reports", "weekly.md")
    provenance_path = os.path.join(roots["godmind"], "reports", "provenance.json")

    doc = doctrine_record(gateways, patterns, attention, citations_map)
    with open(daily_path, "w", encoding="utf-8") as out:
        json.dump(doc, out, indent=2, ensure_ascii=False)

    md = ["# Overmind weekly synthesis",
          f"_Generated: {datetime.utcnow().isoformat()}_",
          "## Gateways"]
    md += [f"- {u} (score {s:.1f})" for (s,u) in gateways[:20]]
    md += ["", "## Attention by domain"]
    md += [f"- {d}: {v}" for (d,v) in attention[:20]]
    md += ["", "## Common path patterns"]
    md += [f"- {cnt} × {' → '.join(seq)}" for (seq,cnt) in patterns[:20]]
    md += ["", "## Citations (sample)"]
    for did, info in list(citations_map.items())[:10]:
        md.append(f"- {did}: seed={info.get('seed_url')} cites={[c.get('url') for c in info.get('citations', [])]}")
    with open(weekly_md, "w", encoding="utf-8") as fmd:
        fmd.write("\n".join(md))

    with open(provenance_path, "w", encoding="utf-8") as fpv:
        json.dump(citations_map, fpv, indent=2, ensure_ascii=False)

    return daily_path, weekly_md, provenance_path

# ========== TREASURY EXPORT (stub) ==========
def export_opportunities_to_treasury(roots, gateways):
    if not gateways: return
    tre = os.path.join(roots["treasury"], "catalog")
    os.makedirs(tre, exist_ok=True)
    skus_path = os.path.join(tre, "skus.json")
    items = [{"sku": f"oppty::{hashlib.sha1(u.encode()).hexdigest()[:8]}", "url": u, "score": float(s)} for (s,u) in gateways[:20]]
    save_json(skus_path, {"generated_at": datetime.utcnow().isoformat(), "items": items})

# ========== ORCHESTRATION ==========
def load_cfg(path: str | None):
    cfg = json.loads(json.dumps(DEFAULT_CFG))  # deep-ish copy
    if not path: return cfg
    if path.lower().endswith((".yaml",".yml")) and yaml:
        with open(path, "r", encoding="utf-8") as f: user = yaml.safe_load(f) or {}
    else:
        with open(path, "r", encoding="utf-8") as f: user = json.load(f)
    def merge(a,b):
        for k,v in b.items():
            if isinstance(v, dict) and k in a and isinstance(a[k], dict):
                a[k] = merge(a[k], v)
            else:
                a[k] = v
        return a
    return merge(cfg, user)

def resolve_roots(cfg):
    pulse_root = os.environ.get("PULSE_ROOT", cfg["paths"]["pulse_root"])
    gd = os.path.join(pulse_root, "godmind")
    gu = os.path.join(pulse_root, "guardian")
    tr = os.path.join(pulse_root, "treasury")
    pc = os.path.join(pulse_root, "pulsecore")
    os.makedirs(os.path.join(gd, "directives", "pending"), exist_ok=True)
    os.makedirs(os.path.join(gd, "directives", "approved"), exist_ok=True)
    os.makedirs(os.path.join(gd, "directives", "expired"), exist_ok=True)
    os.makedirs(os.path.join(gd, "reports"), exist_ok=True)
    os.makedirs(os.path.join(gd, "logs"), exist_ok=True)
    os.makedirs(gu, exist_ok=True)
    os.makedirs(os.path.join(tr, "catalog"), exist_ok=True)
    os.makedirs(os.path.join(pc, "registry"), exist_ok=True)
    return {"root": pulse_root, "godmind": gd, "guardian": gu, "treasury": tr, "pulsecore": pc}

def install_signals():
    def handle(sig, _frame):
        logging.warning("Signal %s received — graceful end after current wave.", sig)
    for s in (signal.SIGINT, signal.SIGTERM):
        try: signal.signal(s, handle)
        except Exception: pass

def sigmoid(x, mu=0.0, scale=1.0):
    try: return 1.0 / (1.0 + math.exp(-(x - mu) / (scale or 1.0)))
    except OverflowError: return 0.0 if x < mu else 1.0

def save_json(path: str, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f: json.dump(obj, f, indent=2)
    os.replace(tmp, path)

async def run_cycle(cfg, roots):
    # events
    events = HashChainLog(os.path.join(roots["godmind"], "logs", "events.jsonl"))

    # storage at pulse root
    db_path = os.path.join(roots["root"], cfg["overmind"]["sqlite_path"])
    storage = Storage(db_path)

    # 1) Discovery
    disc = Discovery(cfg["discovery"]["max_hubs"], cfg["overmind"]["user_agent"], cfg["compliance"]["allowed_schemes"])
    hosts, sitemap_urls = await disc.run(cfg["discovery"]["hub_list"])
    logging.info("Discovery: hosts=%d sitemaps=%d", len(hosts), len(sitemap_urls))
    events.append("discovery_complete", hosts=len(hosts), sitemaps=len(sitemap_urls))

    # 2) Crawl
    frontier = Frontier(cfg["frontier"]["priorities"], cfg["frontier"]["per_host_depth_cap"], cfg["frontier"]["freshness_half_life_hours"])
    for h in hosts[:500]:
        root = h if h.endswith("/") else (h + "/")
        frontier.add(root, depth=0, freshness=1.0, influence=1.0)
    for u in sitemap_urls[:4000]:
        nu = normalize_url(u, None, tuple(cfg["compliance"]["allowed_schemes"]))
        if nu: frontier.add(nu, depth=0, freshness=1.0, influence=1.2)

    crawler = Crawler(cfg, storage, events)
    for w in range(int(cfg["overmind"]["waves"])):
        logging.info("Crawl wave %d/%d frontier=%d", w+1, cfg["overmind"]["waves"], len(frontier.q))
        await crawler.crawl_batch(frontier, depth_limit=cfg["overmind"]["crawl_depth"])
        await asyncio.sleep(cfg["overmind"]["politeness_ms"]/1000.0)

    # 3) Simulate
    run_cohort_sessions(storage, cfg["simulation"]["cohorts"], cfg["simulation"]["sessions"], cfg["simulation"]["max_steps"])

    # 4) Fuse
    f = Fusion(storage)
    gateways = f.gateways(cfg["fusion"]["gateway_top_n"])
    attention = f.attention_by_domain()
    patterns = [(seq,cnt) for (seq,cnt) in f.common_paths() if cnt >= cfg["fusion"]["pattern_min_count"]]
    events.append("fusion_ready", gateways=len(gateways), attention=len(attention), patterns=len(patterns))

    # 5) Constitution & Debate/Evidence
    constitution = load_constitution(roots, cfg)
    created, provenance = propose_directives(roots, cfg, (gateways, patterns, attention), storage, constitution, events)
    logging.info("Directives proposed (pending): %d", created)
    events.append("directives_proposed", count=created)

    # 6) Guardian gate
    min_conf = float(constitution.get("min_confidence", cfg["directives"]["min_confidence_default"]))
    approved, held = guardian_gate(roots, cfg, min_confidence=min_conf)
    logging.info("Guardian: approved=%d held=%d", approved, held)
    events.append("guardian_gate", approved=approved, held=held, min_conf=min_conf)

    # 7) Reports (with citations)
    # Build citations map keyed by directive id
    citations_map = provenance
    daily, weekly, prov = write_reports(roots, gateways, attention, patterns, cfg, citations_map)
    logging.info("Reports written: %s | %s | %s", daily, weekly, prov)

    # 8) Doctrine with citations
    doc = doctrine_record(gateways, patterns, attention, citations_map)
    doctrine_path = write_doctrine(roots, doc)
    logging.info("Doctrine appended → %s", doctrine_path)

    # 9) Export to treasury catalog
    export_opportunities_to_treasury(roots, gateways)

    # 10) DB maintenance
    try:
        with closing(storage.conn.cursor()) as cur:
            cur.execute("VACUUM")
        storage.conn.commit()
    except Exception:
        pass

def main():
    cfg_path = sys.argv[1] if len(sys.argv) > 1 else None
    cfg = load_cfg(cfg_path)
    roots = resolve_roots(cfg)
    setup_logging(cfg["reporting"]["log_level"], roots["root"])
    install_signals()
    asyncio.run(run_cycle(cfg, roots))
    logging.info("Godmind cycle complete.")

if __name__ == "__main__":
    main()
