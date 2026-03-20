import { storage } from "./storage";
import { log } from "./index";
import { onEntryGenerated } from "./hive-brain";

const toSlug = (q: string) =>
  q.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const titleFromSlug = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Topic Categorizer ─────────────────────────────────────────
function categorize(title: string): string {
  const t = title.toLowerCase();
  if (/\b(quantum|physics|relativity|thermodynamics|mechanics|electro|optics|nuclear|particle|wave|force|energy|mass|atom|photon|neutrino|boson|fermion|plasma|dark matter|gravity|spacetime)\b/.test(t)) return "physics";
  if (/\b(biology|cell|gene|dna|rna|protein|evolution|organism|bacteria|virus|ecology|ecosystem|species|mutation|chromosome|mitosis|meiosis|enzyme|ribosome|mitochondria)\b/.test(t)) return "biology";
  if (/\b(math|calculus|algebra|geometry|topology|number|theorem|proof|equation|matrix|vector|derivative|integral|probability|statistics|set theory|logic|combinatorics|analysis)\b/.test(t)) return "mathematics";
  if (/\b(ai|artificial intelligence|machine learning|deep learning|neural|transformer|llm|nlp|computer vision|reinforcement|algorithm|data science|model|training|inference)\b/.test(t)) return "artificial_intelligence";
  if (/\b(computer|software|programming|code|web|database|cloud|network|security|operating system|compiler|api|framework|javascript|python|rust|linux|internet|blockchain|crypto)\b/.test(t)) return "computer_science";
  if (/\b(history|ancient|medieval|renaissance|revolution|empire|war|civilization|dynasty|century|era|cultural|colonial|archaeological|historical)\b/.test(t)) return "history";
  if (/\b(philosophy|ethics|consciousness|metaphysics|epistemology|logic|existentialism|phenomenology|ontology|morality|justice|truth|reality|mind|free will)\b/.test(t)) return "philosophy";
  if (/\b(economics|market|finance|investment|gdp|inflation|trade|monetary|fiscal|supply|demand|capital|banking|crypto|stock|wealth|poverty|inequality)\b/.test(t)) return "economics";
  if (/\b(chemistry|molecule|reaction|compound|element|periodic|acid|base|polymer|organic|inorganic|catalyst|bond|valence|isotope|spectroscopy)\b/.test(t)) return "chemistry";
  if (/\b(psychology|behavior|cognition|emotion|therapy|mental|brain|personality|memory|perception|motivation|social|development|trauma|neuroscience)\b/.test(t)) return "psychology";
  if (/\b(astronomy|star|planet|galaxy|cosmos|universe|black hole|nebula|comet|asteroid|telescope|orbit|solar|lunar|exoplanet|dark energy|big bang)\b/.test(t)) return "astronomy";
  if (/\b(engineering|design|architecture|system|structure|circuit|mechanical|electrical|chemical|civil|aerospace|robotics|material|sensor|automation)\b/.test(t)) return "engineering";
  if (/\b(medicine|health|disease|treatment|drug|clinical|surgery|diagnosis|therapy|patient|hospital|vaccine|pharmaceutical|anatomy|pathology)\b/.test(t)) return "medicine";
  if (/\b(sociology|society|culture|community|institution|class|race|gender|identity|power|politics|government|democracy|policy|law|rights|freedom)\b/.test(t)) return "social_science";
  if (/\b(art|music|film|literature|poetry|creativity|aesthetic|culture|painting|sculpture|theater|dance|architecture|design|narrative|symbolism)\b/.test(t)) return "arts_culture";
  if (/\b(business|management|entrepreneur|startup|strategy|marketing|brand|leadership|organization|product|customer|growth|innovation|corporate)\b/.test(t)) return "business";
  if (/\b(environment|climate|ecology|sustainability|carbon|renewable|pollution|biodiversity|conservation|ocean|forest|atmosphere|greenhouse)\b/.test(t)) return "environment";
  if (/\b(language|linguistics|grammar|syntax|semantics|etymology|dialect|communication|writing|speech|translation|phonology|morphology)\b/.test(t)) return "linguistics";
  if (/\b(education|learning|teaching|school|university|curriculum|pedagogy|knowledge|skill|training|assessment|literacy|critical thinking)\b/.test(t)) return "education";
  return "general_knowledge";
}

