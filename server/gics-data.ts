export interface GicsEntry {
  slug: string;
  name: string;
  level: "sector" | "group" | "industry" | "subindustry";
  parentSlug: string | null;
  searchKeywords: string[];
}

export const GICS_HIERARCHY: GicsEntry[] = [
  // ═══════════════════════════════════════════════════
  // SECTOR 1: ENERGY
  // ═══════════════════════════════════════════════════
  { slug: "energy", name: "Energy", level: "sector", parentSlug: null, searchKeywords: ["oil", "gas", "petroleum", "energy", "solar", "wind", "nuclear", "renewable", "drilling", "pipeline", "opec", "crude", "fossil", "coal", "power plant", "fuel"] },
  { slug: "energy-group", name: "Energy", level: "group", parentSlug: "energy", searchKeywords: ["oil", "gas", "energy sector", "petroleum", "crude oil", "natural gas"] },
  { slug: "energy-equipment-services", name: "Energy Equipment & Services", level: "industry", parentSlug: "energy-group", searchKeywords: ["oil rig", "drilling equipment", "energy services", "oilfield", "halliburton", "schlumberger", "baker hughes"] },
  { slug: "oil-gas-consumable-fuels", name: "Oil, Gas & Consumable Fuels", level: "industry", parentSlug: "energy-group", searchKeywords: ["oil price", "gas price", "exxon", "chevron", "bp", "shell", "petroleum", "crude", "opec", "lng", "refinery"] },
  { slug: "oil-gas-drilling", name: "Oil & Gas Drilling", level: "subindustry", parentSlug: "energy-equipment-services", searchKeywords: ["oil drilling", "gas drilling", "offshore drilling", "drill rig", "well drilling"] },
  { slug: "oil-gas-equipment-services", name: "Oil & Gas Equipment & Services", level: "subindustry", parentSlug: "energy-equipment-services", searchKeywords: ["oilfield services", "oil equipment", "gas equipment", "well services", "subsea"] },
  { slug: "integrated-oil-gas", name: "Integrated Oil & Gas", level: "subindustry", parentSlug: "oil-gas-consumable-fuels", searchKeywords: ["integrated oil", "exxonmobil", "chevron", "bp", "shell", "totalenergies", "major oil"] },
  { slug: "oil-gas-exploration-production", name: "Oil & Gas Exploration & Production", level: "subindustry", parentSlug: "oil-gas-consumable-fuels", searchKeywords: ["oil exploration", "gas exploration", "E&P", "upstream oil", "shale", "fracking"] },
  { slug: "oil-gas-refining-marketing", name: "Oil & Gas Refining & Marketing", level: "subindustry", parentSlug: "oil-gas-consumable-fuels", searchKeywords: ["oil refining", "refinery", "gasoline", "diesel", "fuel marketing", "downstream"] },
  { slug: "oil-gas-storage-transportation", name: "Oil & Gas Storage & Transportation", level: "subindustry", parentSlug: "oil-gas-consumable-fuels", searchKeywords: ["oil pipeline", "gas pipeline", "oil storage", "tanker", "midstream", "lng terminal"] },
  { slug: "coal-consumable-fuels", name: "Coal & Consumable Fuels", level: "subindustry", parentSlug: "oil-gas-consumable-fuels", searchKeywords: ["coal mining", "coal production", "thermal coal", "metallurgical coal", "coal plant"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 2: MATERIALS
  // ═══════════════════════════════════════════════════
  { slug: "materials", name: "Materials", level: "sector", parentSlug: null, searchKeywords: ["mining", "chemicals", "metals", "steel", "copper", "gold", "aluminum", "lumber", "cement", "fertilizer", "lithium", "rare earth"] },
  { slug: "materials-group", name: "Materials", level: "group", parentSlug: "materials", searchKeywords: ["materials sector", "raw materials", "basic materials", "commodities"] },
  { slug: "chemicals", name: "Chemicals", level: "industry", parentSlug: "materials-group", searchKeywords: ["chemical", "chemicals industry", "dow chemical", "basf", "dupont", "chemical manufacturing"] },
  { slug: "construction-materials", name: "Construction Materials", level: "industry", parentSlug: "materials-group", searchKeywords: ["cement", "concrete", "aggregate", "construction materials", "building materials"] },
  { slug: "containers-packaging", name: "Containers & Packaging", level: "industry", parentSlug: "materials-group", searchKeywords: ["packaging", "containers", "cardboard", "plastic packaging", "glass containers", "bottles"] },
  { slug: "metals-mining", name: "Metals & Mining", level: "industry", parentSlug: "materials-group", searchKeywords: ["mining", "metals", "iron ore", "copper mining", "gold mining", "silver", "zinc", "nickel"] },
  { slug: "paper-forest-products", name: "Paper & Forest Products", level: "industry", parentSlug: "materials-group", searchKeywords: ["paper", "pulp", "forest products", "lumber", "timber", "wood products"] },
  { slug: "commodity-chemicals", name: "Commodity Chemicals", level: "subindustry", parentSlug: "chemicals", searchKeywords: ["commodity chemicals", "petrochemicals", "ethylene", "propylene", "basic chemicals"] },
  { slug: "diversified-chemicals", name: "Diversified Chemicals", level: "subindustry", parentSlug: "chemicals", searchKeywords: ["diversified chemicals", "specialty chemical company", "chemical conglomerate"] },
  { slug: "fertilizers-agricultural-chemicals", name: "Fertilizers & Agricultural Chemicals", level: "subindustry", parentSlug: "chemicals", searchKeywords: ["fertilizer", "agricultural chemicals", "pesticide", "herbicide", "crop protection", "nitrogen", "phosphate", "potash"] },
  { slug: "industrial-gases", name: "Industrial Gases", level: "subindustry", parentSlug: "chemicals", searchKeywords: ["industrial gas", "air products", "linde", "oxygen", "nitrogen gas", "hydrogen", "helium"] },
  { slug: "specialty-chemicals", name: "Specialty Chemicals", level: "subindustry", parentSlug: "chemicals", searchKeywords: ["specialty chemicals", "adhesives", "coatings", "catalysts", "fine chemicals", "performance chemicals"] },
  { slug: "construction-materials-sub", name: "Construction Materials", level: "subindustry", parentSlug: "construction-materials", searchKeywords: ["cement production", "concrete mix", "aggregate supply", "ready-mix"] },
  { slug: "metal-glass-containers", name: "Metal & Glass Containers", level: "subindustry", parentSlug: "containers-packaging", searchKeywords: ["metal cans", "glass bottles", "aluminum cans", "beverage containers", "food cans"] },
  { slug: "paper-packaging", name: "Paper Packaging", level: "subindustry", parentSlug: "containers-packaging", searchKeywords: ["cardboard", "corrugated", "paper packaging", "boxes", "cartons"] },
  { slug: "aluminum", name: "Aluminum", level: "subindustry", parentSlug: "metals-mining", searchKeywords: ["aluminum", "aluminium", "bauxite", "smelter", "alcoa", "aluminum production"] },
  { slug: "diversified-metals-mining", name: "Diversified Metals & Mining", level: "subindustry", parentSlug: "metals-mining", searchKeywords: ["diversified mining", "bhp", "rio tinto", "glencore", "iron ore", "copper", "multi-metal"] },
  { slug: "gold", name: "Gold", level: "subindustry", parentSlug: "metals-mining", searchKeywords: ["gold price", "gold mining", "gold bullion", "barrick", "newmont", "gold production"] },
  { slug: "precious-metals-minerals", name: "Precious Metals & Minerals", level: "subindustry", parentSlug: "metals-mining", searchKeywords: ["silver", "platinum", "palladium", "precious metals", "diamonds", "gemstones"] },
  { slug: "steel", name: "Steel", level: "subindustry", parentSlug: "metals-mining", searchKeywords: ["steel production", "steel price", "iron ore", "steelmaker", "nucor", "arcelor", "blast furnace"] },
  { slug: "forest-products", name: "Forest Products", level: "subindustry", parentSlug: "paper-forest-products", searchKeywords: ["lumber", "timber", "wood", "plywood", "forest products", "sawmill"] },
  { slug: "paper-products", name: "Paper Products", level: "subindustry", parentSlug: "paper-forest-products", searchKeywords: ["paper mill", "pulp production", "tissue paper", "printing paper", "paper manufacturing"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 3: INDUSTRIALS
  // ═══════════════════════════════════════════════════
  { slug: "industrials", name: "Industrials", level: "sector", parentSlug: null, searchKeywords: ["manufacturing", "aerospace", "defense", "construction", "transport", "logistics", "railroad", "airline", "shipping", "machinery", "industrial"] },
  { slug: "capital-goods", name: "Capital Goods", level: "group", parentSlug: "industrials", searchKeywords: ["capital goods", "manufacturing", "industrial equipment", "machinery", "aerospace"] },
  { slug: "commercial-professional-services", name: "Commercial & Professional Services", level: "group", parentSlug: "industrials", searchKeywords: ["business services", "consulting", "professional services", "outsourcing"] },
  { slug: "transportation", name: "Transportation", level: "group", parentSlug: "industrials", searchKeywords: ["transportation", "logistics", "shipping", "freight", "airline", "railroad", "trucking"] },
  { slug: "aerospace-defense", name: "Aerospace & Defense", level: "industry", parentSlug: "capital-goods", searchKeywords: ["aerospace", "defense", "military", "boeing", "lockheed", "raytheon", "fighter jet", "missile", "satellite"] },
  { slug: "building-products", name: "Building Products", level: "industry", parentSlug: "capital-goods", searchKeywords: ["building products", "windows", "doors", "insulation", "roofing", "plumbing fixtures"] },
  { slug: "construction-engineering", name: "Construction & Engineering", level: "industry", parentSlug: "capital-goods", searchKeywords: ["construction", "engineering", "infrastructure", "civil engineering", "bridge", "tunnel", "highway"] },
  { slug: "electrical-equipment", name: "Electrical Equipment", level: "industry", parentSlug: "capital-goods", searchKeywords: ["electrical equipment", "power equipment", "transformers", "circuit breakers", "wiring", "cables"] },
  { slug: "industrial-conglomerates", name: "Industrial Conglomerates", level: "industry", parentSlug: "capital-goods", searchKeywords: ["industrial conglomerate", "ge", "siemens", "honeywell", "3m", "diversified industrial"] },
  { slug: "machinery", name: "Machinery", level: "industry", parentSlug: "capital-goods", searchKeywords: ["machinery", "machine tools", "caterpillar", "deere", "heavy equipment", "turbines", "pumps"] },
  { slug: "trading-companies-distributors", name: "Trading Companies & Distributors", level: "industry", parentSlug: "capital-goods", searchKeywords: ["trading company", "industrial distributor", "wholesale", "fastenal", "grainger"] },
  { slug: "commercial-services-supplies", name: "Commercial Services & Supplies", level: "industry", parentSlug: "commercial-professional-services", searchKeywords: ["commercial services", "printing", "waste management", "security services", "janitorial"] },
  { slug: "professional-services", name: "Professional Services", level: "industry", parentSlug: "commercial-professional-services", searchKeywords: ["consulting", "staffing", "hr services", "research", "advisory", "accounting", "legal services"] },
  { slug: "air-freight-logistics", name: "Air Freight & Logistics", level: "industry", parentSlug: "transportation", searchKeywords: ["air freight", "logistics", "fedex", "ups", "dhl", "freight forwarding", "supply chain"] },
  { slug: "airlines", name: "Airlines", level: "industry", parentSlug: "transportation", searchKeywords: ["airline", "aviation", "delta", "united", "american airlines", "southwest", "flights", "air travel"] },
  { slug: "marine", name: "Marine", level: "industry", parentSlug: "transportation", searchKeywords: ["marine shipping", "container ship", "bulk carrier", "tanker", "maritime", "ocean freight"] },
  { slug: "road-rail", name: "Road & Rail", level: "industry", parentSlug: "transportation", searchKeywords: ["railroad", "trucking", "freight rail", "union pacific", "csx", "truck fleet", "intermodal"] },
  { slug: "transportation-infrastructure", name: "Transportation Infrastructure", level: "industry", parentSlug: "transportation", searchKeywords: ["airport", "port", "toll road", "highway", "bridge", "transportation infrastructure"] },
  { slug: "aerospace-defense-sub", name: "Aerospace & Defense", level: "subindustry", parentSlug: "aerospace-defense", searchKeywords: ["aerospace manufacturer", "defense contractor", "jet engine", "military aircraft", "weapons systems"] },
  { slug: "building-products-sub", name: "Building Products", level: "subindustry", parentSlug: "building-products", searchKeywords: ["building products manufacturer", "hvac", "plumbing", "roofing materials"] },
  { slug: "construction-engineering-sub", name: "Construction & Engineering", level: "subindustry", parentSlug: "construction-engineering", searchKeywords: ["construction company", "engineering firm", "infrastructure builder", "EPC contractor"] },
  { slug: "electrical-components-equipment", name: "Electrical Components & Equipment", level: "subindustry", parentSlug: "electrical-equipment", searchKeywords: ["electrical components", "connectors", "switches", "electrical motors", "generators"] },
  { slug: "heavy-electrical-equipment", name: "Heavy Electrical Equipment", level: "subindustry", parentSlug: "electrical-equipment", searchKeywords: ["heavy electrical", "power transformers", "turbine generators", "high voltage equipment"] },
  { slug: "industrial-conglomerates-sub", name: "Industrial Conglomerates", level: "subindustry", parentSlug: "industrial-conglomerates", searchKeywords: ["industrial conglomerate", "diversified manufacturer", "multi-industry"] },
  { slug: "industrial-machinery", name: "Industrial Machinery", level: "subindustry", parentSlug: "machinery", searchKeywords: ["industrial machinery", "machine tools", "hydraulics", "pneumatics", "automation equipment"] },
  { slug: "trading-companies-distributors-sub", name: "Trading Companies & Distributors", level: "subindustry", parentSlug: "trading-companies-distributors", searchKeywords: ["industrial trading", "industrial distribution", "industrial supply"] },
  { slug: "commercial-printing", name: "Commercial Printing", level: "subindustry", parentSlug: "commercial-services-supplies", searchKeywords: ["commercial printing", "print shop", "printing services", "digital printing"] },
  { slug: "environmental-facilities-services", name: "Environmental & Facilities Services", level: "subindustry", parentSlug: "commercial-services-supplies", searchKeywords: ["waste management", "recycling", "environmental services", "facilities management", "janitorial"] },
  { slug: "office-services-supplies", name: "Office Services & Supplies", level: "subindustry", parentSlug: "commercial-services-supplies", searchKeywords: ["office supplies", "office services", "stationery", "copier", "printer supplies"] },
  { slug: "diversified-support-services", name: "Diversified Support Services", level: "subindustry", parentSlug: "commercial-services-supplies", searchKeywords: ["support services", "outsourcing", "business process", "document services"] },
  { slug: "security-alarm-services", name: "Security & Alarm Services", level: "subindustry", parentSlug: "commercial-services-supplies", searchKeywords: ["security services", "alarm systems", "surveillance", "adt", "brinks", "guard services"] },
  { slug: "human-resource-employment-services", name: "Human Resource & Employment Services", level: "subindustry", parentSlug: "professional-services", searchKeywords: ["staffing", "recruiting", "hr services", "employment agency", "temp agency", "headhunter"] },
  { slug: "research-consulting-services", name: "Research & Consulting Services", level: "subindustry", parentSlug: "professional-services", searchKeywords: ["management consulting", "research services", "mckinsey", "accenture", "deloitte consulting"] },
  { slug: "air-freight-logistics-sub", name: "Air Freight & Logistics", level: "subindustry", parentSlug: "air-freight-logistics", searchKeywords: ["air cargo", "freight logistics", "courier", "package delivery", "warehousing"] },
  { slug: "airlines-sub", name: "Airlines", level: "subindustry", parentSlug: "airlines", searchKeywords: ["commercial airline", "passenger airline", "low-cost carrier", "air travel booking"] },
  { slug: "marine-sub", name: "Marine", level: "subindustry", parentSlug: "marine", searchKeywords: ["shipping line", "container shipping", "marine transport", "vessel operator"] },
  { slug: "railroads", name: "Railroads", level: "subindustry", parentSlug: "road-rail", searchKeywords: ["railroad", "freight rail", "train", "locomotive", "rail operator", "union pacific", "bnsf"] },
  { slug: "trucking", name: "Trucking", level: "subindustry", parentSlug: "road-rail", searchKeywords: ["trucking", "truck fleet", "long haul", "freight trucking", "ltl", "truckload"] },
  { slug: "airport-services", name: "Airport Services", level: "subindustry", parentSlug: "transportation-infrastructure", searchKeywords: ["airport operator", "airport services", "ground handling", "air traffic"] },
  { slug: "highways-railtracks", name: "Highways & Railtracks", level: "subindustry", parentSlug: "transportation-infrastructure", searchKeywords: ["toll road", "highway operator", "rail track", "road infrastructure"] },
  { slug: "marine-ports-services", name: "Marine Ports & Services", level: "subindustry", parentSlug: "transportation-infrastructure", searchKeywords: ["port operator", "container terminal", "harbor", "dock", "port authority"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 4: CONSUMER DISCRETIONARY
  // ═══════════════════════════════════════════════════
  { slug: "consumer-discretionary", name: "Consumer Discretionary", level: "sector", parentSlug: null, searchKeywords: ["retail", "fashion", "luxury", "auto", "car", "restaurant", "hotel", "travel", "gaming", "entertainment", "streaming"] },
  { slug: "automobiles-components", name: "Automobiles & Components", level: "group", parentSlug: "consumer-discretionary", searchKeywords: ["automobile", "car", "vehicle", "auto parts", "ev", "electric vehicle"] },
  { slug: "consumer-durables-apparel", name: "Consumer Durables & Apparel", level: "group", parentSlug: "consumer-discretionary", searchKeywords: ["consumer electronics", "home furnishings", "apparel", "fashion", "footwear"] },
  { slug: "consumer-services", name: "Consumer Services", level: "group", parentSlug: "consumer-discretionary", searchKeywords: ["hotels", "restaurants", "leisure", "education", "cruise", "theme park"] },
  { slug: "retailing", name: "Retailing", level: "group", parentSlug: "consumer-discretionary", searchKeywords: ["retail", "e-commerce", "shopping", "stores", "amazon", "walmart", "online shopping"] },
  { slug: "auto-components", name: "Auto Components", level: "industry", parentSlug: "automobiles-components", searchKeywords: ["auto parts", "car parts", "brake", "suspension", "tire", "auto supplier"] },
  { slug: "automobiles", name: "Automobiles", level: "industry", parentSlug: "automobiles-components", searchKeywords: ["car manufacturer", "automaker", "tesla", "toyota", "ford", "gm", "bmw", "electric vehicle", "ev sales"] },
  { slug: "household-durables", name: "Household Durables", level: "industry", parentSlug: "consumer-durables-apparel", searchKeywords: ["appliances", "home furnishings", "furniture", "kitchenware", "homebuilding"] },
  { slug: "leisure-products", name: "Leisure Products", level: "industry", parentSlug: "consumer-durables-apparel", searchKeywords: ["toys", "games", "sporting goods", "outdoor equipment", "bicycles", "fitness equipment"] },
  { slug: "textiles-apparel-luxury", name: "Textiles, Apparel & Luxury Goods", level: "industry", parentSlug: "consumer-durables-apparel", searchKeywords: ["fashion", "luxury", "apparel", "clothing", "nike", "lvmh", "gucci", "designer", "footwear"] },
  { slug: "hotels-restaurants-leisure", name: "Hotels, Restaurants & Leisure", level: "industry", parentSlug: "consumer-services", searchKeywords: ["hotel", "restaurant", "fast food", "cruise", "casino", "theme park", "marriott", "mcdonald", "starbucks"] },
  { slug: "diversified-consumer-services", name: "Diversified Consumer Services", level: "industry", parentSlug: "consumer-services", searchKeywords: ["education services", "consumer services", "online education", "tutoring", "personal services"] },
  { slug: "distributors", name: "Distributors", level: "industry", parentSlug: "retailing", searchKeywords: ["distribution", "wholesale distribution", "consumer distributors"] },
  { slug: "internet-direct-marketing-retail", name: "Internet & Direct Marketing Retail", level: "industry", parentSlug: "retailing", searchKeywords: ["e-commerce", "online retail", "amazon", "shopify", "online shopping", "direct to consumer"] },
  { slug: "multiline-retail", name: "Multiline Retail", level: "industry", parentSlug: "retailing", searchKeywords: ["department store", "discount store", "target", "walmart", "dollar store", "general merchandise"] },
  { slug: "specialty-retail", name: "Specialty Retail", level: "industry", parentSlug: "retailing", searchKeywords: ["specialty store", "home depot", "best buy", "auto parts store", "pet store", "book store"] },
  { slug: "auto-parts-equipment", name: "Auto Parts & Equipment", level: "subindustry", parentSlug: "auto-components", searchKeywords: ["auto parts manufacturer", "car parts supplier", "oem parts", "aftermarket parts"] },
  { slug: "tires-rubber", name: "Tires & Rubber", level: "subindustry", parentSlug: "auto-components", searchKeywords: ["tire manufacturer", "rubber", "goodyear", "michelin", "bridgestone", "tire sales"] },
  { slug: "automobile-manufacturers", name: "Automobile Manufacturers", level: "subindustry", parentSlug: "automobiles", searchKeywords: ["car maker", "auto manufacturer", "tesla", "ford", "gm", "toyota", "ev maker"] },
  { slug: "motorcycle-manufacturers", name: "Motorcycle Manufacturers", level: "subindustry", parentSlug: "automobiles", searchKeywords: ["motorcycle", "harley davidson", "yamaha", "honda motorcycle", "electric motorcycle"] },
  { slug: "consumer-electronics", name: "Consumer Electronics", level: "subindustry", parentSlug: "household-durables", searchKeywords: ["consumer electronics", "smart home", "tv", "audio", "wearable", "headphones"] },
  { slug: "home-furnishings", name: "Home Furnishings", level: "subindustry", parentSlug: "household-durables", searchKeywords: ["furniture", "home decor", "mattress", "lighting", "curtains", "rugs"] },
  { slug: "homebuilding", name: "Homebuilding", level: "subindustry", parentSlug: "household-durables", searchKeywords: ["homebuilder", "new homes", "residential construction", "housing starts", "lennar", "pulte"] },
  { slug: "household-appliances", name: "Household Appliances", level: "subindustry", parentSlug: "household-durables", searchKeywords: ["appliances", "washing machine", "refrigerator", "dishwasher", "whirlpool", "lg appliances"] },
  { slug: "housewares-specialties", name: "Housewares & Specialties", level: "subindustry", parentSlug: "household-durables", searchKeywords: ["housewares", "kitchenware", "cookware", "home accessories", "garden tools"] },
  { slug: "leisure-products-sub", name: "Leisure Products", level: "subindustry", parentSlug: "leisure-products", searchKeywords: ["toys manufacturer", "sporting goods maker", "recreation equipment", "hasbro", "mattel"] },
  { slug: "apparel-accessories-luxury", name: "Apparel, Accessories & Luxury Goods", level: "subindustry", parentSlug: "textiles-apparel-luxury", searchKeywords: ["luxury brands", "designer fashion", "handbags", "watches", "jewelry", "ralph lauren"] },
  { slug: "footwear", name: "Footwear", level: "subindustry", parentSlug: "textiles-apparel-luxury", searchKeywords: ["shoes", "sneakers", "nike", "adidas", "new balance", "footwear brand", "boots"] },
  { slug: "textiles", name: "Textiles", level: "subindustry", parentSlug: "textiles-apparel-luxury", searchKeywords: ["textile", "fabric", "yarn", "cotton", "synthetic fiber", "textile mill"] },
  { slug: "casinos-gaming", name: "Casinos & Gaming", level: "subindustry", parentSlug: "hotels-restaurants-leisure", searchKeywords: ["casino", "gambling", "las vegas", "gaming", "slot machine", "mgm", "wynn"] },
  { slug: "hotels-resorts-cruise", name: "Hotels, Resorts & Cruise Lines", level: "subindustry", parentSlug: "hotels-restaurants-leisure", searchKeywords: ["hotel chain", "resort", "cruise line", "marriott", "hilton", "carnival", "royal caribbean"] },
  { slug: "leisure-facilities", name: "Leisure Facilities", level: "subindustry", parentSlug: "hotels-restaurants-leisure", searchKeywords: ["theme park", "gym", "fitness center", "amusement park", "water park", "disney parks"] },
  { slug: "restaurants", name: "Restaurants", level: "subindustry", parentSlug: "hotels-restaurants-leisure", searchKeywords: ["restaurant chain", "fast food", "mcdonald", "starbucks", "chipotle", "dining", "pizza"] },
  { slug: "education-services", name: "Education Services", level: "subindustry", parentSlug: "diversified-consumer-services", searchKeywords: ["education company", "online learning", "tutoring", "test prep", "student loan", "university"] },
  { slug: "specialized-consumer-services", name: "Specialized Consumer Services", level: "subindustry", parentSlug: "diversified-consumer-services", searchKeywords: ["consumer services", "funeral services", "auction", "personal services"] },
  { slug: "distributors-sub", name: "Distributors", level: "subindustry", parentSlug: "distributors", searchKeywords: ["consumer goods distributor", "wholesale consumer", "product distribution"] },
  { slug: "internet-direct-marketing-retail-sub", name: "Internet & Direct Marketing Retail", level: "subindustry", parentSlug: "internet-direct-marketing-retail", searchKeywords: ["online retailer", "e-commerce platform", "amazon", "ebay", "etsy", "shopify stores"] },
  { slug: "department-stores", name: "Department Stores", level: "subindustry", parentSlug: "multiline-retail", searchKeywords: ["department store", "macy's", "nordstrom", "kohl's", "jcpenney"] },
  { slug: "general-merchandise-stores", name: "General Merchandise Stores", level: "subindustry", parentSlug: "multiline-retail", searchKeywords: ["general merchandise", "dollar store", "dollar general", "dollar tree", "five below"] },
  { slug: "apparel-retail", name: "Apparel Retail", level: "subindustry", parentSlug: "specialty-retail", searchKeywords: ["clothing store", "fashion retail", "gap", "h&m", "zara", "old navy"] },
  { slug: "computer-electronics-retail", name: "Computer & Electronics Retail", level: "subindustry", parentSlug: "specialty-retail", searchKeywords: ["electronics store", "best buy", "apple store", "computer store", "tech retail"] },
  { slug: "home-improvement-retail", name: "Home Improvement Retail", level: "subindustry", parentSlug: "specialty-retail", searchKeywords: ["home depot", "lowe's", "home improvement", "hardware store", "building supply"] },
  { slug: "specialty-stores", name: "Specialty Stores", level: "subindustry", parentSlug: "specialty-retail", searchKeywords: ["pet store", "craft store", "book store", "office supply", "auto parts retail"] },
  { slug: "automotive-retail", name: "Automotive Retail", level: "subindustry", parentSlug: "specialty-retail", searchKeywords: ["car dealership", "auto dealer", "used cars", "autozone", "o'reilly auto", "car sales"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 5: CONSUMER STAPLES
  // ═══════════════════════════════════════════════════
  { slug: "consumer-staples", name: "Consumer Staples", level: "sector", parentSlug: null, searchKeywords: ["food", "beverage", "grocery", "household", "tobacco", "cosmetics", "personal care", "supermarket"] },
  { slug: "food-staples-retailing", name: "Food & Staples Retailing", level: "group", parentSlug: "consumer-staples", searchKeywords: ["grocery store", "supermarket", "food retail", "walmart grocery", "kroger"] },
  { slug: "food-beverage-tobacco", name: "Food, Beverage & Tobacco", level: "group", parentSlug: "consumer-staples", searchKeywords: ["food company", "beverage company", "tobacco", "snacks", "drinks"] },
  { slug: "household-personal-products", name: "Household & Personal Products", level: "group", parentSlug: "consumer-staples", searchKeywords: ["household products", "personal care", "cleaning products", "beauty", "cosmetics"] },
  { slug: "food-staples-retailing-ind", name: "Food & Staples Retailing", level: "industry", parentSlug: "food-staples-retailing", searchKeywords: ["grocery chain", "food store", "costco", "kroger", "albertsons", "whole foods"] },
  { slug: "beverages", name: "Beverages", level: "industry", parentSlug: "food-beverage-tobacco", searchKeywords: ["beverage", "coca-cola", "pepsi", "beer", "wine", "spirits", "soft drink", "juice", "energy drink"] },
  { slug: "food-products", name: "Food Products", level: "industry", parentSlug: "food-beverage-tobacco", searchKeywords: ["food manufacturer", "packaged food", "snacks", "cereal", "dairy", "meat processing", "frozen food"] },
  { slug: "tobacco", name: "Tobacco", level: "industry", parentSlug: "food-beverage-tobacco", searchKeywords: ["tobacco", "cigarette", "vaping", "e-cigarette", "philip morris", "altria", "smoking"] },
  { slug: "household-products", name: "Household Products", level: "industry", parentSlug: "household-personal-products", searchKeywords: ["household products", "cleaning", "detergent", "procter gamble", "clorox", "paper towels"] },
  { slug: "personal-products", name: "Personal Products", level: "industry", parentSlug: "household-personal-products", searchKeywords: ["personal care", "cosmetics", "beauty", "skincare", "shampoo", "deodorant", "loreal", "estee lauder"] },
  { slug: "drug-retail", name: "Drug Retail", level: "subindustry", parentSlug: "food-staples-retailing-ind", searchKeywords: ["pharmacy", "drugstore", "cvs", "walgreens", "rite aid", "prescription"] },
  { slug: "food-distributors", name: "Food Distributors", level: "subindustry", parentSlug: "food-staples-retailing-ind", searchKeywords: ["food distribution", "sysco", "us foods", "food service distributor"] },
  { slug: "food-retail", name: "Food Retail", level: "subindustry", parentSlug: "food-staples-retailing-ind", searchKeywords: ["grocery store", "supermarket chain", "food retailer", "organic grocery"] },
  { slug: "hypermarkets-super-centers", name: "Hypermarkets & Super Centers", level: "subindustry", parentSlug: "food-staples-retailing-ind", searchKeywords: ["hypermarket", "supercenter", "walmart", "costco", "sam's club", "big box"] },
  { slug: "brewers", name: "Brewers", level: "subindustry", parentSlug: "beverages", searchKeywords: ["brewery", "beer", "craft beer", "anheuser busch", "heineken", "brewing"] },
  { slug: "distillers-vintners", name: "Distillers & Vintners", level: "subindustry", parentSlug: "beverages", searchKeywords: ["distillery", "wine", "spirits", "whiskey", "vodka", "rum", "diageo", "constellation"] },
  { slug: "soft-drinks", name: "Soft Drinks", level: "subindustry", parentSlug: "beverages", searchKeywords: ["soft drink", "soda", "coca-cola", "pepsi", "energy drink", "juice", "bottled water"] },
  { slug: "agricultural-products", name: "Agricultural Products", level: "subindustry", parentSlug: "food-products", searchKeywords: ["agriculture", "farming", "crops", "grain", "wheat", "corn", "soybeans", "cattle"] },
  { slug: "packaged-foods-meats", name: "Packaged Foods & Meats", level: "subindustry", parentSlug: "food-products", searchKeywords: ["packaged food", "meat processing", "snacks", "frozen food", "nestle", "kraft", "tyson"] },
  { slug: "tobacco-sub", name: "Tobacco", level: "subindustry", parentSlug: "tobacco", searchKeywords: ["tobacco company", "cigarette maker", "vaping company", "nicotine"] },
  { slug: "household-products-sub", name: "Household Products", level: "subindustry", parentSlug: "household-products", searchKeywords: ["household cleaning", "laundry", "dish soap", "air freshener", "trash bags"] },
  { slug: "personal-products-sub", name: "Personal Products", level: "subindustry", parentSlug: "personal-products", searchKeywords: ["beauty products", "skincare brand", "hair care", "cosmetics brand", "fragrance"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 6: HEALTH CARE
  // ═══════════════════════════════════════════════════
  { slug: "health-care", name: "Health Care", level: "sector", parentSlug: null, searchKeywords: ["health", "medical", "pharma", "biotech", "hospital", "drug", "vaccine", "clinical", "fda", "therapy"] },
  { slug: "health-care-equipment-services", name: "Health Care Equipment & Services", level: "group", parentSlug: "health-care", searchKeywords: ["medical devices", "health care services", "hospital", "medical equipment"] },
  { slug: "pharma-biotech-life-sciences", name: "Pharmaceuticals, Biotechnology & Life Sciences", level: "group", parentSlug: "health-care", searchKeywords: ["pharma", "biotech", "drug development", "clinical trial", "life sciences"] },
  { slug: "health-care-equipment-supplies", name: "Health Care Equipment & Supplies", level: "industry", parentSlug: "health-care-equipment-services", searchKeywords: ["medical devices", "surgical", "implants", "diagnostic equipment", "medtronic", "abbott"] },
  { slug: "health-care-providers-services", name: "Health Care Providers & Services", level: "industry", parentSlug: "health-care-equipment-services", searchKeywords: ["hospital", "health insurance", "managed care", "unitedhealth", "cvs health", "clinic"] },
  { slug: "health-care-technology", name: "Health Care Technology", level: "industry", parentSlug: "health-care-equipment-services", searchKeywords: ["health tech", "electronic health records", "telemedicine", "healthIT", "medical software"] },
  { slug: "biotechnology", name: "Biotechnology", level: "industry", parentSlug: "pharma-biotech-life-sciences", searchKeywords: ["biotech", "gene therapy", "crispr", "amgen", "gilead", "moderna", "biologic drug", "cell therapy"] },
  { slug: "pharmaceuticals", name: "Pharmaceuticals", level: "industry", parentSlug: "pharma-biotech-life-sciences", searchKeywords: ["pharma", "drug", "pfizer", "johnson johnson", "merck", "novartis", "fda approval", "prescription drug"] },
  { slug: "life-sciences-tools-services", name: "Life Sciences Tools & Services", level: "industry", parentSlug: "pharma-biotech-life-sciences", searchKeywords: ["life sciences", "laboratory", "research tools", "thermo fisher", "danaher", "lab equipment", "cro"] },
  { slug: "health-care-equipment", name: "Health Care Equipment", level: "subindustry", parentSlug: "health-care-equipment-supplies", searchKeywords: ["medical equipment", "surgical instruments", "mri", "ct scan", "pacemaker", "stent"] },
  { slug: "health-care-supplies", name: "Health Care Supplies", level: "subindustry", parentSlug: "health-care-equipment-supplies", searchKeywords: ["medical supplies", "bandage", "syringe", "gloves", "ppe", "wound care"] },
  { slug: "health-care-distributors", name: "Health Care Distributors", level: "subindustry", parentSlug: "health-care-providers-services", searchKeywords: ["medical distribution", "drug distribution", "mckesson", "cardinal health", "amerisource"] },
  { slug: "health-care-services-sub", name: "Health Care Services", level: "subindustry", parentSlug: "health-care-providers-services", searchKeywords: ["outpatient", "urgent care", "dialysis", "lab testing", "home health"] },
  { slug: "health-care-facilities", name: "Health Care Facilities", level: "subindustry", parentSlug: "health-care-providers-services", searchKeywords: ["hospital chain", "medical center", "nursing home", "rehab facility", "hca healthcare"] },
  { slug: "managed-health-care", name: "Managed Health Care", level: "subindustry", parentSlug: "health-care-providers-services", searchKeywords: ["health insurance", "managed care", "hmo", "ppo", "unitedhealth", "anthem", "cigna", "aetna"] },
  { slug: "health-care-technology-sub", name: "Health Care Technology", level: "subindustry", parentSlug: "health-care-technology", searchKeywords: ["healthIT", "ehr", "electronic health", "telemedicine platform", "medical software"] },
  { slug: "biotechnology-sub", name: "Biotechnology", level: "subindustry", parentSlug: "biotechnology", searchKeywords: ["biotech company", "gene editing", "monoclonal antibody", "biosimilar", "immunotherapy"] },
  { slug: "pharmaceuticals-sub", name: "Pharmaceuticals", level: "subindustry", parentSlug: "pharmaceuticals", searchKeywords: ["drug maker", "pharmaceutical company", "generic drug", "brand drug", "clinical trial results"] },
  { slug: "life-sciences-tools-services-sub", name: "Life Sciences Tools & Services", level: "subindustry", parentSlug: "life-sciences-tools-services", searchKeywords: ["lab instruments", "genomics tools", "clinical research organization", "contract research"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 7: FINANCIALS
  // ═══════════════════════════════════════════════════
  { slug: "financials", name: "Financials", level: "sector", parentSlug: null, searchKeywords: ["bank", "finance", "insurance", "invest", "stock", "trading", "mortgage", "loan", "credit", "fintech", "payment"] },
  { slug: "banks-group", name: "Banks", level: "group", parentSlug: "financials", searchKeywords: ["banking", "bank", "lending", "deposit", "jpmorgan", "bank of america"] },
  { slug: "diversified-financials", name: "Diversified Financials", level: "group", parentSlug: "financials", searchKeywords: ["financial services", "asset management", "investment banking", "consumer finance", "fintech"] },
  { slug: "insurance-group", name: "Insurance", level: "group", parentSlug: "financials", searchKeywords: ["insurance", "underwriting", "claims", "premium", "policyholder"] },
  { slug: "banks", name: "Banks", level: "industry", parentSlug: "banks-group", searchKeywords: ["bank", "banking", "jpmorgan", "wells fargo", "citigroup", "bank of america", "deposit", "lending"] },
  { slug: "diversified-financial-services", name: "Diversified Financial Services", level: "industry", parentSlug: "diversified-financials", searchKeywords: ["financial services", "berkshire hathaway", "financial conglomerate", "multi-line finance"] },
  { slug: "consumer-finance", name: "Consumer Finance", level: "industry", parentSlug: "diversified-financials", searchKeywords: ["consumer lending", "credit card", "student loan", "auto loan", "visa", "mastercard", "american express"] },
  { slug: "capital-markets", name: "Capital Markets", level: "industry", parentSlug: "diversified-financials", searchKeywords: ["wall street", "investment bank", "stock exchange", "nasdaq", "nyse", "brokerage", "hedge fund", "private equity"] },
  { slug: "insurance", name: "Insurance", level: "industry", parentSlug: "insurance-group", searchKeywords: ["insurance company", "life insurance", "auto insurance", "home insurance", "health insurance", "reinsurance"] },
  { slug: "diversified-banks", name: "Diversified Banks", level: "subindustry", parentSlug: "banks", searchKeywords: ["large bank", "universal bank", "jpmorgan", "citibank", "global bank", "commercial bank"] },
  { slug: "regional-banks", name: "Regional Banks", level: "subindustry", parentSlug: "banks", searchKeywords: ["regional bank", "community bank", "local bank", "pnc", "us bancorp", "truist"] },
  { slug: "other-diversified-financial-services", name: "Other Diversified Financial Services", level: "subindustry", parentSlug: "diversified-financial-services", searchKeywords: ["diversified finance", "financial holding", "multi-sector finance"] },
  { slug: "multi-sector-holdings", name: "Multi-Sector Holdings", level: "subindustry", parentSlug: "diversified-financial-services", searchKeywords: ["holding company", "berkshire", "conglomerate", "investment holding"] },
  { slug: "specialized-finance", name: "Specialized Finance", level: "subindustry", parentSlug: "diversified-financial-services", searchKeywords: ["specialty finance", "leasing", "factoring", "mortgage reit", "specialty lender"] },
  { slug: "consumer-finance-sub", name: "Consumer Finance", level: "subindustry", parentSlug: "consumer-finance", searchKeywords: ["credit card company", "consumer lender", "payday loan", "personal loan", "buy now pay later"] },
  { slug: "asset-management-custody-banks", name: "Asset Management & Custody Banks", level: "subindustry", parentSlug: "capital-markets", searchKeywords: ["asset manager", "mutual fund", "etf", "blackrock", "vanguard", "state street", "custody bank"] },
  { slug: "investment-banking-brokerage", name: "Investment Banking & Brokerage", level: "subindustry", parentSlug: "capital-markets", searchKeywords: ["investment bank", "broker", "goldman sachs", "morgan stanley", "merrill lynch", "ipo underwriter"] },
  { slug: "diversified-capital-markets", name: "Diversified Capital Markets", level: "subindustry", parentSlug: "capital-markets", searchKeywords: ["capital markets", "securities", "trading firm", "market maker", "financial markets"] },
  { slug: "insurance-brokers", name: "Insurance Brokers", level: "subindustry", parentSlug: "insurance", searchKeywords: ["insurance broker", "marsh", "aon", "willis towers", "insurance agent"] },
  { slug: "life-health-insurance", name: "Life & Health Insurance", level: "subindustry", parentSlug: "insurance", searchKeywords: ["life insurance", "health insurance", "metlife", "prudential", "aflac", "disability insurance"] },
  { slug: "multi-line-insurance", name: "Multi-line Insurance", level: "subindustry", parentSlug: "insurance", searchKeywords: ["multi-line insurer", "aig", "allstate", "travelers", "bundled insurance"] },
  { slug: "property-casualty-insurance", name: "Property & Casualty Insurance", level: "subindustry", parentSlug: "insurance", searchKeywords: ["property insurance", "casualty insurance", "auto insurance", "home insurance", "geico", "progressive"] },
  { slug: "reinsurance", name: "Reinsurance", level: "subindustry", parentSlug: "insurance", searchKeywords: ["reinsurance", "reinsurer", "munich re", "swiss re", "berkshire reinsurance"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 8: INFORMATION TECHNOLOGY
  // ═══════════════════════════════════════════════════
  { slug: "information-technology", name: "Information Technology", level: "sector", parentSlug: null, searchKeywords: ["tech", "software", "hardware", "computer", "chip", "semiconductor", "ai", "cloud", "saas", "cyber", "data"] },
  { slug: "software-services", name: "Software & Services", level: "group", parentSlug: "information-technology", searchKeywords: ["software", "it services", "cloud computing", "saas", "enterprise software"] },
  { slug: "technology-hardware-equipment", name: "Technology Hardware & Equipment", level: "group", parentSlug: "information-technology", searchKeywords: ["hardware", "computer", "networking", "server", "storage", "peripheral"] },
  { slug: "semiconductors-equipment", name: "Semiconductors & Semiconductor Equipment", level: "group", parentSlug: "information-technology", searchKeywords: ["semiconductor", "chip", "wafer", "fab", "chipmaker"] },
  { slug: "it-services", name: "IT Services", level: "industry", parentSlug: "software-services", searchKeywords: ["it consulting", "it outsourcing", "accenture", "ibm services", "infosys", "tcs", "cloud services"] },
  { slug: "software", name: "Software", level: "industry", parentSlug: "software-services", searchKeywords: ["software", "microsoft", "adobe", "salesforce", "oracle", "sap", "enterprise software", "cloud app"] },
  { slug: "communications-equipment", name: "Communications Equipment", level: "industry", parentSlug: "technology-hardware-equipment", searchKeywords: ["networking", "router", "switch", "cisco", "juniper", "5g equipment", "telecom equipment"] },
  { slug: "technology-hardware-storage-peripherals", name: "Technology Hardware, Storage & Peripherals", level: "industry", parentSlug: "technology-hardware-equipment", searchKeywords: ["computer", "laptop", "apple", "dell", "hp", "storage", "printer", "keyboard", "mouse"] },
  { slug: "electronic-equipment-instruments-components", name: "Electronic Equipment, Instruments & Components", level: "industry", parentSlug: "technology-hardware-equipment", searchKeywords: ["electronic equipment", "instruments", "sensors", "connectors", "pcb", "display", "test equipment"] },
  { slug: "semiconductors-equipment-ind", name: "Semiconductors & Semiconductor Equipment", level: "industry", parentSlug: "semiconductors-equipment", searchKeywords: ["chip", "semiconductor", "nvidia", "intel", "amd", "tsmc", "qualcomm", "asml", "chip shortage"] },
  { slug: "it-consulting-other-services", name: "IT Consulting & Other Services", level: "subindustry", parentSlug: "it-services", searchKeywords: ["it consulting", "technology consulting", "digital transformation", "managed services"] },
  { slug: "data-processing-outsourced-services", name: "Data Processing & Outsourced Services", level: "subindustry", parentSlug: "it-services", searchKeywords: ["data processing", "payment processing", "visa", "mastercard", "paypal", "bpo", "outsourcing"] },
  { slug: "application-software", name: "Application Software", level: "subindustry", parentSlug: "software", searchKeywords: ["app software", "saas", "salesforce", "adobe", "zoom", "slack", "productivity software"] },
  { slug: "systems-software", name: "Systems Software", level: "subindustry", parentSlug: "software", searchKeywords: ["operating system", "database", "microsoft windows", "linux", "vmware", "cybersecurity software", "oracle database"] },
  { slug: "communications-equipment-sub", name: "Communications Equipment", level: "subindustry", parentSlug: "communications-equipment", searchKeywords: ["network hardware", "router manufacturer", "switch maker", "fiber optic equipment"] },
  { slug: "technology-hardware-storage-peripherals-sub", name: "Technology Hardware, Storage & Peripherals", level: "subindustry", parentSlug: "technology-hardware-storage-peripherals", searchKeywords: ["pc maker", "laptop brand", "storage array", "external drive", "peripheral device"] },
  { slug: "electronic-equipment-instruments", name: "Electronic Equipment & Instruments", level: "subindustry", parentSlug: "electronic-equipment-instruments-components", searchKeywords: ["test equipment", "measurement", "oscilloscope", "multimeter", "keysight"] },
  { slug: "electronic-components", name: "Electronic Components", level: "subindustry", parentSlug: "electronic-equipment-instruments-components", searchKeywords: ["capacitor", "resistor", "connector", "pcb", "printed circuit board", "passive components"] },
  { slug: "electronic-manufacturing-services", name: "Electronic Manufacturing Services", level: "subindustry", parentSlug: "electronic-equipment-instruments-components", searchKeywords: ["ems", "foxconn", "jabil", "flex", "contract manufacturing", "pcb assembly"] },
  { slug: "technology-distributors", name: "Technology Distributors", level: "subindustry", parentSlug: "electronic-equipment-instruments-components", searchKeywords: ["tech distributor", "arrow electronics", "avnet", "ingram micro", "it distribution"] },
  { slug: "semiconductor-equipment", name: "Semiconductor Equipment", level: "subindustry", parentSlug: "semiconductors-equipment-ind", searchKeywords: ["semiconductor equipment", "asml", "applied materials", "lam research", "lithography", "wafer fab equipment"] },
  { slug: "semiconductors", name: "Semiconductors", level: "subindustry", parentSlug: "semiconductors-equipment-ind", searchKeywords: ["chip maker", "nvidia", "intel", "amd", "tsmc", "qualcomm", "broadcom", "gpu", "cpu", "ai chip"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 9: COMMUNICATION SERVICES
  // ═══════════════════════════════════════════════════
  { slug: "communication-services", name: "Communication Services", level: "sector", parentSlug: null, searchKeywords: ["telecom", "5g", "social media", "advertising", "broadcast", "cable", "internet", "streaming", "content"] },
  { slug: "telecommunication-services", name: "Telecommunication Services", level: "group", parentSlug: "communication-services", searchKeywords: ["telecom", "phone", "wireless", "5g", "broadband", "fiber"] },
  { slug: "media-entertainment", name: "Media & Entertainment", level: "group", parentSlug: "communication-services", searchKeywords: ["media", "entertainment", "streaming", "movies", "gaming", "advertising", "publishing"] },
  { slug: "diversified-telecom-services", name: "Diversified Telecommunication Services", level: "industry", parentSlug: "telecommunication-services", searchKeywords: ["telecom provider", "at&t", "verizon", "t-mobile", "broadband", "fiber internet"] },
  { slug: "wireless-telecom-services", name: "Wireless Telecommunication Services", level: "industry", parentSlug: "telecommunication-services", searchKeywords: ["wireless", "mobile", "5g network", "cell tower", "mobile carrier", "spectrum"] },
  { slug: "media", name: "Media", level: "industry", parentSlug: "media-entertainment", searchKeywords: ["media company", "advertising", "newspaper", "magazine", "billboard", "tv network", "broadcast"] },
  { slug: "entertainment", name: "Entertainment", level: "industry", parentSlug: "media-entertainment", searchKeywords: ["entertainment", "movie studio", "music label", "video game", "disney", "netflix", "warner", "sony pictures"] },
  { slug: "interactive-media-services", name: "Interactive Media & Services", level: "industry", parentSlug: "media-entertainment", searchKeywords: ["social media", "google", "meta", "facebook", "instagram", "tiktok", "youtube", "twitter", "search engine"] },
  { slug: "alternative-carriers", name: "Alternative Carriers", level: "subindustry", parentSlug: "diversified-telecom-services", searchKeywords: ["alternative carrier", "wholesale telecom", "competitive carrier", "clec"] },
  { slug: "integrated-telecom-services", name: "Integrated Telecommunication Services", level: "subindustry", parentSlug: "diversified-telecom-services", searchKeywords: ["integrated telecom", "at&t", "verizon", "comcast", "charter", "bundled services"] },
  { slug: "wireless-telecom-services-sub", name: "Wireless Telecommunication Services", level: "subindustry", parentSlug: "wireless-telecom-services", searchKeywords: ["mobile operator", "wireless carrier", "t-mobile", "cell phone service", "5g rollout"] },
  { slug: "advertising", name: "Advertising", level: "subindustry", parentSlug: "media", searchKeywords: ["advertising", "ad agency", "digital advertising", "google ads", "programmatic", "omnicom", "wpp"] },
  { slug: "broadcasting", name: "Broadcasting", level: "subindustry", parentSlug: "media", searchKeywords: ["tv broadcast", "radio", "television network", "cbs", "nbc", "abc", "fox", "local tv"] },
  { slug: "cable-satellite", name: "Cable & Satellite", level: "subindustry", parentSlug: "media", searchKeywords: ["cable tv", "satellite tv", "comcast", "dish", "directv", "cable operator"] },
  { slug: "publishing", name: "Publishing", level: "subindustry", parentSlug: "media", searchKeywords: ["publisher", "newspaper", "book publisher", "magazine", "new york times", "digital publishing"] },
  { slug: "movies-entertainment", name: "Movies & Entertainment", level: "subindustry", parentSlug: "entertainment", searchKeywords: ["movie studio", "film", "disney", "warner bros", "universal", "box office", "streaming service"] },
  { slug: "interactive-home-entertainment", name: "Interactive Home Entertainment", level: "subindustry", parentSlug: "entertainment", searchKeywords: ["video game", "gaming", "activision", "ea", "nintendo", "playstation", "xbox", "esports"] },
  { slug: "interactive-media-services-sub", name: "Interactive Media & Services", level: "subindustry", parentSlug: "interactive-media-services", searchKeywords: ["social network", "search engine", "google", "meta", "snapchat", "pinterest", "reddit"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 10: UTILITIES
  // ═══════════════════════════════════════════════════
  { slug: "utilities", name: "Utilities", level: "sector", parentSlug: null, searchKeywords: ["utility", "water", "electricity", "power", "grid", "infrastructure", "sewage", "waste", "recycling"] },
  { slug: "utilities-group", name: "Utilities", level: "group", parentSlug: "utilities", searchKeywords: ["utility company", "power company", "electric utility", "gas utility", "water utility"] },
  { slug: "electric-utilities", name: "Electric Utilities", level: "industry", parentSlug: "utilities-group", searchKeywords: ["electric utility", "power company", "electricity provider", "duke energy", "southern company", "nextera"] },
  { slug: "gas-utilities", name: "Gas Utilities", level: "industry", parentSlug: "utilities-group", searchKeywords: ["gas utility", "natural gas distribution", "gas company", "atmos energy"] },
  { slug: "multi-utilities", name: "Multi-Utilities", level: "industry", parentSlug: "utilities-group", searchKeywords: ["multi-utility", "combined utility", "electric gas water", "dominion", "sempra"] },
  { slug: "water-utilities", name: "Water Utilities", level: "industry", parentSlug: "utilities-group", searchKeywords: ["water utility", "water company", "american water works", "water treatment", "water supply"] },
  { slug: "independent-power-renewable", name: "Independent Power and Renewable Electricity Producers", level: "industry", parentSlug: "utilities-group", searchKeywords: ["independent power", "renewable energy", "solar farm", "wind farm", "power producer", "clean energy"] },
  { slug: "electric-utilities-sub", name: "Electric Utilities", level: "subindustry", parentSlug: "electric-utilities", searchKeywords: ["electric power", "electricity generation", "transmission", "distribution", "power grid"] },
  { slug: "gas-utilities-sub", name: "Gas Utilities", level: "subindustry", parentSlug: "gas-utilities", searchKeywords: ["natural gas utility", "gas distribution", "gas pipeline utility", "gas meter"] },
  { slug: "multi-utilities-sub", name: "Multi-Utilities", level: "subindustry", parentSlug: "multi-utilities", searchKeywords: ["combined services utility", "electric and gas", "multi-service utility"] },
  { slug: "water-utilities-sub", name: "Water Utilities", level: "subindustry", parentSlug: "water-utilities", searchKeywords: ["water supply company", "water treatment plant", "sewage", "wastewater"] },
  { slug: "independent-power-producers-energy-traders", name: "Independent Power Producers & Energy Traders", level: "subindustry", parentSlug: "independent-power-renewable", searchKeywords: ["power trader", "energy trader", "independent power producer", "wholesale power"] },
  { slug: "renewable-electricity", name: "Renewable Electricity", level: "subindustry", parentSlug: "independent-power-renewable", searchKeywords: ["renewable energy", "solar power", "wind power", "green energy", "clean electricity", "solar panel farm"] },

  // ═══════════════════════════════════════════════════
  // SECTOR 11: REAL ESTATE
  // ═══════════════════════════════════════════════════
  { slug: "real-estate", name: "Real Estate", level: "sector", parentSlug: null, searchKeywords: ["real estate", "property", "housing", "mortgage", "rent", "commercial", "residential", "reit", "building"] },
  { slug: "real-estate-group", name: "Real Estate", level: "group", parentSlug: "real-estate", searchKeywords: ["real estate sector", "property market", "real estate investment"] },
  { slug: "equity-reits", name: "Equity Real Estate Investment Trusts (REITs)", level: "industry", parentSlug: "real-estate-group", searchKeywords: ["reit", "real estate investment trust", "property fund", "dividend reit"] },
  { slug: "real-estate-management-development", name: "Real Estate Management & Development", level: "industry", parentSlug: "real-estate-group", searchKeywords: ["real estate developer", "property management", "real estate company", "development"] },
  { slug: "diversified-reits", name: "Diversified REITs", level: "subindustry", parentSlug: "equity-reits", searchKeywords: ["diversified reit", "mixed property", "multi-asset reit"] },
  { slug: "industrial-reits", name: "Industrial REITs", level: "subindustry", parentSlug: "equity-reits", searchKeywords: ["industrial reit", "warehouse", "logistics reit", "prologis", "distribution center"] },
  { slug: "hotel-resort-reits", name: "Hotel & Resort REITs", level: "subindustry", parentSlug: "equity-reits", searchKeywords: ["hotel reit", "resort reit", "hospitality reit", "lodging reit"] },
  { slug: "office-reits", name: "Office REITs", level: "subindustry", parentSlug: "equity-reits", searchKeywords: ["office reit", "office building", "commercial office", "office space", "coworking"] },
  { slug: "health-care-reits", name: "Health Care REITs", level: "subindustry", parentSlug: "equity-reits", searchKeywords: ["health care reit", "medical office", "senior living", "nursing facility reit"] },
  { slug: "residential-reits", name: "Residential REITs", level: "subindustry", parentSlug: "equity-reits", searchKeywords: ["residential reit", "apartment reit", "rental property", "multifamily", "equity residential"] },
  { slug: "retail-reits", name: "Retail REITs", level: "subindustry", parentSlug: "equity-reits", searchKeywords: ["retail reit", "shopping mall", "shopping center", "strip mall", "simon property"] },
  { slug: "specialized-reits", name: "Specialized REITs", level: "subindustry", parentSlug: "equity-reits", searchKeywords: ["cell tower reit", "data center reit", "storage reit", "timber reit", "american tower", "equinix"] },
  { slug: "real-estate-operating-companies", name: "Real Estate Operating Companies", level: "subindustry", parentSlug: "real-estate-management-development", searchKeywords: ["real estate operator", "property company", "real estate holding"] },
  { slug: "real-estate-development", name: "Real Estate Development", level: "subindustry", parentSlug: "real-estate-management-development", searchKeywords: ["property developer", "real estate development", "land development", "new construction"] },
  { slug: "real-estate-services", name: "Real Estate Services", level: "subindustry", parentSlug: "real-estate-management-development", searchKeywords: ["real estate broker", "realtor", "property management", "redfin", "zillow", "real estate agent"] },
];

const slugMap = new Map<string, GicsEntry>();
for (const entry of GICS_HIERARCHY) {
  slugMap.set(entry.slug, entry);
}

export function getBySlug(slug: string): GicsEntry | undefined {
  return slugMap.get(slug);
}

export function getChildren(parentSlug: string): GicsEntry[] {
  return GICS_HIERARCHY.filter(e => e.parentSlug === parentSlug);
}

export function getParent(slug: string): GicsEntry | undefined {
  const entry = slugMap.get(slug);
  if (!entry || !entry.parentSlug) return undefined;
  return slugMap.get(entry.parentSlug);
}

export function getSiblings(slug: string): GicsEntry[] {
  const entry = slugMap.get(slug);
  if (!entry || !entry.parentSlug) return [];
  return GICS_HIERARCHY.filter(e => e.parentSlug === entry.parentSlug && e.slug !== slug);
}

export function getByLevel(level: GicsEntry["level"]): GicsEntry[] {
  return GICS_HIERARCHY.filter(e => e.level === level);
}

export function getAncestors(slug: string): GicsEntry[] {
  const ancestors: GicsEntry[] = [];
  let current = slugMap.get(slug);
  while (current?.parentSlug) {
    const parent = slugMap.get(current.parentSlug);
    if (parent) ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

export function getSectorForEntry(slug: string): GicsEntry | undefined {
  const ancestors = getAncestors(slug);
  return ancestors.find(a => a.level === "sector");
}

export function getAll(): GicsEntry[] {
  return GICS_HIERARCHY;
}
