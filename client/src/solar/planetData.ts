const T = 'https://www.solarsystemscope.com/textures/download';

export const MAIN_PLANETS = ['Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'];

export interface PlanetFacts { [key: string]: string }
export interface PlanetDatum {
  name: string; radius: number; semiMajor: number; eccentricity: number;
  color: number; emissive?: number; speed: number; axialTilt: number; rotationSpeed: number;
  texture?: string; hasRings?: boolean; inclination?: number;
  description: string; facts: PlanetFacts;
}
export interface MoonDatum {
  name: string; radius: number; distance: number; speed: number; color: number;
  inclination?: number; texture?: string; volcanic?: boolean; geyser?: boolean;
}

export const PLANET_DATA: Record<string, PlanetDatum> = {
  Sun: {
    name: "Sun", radius: 3, semiMajor: 0, eccentricity: 0,
    color: 0xffaa00, emissive: 0xffaa00, speed: 0, axialTilt: 7.25, rotationSpeed: 0.002,
    texture: `${T}/2k_sun.jpg`,
    description: "The Sun is the star at the center of our Solar System. It is a nearly perfect ball of hot plasma, heated to incandescence by nuclear fusion reactions in its core.",
    facts: { "Type": "G-type main-sequence star", "Diameter": "1,391,000 km", "Surface Temp": "5,500°C", "Age": "4.6 billion years", "Mass": "1.989 × 10³⁰ kg" }
  },
  Mercury: {
    name: "Mercury", radius: 0.4, semiMajor: 6, eccentricity: 0.206,
    color: 0xb5b5b5, emissive: 0x111111, speed: 0.8, axialTilt: 0.03, rotationSpeed: 0.001,
    texture: `${T}/2k_mercury.jpg`,
    description: "Mercury is the smallest planet in our solar system and closest to the Sun. Its surface is covered with craters and looks similar to Earth's Moon.",
    facts: { "Type": "Terrestrial", "Diameter": "4,879 km", "Day Length": "59 Earth days", "Year Length": "88 Earth days", "Moons": "0" }
  },
  Venus: {
    name: "Venus", radius: 0.7, semiMajor: 9, eccentricity: 0.007,
    color: 0xe8cda0, emissive: 0x221100, speed: 0.6, axialTilt: 177.4, rotationSpeed: -0.0005,
    texture: `${T}/2k_venus_surface.jpg`,
    description: "Venus is the second planet from the Sun. Its thick atmosphere traps heat making it the hottest planet, with surface temperatures reaching 465°C.",
    facts: { "Type": "Terrestrial", "Diameter": "12,104 km", "Day Length": "243 Earth days (retrograde)", "Year Length": "225 Earth days", "Moons": "0" }
  },
  Earth: {
    name: "Earth", radius: 0.75, semiMajor: 12.5, eccentricity: 0.017,
    color: 0x4488ff, emissive: 0x111133, speed: 0.5, axialTilt: 23.5, rotationSpeed: 0.008,
    texture: `${T}/2k_earth_daymap.jpg`,
    description: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of its surface is covered with water.",
    facts: { "Type": "Terrestrial", "Diameter": "12,756 km", "Day Length": "24 hours", "Year Length": "365.25 days", "Moons": "1" }
  },
  Mars: {
    name: "Mars", radius: 0.55, semiMajor: 16, eccentricity: 0.094,
    color: 0xcc4422, emissive: 0x220800, speed: 0.4, axialTilt: 25.19, rotationSpeed: 0.007,
    texture: `${T}/2k_mars.jpg`,
    description: "Mars is the fourth planet from the Sun, often called the Red Planet. It has the tallest volcano in the solar system — Olympus Mons — and the largest canyon — Valles Marineris.",
    facts: { "Type": "Terrestrial", "Diameter": "6,792 km", "Day Length": "24.6 hours", "Year Length": "687 Earth days", "Moons": "2" }
  },
  Jupiter: {
    name: "Jupiter", radius: 2, semiMajor: 22, eccentricity: 0.049,
    color: 0xddaa77, emissive: 0x221100, speed: 0.25, axialTilt: 3.13, rotationSpeed: 0.02,
    texture: `${T}/2k_jupiter.jpg`,
    description: "Jupiter is the fifth planet from the Sun and the largest in the Solar System. Its Great Red Spot is a storm larger than Earth that has raged for over 350 years.",
    facts: { "Type": "Gas Giant", "Diameter": "142,984 km", "Day Length": "9.9 hours", "Year Length": "11.86 Earth years", "Moons": "95" }
  },
  Saturn: {
    name: "Saturn", radius: 1.7, semiMajor: 29, eccentricity: 0.057,
    color: 0xeedd88, emissive: 0x221100, speed: 0.18, axialTilt: 26.73, rotationSpeed: 0.018,
    texture: `${T}/2k_saturn.jpg`, hasRings: true,
    description: "Saturn is the sixth planet from the Sun, best known for its spectacular ring system made of ice and rock particles ranging in size from tiny grains to boulders.",
    facts: { "Type": "Gas Giant", "Diameter": "120,536 km", "Day Length": "10.7 hours", "Year Length": "29.46 Earth years", "Moons": "146" }
  },
  Uranus: {
    name: "Uranus", radius: 1.1, semiMajor: 36, eccentricity: 0.046,
    color: 0x88ccdd, emissive: 0x112233, speed: 0.12, axialTilt: 97.77, rotationSpeed: -0.012,
    texture: `${T}/2k_uranus.jpg`,
    description: "Uranus is the seventh planet from the Sun. It rotates on its side with an axial tilt of 98°, essentially rolling around the Sun. It has 13 known rings.",
    facts: { "Type": "Ice Giant", "Diameter": "51,118 km", "Day Length": "17.2 hours", "Year Length": "84 Earth years", "Moons": "28" }
  },
  Neptune: {
    name: "Neptune", radius: 1.0, semiMajor: 42, eccentricity: 0.010,
    color: 0x3355ff, emissive: 0x111133, speed: 0.09, axialTilt: 28.32, rotationSpeed: 0.010,
    texture: `${T}/2k_neptune.jpg`,
    description: "Neptune is the eighth and farthest known planet from the Sun. It has the strongest winds in the solar system, reaching speeds of 2,100 km/h.",
    facts: { "Type": "Ice Giant", "Diameter": "49,528 km", "Day Length": "16.1 hours", "Year Length": "164.8 Earth years", "Moons": "16" }
  },
  Pluto: {
    name: "Pluto", radius: 0.2, semiMajor: 56, eccentricity: 0.248,
    color: 0xbbaa99, emissive: 0x111100, speed: 0.04, axialTilt: 122.5, rotationSpeed: -0.002,
    inclination: 0.299,
    description: "Pluto is a dwarf planet in the Kuiper Belt. Once considered the ninth planet, it was reclassified in 2006. Its heart-shaped Tombaugh Regio is made of nitrogen ice.",
    facts: { "Type": "Dwarf Planet", "Diameter": "2,377 km", "Day Length": "6.4 Earth days (retrograde)", "Year Length": "248 Earth years", "Moons": "5" }
  },
  Ceres: {
    name: "Ceres", radius: 0.15, semiMajor: 19.2, eccentricity: 0.076,
    color: 0x998877, emissive: 0x110000, speed: 0.34, axialTilt: 4, rotationSpeed: 0.015,
    description: "Ceres is the largest object in the asteroid belt and the only dwarf planet in the inner solar system. It has bright spots of sodium carbonate in its craters.",
    facts: { "Type": "Dwarf Planet", "Diameter": "940 km", "Day Length": "9 hours", "Year Length": "4.6 Earth years", "Moons": "0" }
  },
  Eris: {
    name: "Eris", radius: 0.18, semiMajor: 68, eccentricity: 0.441,
    color: 0xddddcc, emissive: 0x111111, speed: 0.022, axialTilt: 44, rotationSpeed: 0.003,
    inclination: 0.306,
    description: "Eris is one of the most massive known dwarf planets in the solar system. Its discovery in 2005 prompted the reclassification of Pluto.",
    facts: { "Type": "Dwarf Planet", "Diameter": "2,326 km", "Day Length": "25.9 hours", "Year Length": "559 Earth years", "Moons": "1" }
  },
  Makemake: {
    name: "Makemake", radius: 0.16, semiMajor: 62, eccentricity: 0.162,
    color: 0xcc9977, emissive: 0x110000, speed: 0.027, axialTilt: 29, rotationSpeed: 0.004,
    description: "Makemake is a dwarf planet in the outer Kuiper Belt, covered with frozen methane and ethane. It has no known atmosphere.",
    facts: { "Type": "Dwarf Planet", "Diameter": "~1,430 km", "Day Length": "22.8 hours", "Year Length": "305 Earth years", "Moons": "1" }
  },
  Haumea: {
    name: "Haumea", radius: 0.14, semiMajor: 60, eccentricity: 0.191,
    color: 0xddccbb, emissive: 0x111100, speed: 0.029, axialTilt: 28.2, rotationSpeed: 0.018,
    description: "Haumea is a dwarf planet with a distinctive elongated shape caused by its extremely fast rotation — a day is only 3.9 hours. It has two known moons and a ring.",
    facts: { "Type": "Dwarf Planet", "Diameter": "~1,600×1,000 km", "Day Length": "3.9 hours", "Year Length": "284 Earth years", "Moons": "2" }
  },
};

