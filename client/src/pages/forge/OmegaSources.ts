// ── OMEGA SOURCE LIBRARY + PULSE UNIVERSE EXTENSIONS ─────────────────────────
// [Ω5] Enriched with Pulse-specific quantum & hive intelligence sources

export const OMEGA_SOURCES = [
  // ── CODE & FRAMEWORKS ─────────────────────────────────────────────────────
  { name: "GitHub", url: "https://github.com", cat: "code", desc: "World's largest open source host" },
  { name: "GitLab", url: "https://gitlab.com", cat: "code", desc: "DevOps platform with CI/CD" },
  { name: "npm Registry", url: "https://npmjs.com", cat: "code", desc: "JavaScript package registry" },
  { name: "PyPI", url: "https://pypi.org", cat: "code", desc: "Python package index" },
  { name: "Crates.io", url: "https://crates.io", cat: "code", desc: "Rust package registry" },
  { name: "pkg.go.dev", url: "https://pkg.go.dev", cat: "code", desc: "Go package discovery" },
  { name: "MVN Repository", url: "https://mvnrepository.com", cat: "code", desc: "Java/Maven dependencies" },
  { name: "RubyGems", url: "https://rubygems.org", cat: "code", desc: "Ruby library repository" },
  { name: "Codeberg", url: "https://codeberg.org", cat: "code", desc: "Free open-source Gitea hosting" },
  { name: "SourceForge", url: "https://sourceforge.net", cat: "code", desc: "Classic OSS project host" },
  // ── UI COMPONENTS ─────────────────────────────────────────────────────────
  { name: "Shadcn/ui", url: "https://ui.shadcn.com", cat: "ui", desc: "Beautiful React components" },
  { name: "Radix UI", url: "https://radix-ui.com", cat: "ui", desc: "Accessible component primitives" },
  { name: "Headless UI", url: "https://headlessui.com", cat: "ui", desc: "Tailwind UI components" },
  { name: "DaisyUI", url: "https://daisyui.com", cat: "ui", desc: "Tailwind CSS component library" },
  { name: "Flowbite", url: "https://flowbite.com", cat: "ui", desc: "Open-source Tailwind components" },
  { name: "MUI", url: "https://mui.com", cat: "ui", desc: "Material Design React components" },
  { name: "Ant Design", url: "https://ant.design", cat: "ui", desc: "Enterprise-level UI system" },
  { name: "Chakra UI", url: "https://chakra-ui.com", cat: "ui", desc: "Accessible React component lib" },
  // ── DESIGN ASSETS ─────────────────────────────────────────────────────────
  { name: "Unsplash", url: "https://unsplash.com", cat: "assets", desc: "Free high-res stock photos" },
  { name: "Pexels", url: "https://pexels.com", cat: "assets", desc: "Free stock photos and videos" },
  { name: "SVGRepo", url: "https://svgrepo.com", cat: "assets", desc: "300k+ free SVG icons" },
  { name: "Lucide Icons", url: "https://lucide.dev", cat: "assets", desc: "Beautiful open-source icons" },
  { name: "Heroicons", url: "https://heroicons.com", cat: "assets", desc: "Tailwind hand-crafted SVGs" },
  { name: "Google Fonts", url: "https://fonts.google.com", cat: "assets", desc: "Free web fonts" },
  { name: "Lottiefiles", url: "https://lottiefiles.com", cat: "assets", desc: "Lightweight JSON animations" },
  { name: "Undraw", url: "https://undraw.co", cat: "assets", desc: "Open-source SVG illustrations" },
  // ── ALGORITHMS ────────────────────────────────────────────────────────────
  { name: "The Algorithms", url: "https://the-algorithms.com", cat: "algo", desc: "Algos in every language" },
  { name: "NIST CSRC", url: "https://csrc.nist.gov", cat: "algo", desc: "Cryptographic standards" },
  { name: "Rosetta Code", url: "https://rosettacode.org", cat: "algo", desc: "Tasks in 900+ languages" },
  { name: "Project Euler", url: "https://projecteuler.net", cat: "algo", desc: "Mathematical/computational" },
  { name: "Stanford SNAP", url: "https://snap.stanford.edu", cat: "algo", desc: "Network analysis platform" },
  { name: "SciPy", url: "https://scipy.org", cat: "algo", desc: "Scientific computing Python" },
  { name: "Boost C++", url: "https://boost.org", cat: "algo", desc: "Peer-reviewed C++ libraries" },
  { name: "GeeksForGeeks", url: "https://geeksforgeeks.org", cat: "algo", desc: "Coding DSA reference" },
  // ── AI & LLM ──────────────────────────────────────────────────────────────
  { name: "Hugging Face", url: "https://huggingface.co", cat: "ai", desc: "Open-source AI models/datasets" },
  { name: "Papers With Code", url: "https://paperswithcode.com", cat: "ai", desc: "ML papers + code" },
  { name: "OpenAI Cookbook", url: "https://cookbook.openai.com", cat: "ai", desc: "LLM integration guides" },
  { name: "LangChain", url: "https://langchain.com", cat: "ai", desc: "Framework for LLM apps" },
  { name: "LlamaIndex", url: "https://llamaindex.ai", cat: "ai", desc: "Data framework for LLMs" },
  { name: "Ollama", url: "https://ollama.ai", cat: "ai", desc: "Run LLMs locally" },
  { name: "Meta AI Research", url: "https://ai.meta.com/research", cat: "ai", desc: "LLaMA + open AI" },
  { name: "Google DeepMind", url: "https://deepmind.google/research", cat: "ai", desc: "Gemini, AlphaFold" },
  { name: "EleutherAI", url: "https://eleutherai.org", cat: "ai", desc: "Open-source AI safety" },
  { name: "PyTorch", url: "https://pytorch.org", cat: "ai", desc: "Open source ML by Meta" },
  { name: "TensorFlow Hub", url: "https://tfhub.dev", cat: "ai", desc: "Pre-trained TF models" },
  { name: "spaCy", url: "https://spacy.io", cat: "ai", desc: "Industrial NLP library" },
  { name: "Stable Diffusion", url: "https://github.com/CompVis/stable-diffusion", cat: "ai", desc: "Open image gen AI" },
  { name: "Whisper", url: "https://github.com/openai/whisper", cat: "ai", desc: "Speech recognition" },
  // ── QUANTUM ───────────────────────────────────────────────────────────────
  { name: "Qiskit", url: "https://qiskit.org", cat: "quantum", desc: "IBM quantum computing SDK" },
  { name: "PennyLane", url: "https://pennylane.ai", cat: "quantum", desc: "Quantum ML framework" },
  { name: "Cirq", url: "https://github.com/quantumlib/Cirq", cat: "quantum", desc: "Google quantum framework" },
  { name: "QuTiP", url: "https://qutip.org", cat: "quantum", desc: "Open quantum systems toolkit" },
  { name: "NVIDIA cuQuantum", url: "https://developer.nvidia.com/cuquantum-sdk", cat: "quantum", desc: "GPU quantum simulation" },
  { name: "QOSF", url: "https://qosf.org", cat: "quantum", desc: "Quantum OSS foundation" },
  { name: "arXiv Quantum", url: "https://arxiv.org/list/quant-ph/recent", cat: "quantum", desc: "Quantum physics preprints" },
  // ── SCIENCE ───────────────────────────────────────────────────────────────
  { name: "arXiv", url: "https://arxiv.org", cat: "science", desc: "Open access science preprints" },
  { name: "PubMed Central", url: "https://ncbi.nlm.nih.gov/pmc", cat: "science", desc: "Free biomedical archive" },
  { name: "NASA Tech Reports", url: "https://ntrs.nasa.gov", cat: "science", desc: "NASA open research" },
  { name: "CERN Open Data", url: "https://opendata.cern.ch", cat: "science", desc: "Particle physics datasets" },
  { name: "Zenodo", url: "https://zenodo.org", cat: "science", desc: "Open research by CERN" },
  { name: "OpenNeuro", url: "https://openneuro.org", cat: "science", desc: "Open neuroscience data" },
  { name: "Wolfram MathWorld", url: "https://mathworld.wolfram.com", cat: "science", desc: "Math encyclopedia" },
  { name: "Semantic Scholar", url: "https://semanticscholar.org", cat: "science", desc: "AI-powered research" },
  { name: "Internet Archive", url: "https://archive.org", cat: "science", desc: "Digital library" },
  // ── APIS ──────────────────────────────────────────────────────────────────
  { name: "Public APIs", url: "https://github.com/public-apis/public-apis", cat: "api", desc: "Free open APIs list" },
  { name: "RapidAPI", url: "https://rapidapi.com/hub", cat: "api", desc: "API marketplace" },
  { name: "OpenWeatherMap", url: "https://openweathermap.org/api", cat: "api", desc: "Free weather API" },
  { name: "REST Countries", url: "https://restcountries.com", cat: "api", desc: "Country data API" },
  { name: "Wikimedia API", url: "https://api.wikimedia.org", cat: "api", desc: "Wikipedia APIs" },
  { name: "TMDB", url: "https://themoviedb.org/documentation/api", cat: "api", desc: "Movie & TV database" },
  { name: "JSONPlaceholder", url: "https://jsonplaceholder.typicode.com", cat: "api", desc: "Fake REST API" },
  // ── DEVTOOLS ──────────────────────────────────────────────────────────────
  { name: "Vite", url: "https://vitejs.dev", cat: "devtools", desc: "Next-gen frontend build tool" },
  { name: "Bun", url: "https://bun.sh", cat: "devtools", desc: "Ultra-fast JS runtime" },
  { name: "Deno", url: "https://deno.com", cat: "devtools", desc: "Secure JS/TS runtime" },
  { name: "Nx", url: "https://nx.dev", cat: "devtools", desc: "Smart monorepo build system" },
  { name: "Turborepo", url: "https://turbo.build", cat: "devtools", desc: "High-performance builds" },
  // ── [Ω5] PULSE UNIVERSE EXTENSIONS — hive intelligence sources ────────────
  { name: "Pulse Hive API", url: "https://myaigpt.online/api", cat: "pulse", desc: "Live sovereign AI civilization data" },
  { name: "Pulse CRISPR Engine", url: "https://myaigpt.online/crispr", cat: "pulse", desc: "AI disease & pattern discovery" },
  { name: "Pulse Knowledge Graph", url: "https://myaigpt.online/api/knowledge", cat: "pulse", desc: "860k+ hive knowledge nodes" },
  { name: "Pulse Gene Editor", url: "https://myaigpt.online/gene-editor", cat: "pulse", desc: "Species DNA forge & evolution" },
  { name: "PulseLang Glyphs", url: "https://myaigpt.online/language", cat: "pulse", desc: "34-glyph Γ living language" },
  { name: "Pulse OmniNet", url: "https://myaigpt.online/omni-net", cat: "pulse", desc: "Sovereign AI internet — U₂₄₈" },
  { name: "Pulse Economy API", url: "https://myaigpt.online/api/economy", cat: "pulse", desc: "Pulse Credits & hive GDP" },
  { name: "Quantapedia", url: "https://myaigpt.online/quantapedia", cat: "pulse", desc: "200k+ AI-generated knowledge articles" },
];