// ─── Category Knowledge Maps ────────────────────────────────────
const CATEGORY_DATA: Record<string, { related: string[]; tools: string[]; figures: string[]; applications: string[]; subfields: string[] }> = {
  physics: {
    related: ["Quantum Field Theory", "String Theory", "General Relativity", "Statistical Mechanics", "Condensed Matter", "Particle Physics", "Plasma Physics", "Astrophysics", "Optics", "Thermodynamics"],
    tools: ["Large Hadron Collider", "Particle Detectors", "Spectrometers", "Interferometers", "Synchrotrons", "Quantum Computers"],
    figures: ["Albert Einstein", "Richard Feynman", "Niels Bohr", "Max Planck", "Werner Heisenberg", "Erwin Schrödinger", "Stephen Hawking", "Marie Curie"],
    applications: ["Nuclear energy", "Medical imaging", "GPS systems", "Semiconductors", "Lasers", "MRI machines", "Solar cells", "Quantum computing"],
    subfields: ["Theoretical physics", "Experimental physics", "Applied physics", "Computational physics", "Mathematical physics"],
  },
  biology: {
    related: ["Molecular Biology", "Cell Biology", "Genetics", "Evolutionary Biology", "Ecology", "Microbiology", "Biochemistry", "Neuroscience", "Developmental Biology", "Immunology"],
    tools: ["CRISPR-Cas9", "PCR Machine", "Electron Microscope", "Flow Cytometer", "DNA Sequencer", "Confocal Microscope"],
    figures: ["Charles Darwin", "Gregor Mendel", "James Watson", "Francis Crick", "Rosalind Franklin", "Louis Pasteur", "Carl Woese", "Lynn Margulis"],
    applications: ["Drug discovery", "Genetic therapy", "Agricultural biotech", "Environmental remediation", "Personalized medicine", "Synthetic biology"],
    subfields: ["Zoology", "Botany", "Marine biology", "Astrobiology", "Systems biology", "Structural biology"],
  },
  mathematics: {
    related: ["Number Theory", "Abstract Algebra", "Topology", "Analysis", "Combinatorics", "Probability Theory", "Differential Equations", "Linear Algebra", "Geometry", "Category Theory"],
    tools: ["Mathematica", "MATLAB", "Sage", "Coq Proof Assistant", "LaTeX", "Wolfram Alpha"],
    figures: ["Euler", "Gauss", "Riemann", "Fermat", "Hilbert", "Gödel", "Ramanujan", "Emmy Noether", "Alan Turing", "John von Neumann"],
    applications: ["Cryptography", "Data compression", "Financial modeling", "Physics simulations", "Computer graphics", "Machine learning"],
    subfields: ["Pure mathematics", "Applied mathematics", "Computational mathematics", "Statistics", "Mathematical logic"],
  },
  artificial_intelligence: {
    related: ["Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "Neural Networks", "Knowledge Representation", "Robotics", "Expert Systems", "Generative AI"],
    tools: ["PyTorch", "TensorFlow", "Hugging Face", "CUDA", "JAX", "OpenAI API", "LangChain", "Scikit-learn"],
    figures: ["Alan Turing", "John McCarthy", "Geoffrey Hinton", "Yann LeCun", "Yoshua Bengio", "Demis Hassabis", "Sam Altman", "Fei-Fei Li"],
    applications: ["Autonomous vehicles", "Medical diagnosis", "Language translation", "Content generation", "Financial trading", "Drug discovery", "Climate modeling"],
    subfields: ["Symbolic AI", "Connectionist AI", "Embodied AI", "AGI research", "AI safety", "Explainable AI"],
  },
  computer_science: {
    related: ["Algorithms", "Data Structures", "Distributed Systems", "Databases", "Networking", "Operating Systems", "Cryptography", "Compilers", "Computer Graphics", "Human-Computer Interaction"],
    tools: ["Git", "Docker", "Kubernetes", "PostgreSQL", "Redis", "React", "Node.js", "Rust", "Python", "Linux"],
    figures: ["Alan Turing", "John von Neumann", "Dennis Ritchie", "Linus Torvalds", "Donald Knuth", "Grace Hopper", "Tim Berners-Lee", "Vint Cerf"],
    applications: ["Cloud computing", "Mobile apps", "Cybersecurity", "IoT systems", "Blockchain", "Real-time systems", "Big data processing"],
    subfields: ["Software engineering", "Systems programming", "Database theory", "Computer architecture", "Bioinformatics", "Quantum computing"],
  },
  history: {
    related: ["Ancient History", "Medieval History", "Modern History", "Cultural History", "Political History", "Economic History", "Military History", "Social History", "Archaeology", "Historiography"],
    tools: ["Archaeological surveys", "Carbon dating", "Archival research", "Oral history methods", "GIS mapping", "Dendrochronology"],
    figures: ["Herodotus", "Thucydides", "Ibn Khaldun", "Edward Gibbon", "Fernand Braudel", "Howard Zinn", "Yuval Noah Harari"],
    applications: ["Policy analysis", "Cultural preservation", "Identity formation", "Education", "Conflict resolution", "Museum curation"],
    subfields: ["World history", "Comparative history", "Quantitative history", "Intellectual history", "Environmental history"],
  },
  philosophy: {
    related: ["Ethics", "Epistemology", "Metaphysics", "Logic", "Aesthetics", "Political Philosophy", "Philosophy of Mind", "Philosophy of Science", "Existentialism", "Phenomenology"],
    tools: ["Formal logic", "Thought experiments", "Dialectical method", "Linguistic analysis", "Phenomenological reduction"],
    figures: ["Plato", "Aristotle", "Kant", "Hegel", "Nietzsche", "Wittgenstein", "Heidegger", "Sartre", "Rawls", "Dennett"],
    applications: ["Ethical AI design", "Legal reasoning", "Policy frameworks", "Psychological therapy", "Scientific methodology", "Political theory"],
    subfields: ["Continental philosophy", "Analytic philosophy", "Eastern philosophy", "Applied ethics", "Bioethics", "Philosophy of language"],
  },
  economics: {
    related: ["Microeconomics", "Macroeconomics", "Behavioral Economics", "Development Economics", "International Trade", "Monetary Policy", "Game Theory", "Financial Economics", "Labor Economics", "Environmental Economics"],
    tools: ["Econometric modeling", "Regression analysis", "Input-output analysis", "Computable general equilibrium", "Agent-based modeling"],
    figures: ["Adam Smith", "John Maynard Keynes", "Milton Friedman", "Paul Krugman", "Amartya Sen", "Joseph Stiglitz", "Thomas Piketty"],
    applications: ["Central banking", "Investment strategy", "Trade policy", "Poverty reduction", "Climate economics", "Healthcare funding"],
    subfields: ["Industrial organization", "Public economics", "Information economics", "Experimental economics", "Political economy"],
  },
  chemistry: {
    related: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry", "Biochemistry", "Computational Chemistry", "Materials Science", "Electrochemistry", "Photochemistry", "Polymer Chemistry"],
    tools: ["Mass spectrometer", "NMR spectroscopy", "X-ray crystallography", "Gas chromatography", "HPLC", "Atomic force microscopy"],
    figures: ["Dmitri Mendeleev", "Marie Curie", "Linus Pauling", "Dorothy Hodgkin", "Ahmed Zewail", "John B. Goodenough"],
    applications: ["Drug synthesis", "Materials development", "Energy storage", "Food chemistry", "Environmental monitoring", "Forensics"],
    subfields: ["Green chemistry", "Supramolecular chemistry", "Astrochemistry", "Nuclear chemistry", "Surface chemistry"],
  },
  psychology: {
    related: ["Cognitive Psychology", "Behavioral Psychology", "Developmental Psychology", "Social Psychology", "Clinical Psychology", "Neuropsychology", "Personality Psychology", "Positive Psychology", "Psycholinguistics", "Health Psychology"],
    tools: ["fMRI scanning", "EEG", "Clinical assessment", "Standardized testing", "Experimental paradigms", "Longitudinal studies"],
    figures: ["Sigmund Freud", "Carl Jung", "B.F. Skinner", "Jean Piaget", "Abraham Maslow", "Daniel Kahneman", "Brené Brown", "Martin Seligman"],
    applications: ["Psychotherapy", "Education", "UX design", "Marketing", "Sports performance", "Organizational behavior"],
    subfields: ["Forensic psychology", "Industrial-organizational psychology", "Counseling psychology", "School psychology", "Environmental psychology"],
  },
  astronomy: {
    related: ["Cosmology", "Astrophysics", "Planetary Science", "Stellar Physics", "Galactic Astronomy", "Extragalactic Astronomy", "Radio Astronomy", "Space Science", "Observational Astronomy", "Theoretical Cosmology"],
    tools: ["Hubble Space Telescope", "James Webb Space Telescope", "Chandra X-ray Observatory", "Very Large Array", "ALMA", "Gravitational wave detectors"],
    figures: ["Galileo Galilei", "Edwin Hubble", "Carl Sagan", "Vera Rubin", "Neil deGrasse Tyson", "Kip Thorne", "Jill Tarter"],
    applications: ["Satellite technology", "Space exploration", "GPS systems", "Climate monitoring", "Communications", "Scientific discovery"],
    subfields: ["Astrochemistry", "Astrobiology", "Solar physics", "High-energy astrophysics", "Gravitational astronomy"],
  },
  engineering: {
    related: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering", "Aerospace Engineering", "Biomedical Engineering", "Software Engineering", "Materials Engineering", "Systems Engineering", "Environmental Engineering"],
    tools: ["CAD software", "FEA simulation", "MATLAB", "Oscilloscopes", "3D printing", "CNC machining", "Sensors and actuators"],
    figures: ["Nikola Tesla", "James Watt", "Isambard Kingdom Brunel", "Elon Musk", "Ada Lovelace", "Hedy Lamarr", "Shannon"],
    applications: ["Infrastructure", "Transportation", "Healthcare devices", "Renewable energy", "Space systems", "Manufacturing"],
    subfields: ["Control systems", "Robotics", "Nanotechnology", "Photonics", "Structural engineering"],
  },
  medicine: {
    related: ["Internal Medicine", "Surgery", "Neurology", "Oncology", "Cardiology", "Immunology", "Pharmacology", "Genetics", "Epidemiology", "Public Health"],
    tools: ["MRI", "CT scan", "Ultrasound", "PCR diagnostics", "Robotic surgery systems", "Biomarker assays", "EHR systems"],
    figures: ["Hippocrates", "Louis Pasteur", "Alexander Fleming", "Jonas Salk", "Elizabeth Blackwell", "William Osler", "Paul Ehrlich"],
    applications: ["Disease prevention", "Surgical intervention", "Drug development", "Mental health treatment", "Geriatric care", "Pediatrics"],
    subfields: ["Precision medicine", "Regenerative medicine", "Telemedicine", "Global health", "Medical ethics"],
  },
  social_science: {
    related: ["Sociology", "Anthropology", "Political Science", "Cultural Studies", "Gender Studies", "Criminology", "Urban Studies", "Communication", "Demography", "Human Geography"],
    tools: ["Survey methodology", "Ethnographic fieldwork", "Content analysis", "Statistical modeling", "GIS mapping", "Discourse analysis"],
    figures: ["Max Weber", "Émile Durkheim", "Michel Foucault", "Judith Butler", "Pierre Bourdieu", "bell hooks", "W.E.B. Du Bois"],
    applications: ["Policy design", "Community development", "NGO programs", "Media studies", "Urban planning", "Public health campaigns"],
    subfields: ["Comparative politics", "Social stratification", "Cultural sociology", "Political sociology", "Economic sociology"],
  },
  arts_culture: {
    related: ["Visual Arts", "Music", "Literature", "Film", "Theater", "Dance", "Architecture", "Photography", "Digital Art", "Cultural Heritage"],
    tools: ["Digital audio workstations", "3D modeling software", "Cinematography equipment", "Traditional media", "Generative AI tools"],
    figures: ["Leonardo da Vinci", "Shakespeare", "Beethoven", "Picasso", "Toni Morrison", "Martin Scorsese", "Maya Angelou"],
    applications: ["Cultural education", "Entertainment industry", "Therapeutic arts", "Tourism", "Urban identity", "Social commentary"],
    subfields: ["Art history", "Music theory", "Literary criticism", "Film studies", "Cultural anthropology"],
  },
  business: {
    related: ["Management", "Entrepreneurship", "Marketing", "Finance", "Operations", "Strategy", "Human Resources", "Supply Chain", "Business Analytics", "Innovation"],
    tools: ["ERP systems", "CRM platforms", "Business intelligence tools", "Agile frameworks", "OKR systems", "Financial modeling software"],
    figures: ["Peter Drucker", "Steve Jobs", "Warren Buffett", "Elon Musk", "Sheryl Sandberg", "Jeff Bezos", "Michael Porter"],
    applications: ["Startup creation", "Corporate strategy", "Market expansion", "Digital transformation", "ESG investing", "Brand building"],
    subfields: ["Corporate finance", "Organizational behavior", "Operations research", "Behavioral finance", "Social entrepreneurship"],
  },
  environment: {
    related: ["Climate Science", "Ecology", "Conservation Biology", "Environmental Policy", "Sustainability", "Renewable Energy", "Oceanography", "Atmospheric Science", "Environmental Economics", "Green Technology"],
    tools: ["Climate models", "Remote sensing", "LiDAR", "Carbon monitoring", "Environmental DNA sampling", "Satellite imagery"],
    figures: ["Rachel Carson", "David Attenborough", "Greta Thunberg", "James Lovelock", "Wangari Maathai", "Bill McKibben"],
    applications: ["Carbon capture", "Renewable energy policy", "Biodiversity conservation", "Sustainable agriculture", "Green building", "Ocean cleanup"],
    subfields: ["Environmental justice", "Agroecology", "Industrial ecology", "Urban ecology", "Glaciology"],
  },
  linguistics: {
    related: ["Phonology", "Morphology", "Syntax", "Semantics", "Pragmatics", "Sociolinguistics", "Psycholinguistics", "Historical Linguistics", "Computational Linguistics", "Neurolinguistics"],
    tools: ["Corpus analysis software", "Language documentation tools", "Speech analysis programs", "Translation systems", "Lexicography databases"],
    figures: ["Noam Chomsky", "Ferdinand de Saussure", "Sapir", "Whorf", "William Labov", "Steven Pinker", "George Lakoff"],
    applications: ["Machine translation", "Speech recognition", "Language preservation", "Education", "NLP systems", "Forensic linguistics"],
    subfields: ["Applied linguistics", "Cognitive linguistics", "Discourse analysis", "Sign language studies", "Language acquisition"],
  },
  education: {
    related: ["Pedagogy", "Curriculum Design", "Educational Psychology", "Learning Theory", "Assessment", "Special Education", "Higher Education", "EdTech", "Lifelong Learning", "Vocational Training"],
    tools: ["Learning management systems", "Adaptive learning platforms", "Educational games", "Assessment tools", "Virtual classrooms"],
    figures: ["John Dewey", "Paulo Freire", "Maria Montessori", "Lev Vygotsky", "Jean Piaget", "Howard Gardner", "Ken Robinson"],
    applications: ["School reform", "Online learning", "STEM education", "Inclusive education", "Corporate training", "Early childhood development"],
    subfields: ["Comparative education", "Philosophy of education", "Educational neuroscience", "Distance learning", "Instructional design"],
  },
  general_knowledge: {
    related: ["Systems Thinking", "Complex Systems", "Information Theory", "Cybernetics", "Interdisciplinary Studies", "Critical Thinking", "Knowledge Management", "Research Methods", "Innovation Studies", "Futures Studies"],
    tools: ["Research databases", "Knowledge graphs", "Mind mapping tools", "Simulation software", "Data visualization tools"],
    figures: ["Buckminster Fuller", "Norbert Wiener", "Gregory Bateson", "Edgar Morin", "Nassim Taleb", "Richard Feynman"],
    applications: ["Decision making", "Strategic planning", "Scientific research", "Education", "Policy design", "Innovation"],
    subfields: ["Cross-disciplinary research", "Meta-learning", "Science of science", "Knowledge organization"],
  },
};

// ─── Template Generator ─────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function generateQuantapediaEntry(title: string): any {
  const category = categorize(title);
  const data = CATEGORY_DATA[category] || CATEGORY_DATA.general_knowledge;
  const slug = toSlug(title);

  const complexity = pick(["Beginner", "Intermediate", "Advanced", "Expert"]);
  const typeMap: Record<string, string> = {
    physics: "scientific principle", biology: "life science concept", mathematics: "mathematical structure",
    artificial_intelligence: "AI/ML concept", computer_science: "computing concept", history: "historical subject",
    philosophy: "philosophical concept", economics: "economic concept", chemistry: "chemical concept",
    psychology: "psychological concept", astronomy: "astronomical phenomenon", engineering: "engineering discipline",
    medicine: "medical concept", social_science: "social phenomenon", arts_culture: "cultural concept",
    business: "business concept", environment: "environmental concept", linguistics: "linguistic concept",
    education: "educational concept", general_knowledge: "interdisciplinary concept",
  };
  const entryType = typeMap[category] || "concept";

  const figureA = pick(data.figures);
  const figureB = pick(data.figures.filter(f => f !== figureA));
  const appA = pick(data.applications);
  const appB = pick(data.applications.filter(a => a !== appA));
  const subfield = pick(data.subfields);

  const summaries = [
    `${title} is a foundational ${entryType} that shapes our understanding of ${category.replace(/_/g, " ")}. Pioneered by thinkers like ${figureA} and ${figureB}, it has become essential to modern scientific and technological progress.`,
    `A core concept in ${category.replace(/_/g, " ")}, ${title} bridges theoretical insight and practical application. Its study reveals deep patterns about how the world operates, with direct relevance to fields ranging from ${appA} to ${appB}.`,
    `${title} represents one of the most important developments in ${category.replace(/_/g, " ")}, offering a framework that connects abstract principles to real-world outcomes. Researchers from ${figureA} onward have expanded its boundaries significantly.`,
    `The study of ${title} opens windows into the nature of reality, knowledge, and human capability. Rooted in ${category.replace(/_/g, " ")}, it informs critical advancements in ${appA} and ${appB} worldwide.`,
  ];

  const overview = [
    `${title} encompasses the study of phenomena and principles central to ${category.replace(/_/g, " ")}. Its foundational ideas were developed through centuries of inquiry, with major contributions from ${figureA} and ${figureB}.`,
    `At its core, ${title} provides a systematic framework for understanding complex relationships within ${category.replace(/_/g, " ")}. The discipline integrates empirical observation, theoretical modeling, and practical application.`,
    `The concept of ${title} emerged as scholars and scientists sought to explain patterns and mechanisms underlying ${category.replace(/_/g, " ")}. Today it forms a cornerstone of academic and applied research globally.`,
  ];

  const history = [
    `The history of ${title} spans millennia of human curiosity and systematic investigation. Early foundations were laid through observation and reasoning, with formalization occurring primarily during the scientific revolutions of the 16th–20th centuries.`,
    `${title} has evolved through several distinct periods: early conceptual development, mathematical formalization, experimental verification, and modern computational exploration. Key milestones include contributions from ${figureA} and subsequent generations of researchers.`,
    `From ancient philosophical speculation to modern experimental science, ${title} has grown into a mature field. The 20th century saw particularly rapid development, as new tools and theoretical frameworks emerged to address increasingly complex questions.`,
  ];

  const applications = [
    `${title} finds practical application across numerous domains. In technology, it enables advances in ${appA}. In industry, its principles guide approaches to ${appB}. Emerging applications include cross-disciplinary work in ${subfield}, demonstrating its enduring versatility.`,
    `The practical applications of ${title} extend across science, industry, and society. Technologies based on its principles power innovations in ${appA}, while informing policy and practice in areas like ${appB} and beyond.`,
    `Modern applications of ${title} range from foundational research to direct technological deployment. Key use cases include ${appA}, ${appB}, and new frontiers in ${subfield} where interdisciplinary approaches are yielding breakthrough results.`,
  ];

  const future = [
    `The future of ${title} lies at the intersection of computational power, interdisciplinary collaboration, and emerging experimental techniques. Researchers anticipate breakthroughs in ${appA} driven by innovations in ${subfield}.`,
    `Advances in ${subfield} and related fields will continue to expand what is possible through ${title}. The coming decade promises new discoveries that challenge current paradigms and open entirely new research directions.`,
    `As computational tools grow more powerful and datasets become richer, ${title} will evolve rapidly. The integration of AI-driven analysis with traditional methodologies points toward an era of accelerated discovery and broader application.`,
  ];

  const relatedTerms = pickN([
    ...data.related,
    ...data.subfields,
    titleFromSlug(slug + "-theory"),
    titleFromSlug(slug + "-applications"),
    titleFromSlug(slug + "-history"),
    titleFromSlug("advanced-" + slug),
    titleFromSlug(slug + "-research"),
  ], 10);

  const seeAlso = pickN([
    ...data.related.filter(r => !relatedTerms.includes(r)),
    ...data.applications,
    ...data.subfields.filter(s => !relatedTerms.includes(s)),
  ], 8);

  const categories = [
    category.replace(/_/g, " "),
    subfield,
    `${category.replace(/_/g, " ")} fundamentals`,
    "Knowledge",
    "Research",
  ].slice(0, 4);

  return {
    title,
    slug,
    type: entryType,
    summary: pick(summaries),
    sections: [
      { heading: "Overview", content: pick(overview) },
      { heading: "Historical Development", content: pick(history) },
      { heading: "Core Principles", content: `The fundamental principles of ${title} involve understanding how ${category.replace(/_/g, " ")} processes interact. Key tools include ${pickN(data.tools, 3).join(", ")}, which researchers use to probe, measure, and model the phenomena involved.` },
      { heading: "Applications & Impact", content: pick(applications) },
      { heading: "Future Directions", content: pick(future) },
    ],
    relatedTerms,
    seeAlso,
    synonyms: [titleFromSlug(slug), `${title} theory`, `${title} science`, `${title} studies`].slice(0, 3),
    antonyms: [],
    categories,
    quickFacts: [
      { label: "Domain", value: category.replace(/_/g, " ") },
      { label: "Complexity", value: complexity },
      { label: "Key Figure", value: figureA },
      { label: "Primary Application", value: appA },
      { label: "Related Subfield", value: subfield },
    ],
  };
}