export const MOON_DATA: Record<string, MoonDatum[]> = {
  Earth: [
    { name: 'Moon', radius: 0.2, distance: 1.5, speed: 2.0, color: 0xaaaaaa, inclination: 0.09,
      texture: `${T}/2k_moon.jpg` },
  ],
  Mars: [
    { name: 'Phobos', radius: 0.07, distance: 0.75, speed: 10, color: 0x887766 },
    { name: 'Deimos', radius: 0.05, distance: 1.2, speed: 5, color: 0x998877 },
  ],
  Jupiter: [
    { name: 'Io', radius: 0.21, distance: 3.2, speed: 4.5, color: 0xffcc44, volcanic: true },
    { name: 'Europa', radius: 0.18, distance: 4.2, speed: 3.0, color: 0xeeddcc },
    { name: 'Ganymede', radius: 0.27, distance: 5.5, speed: 2.0, color: 0x998877 },
    { name: 'Callisto', radius: 0.25, distance: 7.0, speed: 1.4, color: 0x665544 },
  ],
  Saturn: [
    { name: 'Titan', radius: 0.23, distance: 4.8, speed: 1.8, color: 0xddaa55 },
    { name: 'Enceladus', radius: 0.08, distance: 3.4, speed: 3.5, color: 0xeeeeff, geyser: true },
  ],
  Uranus: [
    { name: 'Miranda', radius: 0.08, distance: 2.0, speed: 4.0, color: 0xaabbcc },
    { name: 'Titania', radius: 0.12, distance: 3.2, speed: 2.2, color: 0x99aaaa },
  ],
  Neptune: [
    { name: 'Triton', radius: 0.15, distance: 2.5, speed: -2.5, color: 0x99bbcc },
  ],
};
