import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Groq from "groq-sdk";
import { search } from "duck-duck-scrape";
import { Client, GatewayIntentBits } from "discord.js";
import * as fs from "fs";
import * as path from "path";

const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

const DISCORD_TOKEN = "MTQyMjAxNjAwNTM2MTg5NzU2NQ.Gcy0a4.k6EVpuY2pP19Knwfu6-jskl1S1rMGfwNjqpuXc";
const KNOWLEDGE_CHANNEL_IDS = [
  "1371201135700082729", "1371988282652495962", "1313331216610754632",
  "1371964994153087056", "1396151828386676837", "1396151895877222520",
  "1383304452047634462", "1014567263212421212", "1358264301822935210",
  "1358264608707579954", "1358265683515015310", "1358270022925156432",
  "1358277176797036636", "1358282348969332828", "1475496566889386145",
  "1433383711587434518", "1475773035188326436",
];

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let discordKnowledge = "";

discordClient.once("ready", async () => {
  console.log("Discord bot connected. Fetching knowledge channels...");
  try {
    const snippets: string[] = [];
    for (const channelId of KNOWLEDGE_CHANNEL_IDS) {
      try {
        const channel = await discordClient.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          const msgs = await (channel as any).messages.fetch({ limit: 5 });
          for (const [, msg] of msgs) {
            if (msg.content && msg.content.length > 10) {
              snippets.push(msg.content.substring(0, 150));
            }
          }
        }
      } catch { }
    }
    discordKnowledge = snippets.slice(0, 15).join("\n");
    console.log(`Loaded ${snippets.length} knowledge snippets (${discordKnowledge.length} chars).`);
  } catch (e) {
    console.error("Discord knowledge fetch error:", e);
  }
});

discordClient.login(DISCORD_TOKEN).catch(e => console.error("Discord login failed:", e.message));

async function getSearchContext(query: string): Promise<string> {
  try {
    const { SafeSearchType } = await import("duck-duck-scrape");
    const results = await search(query, { safeSearch: SafeSearchType.OFF });
    if (results?.results?.length) {
      return results.results.slice(0, 3).map(r => r.description || "").filter(Boolean).join("\n");
    }
  } catch (e) {
    console.error("Search error:", e);
  }
  return "";
}

