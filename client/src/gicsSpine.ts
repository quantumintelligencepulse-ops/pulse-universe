export interface GicsChild {
  key: string;
  label: string;
  search: string;
  children?: GicsChild[];
}

export interface GicsEntry {
  key: string;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  search: string;
  children: GicsChild[];
}

export const OMEGA_SPINE: GicsEntry[] = [

  // ═══════════════════════════════════════════════════
  // NON-GICS CORE DOMAINS (always first)
  // ═══════════════════════════════════════════════════
  {
    key: "top-stories", label: "Top Stories", emoji: "🔥", color: "#f97316",
    gradient: "from-orange-500 to-red-500", search: "breaking news top stories world",
    children: [],
  },
  {
    key: "ai-technology", label: "AI & Technology", emoji: "🤖", color: "#6366f1",
    gradient: "from-indigo-500 to-purple-600", search: "artificial intelligence technology innovation",
    children: [
      { key: "ai-ml", label: "AI & Machine Learning", search: "artificial intelligence machine learning neural networks deep learning" },
      { key: "computing", label: "Computing & Software", search: "computing software cloud infrastructure" },
      { key: "cybersecurity", label: "Cybersecurity", search: "cybersecurity hacking data breach ransomware" },
      { key: "future-tech", label: "Future Tech", search: "future technology robotics quantum metaverse" },
      { key: "ai-agents", label: "AI Agents", search: "AI agents autonomous systems LLM GPT" },
      { key: "semiconductors-tech", label: "Chips & Semiconductors", search: "semiconductor chips nvidia intel TSMC fab" },
    ],
  },
  {
    key: "sports", label: "Sports", emoji: "🏆", color: "#eab308",
    gradient: "from-yellow-500 to-orange-500", search: "sports news athletics",
    children: [
      { key: "team-sports", label: "Team Sports", search: "NFL NBA MLB soccer football basketball" },
      { key: "individual-sports", label: "Individual Sports", search: "tennis golf track swimming boxing" },
      { key: "motorsports", label: "Motorsports", search: "Formula 1 NASCAR MotoGP motorsports" },
      { key: "esports", label: "Esports & Gaming", search: "esports gaming tournaments competitive" },
      { key: "sports-betting", label: "Sports Betting", search: "sports betting odds lines wagering" },
      { key: "sports-media", label: "Sports Media", search: "sports media broadcasting ESPN rights deals" },
    ],
  },
  {
    key: "politics-world", label: "Politics & World", emoji: "🌍", color: "#64748b",
    gradient: "from-slate-500 to-gray-600", search: "politics world news government",
    children: [
      { key: "us-politics", label: "US Politics", search: "US politics congress senate president White House" },
      { key: "global-politics", label: "Global Politics", search: "global politics international relations diplomacy" },
      { key: "elections", label: "Elections", search: "elections voting democracy campaigns" },
      { key: "military", label: "Military & Defense", search: "military defense war geopolitics NATO" },
      { key: "policy", label: "Policy & Law", search: "policy law legislation regulation government" },
    ],
  },
  {
    key: "science-space", label: "Science & Space", emoji: "🔬", color: "#3b82f6",
    gradient: "from-blue-500 to-cyan-600", search: "science research discovery space",
    children: [
      { key: "physics", label: "Physics", search: "physics quantum particles energy relativity" },
      { key: "space", label: "Space & Astronomy", search: "space NASA SpaceX astronomy planets universe" },
      { key: "biology", label: "Biology & Life Sciences", search: "biology genetics evolution cells organisms" },
      { key: "climate", label: "Climate & Environment", search: "climate change environment carbon emissions" },
      { key: "ocean", label: "Oceanography", search: "ocean marine science deep sea" },
      { key: "mathematics", label: "Mathematics", search: "mathematics theorem calculus statistics" },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 1: ENERGY
  // ═══════════════════════════════════════════════════
  {
    key: "energy", label: "Energy", emoji: "⚡", color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
    search: "energy oil gas petroleum renewable power electricity",
    children: [
      {
        key: "oil-gas-drilling", label: "Oil & Gas Drilling", search: "oil drilling gas drilling offshore deepwater rig wellbore",
        children: [
          { key: "offshore-deepwater", label: "Offshore Deepwater Drilling", search: "deepwater offshore drilling rig subsea wellhead" },
          { key: "onshore-shale", label: "Onshore Shale Drilling", search: "shale drilling horizontal directional Permian Bakken" },
          { key: "arctic-drilling", label: "Arctic Drilling", search: "arctic drilling ice-capable drill ship polar" },
          { key: "directional-drilling", label: "Directional Drilling", search: "directional drilling MWD steerable drilling" },
        ],
      },
      {
        key: "energy-equipment-services", label: "Energy Equipment & Services", search: "oilfield services energy equipment pressure pumping wireline",
        children: [
          { key: "well-completion", label: "Well Completion Services", search: "hydraulic fracturing fracking well completion" },
          { key: "subsea-equipment", label: "Subsea Equipment", search: "subsea equipment connector manifold BOP blowout" },
          { key: "pipeline-inspection", label: "Pipeline Inspection", search: "pipeline inspection PIG pigging integrity" },
        ],
      },
      {
        key: "integrated-oil-gas", label: "Integrated Oil & Gas", search: "integrated oil gas ExxonMobil Chevron Shell BP TotalEnergies major oil",
        children: [
          { key: "supermajors", label: "Oil Supermajors", search: "ExxonMobil Chevron Shell BP TotalEnergies ConocoPhillips major oil company" },
          { key: "national-oil-cos", label: "National Oil Companies", search: "Saudi Aramco NOC national oil company ADNOC Petrobras" },
          { key: "lng-majors", label: "LNG Operations", search: "LNG liquefied natural gas FLNG export terminal" },
        ],
      },
      {
        key: "oil-gas-ep", label: "Exploration & Production", search: "oil gas exploration production upstream E&P shale reserves",
        children: [
          { key: "shale-ep", label: "Shale E&P", search: "shale oil gas exploration Permian Eagle Ford Marcellus" },
          { key: "offshore-ep", label: "Offshore E&P", search: "offshore oil gas exploration production North Sea Gulf" },
          { key: "natural-gas-ep", label: "Natural Gas E&P", search: "natural gas production exploration coalbed methane" },
        ],
      },
      {
        key: "oil-refining", label: "Refining & Marketing", search: "oil refining refinery gasoline diesel downstream marketing",
        children: [
          { key: "complex-refining", label: "Complex Refining", search: "complex refinery coker hydrocracker heavy crude processing" },
          { key: "biofuel-blending", label: "Biofuel Blending", search: "biofuel ethanol biodiesel renewable fuel blending RFS" },
          { key: "retail-fuel", label: "Retail Fuel Marketing", search: "petrol station fuel retail forecourt gas station" },
        ],
      },
      {
        key: "oil-storage-transport", label: "Oil & Gas Storage & Transport", search: "pipeline midstream LNG tanker crude oil storage transportation",
        children: [
          { key: "pipeline-midstream", label: "Pipeline Midstream", search: "natural gas pipeline gathering midstream processing" },
          { key: "lng-terminals", label: "LNG Terminals", search: "LNG import export terminal floating FSRU" },
          { key: "crude-tankers", label: "Crude Oil Tankers", search: "crude oil VLCC tanker shipping maritime" },
        ],
      },
      {
        key: "coal-fuels", label: "Coal & Consumable Fuels", search: "coal mining thermal coking coal power fuel",
        children: [
          { key: "thermal-coal", label: "Thermal Coal", search: "thermal coal power plant electricity generation seaborne" },
          { key: "metallurgical-coal", label: "Metallurgical Coal", search: "coking coal steel making metallurgical coal" },
          { key: "biomass", label: "Biomass Fuel", search: "biomass pellet wood fuel bioenergy cofiring" },
        ],
      },
      {
        key: "renewable-energy", label: "Renewable Energy", search: "solar wind renewable energy green power clean energy",
        children: [
          { key: "solar-utility", label: "Utility-Scale Solar", search: "utility solar PV farm power purchase agreement" },
          { key: "onshore-wind", label: "Onshore Wind", search: "onshore wind turbine farm power generation" },
          { key: "offshore-wind", label: "Offshore Wind", search: "offshore wind turbine floating fixed-bottom installation" },
          { key: "hydro", label: "Hydropower", search: "hydroelectric dam hydro power plant" },
          { key: "battery-storage", label: "Battery Storage", search: "grid battery storage BESS lithium-ion energy storage" },
          { key: "green-hydrogen", label: "Green Hydrogen", search: "green hydrogen electrolysis fuel cell electrolyzer" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 2: MATERIALS
  // ═══════════════════════════════════════════════════
  {
    key: "materials", label: "Materials", emoji: "⚗️", color: "#6b7280",
    gradient: "from-gray-500 to-slate-600",
    search: "materials chemicals metals mining commodities",
    children: [
      {
        key: "commodity-chemicals", label: "Commodity Chemicals", search: "commodity chemicals ethylene polyethylene ammonia methanol chlor-alkali",
        children: [
          { key: "ethylene-pe", label: "Ethylene & Polyethylene", search: "ethylene polyethylene cracker olefin petrochemical" },
          { key: "ammonia-fertilizer", label: "Ammonia Production", search: "ammonia synthesis Haber-Bosch fertilizer production" },
          { key: "methanol", label: "Methanol & Derivatives", search: "methanol production formaldehyde acetic acid downstream" },
        ],
      },
      {
        key: "specialty-chemicals", label: "Specialty Chemicals", search: "specialty chemicals electronic coatings water treatment food additives",
        children: [
          { key: "electronic-chemicals", label: "Electronic Chemicals", search: "photoresist semiconductor chemical CMP slurry electronic" },
          { key: "coatings-paints", label: "Coatings & Paints", search: "industrial coating automotive paint architectural finishes" },
          { key: "water-treatment-chem", label: "Water Treatment Chemicals", search: "water treatment coagulant antiscalant membrane chemicals" },
          { key: "personal-care-actives", label: "Personal Care Actives", search: "cosmetic active ingredient retinol hyaluronic acid sunscreen" },
        ],
      },
      {
        key: "fertilizers-agri-chem", label: "Fertilizers & Agricultural Chemicals", search: "fertilizers nitrogen phosphate potash crop protection herbicide",
        children: [
          { key: "nitrogen-fertilizer", label: "Nitrogen Fertilizers", search: "urea ammonium nitrate nitrogen fertilizer crop" },
          { key: "phosphate-fertilizer", label: "Phosphate Fertilizers", search: "DAP MAP phosphate fertilizer rock phosphate" },
          { key: "potash", label: "Potash & Potassium", search: "potash potassium chloride mine Saskatchewan Mosaic" },
          { key: "crop-protection", label: "Crop Protection Chemicals", search: "herbicide pesticide insecticide fungicide agrochemical" },
        ],
      },
      {
        key: "industrial-gases", label: "Industrial Gases", search: "industrial gases oxygen nitrogen argon helium air separation",
        children: [
          { key: "bulk-gases", label: "Bulk Industrial Gases", search: "oxygen nitrogen air separation unit ASU bulk gas" },
          { key: "specialty-gases", label: "Specialty Gases", search: "specialty gas semiconductor grade rare gas electronic" },
          { key: "medical-gases", label: "Medical Gases", search: "medical oxygen hospital gas cylinder cryogenic" },
        ],
      },
      {
        key: "metals-mining", label: "Metals & Mining", search: "metals mining gold silver copper iron ore steel aluminum",
        children: [
          { key: "gold-mining", label: "Gold Mining", search: "gold mining mine production bullion reserves streaming" },
          { key: "copper-mining", label: "Copper Mining", search: "copper mining smelting refinery cathode concentrate" },
          { key: "iron-steel", label: "Iron Ore & Steel", search: "iron ore steel blast furnace EAF flat rolled" },
          { key: "aluminum", label: "Aluminum Production", search: "bauxite alumina aluminum smelting rolling extrusion" },
          { key: "precious-metals", label: "Precious Metals", search: "silver platinum palladium rhodium precious metals" },
          { key: "lithium-cobalt", label: "Lithium & Battery Metals", search: "lithium cobalt nickel manganese battery supply chain" },
          { key: "rare-earth", label: "Rare Earth Minerals", search: "rare earth neodymium dysprosium REE mining" },
        ],
      },
      {
        key: "containers-packaging", label: "Containers & Packaging", search: "packaging containers aluminum cans plastic bottles corrugated",
        children: [
          { key: "corrugated", label: "Corrugated & Paper Packaging", search: "corrugated box containerboard paper packaging converting" },
          { key: "flexible-packaging", label: "Flexible Packaging", search: "flexible film barrier multilayer packaging food pouches" },
          { key: "metal-glass-containers", label: "Metal & Glass Containers", search: "aluminum can steel can glass bottle jar aerosol" },
        ],
      },
      {
        key: "construction-materials", label: "Construction Materials", search: "cement concrete aggregate asphalt building materials",
        children: [
          { key: "cement-concrete", label: "Cement & Concrete", search: "cement clinker concrete ready-mix building construction" },
          { key: "aggregates", label: "Aggregates & Quarrying", search: "aggregates crushed stone sand gravel quarry" },
          { key: "asphalt", label: "Asphalt & Bitumen", search: "asphalt bitumen hot mix road paving" },
        ],
      },
      {
        key: "paper-forest", label: "Paper & Forest Products", search: "paper pulp timber lumber forest products",
        children: [
          { key: "pulp-paper", label: "Pulp & Paper", search: "wood pulp paper mill kraft newsprint tissue" },
          { key: "lumber-timber", label: "Lumber & Timber", search: "lumber timber saw mill wood products framing" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 3: INDUSTRIALS
  // ═══════════════════════════════════════════════════
  {
    key: "industrials", label: "Industrials", emoji: "🏭", color: "#78716c",
    gradient: "from-stone-500 to-gray-600",
    search: "industrials manufacturing aerospace defense machinery logistics",
    children: [
      {
        key: "aerospace-defense", label: "Aerospace & Defense", search: "aerospace defense aircraft military fighter jet missile satellite",
        children: [
          { key: "commercial-aircraft", label: "Commercial Aircraft", search: "commercial aircraft Boeing Airbus narrow wide body jets" },
          { key: "military-defense", label: "Military & Defense Systems", search: "military fighter jet defense systems weapons avionics" },
          { key: "satellites-space", label: "Satellites & Space Systems", search: "satellite constellation LEO space systems launch vehicle" },
          { key: "defense-electronics", label: "Defense Electronics", search: "radar electronic warfare defense electronics signals" },
          { key: "missiles-munitions", label: "Missiles & Munitions", search: "missile munitions precision guided weapons systems" },
          { key: "mro-aviation", label: "MRO & Aviation Services", search: "aircraft maintenance repair overhaul MRO aviation" },
        ],
      },
      {
        key: "building-products", label: "Building Products", search: "building products HVAC windows doors roofing insulation",
        children: [
          { key: "hvac", label: "HVAC Systems", search: "HVAC heating cooling ventilation chiller heat pump" },
          { key: "windows-doors", label: "Windows & Doors", search: "windows doors energy rated insulated glazing fenestration" },
          { key: "roofing", label: "Roofing Materials", search: "roofing shingles membrane TPO metal roof" },
          { key: "insulation", label: "Insulation Products", search: "insulation fiberglass spray foam thermal building envelope" },
        ],
      },
      {
        key: "construction-engineering", label: "Construction & Engineering", search: "construction engineering EPC infrastructure civil bridge",
        children: [
          { key: "infrastructure-epc", label: "Infrastructure EPC", search: "infrastructure engineering procurement construction bridge highway tunnel" },
          { key: "commercial-construction", label: "Commercial Construction", search: "commercial construction office tower general contractor" },
          { key: "industrial-plant", label: "Industrial Plant Construction", search: "industrial plant refinery greenfield construction EPC" },
          { key: "homebuilding", label: "Residential Homebuilding", search: "homebuilder residential construction new homes housing" },
        ],
      },
      {
        key: "electrical-equipment", label: "Electrical Equipment", search: "electrical equipment transformers motors switchgear power",
        children: [
          { key: "power-transformers", label: "Power Transformers", search: "power transformer grid substation high voltage" },
          { key: "electric-motors", label: "Electric Motors", search: "electric motor drive efficiency industrial" },
          { key: "switchgear", label: "Switchgear & Panels", search: "switchgear circuit breaker panel board industrial" },
          { key: "gas-turbines", label: "Gas & Steam Turbines", search: "gas turbine CCGT steam turbine power generation" },
          { key: "wind-turbines-mfg", label: "Wind Turbine Manufacturing", search: "wind turbine nacelle blade tower manufacturer" },
        ],
      },
      {
        key: "industrial-machinery", label: "Industrial Machinery", search: "industrial machinery CNC pumps valves compressors conveyor",
        children: [
          { key: "cnc-machine-tools", label: "CNC Machine Tools", search: "CNC machining center lathe milling cutting tools" },
          { key: "pumps-valves", label: "Pumps & Valves", search: "centrifugal pump valve flow control industrial" },
          { key: "compressors", label: "Compressors", search: "compressor reciprocating centrifugal gas air industrial" },
          { key: "conveyor-systems", label: "Conveyor & Automation", search: "conveyor automation sortation industrial robotics" },
          { key: "packaging-machinery", label: "Packaging Machinery", search: "packaging machine form fill seal wrapping bottling" },
        ],
      },
      {
        key: "agricultural-machinery", label: "Agricultural Machinery", search: "farm equipment tractor combine harvester precision agriculture",
        children: [
          { key: "tractors", label: "Tractors", search: "tractor John Deere CNH AGCO farm row crop" },
          { key: "combine-harvesters", label: "Combine Harvesters", search: "combine harvester grain wheat corn soybean" },
          { key: "precision-agri", label: "Precision Agriculture", search: "precision agriculture GPS drone variable rate seeding" },
          { key: "irrigation", label: "Irrigation Equipment", search: "irrigation center pivot drip sprinkler water management" },
        ],
      },
      {
        key: "commercial-services", label: "Commercial & Professional Services", search: "consulting staffing outsourcing professional services commercial",
        children: [
          { key: "strategy-consulting", label: "Strategy Consulting", search: "strategy consulting McKinsey BCG Bain Deloitte" },
          { key: "it-consulting", label: "IT Consulting", search: "IT consulting ERP SAP implementation technology" },
          { key: "staffing-hr", label: "Staffing & HR Services", search: "staffing recruiting temp agency human resources" },
          { key: "environmental-services", label: "Environmental Services", search: "waste management recycling environmental remediation" },
          { key: "security-services", label: "Security Services", search: "security guards alarm surveillance facility protection" },
          { key: "market-research", label: "Market Research", search: "market research consumer panel survey data analytics" },
        ],
      },
      {
        key: "transportation", label: "Transportation", search: "transportation logistics airlines freight rail trucking shipping",
        children: [
          { key: "airlines-aviation", label: "Airlines & Aviation", search: "airline commercial aviation low cost carrier full service" },
          { key: "air-freight", label: "Air Freight & Express", search: "air freight cargo express parcel FedEx UPS DHL" },
          { key: "container-shipping", label: "Container Shipping", search: "container shipping Maersk MSC TEU ocean freight" },
          { key: "bulk-shipping", label: "Bulk Shipping", search: "dry bulk tanker capesize panamax shipping" },
          { key: "freight-rail", label: "Freight Rail", search: "freight railroad Class I intermodal coal grain" },
          { key: "trucking-freight", label: "Trucking & Freight", search: "trucking FTL LTL freight carrier intermodal" },
          { key: "ports-logistics", label: "Ports & Logistics", search: "container port terminal harbor logistics distribution" },
          { key: "last-mile", label: "Last-Mile Delivery", search: "last mile delivery courier parcel e-commerce fulfillment" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 4: CONSUMER DISCRETIONARY
  // ═══════════════════════════════════════════════════
  {
    key: "consumer-discretionary", label: "Consumer Discretionary", emoji: "🛍️", color: "#ec4899",
    gradient: "from-pink-500 to-rose-600",
    search: "consumer discretionary retail auto luxury fashion entertainment",
    children: [
      {
        key: "automobiles", label: "Automobiles & Auto Parts", search: "automobile cars electric vehicle EV auto parts manufacturer",
        children: [
          { key: "ev-manufacturers", label: "EV Manufacturers", search: "electric vehicle Tesla Rivian NIO BYD EV battery" },
          { key: "luxury-auto", label: "Luxury Automobiles", search: "luxury car BMW Mercedes Bentley Rolls-Royce Porsche" },
          { key: "mass-market-auto", label: "Mass Market Auto", search: "mass market automobile Toyota Honda Ford GM" },
          { key: "ev-batteries", label: "EV Battery Systems", search: "EV battery lithium-ion pack cell module automotive" },
          { key: "auto-parts", label: "Auto Parts & Components", search: "auto parts brake suspension lighting interior supplier" },
          { key: "tires", label: "Tires & Rubber", search: "tire rubber Michelin Bridgestone Goodyear Continental" },
          { key: "motorcycles", label: "Motorcycles & Power Sports", search: "motorcycle Harley Davidson Honda Yamaha electric scooter" },
        ],
      },
      {
        key: "luxury-apparel", label: "Luxury & Apparel", search: "luxury fashion apparel handbags watches footwear textiles",
        children: [
          { key: "luxury-fashion", label: "Luxury Fashion Houses", search: "luxury fashion LVMH Gucci Prada Hermès haute couture" },
          { key: "streetwear", label: "Streetwear & Sneakers", search: "streetwear sneakers Nike Supreme hype limited drops" },
          { key: "outdoor-apparel", label: "Outdoor Performance Apparel", search: "outdoor apparel Gore-Tex Patagonia Arc'teryx performance" },
          { key: "luxury-watches", label: "Luxury Watches", search: "luxury watch Swiss mechanical Rolex Patek Philippe" },
          { key: "athletic-footwear", label: "Athletic Footwear", search: "athletic footwear Nike Adidas running basketball shoes" },
          { key: "fast-fashion", label: "Fast Fashion", search: "fast fashion Zara H&M Shein affordable clothing" },
          { key: "sustainable-fashion", label: "Sustainable Fashion", search: "sustainable fashion recycled eco friendly clothing" },
        ],
      },
      {
        key: "home-durables", label: "Home & Durables", search: "furniture mattresses home appliances homebuilding renovation",
        children: [
          { key: "furniture", label: "Furniture & Home Furnishings", search: "furniture sofa mattress home decor interior design" },
          { key: "home-appliances", label: "Home Appliances", search: "home appliance refrigerator washer dryer smart home" },
          { key: "homebuilders", label: "Homebuilders", search: "homebuilder new construction residential homes housing" },
          { key: "home-improvement", label: "Home Improvement & DIY", search: "home improvement renovation DIY hardware tools flooring" },
          { key: "leisure-products", label: "Leisure & Recreation Products", search: "recreation boat RV camper power sports outdoor leisure" },
        ],
      },
      {
        key: "restaurants-leisure", label: "Restaurants & Leisure", search: "restaurants hotels casino theme park entertainment leisure",
        children: [
          { key: "qsr", label: "Quick Service Restaurants", search: "fast food QSR McDonald's Burger King Chick-fil-A" },
          { key: "fast-casual", label: "Fast Casual Dining", search: "fast casual Chipotle Sweetgreen Shake Shack restaurant" },
          { key: "fine-dining", label: "Fine Dining", search: "fine dining Michelin star gourmet restaurant" },
          { key: "ghost-kitchens", label: "Ghost Kitchens & Delivery", search: "ghost kitchen virtual restaurant delivery DoorDash" },
          { key: "hotels", label: "Hotels & Resorts", search: "hotel resort hospitality Marriott Hilton Hyatt luxury" },
          { key: "cruise-lines", label: "Cruise Lines", search: "cruise line Royal Caribbean Carnival Norwegian luxury" },
          { key: "theme-parks", label: "Theme Parks", search: "theme park Disney Universal Six Flags entertainment" },
          { key: "casinos-gaming", label: "Casinos & Gambling", search: "casino gambling gaming slot sports betting Las Vegas" },
          { key: "fitness-wellness", label: "Fitness & Wellness Centers", search: "gym fitness yoga pilates wellness health club" },
        ],
      },
      {
        key: "retail", label: "Retail & E-Commerce", search: "retail ecommerce shopping consumer marketplace",
        children: [
          { key: "ecommerce-marketplace", label: "E-Commerce & Marketplaces", search: "ecommerce Amazon marketplace online retail shopping" },
          { key: "broadline-retail", label: "Broadline Retail", search: "broadline retail department store Walmart Target" },
          { key: "specialty-retail", label: "Specialty Retail", search: "specialty retail electronics toys sporting goods" },
          { key: "luxury-retail", label: "Luxury Retail", search: "luxury retail boutique high-end shopping brand flagship" },
          { key: "auto-retail", label: "Automotive Retail", search: "auto dealer car dealership new used vehicle sales" },
          { key: "online-grocery", label: "Online Grocery & Delivery", search: "grocery delivery instacart online fresh food" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 5: CONSUMER STAPLES
  // ═══════════════════════════════════════════════════
  {
    key: "consumer-staples", label: "Consumer Staples", emoji: "🛒", color: "#22c55e",
    gradient: "from-green-500 to-emerald-600",
    search: "consumer staples food beverage grocery household products",
    children: [
      {
        key: "food-beverages", label: "Food & Beverages", search: "food beverage packaged consumer brands grocery",
        children: [
          { key: "packaged-foods", label: "Packaged Foods", search: "packaged food brands snacks frozen meals CPG" },
          { key: "beverages-soft", label: "Soft Drinks & Beverages", search: "soft drinks Coca-Cola Pepsi energy drinks sports drinks" },
          { key: "beer-brewing", label: "Beer & Brewing", search: "beer brewing craft beer lager ale brewer" },
          { key: "spirits-wine", label: "Spirits & Wine", search: "spirits whiskey tequila wine vodka distillery" },
          { key: "functional-beverages", label: "Functional Beverages", search: "functional beverage wellness adaptogen nootropic kombucha" },
          { key: "plant-based-foods", label: "Plant-Based Foods", search: "plant-based meat alternative vegan Beyond Impossible" },
          { key: "organic-natural-food", label: "Organic & Natural Foods", search: "organic natural food clean label whole foods" },
          { key: "meat-processing", label: "Meat & Protein Processing", search: "meat processing beef pork poultry chicken food safety" },
        ],
      },
      {
        key: "grocery-retail", label: "Grocery & Food Retail", search: "grocery supermarket pharmacy food retail distribution",
        children: [
          { key: "supermarkets", label: "Supermarkets", search: "supermarket grocery chain Kroger Albertsons food retail" },
          { key: "organic-grocers", label: "Natural & Organic Grocers", search: "natural organic grocery Whole Foods Sprouts" },
          { key: "convenience-stores", label: "Convenience Stores", search: "convenience store c-store 7-Eleven forecourt fuel" },
          { key: "pharmacy-retail", label: "Pharmacy Retail", search: "pharmacy drug store CVS Walgreens Rite Aid" },
          { key: "food-distribution", label: "Food Distribution", search: "food distribution wholesale Sysco US Foods supply" },
        ],
      },
      {
        key: "household-personal", label: "Household & Personal Products", search: "household products detergent cleaning personal care beauty",
        children: [
          { key: "household-cleaning", label: "Household Cleaning Products", search: "household cleaning detergent disinfectant laundry surface spray" },
          { key: "skincare-cosmetics", label: "Skincare & Cosmetics", search: "skincare moisturizer serum cosmetics makeup foundation" },
          { key: "hair-care", label: "Hair Care", search: "hair care shampoo conditioner treatment salon professional" },
          { key: "oral-care", label: "Oral Care", search: "toothpaste toothbrush mouthwash oral care electric" },
          { key: "pet-food", label: "Pet Food & Care", search: "pet food dog cat treats premium pet care" },
          { key: "baby-products", label: "Baby & Infant Products", search: "baby infant diapers formula wipes newborn" },
        ],
      },
      {
        key: "tobacco-alternatives", label: "Tobacco & Alternatives", search: "tobacco cigarettes vaping nicotine alternatives",
        children: [
          { key: "cigarettes", label: "Cigarettes & Cigars", search: "cigarette tobacco Philip Morris Altria BAT" },
          { key: "vaping-nicotine", label: "Vaping & Nicotine Alternatives", search: "vaping e-cigarette nicotine pouch JUUL ZYN" },
        ],
      },
      {
        key: "agricultural-commodities", label: "Agricultural Commodities", search: "agriculture grain oilseed sugar cocoa coffee commodity trading",
        children: [
          { key: "grain-trading", label: "Grain Trading & Origination", search: "grain wheat corn soybean trading merchandising" },
          { key: "oilseed-crushing", label: "Oilseed Crushing", search: "soybean canola oilseed crushing meal oil vegetable" },
          { key: "sugar-milling", label: "Sugar & Sweeteners", search: "sugar cane beet milling ethanol sweetener" },
          { key: "coffee-cocoa", label: "Coffee & Cocoa", search: "coffee cocoa bean processing trading origin" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 6: HEALTH CARE
  // ═══════════════════════════════════════════════════
  {
    key: "health-care", label: "Health Care", emoji: "🏥", color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    search: "health care medicine pharmaceutical biotech hospital insurance",
    children: [
      {
        key: "biotech-pharma", label: "Biotechnology & Pharma", search: "biotechnology pharmaceutical drug clinical trial FDA approval",
        children: [
          { key: "monoclonal-antibodies", label: "Monoclonal Antibodies", search: "monoclonal antibody mAb bispecific antibody cancer immunology" },
          { key: "gene-therapy", label: "Gene & Cell Therapy", search: "gene therapy CAR-T cell therapy AAV CRISPR rare disease" },
          { key: "mrna-therapeutics", label: "mRNA Therapeutics", search: "mRNA therapeutics lipid nanoparticle vaccine platform" },
          { key: "oncology-drugs", label: "Oncology Drugs", search: "cancer drug oncology tumor checkpoint inhibitor kinase" },
          { key: "rare-disease", label: "Rare Disease Drugs", search: "rare disease orphan drug FDA breakthrough designated" },
          { key: "biosimilars", label: "Biosimilars", search: "biosimilar adalimumab infliximab interchangeable generic biologic" },
          { key: "small-molecule", label: "Small Molecule Drugs", search: "small molecule drug oral tablet capsule synthesis" },
          { key: "vaccines", label: "Vaccines & Immunology", search: "vaccine mRNA subunit adjuvant immunization pandemic" },
        ],
      },
      {
        key: "medical-devices", label: "Medical Devices & Equipment", search: "medical device surgical robot imaging implant diagnostic equipment",
        children: [
          { key: "surgical-robotics", label: "Surgical Robotics", search: "surgical robot minimally invasive Intuitive Medtronic" },
          { key: "imaging-equipment", label: "Medical Imaging Equipment", search: "MRI CT PET ultrasound imaging scanner radiology" },
          { key: "orthopedic-implants", label: "Orthopedic Implants", search: "orthopedic implant hip knee joint replacement spine" },
          { key: "cardiac-devices", label: "Cardiac Devices", search: "cardiac pacemaker defibrillator ICD heart device" },
          { key: "diabetes-devices", label: "Diabetes Monitoring & Devices", search: "glucose monitor CGM insulin pump diabetes management" },
          { key: "dental-equipment", label: "Dental Equipment & Supplies", search: "dental equipment implant CAD/CAM orthodontic brace" },
          { key: "wound-care", label: "Wound Care & Surgical Supplies", search: "wound care dressing surgical supply disposable sterile" },
        ],
      },
      {
        key: "health-care-services", label: "Health Care Services & Facilities", search: "hospital surgery center urgent care telehealth managed care",
        children: [
          { key: "hospitals", label: "Hospitals & Health Systems", search: "hospital health system academic medical center acute care" },
          { key: "ambulatory-surgery", label: "Ambulatory Surgery Centers", search: "ambulatory surgery center outpatient ASC procedure" },
          { key: "behavioral-health", label: "Behavioral Health", search: "mental health behavioral health inpatient outpatient" },
          { key: "dialysis-clinics", label: "Dialysis Clinics", search: "dialysis kidney ESRD hemodialysis DaVita Fresenius" },
          { key: "home-health", label: "Home Health & Hospice", search: "home health hospice skilled nursing home care" },
          { key: "telehealth", label: "Telehealth & Virtual Care", search: "telehealth telemedicine virtual care remote doctor" },
        ],
      },
      {
        key: "health-insurance", label: "Health Insurance & Managed Care", search: "health insurance managed care Medicare Medicaid plan",
        children: [
          { key: "commercial-insurance-health", label: "Commercial Health Insurance", search: "commercial health insurance employer group plan UnitedHealth" },
          { key: "medicare-advantage", label: "Medicare Advantage", search: "Medicare Advantage MA plan HMO seniors CMS" },
          { key: "medicaid-mco", label: "Medicaid Managed Care", search: "Medicaid MCO managed care state contract" },
          { key: "dental-vision", label: "Dental & Vision Insurance", search: "dental vision insurance plan benefits employer" },
        ],
      },
      {
        key: "life-sciences-tools", label: "Life Sciences Tools & Services", search: "life sciences instruments CRO CDMO sequencing genomics",
        children: [
          { key: "lab-instruments", label: "Laboratory Instruments", search: "lab instrument mass spectrometry chromatography analytical" },
          { key: "cro-services", label: "CRO Clinical Services", search: "CRO clinical research organization trial management" },
          { key: "cdmo-manufacturing", label: "CDMO Drug Manufacturing", search: "CDMO contract manufacturing biologics API drug substance" },
          { key: "genomics-sequencing", label: "Genomics & Sequencing", search: "NGS sequencing genomics Illumina Oxford Nanopore" },
          { key: "lab-consumables", label: "Lab Consumables & Reagents", search: "lab consumable reagent pipette plate antibody" },
        ],
      },
      {
        key: "health-tech", label: "Health Technology & Digital Health", search: "health technology EHR digital health AI diagnostics population",
        children: [
          { key: "ehr-emr", label: "EHR & EMR Systems", search: "electronic health record EMR EHR Epic Cerner hospital" },
          { key: "revenue-cycle", label: "Revenue Cycle Management", search: "revenue cycle billing coding claims denial RCM" },
          { key: "ai-diagnostics", label: "AI Diagnostics", search: "AI diagnostics radiology pathology FDA clearance" },
          { key: "population-health", label: "Population Health Platforms", search: "population health chronic disease analytics predictive" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 7: FINANCIALS
  // ═══════════════════════════════════════════════════
  {
    key: "financials", label: "Finance & Markets", emoji: "💰", color: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    search: "finance banking markets investing insurance fintech",
    children: [
      {
        key: "banking", label: "Banking & Credit", search: "banking bank credit loan deposit commercial retail",
        children: [
          { key: "global-banks", label: "Global Investment Banks", search: "investment bank JPMorgan Goldman Sachs Morgan Stanley" },
          { key: "commercial-banks", label: "Commercial Banks", search: "commercial bank retail lending deposits checking savings" },
          { key: "regional-banks", label: "Regional & Community Banks", search: "regional bank community bank local credit union" },
          { key: "private-banking", label: "Private Banking & Wealth", search: "private banking wealth management UHNW family office" },
          { key: "trade-finance", label: "Trade Finance & Transaction Banking", search: "trade finance letter of credit supply chain payment" },
        ],
      },
      {
        key: "capital-markets", label: "Capital Markets", search: "capital markets investment banking IPO equity debt securities",
        children: [
          { key: "investment-banking", label: "Investment Banking & M&A", search: "investment banking merger acquisition M&A IPO underwriting" },
          { key: "equity-markets", label: "Equity Markets & Exchanges", search: "stock market NYSE NASDAQ equity exchange trading" },
          { key: "fixed-income", label: "Fixed Income & Bonds", search: "bond fixed income treasury yield credit market" },
          { key: "derivatives", label: "Derivatives & Structured Products", search: "derivatives options futures swaps structured products" },
          { key: "market-data", label: "Market Data & Financial Information", search: "market data Bloomberg Reuters financial information index" },
        ],
      },
      {
        key: "asset-management", label: "Asset Management & Investment", search: "asset management fund hedge private equity mutual ETF",
        children: [
          { key: "mutual-funds", label: "Mutual Funds & Active Management", search: "mutual fund active management equity bond portfolio" },
          { key: "etf-passive", label: "ETF & Passive Investment", search: "ETF passive index fund Vanguard BlackRock iShares" },
          { key: "hedge-funds", label: "Hedge Funds", search: "hedge fund long short quantitative macro strategy" },
          { key: "private-equity", label: "Private Equity & Venture", search: "private equity buyout venture capital growth LBO" },
          { key: "real-assets", label: "Real Assets & Infrastructure Funds", search: "infrastructure fund real assets timber farmland" },
        ],
      },
      {
        key: "insurance", label: "Insurance", search: "insurance property casualty life health reinsurance",
        children: [
          { key: "property-casualty", label: "Property & Casualty Insurance", search: "property casualty P&C insurance auto home commercial" },
          { key: "life-insurance", label: "Life Insurance", search: "life insurance term whole universal annuity death benefit" },
          { key: "health-insurance-fin", label: "Health & Medical Insurance", search: "health insurance plan benefit employer group" },
          { key: "reinsurance", label: "Reinsurance", search: "reinsurance treaty facultative Munich Re Swiss Re" },
          { key: "specialty-insurance", label: "Specialty & Cyber Insurance", search: "cyber insurance specialty D&O E&O marine aviation" },
          { key: "insurance-brokers", label: "Insurance Brokers & Agents", search: "insurance broker agent Marsh Aon WTW placement" },
          { key: "insurtech", label: "Insurtech & Digital Insurance", search: "insurtech digital insurance embedded Lemonade Root" },
        ],
      },
      {
        key: "fintech-payments", label: "FinTech & Payments", search: "fintech payments digital wallet crypto blockchain banking technology",
        children: [
          { key: "payment-processing", label: "Payment Processing", search: "payment processing Visa Mastercard Stripe Square acquirer" },
          { key: "digital-wallets", label: "Digital Wallets & Mobile Pay", search: "digital wallet Apple Pay Google Pay PayPal Venmo" },
          { key: "bnpl", label: "Buy Now Pay Later", search: "BNPL buy now pay later Klarna Afterpay Affirm" },
          { key: "crypto-defi", label: "Crypto & DeFi", search: "cryptocurrency bitcoin ethereum DeFi blockchain Web3" },
          { key: "neobanks", label: "Neobanks & Challenger Banks", search: "neobank digital bank Chime Revolut Monzo challenger" },
          { key: "wealthtech", label: "WealthTech & Robo-Advisory", search: "wealthtech robo advisor Betterment Robinhood fintech" },
          { key: "regtech", label: "RegTech & Compliance", search: "regtech regulatory compliance AML KYC fraud detection" },
        ],
      },
      {
        key: "consumer-finance", label: "Consumer Finance & Lending", search: "consumer finance credit card auto loan mortgage student personal",
        children: [
          { key: "credit-cards", label: "Credit Cards", search: "credit card rewards points co-brand issuer American Express" },
          { key: "mortgage-lending", label: "Mortgage Lending", search: "mortgage home loan origination refinance HELOC" },
          { key: "auto-lending", label: "Auto Financing", search: "auto loan vehicle financing captive lender" },
          { key: "personal-loans", label: "Personal Loans", search: "personal loan unsecured installment peer-to-peer lending" },
          { key: "student-loans", label: "Student Loans", search: "student loan federal private refinancing ISA" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 8: INFORMATION TECHNOLOGY
  // ═══════════════════════════════════════════════════
  {
    key: "information-technology", label: "Information Technology", emoji: "💻", color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
    search: "information technology software hardware cloud computing enterprise",
    children: [
      {
        key: "enterprise-software", label: "Enterprise Software", search: "enterprise software SaaS CRM ERP cloud applications business",
        children: [
          { key: "crm-software", label: "CRM & Sales Software", search: "CRM Salesforce sales automation customer relationship" },
          { key: "erp-software", label: "ERP & Business Management", search: "ERP SAP Oracle enterprise resource planning" },
          { key: "hr-tech", label: "HR & Workforce Technology", search: "HR tech HRIS payroll workforce management ATS" },
          { key: "project-management-sw", label: "Project Management Software", search: "project management Jira Monday Asana collaboration" },
          { key: "analytics-bi", label: "Analytics & Business Intelligence", search: "analytics business intelligence BI Tableau Snowflake" },
          { key: "marketing-tech", label: "Marketing Technology", search: "martech marketing automation CDP email advertising platform" },
          { key: "legal-tech", label: "Legal Technology", search: "legal tech e-discovery contract management law firm" },
          { key: "vertical-saas", label: "Vertical SaaS", search: "vertical SaaS industry-specific software healthcare fintech" },
        ],
      },
      {
        key: "cybersecurity-sw", label: "Cybersecurity", search: "cybersecurity zero trust endpoint SIEM threat detection",
        children: [
          { key: "endpoint-security", label: "Endpoint Security", search: "endpoint security EDR XDR antivirus CrowdStrike" },
          { key: "network-security", label: "Network Security & Firewall", search: "network firewall NGFW Palo Alto Fortinet zero trust" },
          { key: "identity-access", label: "Identity & Access Management", search: "identity access management IAM SSO Okta privileged" },
          { key: "cloud-security", label: "Cloud Security", search: "cloud security CSPM CWPP SASE Wiz Orca" },
          { key: "soc-siem", label: "SOC & Threat Intelligence", search: "SOC SIEM threat intelligence security operations center" },
        ],
      },
      {
        key: "cloud-infrastructure", label: "Cloud & Infrastructure", search: "cloud computing AWS Azure GCP infrastructure hyperscale",
        children: [
          { key: "hyperscale-cloud", label: "Hyperscale Cloud Platforms", search: "AWS Azure Google Cloud hyperscaler IaaS PaaS SaaS" },
          { key: "devops-devtools", label: "DevOps & Developer Tools", search: "DevOps CI/CD GitHub Docker Kubernetes developer" },
          { key: "data-platforms", label: "Data Platforms & Databases", search: "data platform database Snowflake Databricks cloud data" },
          { key: "networking-cdn", label: "Networking & CDN", search: "CDN content delivery Cloudflare Akamai network edge" },
          { key: "observability", label: "Observability & Monitoring", search: "observability monitoring Datadog Dynatrace New Relic logs" },
        ],
      },
      {
        key: "semiconductors-it", label: "Semiconductors & Chips", search: "semiconductor chip GPU CPU processor TSMC Nvidia Intel AMD",
        children: [
          { key: "ai-chips", label: "AI Chips & GPUs", search: "AI chip GPU Nvidia H100 data center accelerator" },
          { key: "cpu-logic", label: "CPUs & Logic Chips", search: "CPU processor Intel AMD ARM server workstation" },
          { key: "memory-chips", label: "Memory & Storage Chips", search: "NAND DRAM memory Samsung SK Hynix Micron" },
          { key: "analog-power-chips", label: "Analog & Power Semiconductors", search: "analog power chip SiC GaN EV automotive" },
          { key: "semiconductor-equipment", label: "Semiconductor Equipment", search: "semiconductor equipment ASML EUV lithography etch deposition" },
          { key: "chip-design-ip", label: "Chip Design & IP", search: "chip design EDA ARM IP licensing Synopsys Cadence" },
        ],
      },
      {
        key: "tech-hardware", label: "Technology Hardware", search: "laptop PC server storage peripherals displays printers",
        children: [
          { key: "pcs-laptops", label: "PCs & Laptops", search: "PC laptop commercial notebook Dell HP Lenovo" },
          { key: "servers", label: "Servers & Data Center Hardware", search: "server data center compute rack supermicro Dell" },
          { key: "storage-systems", label: "Storage Systems", search: "storage array flash NVMe SAN NAS enterprise" },
          { key: "network-hardware", label: "Network Equipment", search: "switch router enterprise network Cisco Juniper" },
          { key: "wearables-iot", label: "Wearables & IoT Devices", search: "wearable IoT smartwatch connected device sensor" },
        ],
      },
      {
        key: "it-services-outsourcing", label: "IT Services & Outsourcing", search: "IT services managed outsourcing consulting digital transformation",
        children: [
          { key: "managed-it", label: "Managed IT Services", search: "managed services MSP outsourcing IT support" },
          { key: "digital-transformation", label: "Digital Transformation", search: "digital transformation modernization legacy cloud migration" },
          { key: "data-processing", label: "Data Processing & BPO", search: "BPO business process outsourcing data processing payroll" },
          { key: "ai-development", label: "AI Implementation Services", search: "AI implementation GenAI enterprise LLM integration" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 9: COMMUNICATION SERVICES
  // ═══════════════════════════════════════════════════
  {
    key: "communication-services", label: "Communication Services", emoji: "📡", color: "#06b6d4",
    gradient: "from-cyan-500 to-blue-600",
    search: "communication media entertainment social telecom streaming",
    children: [
      {
        key: "telecom", label: "Telecommunications", search: "telecom 5G wireless broadband fiber internet mobile operator",
        children: [
          { key: "mobile-operators", label: "Mobile Network Operators", search: "mobile network operator MNO 5G Verizon AT&T T-Mobile" },
          { key: "fixed-broadband", label: "Fixed Broadband & Fiber", search: "fiber broadband FTTH internet gigabit home" },
          { key: "mvno", label: "MVNOs & Virtual Operators", search: "MVNO virtual operator wireless reseller" },
          { key: "satellite-internet", label: "Satellite Internet", search: "satellite internet Starlink OneWeb LEO broadband" },
          { key: "iot-connectivity", label: "IoT & M2M Connectivity", search: "IoT connectivity machine-to-machine NB-IoT eSIM" },
        ],
      },
      {
        key: "social-media", label: "Social Media & Platforms", search: "social media Facebook Instagram TikTok YouTube creator",
        children: [
          { key: "short-form-video", label: "Short-Form Video", search: "TikTok Instagram Reels short video vertical content" },
          { key: "professional-social", label: "Professional Social Networks", search: "LinkedIn professional network B2B career jobs" },
          { key: "messaging-apps", label: "Messaging & Chat Platforms", search: "messaging WhatsApp Telegram Signal Discord chat" },
          { key: "creator-platforms", label: "Creator Economy Platforms", search: "creator economy Patreon Substack OnlyFans monetization" },
          { key: "dating-apps", label: "Dating & Social Connection Apps", search: "dating app Tinder Hinge Bumble Match" },
        ],
      },
      {
        key: "streaming-entertainment", label: "Streaming & Entertainment", search: "streaming Netflix Disney+ content SVOD film television",
        children: [
          { key: "svod-streaming", label: "SVOD Streaming Services", search: "Netflix Disney+ HBO Max streaming subscription video" },
          { key: "avod-fast", label: "AVOD & Free Streaming", search: "AVOD free ad-supported Peacock Tubi Pluto FAST" },
          { key: "gaming-entertainment", label: "Video Games & Gaming", search: "video game console PC mobile gaming AAA publisher" },
          { key: "podcast-audio", label: "Podcasting & Audio", search: "podcast audio Spotify sound streaming" },
          { key: "live-events", label: "Live Events & Concerts", search: "live events concerts tours festival ticketing" },
          { key: "film-studio", label: "Film Studios & Production", search: "film studio movie production Hollywood box office" },
        ],
      },
      {
        key: "advertising-media", label: "Advertising & Media", search: "advertising digital media programmatic OOH broadcast search",
        children: [
          { key: "digital-advertising", label: "Digital & Programmatic Advertising", search: "digital advertising programmatic DSP DV360 Google Meta" },
          { key: "search-advertising", label: "Search & Social Advertising", search: "search advertising Google Ads Meta Facebook performance" },
          { key: "ooh-advertising", label: "Out-of-Home Advertising", search: "OOH outdoor billboard transit digital signage" },
          { key: "broadcast-advertising", label: "Broadcast & TV Advertising", search: "TV broadcast advertising upfront scatter linear CTV" },
          { key: "ad-tech", label: "Ad Technology & MarTech", search: "adtech martech DSP SSP DMP CDP measurement" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 10: UTILITIES
  // ═══════════════════════════════════════════════════
  {
    key: "utilities", label: "Utilities", emoji: "💡", color: "#f59e0b",
    gradient: "from-yellow-400 to-amber-600",
    search: "utilities electricity gas water power grid renewable utility",
    children: [
      {
        key: "electric-utilities", label: "Electric Utilities", search: "electric utility power grid transmission distribution regulated",
        children: [
          { key: "regulated-electric", label: "Regulated Electric Utilities", search: "regulated electric utility investor owned IOU distribution" },
          { key: "power-transmission", label: "Power Transmission & Grid", search: "power grid transmission line high voltage ISO RTO" },
          { key: "smart-grid", label: "Smart Grid & AMI", search: "smart grid AMI advanced metering demand response" },
          { key: "distributed-generation", label: "Distributed Generation", search: "distributed generation rooftop solar community DG" },
        ],
      },
      {
        key: "gas-utilities", label: "Gas Utilities", search: "natural gas utility distribution LDC residential commercial",
        children: [
          { key: "gas-distribution", label: "Gas Distribution Utilities", search: "gas distribution LDC local distribution company residential" },
          { key: "rng-biogas", label: "Renewable Natural Gas", search: "renewable natural gas RNG biogas landfill dairy biomethane" },
        ],
      },
      {
        key: "water-utilities", label: "Water & Wastewater", search: "water utility drinking wastewater treatment municipal",
        children: [
          { key: "drinking-water", label: "Drinking Water Systems", search: "drinking water utility municipal treatment filtration" },
          { key: "wastewater", label: "Wastewater Treatment", search: "wastewater treatment sewage effluent reuse recycled" },
          { key: "desalination", label: "Desalination & Water Recycling", search: "desalination reverse osmosis water reuse drought" },
        ],
      },
      {
        key: "renewable-power-utilities", label: "Renewable Power Producers", search: "renewable power producer solar wind hydro independent IPP",
        children: [
          { key: "solar-isp", label: "Solar Power Producers", search: "solar farm PPA utility scale independent power producer" },
          { key: "wind-isp", label: "Wind Power Producers", search: "onshore offshore wind power PPA grid scale" },
          { key: "hydro-power", label: "Hydro & Pumped Storage", search: "hydroelectric pumped storage hydro power" },
          { key: "nuclear-power", label: "Nuclear Power", search: "nuclear power plant SMR uranium reactor baseload" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // GICS SECTOR 11: REAL ESTATE
  // ═══════════════════════════════════════════════════
  {
    key: "real-estate", label: "Real Estate", emoji: "🏢", color: "#84cc16",
    gradient: "from-lime-500 to-green-600",
    search: "real estate REIT property investment commercial residential",
    children: [
      {
        key: "office-reits", label: "Office Real Estate", search: "office REIT commercial real estate building CBD tower",
        children: [
          { key: "trophy-office", label: "Trophy & Class A Office", search: "trophy office Class A CBD tower premium workspace" },
          { key: "life-science-office", label: "Life Science Real Estate", search: "life science lab office biotech campus REIT" },
          { key: "coworking", label: "Co-Working & Flex Office", search: "coworking flexible office WeWork serviced workspace" },
        ],
      },
      {
        key: "industrial-reits", label: "Industrial & Logistics Real Estate", search: "industrial REIT logistics warehouse distribution fulfillment",
        children: [
          { key: "logistics-warehouses", label: "Logistics Warehouses", search: "logistics warehouse distribution center big box Prologis" },
          { key: "last-mile-industrial", label: "Last-Mile Fulfillment", search: "last mile fulfillment urban infill delivery warehouse" },
          { key: "cold-storage-re", label: "Cold Storage Real Estate", search: "cold storage refrigerated warehouse REIT logistics" },
          { key: "data-center-reits", label: "Data Center REITs", search: "data center REIT colocation hyperscale Equinix Digital Realty" },
        ],
      },
      {
        key: "residential-reits", label: "Residential Real Estate", search: "residential REIT apartment multifamily single family housing",
        children: [
          { key: "apartment-reits", label: "Apartment REITs", search: "apartment REIT multifamily urban suburban rental" },
          { key: "sfr-reits", label: "Single-Family Rental", search: "single family rental SFR homes Invitation Homes" },
          { key: "student-housing", label: "Student Housing", search: "student housing off campus university residence" },
          { key: "senior-housing", label: "Senior Living & Housing", search: "senior housing assisted living independent living" },
        ],
      },
      {
        key: "retail-reits", label: "Retail Real Estate", search: "retail REIT mall shopping center strip net lease",
        children: [
          { key: "mall-reits", label: "Shopping Malls", search: "shopping mall REIT enclosed super regional Simon" },
          { key: "grocery-anchored", label: "Grocery-Anchored Strip Centers", search: "grocery anchored strip center neighborhood retail" },
          { key: "net-lease-reits", label: "Net Lease Properties", search: "net lease NNN single tenant REIT Realty Income" },
          { key: "outlet-centers", label: "Outlet & Lifestyle Centers", search: "outlet center open air lifestyle retail premium" },
        ],
      },
      {
        key: "specialty-reits", label: "Specialty REITs & Real Estate", search: "cell tower timber farmland billboard healthcare REIT specialty",
        children: [
          { key: "cell-tower-reits", label: "Cell Tower REITs", search: "cell tower REIT American Tower Crown Castle SBA" },
          { key: "healthcare-reits", label: "Healthcare REITs", search: "healthcare REIT hospital MOB nursing skilled care" },
          { key: "farmland-timber", label: "Farmland & Timberland", search: "farmland REIT timberland Weyerhaeuser Rayonier" },
          { key: "casino-reits", label: "Casino & Hospitality REITs", search: "casino REIT hotel resort gaming property" },
        ],
      },
      {
        key: "real-estate-services", label: "Real Estate Services & Development", search: "real estate development brokerage property management proptech",
        children: [
          { key: "commercial-brokerage", label: "Commercial Real Estate Brokerage", search: "commercial brokerage CBRE JLL Cushman leasing advisory" },
          { key: "residential-brokerage", label: "Residential Real Estate Brokerage", search: "residential brokerage Compass Redfin agent listing" },
          { key: "property-management", label: "Property Management", search: "property management third party multifamily commercial" },
          { key: "proptech", label: "PropTech & Real Estate Technology", search: "proptech real estate technology AVM valuation digital" },
          { key: "master-planned", label: "Master-Planned Communities & Development", search: "master planned community mixed use transit oriented developer" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // EXTENDED KNOWLEDGE DOMAINS (Beyond GICS)
  // ═══════════════════════════════════════════════════
  {
    key: "law-regulation", label: "Law & Regulation", emoji: "⚖️", color: "#6366f1",
    gradient: "from-indigo-500 to-blue-600",
    search: "law legal regulation compliance court litigation",
    children: [
      { key: "corporate-law", label: "Corporate & M&A Law", search: "corporate law M&A transaction merger acquisition legal" },
      { key: "regulatory-compliance", label: "Regulatory & Compliance", search: "regulatory compliance SEC CFTC FDA enforcement" },
      { key: "ip-law", label: "Intellectual Property", search: "intellectual property patent trademark copyright licensing" },
      { key: "criminal-law", label: "Criminal Law & Justice", search: "criminal law prosecution defense court justice" },
      { key: "international-law", label: "International Law & Trade", search: "international law treaty trade WTO arbitration" },
      { key: "environmental-law", label: "Environmental Law", search: "environmental law EPA regulation sustainability ESG" },
    ],
  },
  {
    key: "education-academia", label: "Education & Academia", emoji: "🎓", color: "#7c3aed",
    gradient: "from-violet-600 to-purple-700",
    search: "education university research academic learning training",
    children: [
      { key: "higher-ed", label: "Higher Education", search: "university college degree academic higher education" },
      { key: "k12-education", label: "K-12 Education", search: "K-12 school education curriculum teaching learning" },
      { key: "edtech", label: "EdTech & Online Learning", search: "edtech online learning MOOC platform course bootcamp" },
      { key: "research-academia", label: "Academic Research", search: "academic research publication journal peer review" },
      { key: "vocational-training", label: "Vocational & Skills Training", search: "vocational training skills certification workforce" },
    ],
  },
  {
    key: "culture-arts", label: "Culture, Arts & History", emoji: "🎨", color: "#f43f5e",
    gradient: "from-rose-500 to-pink-600",
    search: "culture arts history music film literature civilization",
    children: [
      { key: "art-design", label: "Visual Art & Design", search: "art design museum gallery exhibition contemporary" },
      { key: "music-industry", label: "Music Industry", search: "music artist record label streaming concert tour" },
      { key: "film-tv", label: "Film & Television", search: "film TV show movie production streaming award" },
      { key: "literature-publishing", label: "Literature & Publishing", search: "book literature author publishing bestseller fiction" },
      { key: "history-civilizations", label: "History & Civilizations", search: "history civilization ancient empire war discovery" },
      { key: "architecture", label: "Architecture & Urbanism", search: "architecture building design urban planning city" },
      { key: "philosophy-ethics", label: "Philosophy & Ethics", search: "philosophy ethics morality consciousness meaning" },
    ],
  },
  {
    key: "deep-knowledge", label: "Deep Knowledge", emoji: "🌌", color: "#7c3aed",
    gradient: "from-violet-600 to-indigo-700",
    search: "systems theory game theory cosmology evolution consciousness",
    children: [
      { key: "systems-theory", label: "Systems Theory & Complexity", search: "systems theory complexity emergence chaos" },
      { key: "game-theory", label: "Game Theory & Decision Science", search: "game theory Nash equilibrium strategy decision" },
      { key: "ai-ethics-deep", label: "AI Safety & Ethics", search: "AI safety alignment ethics artificial general intelligence" },
      { key: "cosmology", label: "Cosmology & Universe", search: "cosmology universe dark matter dark energy big bang" },
      { key: "evolution-life", label: "Evolution & Origins of Life", search: "evolution natural selection Darwin genetics origin" },
      { key: "consciousness-mind", label: "Consciousness & Mind", search: "consciousness mind awareness qualia neuroscience" },
    ],
  },
];