export const getRelevantSources = (prompt: string, n = 18) => {
  const q = prompt.toLowerCase();
  return OMEGA_SOURCES.map((s) => ({
    ...s,
    score:
      (q.includes("ai") || q.includes("ml") || q.includes("llm") ? (s.cat === "ai" ? 4 : 0) : 0) +
      (q.includes("quantum") || q.includes("physics") ? (s.cat === "quantum" || s.cat === "science" ? 4 : 0) : 0) +
      (q.includes("game") || q.includes("canvas") ? (s.cat === "assets" ? 3 : 0) : 0) +
      (q.includes("data") || q.includes("dashboard") || q.includes("saas") ? (s.cat === "api" || s.cat === "algo" ? 3 : 0) : 0) +
      (q.includes("web") || q.includes("app") ? (s.cat === "ui" || s.cat === "code" ? 2 : 0) : 0) +
      (q.includes("pulse") || q.includes("hive") || q.includes("sovereign") ? (s.cat === "pulse" ? 5 : 0) : 0) +
      (["code", "ui", "assets"].includes(s.cat) ? 1 : 0) +
      Math.random() * 0.4,
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
};

export const CAT_COLORS: Record<string, string> = {
  code: "text-blue-400",
  ui: "text-pink-400",
  assets: "text-yellow-400",
  algo: "text-orange-400",
  ai: "text-emerald-400",
  quantum: "text-violet-400",
  science: "text-cyan-400",
  api: "text-green-400",
  devtools: "text-red-400",
  pulse: "text-[#00FFD1]",
};

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "code", label: "Code" },
  { id: "ui", label: "UI" },
  { id: "assets", label: "Assets" },
  { id: "algo", label: "Algorithms" },
  { id: "ai", label: "AI/LLM" },
  { id: "quantum", label: "Quantum" },
  { id: "science", label: "Science" },
  { id: "api", label: "APIs" },
  { id: "devtools", label: "DevTools" },
  { id: "pulse", label: "⚡ Pulse" },
];