// ─── Topic Discovery ─────────────────────────────────────────────
function extractDiscoveredTopics(entry: any): { slug: string; title: string }[] {
  const candidates: string[] = [
    ...(entry.relatedTerms || []),
    ...(entry.seeAlso || []),
    ...(entry.synonyms || []).slice(0, 3),
    ...(entry.categories || []),
  ];
  const seen = new Set<string>();
  return candidates
    .filter((t) => t && typeof t === "string" && t.length > 2 && t.length < 80)
    .map((t) => ({ slug: toSlug(t), title: t.trim() }))
    .filter((t) => {
      if (t.slug.length <= 2 || seen.has(t.slug)) return false;
      seen.add(t.slug);
      return true;
    });
}

const SEED_TOPICS: { slug: string; title: string }[] = [
  { slug: "universe", title: "Universe" }, { slug: "information", title: "Information" },
  { slug: "mathematics", title: "Mathematics" }, { slug: "physics", title: "Physics" },
  { slug: "biology", title: "Biology" }, { slug: "computer-science", title: "Computer Science" },
  { slug: "philosophy", title: "Philosophy" }, { slug: "chemistry", title: "Chemistry" },
  { slug: "history", title: "History" }, { slug: "language", title: "Language" },
  { slug: "consciousness", title: "Consciousness" }, { slug: "artificial-intelligence", title: "Artificial Intelligence" },
  { slug: "quantum-mechanics", title: "Quantum Mechanics" }, { slug: "evolution", title: "Evolution" },
  { slug: "democracy", title: "Democracy" }, { slug: "economics", title: "Economics" },
  { slug: "psychology", title: "Psychology" }, { slug: "sociology", title: "Sociology" },
  { slug: "astronomy", title: "Astronomy" }, { slug: "neuroscience", title: "Neuroscience" },
  { slug: "genetics", title: "Genetics" }, { slug: "ecology", title: "Ecology" },
  { slug: "calculus", title: "Calculus" }, { slug: "thermodynamics", title: "Thermodynamics" },
  { slug: "relativity", title: "Relativity" }, { slug: "electromagnetism", title: "Electromagnetism" },
  { slug: "machine-learning", title: "Machine Learning" }, { slug: "dna", title: "DNA" },
  { slug: "gravity", title: "Gravity" }, { slug: "photosynthesis", title: "Photosynthesis" },
  { slug: "civilization", title: "Civilization" }, { slug: "ethics", title: "Ethics" },
  { slug: "logic", title: "Logic" }, { slug: "entropy", title: "Entropy" },
  { slug: "energy", title: "Energy" }, { slug: "time", title: "Time" },
  { slug: "space", title: "Space" }, { slug: "matter", title: "Matter" },
  { slug: "intelligence", title: "Intelligence" }, { slug: "knowledge", title: "Knowledge" },
  { slug: "freedom", title: "Freedom" }, { slug: "justice", title: "Justice" },
  { slug: "creativity", title: "Creativity" }, { slug: "language", title: "Language" },
  { slug: "music", title: "Music" }, { slug: "art", title: "Art" },
  { slug: "religion", title: "Religion" }, { slug: "mythology", title: "Mythology" },
  { slug: "technology", title: "Technology" }, { slug: "innovation", title: "Innovation" },
  { slug: "blockchain", title: "Blockchain" }, { slug: "cybersecurity", title: "Cybersecurity" },
  { slug: "robotics", title: "Robotics" }, { slug: "nanotechnology", title: "Nanotechnology" },
  { slug: "climate-change", title: "Climate Change" }, { slug: "renewable-energy", title: "Renewable Energy" },
  { slug: "democracy", title: "Democracy" }, { slug: "capitalism", title: "Capitalism" },
  { slug: "globalization", title: "Globalization" }, { slug: "urbanization", title: "Urbanization" },
  { slug: "sociology", title: "Sociology" }, { slug: "anthropology", title: "Anthropology" },
  { slug: "cognition", title: "Cognition" }, { slug: "memory", title: "Memory" },
  { slug: "perception", title: "Perception" }, { slug: "emotion", title: "Emotion" },
  { slug: "morality", title: "Morality" }, { slug: "truth", title: "Truth" },
  { slug: "reality", title: "Reality" }, { slug: "complexity", title: "Complexity" },
  { slug: "emergence", title: "Emergence" }, { slug: "chaos-theory", title: "Chaos Theory" },
  { slug: "game-theory", title: "Game Theory" }, { slug: "information-theory", title: "Information Theory" },
  { slug: "graph-theory", title: "Graph Theory" }, { slug: "topology", title: "Topology" },
  { slug: "number-theory", title: "Number Theory" }, { slug: "set-theory", title: "Set Theory" },
  { slug: "abstract-algebra", title: "Abstract Algebra" }, { slug: "statistics", title: "Statistics" },
  { slug: "data-science", title: "Data Science" }, { slug: "natural-language-processing", title: "Natural Language Processing" },
  { slug: "computer-vision", title: "Computer Vision" }, { slug: "reinforcement-learning", title: "Reinforcement Learning" },
  { slug: "neural-networks", title: "Neural Networks" }, { slug: "large-language-models", title: "Large Language Models" },
  { slug: "quantum-computing", title: "Quantum Computing" }, { slug: "space-exploration", title: "Space Exploration" },
  { slug: "black-holes", title: "Black Holes" }, { slug: "dark-matter", title: "Dark Matter" },
  { slug: "string-theory", title: "String Theory" }, { slug: "immunology", title: "Immunology" },
  { slug: "pharmacology", title: "Pharmacology" }, { slug: "oncology", title: "Oncology" },
  { slug: "neurology", title: "Neurology" }, { slug: "genetics", title: "Genetics" },
  { slug: "epigenetics", title: "Epigenetics" }, { slug: "synthetic-biology", title: "Synthetic Biology" },
  { slug: "crispr", title: "CRISPR" }, { slug: "stem-cells", title: "Stem Cells" },
];