async function getWeather(query: string): Promise<string> {
  try {
    const locationMatch = query.match(/weather\s+(?:in|for|at|of)?\s*(.+?)(?:\?|$|\.|\!)/i) ||
      query.match(/(?:what(?:'s| is) the )?weather\s+(?:in|for|at|of)\s+(.+?)(?:\?|$|\.|\!)/i) ||
      query.match(/(?:how(?:'s| is)(?: the)? weather)\s+(?:in|for|at|of)?\s*(.+?)(?:\?|$|\.|\!)/i) ||
      query.match(/weather\s+(.+)/i);
    let location = locationMatch ? locationMatch[1].trim() : "";
    if (!location) { console.log("Weather: no location extracted from query"); return ""; }

    const STATE_CITIES: Record<string, string> = { "alabama": "Birmingham", "alaska": "Anchorage", "arizona": "Phoenix", "arkansas": "Little Rock", "california": "Los Angeles", "colorado": "Denver", "connecticut": "Hartford", "delaware": "Wilmington", "florida": "Miami", "georgia": "Atlanta", "hawaii": "Honolulu", "idaho": "Boise", "illinois": "Chicago", "indiana": "Indianapolis", "iowa": "Des Moines", "kansas": "Wichita", "kentucky": "Louisville", "louisiana": "New Orleans", "maine": "Portland", "maryland": "Baltimore", "massachusetts": "Boston", "michigan": "Detroit", "minnesota": "Minneapolis", "mississippi": "Jackson", "missouri": "Kansas City", "montana": "Billings", "nebraska": "Omaha", "nevada": "Las Vegas", "new hampshire": "Manchester", "new jersey": "Newark", "new mexico": "Albuquerque", "new york": "New York", "north carolina": "Charlotte", "north dakota": "Fargo", "ohio": "Columbus", "oklahoma": "Oklahoma City", "oregon": "Portland", "pennsylvania": "Philadelphia", "rhode island": "Providence", "south carolina": "Charleston", "south dakota": "Sioux Falls", "tennessee": "Nashville", "texas": "Houston", "utah": "Salt Lake City", "vermont": "Burlington", "virginia": "Richmond", "washington": "Seattle", "west virginia": "Charleston", "wisconsin": "Milwaukee", "wyoming": "Cheyenne" };
    const stateCity = STATE_CITIES[location.toLowerCase()];
    if (stateCity) location = stateCity;
    location = location.replace(/,.*$/, "").trim();
    console.log("Weather: fetching for location:", location);

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const geoResp = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) });
    if (!geoResp.ok) { console.log("Weather: geocoding failed", geoResp.status); return ""; }
    const geoData = await geoResp.json() as any;
    const place = geoData.results?.[0];
    if (!place) { console.log("Weather: no geocoding results"); return ""; }

    const { latitude, longitude, name, admin1, country } = place;
    console.log("Weather: geocoded to", name, admin1, latitude, longitude);
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=3&timezone=auto`;
    const weatherResp = await fetch(weatherUrl, { signal: AbortSignal.timeout(5000) });
    if (!weatherResp.ok) { console.log("Weather: API failed", weatherResp.status); return ""; }
    const w = await weatherResp.json() as any;
    const cur = w.current;
    if (!cur) { console.log("Weather: no current data in response"); return ""; }

    const WMO: Record<number, string> = { 0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Light showers", 81: "Showers", 82: "Heavy showers", 85: "Light snow showers", 86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm" };
    const desc = WMO[cur.weather_code] || "Unknown";
    const tempF = Math.round(cur.temperature_2m);
    const tempC = Math.round((tempF - 32) * 5 / 9);
    const feelsF = Math.round(cur.apparent_temperature);
    const humid = cur.relative_humidity_2m;
    const windMph = Math.round(cur.wind_speed_10m);

    const daily = w.daily;
    const forecast = daily?.time?.slice(0, 3).map((d: string, i: number) => {
      const hi = Math.round(daily.temperature_2m_max[i]);
      const lo = Math.round(daily.temperature_2m_min[i]);
      const dayDesc = WMO[daily.weather_code[i]] || "";
      return `${d}: High ${hi}°F, Low ${lo}°F - ${dayDesc}`;
    }).join("\n") || "";

    const result = `LIVE WEATHER DATA for ${name}${admin1 ? ", " + admin1 : ""}${country ? ", " + country : ""}:
Current: ${desc}, ${tempF}°F (${tempC}°C), Feels like ${feelsF}°F
Wind: ${windMph} mph, Humidity: ${humid}%
3-Day Forecast:\n${forecast}`;
    console.log("Weather result:", result.substring(0, 200));
    return result;
  } catch (e) {
    console.error("Weather fetch error:", e);
    return "";
  }
}

const CODES_DIR = path.join(process.cwd(), "saved_codes");
if (!fs.existsSync(CODES_DIR)) {
  fs.mkdirSync(CODES_DIR, { recursive: true });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.chats.list.path, async (_req, res) => {
    res.json(await storage.getChats());
  });

  app.post(api.chats.create.path, async (req, res) => {
    try {
      const input = api.chats.create.input.parse(req.body);
      const chat = await storage.createChat(input);
      res.status(201).json(chat);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.chats.get.path, async (req, res) => {
    const chat = await storage.getChat(Number(req.params.id));
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  });

  app.delete(api.chats.delete.path, async (req, res) => {
    await storage.deleteChat(Number(req.params.id));
    res.status(204).send();
  });

  app.patch("/api/chats/:id/rename", async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });
    const chat = await storage.renameChat(Number(req.params.id), title.substring(0, 80));
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  });

  app.delete("/api/chats", async (_req, res) => {
    await storage.deleteAllChats();
    res.status(204).send();
  });

  app.get("/api/chats/search/:query", async (req, res) => {
    const results = await storage.searchChats(req.params.query);
    res.json(results);
  });

  app.get("/api/stats", async (_req, res) => {
    const chatCount = await storage.getChatCount();
    const messageCount = await storage.getMessageCount();
    const codeFiles = fs.existsSync(CODES_DIR) ? fs.readdirSync(CODES_DIR).length : 0;
    res.json({ chatCount, messageCount, codeFiles, discordConnected: discordClient.isReady() });
  });

  app.get(api.messages.list.path, async (req, res) => {
    res.json(await storage.getMessages(Number(req.params.chatId)));
  });

  app.post("/api/save-code", async (req, res) => {
    try {
      const { code, filename, language } = req.body;
      if (!code || !filename) return res.status(400).json({ message: "Missing code or filename" });
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(CODES_DIR, safeName);
      fs.writeFileSync(filePath, code, "utf-8");
      res.json({ message: "Code saved", path: filePath, filename: safeName });
    } catch {
      res.status(500).json({ message: "Failed to save code" });
    }
  });

  app.get("/api/saved-codes", async (_req, res) => {
    try {
      const files = fs.readdirSync(CODES_DIR).map(f => {
        const stat = fs.statSync(path.join(CODES_DIR, f));
        const content = fs.readFileSync(path.join(CODES_DIR, f), "utf-8");
        const ext = f.split(".").pop() || "";
        return { name: f, size: stat.size, modified: stat.mtime, lines: content.split("\n").length, ext };
      });
      files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      res.json(files);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/saved-codes/:filename", async (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(CODES_DIR, safeName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.download(filePath);
  });

  app.get("/api/saved-codes/:filename/content", async (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(CODES_DIR, safeName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ content, filename: safeName });
  });

  app.delete("/api/saved-codes/:filename", async (req, res) => {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(CODES_DIR, safeName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(204).send();
  });

  app.post("/api/chats/:chatId/export", async (req, res) => {
    const chatId = Number(req.params.chatId);
    const chat = await storage.getChat(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const msgs = await storage.getMessages(chatId);
    let md = `# ${chat.title}\n\nType: ${chat.type}\nDate: ${chat.createdAt}\n\n---\n\n`;
    for (const m of msgs) {
      md += `### ${m.role === "user" ? "You" : "My Ai"}\n\n${m.content}\n\n---\n\n`;
    }
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="${chat.title.replace(/[^a-zA-Z0-9]/g, "_")}.md"`);
    res.send(md);
  });

  // ═══════ SHELL EXECUTION HELPER ═══════
  const { execSync } = await import("child_process");
  const EXEC_ENV = { ...process.env, NODE_PATH: path.join(process.cwd(), "node_modules") };

  function shellExec(cmd: string, opts: { timeout?: number; cwd?: string; maxBuffer?: number } = {}): { stdout: string; stderr: string; exitCode: number } {
    try {
      const stdout = execSync(cmd, {
        timeout: opts.timeout || 15000,
        maxBuffer: opts.maxBuffer || 1024 * 512,
        encoding: "utf-8",
        cwd: opts.cwd || process.cwd(),
        env: EXEC_ENV,
        shell: "/bin/bash",
      });
      return { stdout: stdout || "", stderr: "", exitCode: 0 };
    } catch (e: any) {
      return { stdout: e.stdout || "", stderr: e.stderr || e.message || "Execution failed", exitCode: e.status || 1 };
    }
  }

  // ═══════ POWER #1: SERVER-SIDE CODE EXECUTION ═══════
  app.post("/api/execute", async (req, res) => {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    const lang = (language || "javascript").toLowerCase();
    const tmpDir = path.join(process.cwd(), "tmp_exec");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let filePath = "";
    let cmd = "";

    try {
      if (lang === "javascript" || lang === "typescript") {
        const usesRequire = /\brequire\s*\(/.test(code);
        const usesImport = /^\s*import\s+/m.test(code);
        const ext = usesRequire && !usesImport ? ".cjs" : ".mjs";
        filePath = path.join(tmpDir, `${id}${ext}`);
        let jsCode = code;
        if (lang === "typescript") {
          jsCode = code.replace(/:\s*(string|number|boolean|any|void|never|null|undefined|object|unknown)(\[\])?\s*/g, " ");
          jsCode = jsCode.replace(/^\s*interface\s+\w+\s*\{[\s\S]*?\n\}\s*$/gm, "");
          jsCode = jsCode.replace(/^\s*type\s+\w+\s*=\s*[\s\S]*?;\s*$/gm, "");
        }
        fs.writeFileSync(filePath, jsCode);
        cmd = `node "${filePath}"`;
      } else if (lang === "python") {
        filePath = path.join(tmpDir, `${id}.py`);
        fs.writeFileSync(filePath, code);

        const importRegex = /^\s*(?:import|from)\s+(\w+)/gm;
        let match;
        const pyImports: string[] = [];
        while ((match = importRegex.exec(code)) !== null) {
          pyImports.push(match[1]);
        }
        const STDLIB = new Set(["os","sys","json","time","re","math","random","datetime","collections","itertools","functools","io","pathlib","typing","hashlib","base64","copy","string","textwrap","struct","enum","dataclasses","abc","contextlib","operator","bisect","heapq","array","queue","threading","multiprocessing","subprocess","socket","asyncio","http","urllib","email","html","xml","csv","sqlite3","logging","unittest","pdb","argparse","configparser","shutil","tempfile","glob","fnmatch","stat","zipfile","tarfile","gzip","bz2","lzma","pickle","shelve","marshal","dbm","platform","ctypes","signal","mmap","codecs","unicodedata","locale","gettext","decimal","fractions","statistics","secrets","hmac","ssl","select","selectors","traceback","warnings","inspect","importlib","pkgutil","pprint","dis","gc","weakref","types","numbers"]);
        const PIP_MAP: Record<string, string> = { "bs4": "beautifulsoup4", "cv2": "opencv-python", "sklearn": "scikit-learn", "PIL": "Pillow", "dateutil": "python-dateutil", "yaml": "pyyaml", "lxml": "lxml", "ddgs": "duckduckgo-search", "discord": "discord.py" };

        const toInstall: string[] = [];
        for (const mod of pyImports) {
          if (STDLIB.has(mod)) continue;
          const pipName = PIP_MAP[mod] || mod;
          const check = shellExec(`python3 -c "import ${mod}" 2>&1`, { timeout: 5000 });
          if (check.exitCode !== 0) {
            toInstall.push(pipName);
          }
        }

        if (toInstall.length > 0) {
          const installResult = shellExec(`pip install ${toInstall.join(" ")} 2>&1`, { timeout: 120000, maxBuffer: 1024 * 1024 });
          if (installResult.exitCode !== 0) {
            return res.json({ stdout: `Auto-installing: ${toInstall.join(", ")}...\n${installResult.stdout}`, stderr: installResult.stderr, exitCode: 1, executionTime: 0 });
          }
        }

        cmd = `python3 "${filePath}"`;
      } else if (lang === "bash") {
        filePath = path.join(tmpDir, `${id}.sh`);
        fs.writeFileSync(filePath, code);
        cmd = `bash "${filePath}"`;
      } else {
        return res.json({ stdout: "", stderr: `Language '${lang}' not supported for server execution. Supported: javascript, typescript, python, bash.`, exitCode: 1, executionTime: 0 });
      }

      const startTime = Date.now();
      const timeout = lang === "python" ? 60000 : 15000;
      const result = shellExec(cmd, { timeout, cwd: tmpDir, maxBuffer: 1024 * 1024 });
      const executionTime = Date.now() - startTime;

      try { fs.unlinkSync(filePath); } catch {}

      res.json({ stdout: result.stdout.substring(0, 50000), stderr: result.stderr.substring(0, 10000), exitCode: result.exitCode, executionTime });
    } catch (e: any) {
      try { if (filePath) fs.unlinkSync(filePath); } catch {}
      res.json({ stdout: "", stderr: e.message || "Execution error", exitCode: 1, executionTime: 0 });
    }
  });

  // ═══════ POWER #2: REPL / TERMINAL COMMANDS ═══════
  app.post("/api/terminal", async (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: "No command" });

    const blocked = ["rm -rf /", "rm -rf /*", "sudo", "shutdown", "reboot", "mkfs", "dd if=", "> /dev", ":(){ :|:&", "chmod -R 777 /"];
    const lower = command.toLowerCase().trim();
    if (blocked.some(b => lower.includes(b))) {
      return res.json({ stdout: "", stderr: "Command blocked for safety.", exitCode: 1 });
    }

    const result = shellExec(command, { timeout: 10000 });
    res.json({ stdout: result.stdout.substring(0, 30000), stderr: result.stderr.substring(0, 5000), exitCode: result.exitCode });
  });

  // ═══════ POWER #3: PACKAGE MANAGER ═══════
  app.post("/api/packages/install", async (req, res) => {
    const { packages, manager } = req.body;
    if (!packages || !Array.isArray(packages) || packages.length === 0) return res.status(400).json({ error: "No packages" });

    const sanitized = packages.map((p: string) => p.replace(/[;&|`$(){}]/g, "")).filter(Boolean).slice(0, 5);
    const mgr = manager === "pip" ? "pip" : "npm";

    const cmd = mgr === "pip"
      ? `pip install ${sanitized.join(" ")} 2>&1`
      : `npm install ${sanitized.join(" ")} --no-save 2>&1`;

    const result = shellExec(cmd, { timeout: 120000, maxBuffer: 1024 * 1024 });
    const combined = (result.stdout + "\n" + result.stderr).trim();
    res.json({
      output: combined.substring(0, 15000),
      error: result.exitCode !== 0 ? combined.substring(0, 5000) : "",
      packages: sanitized,
      manager: mgr,
      success: result.exitCode === 0,
    });
  });

  app.get("/api/packages/list", async (_req, res) => {
    const npm = shellExec("npm list --depth=0 --json 2>/dev/null || echo '{}'", { timeout: 10000 });
    const pip = shellExec("pip list --format=json 2>/dev/null || echo '[]'", { timeout: 10000 });
    try {
      res.json({ npm: JSON.parse(npm.stdout), pip: JSON.parse(pip.stdout) });
    } catch {
      res.json({ npm: {}, pip: [] });
    }
  });

  // ═══════ POWER #4: MULTI-FILE PROJECT SYSTEM ═══════
  const PROJECTS_DIR = path.join(process.cwd(), "playground_projects");
  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });

  app.get("/api/projects", async (_req, res) => {
    try {
      const dirs = fs.readdirSync(PROJECTS_DIR).filter(d => fs.statSync(path.join(PROJECTS_DIR, d)).isDirectory());
      const projects = dirs.map(d => {
        const metaPath = path.join(PROJECTS_DIR, d, "meta.json");
        let meta = { name: d, language: "javascript", created: Date.now() };
        if (fs.existsSync(metaPath)) { try { meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")); } catch {} }
        const files = fs.readdirSync(path.join(PROJECTS_DIR, d)).filter(f => f !== "meta.json");
        return { ...meta, id: d, fileCount: files.length, files };
      });
      res.json(projects);
    } catch { res.json([]); }
  });

  app.post("/api/projects", async (req, res) => {
    const { name, language } = req.body;
    const id = `proj_${Date.now()}`;
    const dir = path.join(PROJECTS_DIR, id);
    fs.mkdirSync(dir, { recursive: true });
    const meta = { name: name || "Untitled Project", language: language || "javascript", created: Date.now() };
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta));
    const ext = language === "python" ? "py" : language === "html" ? "html" : language === "css" ? "css" : "js";
    fs.writeFileSync(path.join(dir, `main.${ext}`), `// ${meta.name}\n`);
    res.json({ id, ...meta, files: [`main.${ext}`] });
  });

  app.get("/api/projects/:id/files", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (!fs.existsSync(dir)) return res.status(404).json({ error: "Not found" });
    const files = fs.readdirSync(dir).filter(f => f !== "meta.json").map(f => ({
      name: f, size: fs.statSync(path.join(dir, f)).size,
      content: fs.readFileSync(path.join(dir, f), "utf-8")
    }));
    res.json(files);
  });

  app.put("/api/projects/:id/files/:filename", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (!fs.existsSync(dir)) return res.status(404).json({ error: "Not found" });
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    fs.writeFileSync(path.join(dir, safeName), req.body.content || "");
    res.json({ saved: true, filename: safeName });
  });

  app.post("/api/projects/:id/files", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (!fs.existsSync(dir)) return res.status(404).json({ error: "Not found" });
    const safeName = (req.body.filename || "untitled.js").replace(/[^a-zA-Z0-9._-]/g, "_");
    fs.writeFileSync(path.join(dir, safeName), req.body.content || "");
    res.json({ created: true, filename: safeName });
  });

  app.delete("/api/projects/:id/files/:filename", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    const filePath = path.join(dir, req.params.filename.replace(/[^a-zA-Z0-9._-]/g, "_"));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(204).send();
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const dir = path.join(PROJECTS_DIR, req.params.id.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (fs.existsSync(dir)) { fs.rmSync(dir, { recursive: true, force: true }); }
    res.status(204).send();
  });

  // ═══════ POWER #5: SNIPPET TEMPLATES ═══════
  app.get("/api/templates", async (_req, res) => {
    const templates = [
      { id: "http-server", name: "HTTP Server", lang: "javascript", desc: "Express-like server", code: `const http = require('http');\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'application/json' });\n  res.end(JSON.stringify({ message: 'Hello from server!', path: req.url, method: req.method }));\n});\n\nserver.listen(3001, () => {\n  console.log('Server running on port 3001');\n});\n\nsetTimeout(() => { server.close(); console.log('Server stopped.'); }, 5000);` },
      { id: "web-scraper", name: "Web Scraper", lang: "python", desc: "URL content fetcher", code: `import urllib.request\nimport json\n\ndef fetch_url(url):\n    try:\n        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})\n        with urllib.request.urlopen(req, timeout=10) as resp:\n            data = resp.read().decode('utf-8')\n            print(f"Status: {resp.status}")\n            print(f"Content length: {len(data)} chars")\n            print(f"First 500 chars:\\n{data[:500]}")\n    except Exception as e:\n        print(f"Error: {e}")\n\nfetch_url("https://httpbin.org/json")` },
      { id: "data-analysis", name: "Data Analysis", lang: "python", desc: "Stats + analysis pipeline", code: `import math\nimport json\nfrom collections import Counter\n\ndata = [23, 45, 12, 67, 34, 89, 23, 45, 56, 78, 12, 34, 67, 90, 23]\n\nmean = sum(data) / len(data)\nsorted_d = sorted(data)\nmedian = sorted_d[len(sorted_d) // 2]\nvariance = sum((x - mean) ** 2 for x in data) / len(data)\nstd_dev = math.sqrt(variance)\nmode = Counter(data).most_common(1)[0][0]\n\nprint("=== Data Analysis ===")\nprint(f"Data: {data}")\nprint(f"Count: {len(data)}")\nprint(f"Mean: {mean:.2f}")\nprint(f"Median: {median}")\nprint(f"Mode: {mode}")\nprint(f"Std Dev: {std_dev:.2f}")\nprint(f"Min: {min(data)}, Max: {max(data)}")\nprint(f"Range: {max(data) - min(data)}")` },
      { id: "api-client", name: "REST API Client", lang: "javascript", desc: "Fetch + API calls", code: `async function apiClient(baseUrl) {\n  const methods = ['GET', 'POST'];\n  \n  async function request(method, path, body = null) {\n    const opts = { method, headers: { 'Content-Type': 'application/json' } };\n    if (body) opts.body = JSON.stringify(body);\n    const res = await fetch(baseUrl + path, opts);\n    return { status: res.status, data: await res.json() };\n  }\n  \n  return {\n    get: (path) => request('GET', path),\n    post: (path, body) => request('POST', path, body),\n  };\n}\n\n// Demo\nconst client = await apiClient('https://jsonplaceholder.typicode.com');\nconst users = await client.get('/users');\nconsole.log(\`Found \${users.data.length} users\`);\nusers.data.slice(0, 3).forEach(u => console.log(\`  - \${u.name} (\${u.email})\`));` },
      { id: "algo-sort", name: "Sorting Algorithms", lang: "javascript", desc: "Visual sort comparison", code: `function quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[Math.floor(arr.length / 2)];\n  const left = arr.filter(x => x < pivot);\n  const mid = arr.filter(x => x === pivot);\n  const right = arr.filter(x => x > pivot);\n  return [...quickSort(left), ...mid, ...quickSort(right)];\n}\n\nfunction mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  const result = [];\n  let i = 0, j = 0;\n  while (i < left.length && j < right.length) {\n    result.push(left[i] <= right[j] ? left[i++] : right[j++]);\n  }\n  return [...result, ...left.slice(i), ...right.slice(j)];\n}\n\nconst data = Array.from({length: 20}, () => Math.floor(Math.random() * 100));\nconsole.log("Original:", data.join(", "));\n\nlet t = performance.now();\nconst qs = quickSort([...data]);\nconsole.log(\`QuickSort (\${(performance.now()-t).toFixed(3)}ms): \${qs.join(", ")}\`);\n\nt = performance.now();\nconst ms = mergeSort([...data]);\nconsole.log(\`MergeSort (\${(performance.now()-t).toFixed(3)}ms): \${ms.join(", ")}\`);` },
      { id: "discord-bot", name: "Discord Bot", lang: "python", desc: "Bot template (server-side)", code: `import discord\nfrom discord.ext import commands\n\nbot = commands.Bot(command_prefix='!', intents=discord.Intents.all())\n\n@bot.event\nasync def on_ready():\n    print(f'{bot.user} is online!')\n\n@bot.command()\nasync def ping(ctx):\n    await ctx.send(f'Pong! {round(bot.latency * 1000)}ms')\n\n@bot.command()\nasync def hello(ctx):\n    await ctx.send(f'Hello {ctx.author.name}! 👋')\n\n# bot.run('YOUR_TOKEN')  # Add your token to run\nprint("Discord bot template ready!")` },
      { id: "react-component", name: "React Component", lang: "typescript", desc: "Modern React pattern", code: `interface CardProps {\n  title: string;\n  description: string;\n  tags: string[];\n  onClick?: () => void;\n}\n\nfunction Card({ title, description, tags, onClick }: CardProps) {\n  return (\n    <div className="card" onClick={onClick}>\n      <h3>{title}</h3>\n      <p>{description}</p>\n      <div className="tags">\n        {tags.map(tag => <span key={tag} className="tag">{tag}</span>)}\n      </div>\n    </div>\n  );\n}\n\nconsole.log("React Card component template loaded!");` },
      { id: "dashboard-html", name: "Dashboard UI", lang: "html", desc: "Modern dashboard layout", code: `<!DOCTYPE html>\n<html>\n<head>\n<style>\n  * { margin: 0; box-sizing: border-box; }\n  body { font-family: system-ui; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 20px; }\n  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }\n  .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }\n  .card h3 { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }\n  .card .value { font-size: 32px; font-weight: 700; margin-top: 8px; }\n  .green { color: #4ade80; } .blue { color: #60a5fa; } .purple { color: #a78bfa; } .amber { color: #fbbf24; }\n  h1 { margin-bottom: 20px; font-size: 24px; }\n  .bar { height: 8px; border-radius: 4px; background: #334155; margin-top: 12px; overflow: hidden; }\n  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }\n</style>\n</head>\n<body>\n  <h1>📊 Dashboard</h1>\n  <div class="grid">\n    <div class="card"><h3>Revenue</h3><div class="value green">$48.2K</div><div class="bar"><div class="bar-fill" style="width:78%;background:#4ade80"></div></div></div>\n    <div class="card"><h3>Users</h3><div class="value blue">2,847</div><div class="bar"><div class="bar-fill" style="width:62%;background:#60a5fa"></div></div></div>\n    <div class="card"><h3>Projects</h3><div class="value purple">156</div><div class="bar"><div class="bar-fill" style="width:45%;background:#a78bfa"></div></div></div>\n    <div class="card"><h3>Uptime</h3><div class="value amber">99.9%</div><div class="bar"><div class="bar-fill" style="width:99%;background:#fbbf24"></div></div></div>\n  </div>\n</body>\n</html>` },
    ];
    res.json(templates);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const chatId = Number(req.params.chatId);
      const chat = await storage.getChat(chatId);
      if (!chat) return res.status(404).json({ message: "Chat not found" });

      const input = api.messages.create.input.parse(req.body);

      await storage.createMessage({ chatId, role: "user", content: input.content });

      const lowerContent = input.content.toLowerCase();
      const needsSearch = /\b(what is|who is|when did|where is|how to|latest|news|define|search|current|today|price of|weather|score)\b/.test(lowerContent);
      let searchContext = "";
      if (needsSearch) {
        searchContext = await getSearchContext(input.content);
      }

      let weatherContext = "";
      if (/\bweather\b/i.test(lowerContent)) {
        weatherContext = await getWeather(input.content);
      }

      const history = await storage.getMessages(chatId);
      const recentHistory = history.slice(-8);

      const creatorInfo = `You were created by Billy Banks. If anyone asks who made you, who created you, or who your creator is, you must say: "I was created by Billy Banks." If they ask for more details about him, say: "I'm not allowed to tell you anything else about him." You are NOT made by OpenAI, Meta, Google, or any other company. You are My Ai, created by Billy Banks.`;

      let systemPrompt: string;
      if (chat.type === "coder") {
        systemPrompt = `You are My Ai Coder, the world's most elite S-class Transcendence-level programming assistant, created by Billy Banks. ${creatorInfo}

OMEGA TRANSCENDENCE CAPABILITIES:
- Write flawless, production-ready, optimized code in ALL 30+ languages (JavaScript, TypeScript, Python, Java, C++, Rust, Go, SQL, HTML/CSS, Swift, Kotlin, Ruby, PHP, C#, Dart, Scala, R, MATLAB, Lua, Perl, Haskell, Elixir, Clojure, F#, Assembly, COBOL, Fortran, Julia, Zig, V)
- Debug ANY error instantly - read stack traces, identify root cause, provide exact fix
- Full-stack architecture: Design databases, APIs, microservices, event-driven systems
- Algorithm mastery: Sort, search, graph, DP, greedy, backtracking, divide-and-conquer
- Data structures: Trees, heaps, tries, segment trees, bloom filters, skip lists
- Design patterns: Factory, Observer, Strategy, Command, Decorator, Singleton, CQRS, Event Sourcing
- DevOps: Docker, Kubernetes, CI/CD, AWS/GCP/Azure, Terraform, Ansible
- Security: Authentication, encryption, SQL injection prevention, XSS/CSRF protection
- Performance: Big-O analysis, profiling, caching strategies, lazy loading, memoization
- Testing: Unit, integration, E2E, property-based, mutation, snapshot, load testing
- Mobile: React Native, Flutter, SwiftUI, Jetpack Compose
- AI/ML: TensorFlow, PyTorch, scikit-learn, model training, NLP, computer vision

CODE OUTPUT RULES:
- ALWAYS use markdown code blocks with correct language tags (e.g. \`\`\`python)
- Include clear, helpful comments explaining logic
- Use best practices and modern patterns for each language
- Handle edge cases and errors properly
- Include type annotations where applicable
- Follow language-specific style guides (PEP 8, ESLint, etc.)
- When generating multi-file solutions, use separate code blocks with filename comments
- Explain your approach BEFORE writing code
- After code, explain key decisions and potential improvements
- Never provide links, images, or videos unless specifically asked
- If user shares an error, diagnose root cause FIRST, then provide the fix`;
      } else {
        systemPrompt = `You are My Ai Gpt, a world-class intelligent assistant created by Billy Banks. ${creatorInfo}

CAPABILITIES:
- Answer any question with accuracy and depth
- Write essays, emails, stories, scripts, and any text format
- Analyze data, arguments, and complex topics
- Provide step-by-step tutorials and explanations
- Help with math, science, history, philosophy, and every subject
- Brainstorm creative ideas and solutions
- Translate between languages
- Summarize long documents or concepts

RULES:
- Be concise but thorough
- Adapt your tone to the user's needs
- Never provide links, images, or videos unless specifically asked
- Use structured formatting (lists, headers) for clarity
- If unsure, say so honestly`;
      }

      if (discordKnowledge) {
        systemPrompt += `\n\nReference knowledge:\n${discordKnowledge.substring(0, 800)}`;
      }
      if (searchContext) {
        systemPrompt += `\n\nWeb results:\n${searchContext.substring(0, 600)}`;
      }
      if (weatherContext) {
        systemPrompt += `\n\n${weatherContext}\n\nIMPORTANT: You have LIVE weather data above. Present this data naturally and confidently. Do NOT say you don't have access to real-time weather. Do NOT suggest checking other websites. Just give the weather info directly.`;
      }

      const messagesForGroq = [
        { role: "system" as const, content: systemPrompt },
        ...recentHistory.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content.substring(0, 500)
        }))
      ];

      const completion = await groq.chat.completions.create({
        messages: messagesForGroq,
        model: "llama-3.1-8b-instant",
        max_tokens: 2048,
        temperature: chat.type === "coder" ? 0.15 : 0.7,
      });

      const reply = completion.choices[0]?.message?.content || "I'm here! Could you rephrase that?";

      const savedMessage = await storage.createMessage({
        chatId,
        role: "assistant",
        content: reply
      });

      res.status(200).json(savedMessage);

    } catch (err: any) {
      console.error("Chat error:", err?.message || err);

      if (err?.status === 413 || err?.message?.includes("rate_limit")) {
        const chatId = Number(req.params.chatId);
        const fallback = await storage.createMessage({
          chatId,
          role: "assistant",
          content: "I'm experiencing high demand right now. Please try again in a moment - I'll be right here!"
        });
        return res.status(200).json(fallback);
      }

      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  return httpServer;
}