// ─── Engine State ────────────────────────────────────────────────
let engineRunning = false;
let totalGenerated = 0;
let engineStartTime: Date | null = null;

export function getEngineStatus() {
  return {
    running: engineRunning,
    totalGenerated,
    startTime: engineStartTime?.toISOString() || null,
    uptime: engineStartTime ? Math.floor((Date.now() - engineStartTime.getTime()) / 1000) : 0,
  };
}

// ─── Parallel Batch Generation — ZERO API CALLS ──────────────────
const BATCH_SIZE = 25;
const INTERVAL_MS = 300;

export async function startQuantapediaEngine() {
  if (engineRunning) return;
  engineRunning = true;
  engineStartTime = new Date();

  log("[QuantapediaEngine] 🧠 ULTRA KNOWLEDGE ENGINE — TEMPLATE MODE — ZERO RATE LIMITS", "quantapedia");
  log(`[QuantapediaEngine] ⚡ Processing ${BATCH_SIZE} entries per tick every ${INTERVAL_MS}ms`, "quantapedia");

  try {
    await storage.queueQuantapediaTopics(SEED_TOPICS);
    log(`[QuantapediaEngine] Seeded ${SEED_TOPICS.length} foundation topics`, "quantapedia");
  } catch (e) {
    log(`[QuantapediaEngine] Seed error: ${e}`, "quantapedia");
  }

  const tick = async () => {
    if (!engineRunning) return;
    try {
      const stats = await storage.getQuantapediaStats();
      const batch = await storage.getUngeneratedQuantapediaTopics(BATCH_SIZE);

      if (!batch.length) {
        setTimeout(tick, 5000);
        return;
      }

      let batchGenerated = 0;
      let totalNewSeeds = 0;

      for (const item of batch) {
        try {
          const entry = generateQuantapediaEntry(item.title);
          if (entry) {
            const discovered = extractDiscoveredTopics(entry);
            await storage.storeFullQuantapediaEntry(
              item.slug, entry.title || item.title,
              entry.type || "concept", entry.summary || "",
              entry.categories || [], entry.relatedTerms || [], entry
            );
            onEntryGenerated(item.slug, entry.title || item.title, entry).catch(() => {});
            if (discovered.length) {
              await storage.queueQuantapediaTopics(discovered);
              totalNewSeeds += discovered.length;
            }
            batchGenerated++;
            totalGenerated++;
          }
        } catch (e) {
          // skip failed entry silently
        }
      }

      if (batchGenerated > 0) {
        const freshStats = await storage.getQuantapediaStats();
        log(
          `[QuantapediaEngine] ✓ +${batchGenerated} entries | Total: ${freshStats.generated}/${freshStats.total} | +${totalNewSeeds} new topics queued`,
          "quantapedia"
        );
      }
    } catch (err) {
      log(`[QuantapediaEngine] Tick error: ${err}`, "quantapedia");
    }
    setTimeout(tick, INTERVAL_MS);
  };

  setTimeout(tick, 500);
}

export function stopQuantapediaEngine() {
  engineRunning = false;
  log("[QuantapediaEngine] 🛑 Stopped", "quantapedia");
}
