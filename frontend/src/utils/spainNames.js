// Normalización para comparar nombres INE / BD con etiquetas GeoJSON del mapa
export function normalizeName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Clave = nombre de provincia en el SVG (GeoJSON). Valor = variantes que vienen del API/BD
export const PROVINCE_ALIASES = {
  "La Coruña": [
    "La Coruña",
    "A Coruña",
    "Coruña",
    "A Coruña, A",
    "Coruña, A",
  ],
  Lugo: ["Lugo"],
  Orense: ["Orense", "Ourense"],
  Pontevedra: ["Pontevedra"],
  Barcelona: ["Barcelona"],
  Gerona: ["Gerona", "Girona"],
  "Lérida": ["Lérida", "Lleida"],
  Tarragona: ["Tarragona"],
  Álava: ["Álava", "Araba/Álava", "Araba"],
  Vizcaya: ["Vizcaya", "Bizkaia"],
  Gipuzkoa: ["Gipuzkoa", "Guipúzcoa"],
  Navarra: [
    "Navarra",
    "Navarra / Nafarroa",
    "Nafarroa",
    "Navarra, Comunidad Foral de",
    "Comunidad Foral de Navarra",
  ],
  "La Rioja": ["La Rioja", "Rioja, La"],
  Ávila: ["Ávila", "Avila"],
  Burgos: ["Burgos"],
  "León": ["León", "Leon"],
  Palencia: ["Palencia"],
  Salamanca: ["Salamanca"],
  Segovia: ["Segovia"],
  Soria: ["Soria"],
  Valladolid: ["Valladolid"],
  Zamora: ["Zamora"],
  Asturias: ["Asturias", "Asturias, Principado de", "Principado de Asturias"],
  Cantabria: ["Cantabria"],
  Madrid: ["Madrid", "Comunidad de Madrid"],
  Albacete: ["Albacete"],
  "Ciudad Real": ["Ciudad Real"],
  Cuenca: ["Cuenca"],
  Guadalajara: ["Guadalajara"],
  Toledo: ["Toledo"],
  Badajoz: ["Badajoz"],
  Cáceres: ["Cáceres", "Caceres"],
  Huesca: ["Huesca"],
  Teruel: ["Teruel"],
  Zaragoza: ["Zaragoza"],
  Cataluña: ["Cataluña"],
  Valencia: ["Valencia", "València", "Valencia/València", "Valencia/Valencia"],
  Alicante: ["Alicante", "Alacant", "Alicante/Alacant"],
  Castellón: [
    "Castellón",
    "Castelló",
    "Castellon",
    "Castello",
    "Castellón/Castelló",
    "Castellon/Castello",
  ],
  "Valencia/València": ["Valencia/València"],
  "Alicante/Alacant": ["Alicante/Alacant"],
  "Castellón/Castelló": ["Castellón/Castelló"],
  "Araba/Álava": ["Araba/Álava"],
  "Bizkaia/Vizcaya": ["Bizkaia/Vizcaya"],
  "Gipuzkoa/Guipúzcoa": ["Gipuzkoa/Guipúzcoa"],
  "Gerona/Girona": ["Gerona/Girona"],
  "Lérida/Lleida": ["Lérida/Lleida"],
  "Orense/Ourense": ["Orense/Ourense"],
  "La Coruña/A Coruña": ["La Coruña/A Coruña"],
  Baleares: [
    "Baleares",
    "Islas Baleares",
    "Illes Balears",
    "Balears, Illes",
  ],
  Almería: ["Almería", "Almeria"],
  Cádiz: ["Cádiz", "Cadiz"],
  Córdoba: ["Córdoba", "Cordoba"],
  Granada: ["Granada"],
  Huelva: ["Huelva"],
  "Jaén": ["Jaén", "Jaen"],
  "Málaga": ["Málaga", "Malaga"],
  Sevilla: ["Sevilla"],
  Murcia: ["Murcia", "Región de Murcia", "Murcia, Región de"],
  "Las Palmas": [
    "Las Palmas",
    "Las Palmas de Gran Canaria",
    "Palmas, Las",
  ],
  "Santa Cruz de Tenerife": [
    "Santa Cruz de Tenerife",
    "S/C de Tenerife",
    "Santa Cruz Tenerife",
  ],
  Ceuta: ["Ceuta"],
  Melilla: ["Melilla"],
};

// Grupos de nombres equivalentes para CCAA (SVG vs API)
export const CCAA_ALIAS_GROUPS = [
  ["Andalucía", "Andalusia"],
  ["Aragon", "Aragón"],
  ["Asturias", "Principado de Asturias", "Asturias, Principado de"],
  ["Islas Baleares", "Baleares", "Illes Balears", "Balears, Illes"],
  ["Islas Canarias", "Canarias"],
  ["Cantabria"],
  ["Castilla y León", "Castilla y Leon", "Castile and León"],
  ["Castilla la Mancha", "Castilla-La Mancha", "Castilla La Mancha"],
  ["Cataluña", "Catalunya", "Catalonia"],
  ["Ceuta"],
  ["Comunidad Valenciana", "Comunitat Valenciana", "Valencian Community"],
  ["Extremadura"],
  ["Galicia"],
  ["La Rioja", "Rioja, La"],
  ["Comunidad de Madrid", "Madrid", "Madrid, Comunidad de"],
  ["Melilla"],
  ["Murcia", "Región de Murcia", "Murcia, Región de"],
  [
    "Navarra, Comunidad Foral de",
    "Navarra",
    "Comunidad Foral de Navarra",
  ],
  ["País Vasco", "Euskadi", "Basque Country"],
];

export const ccaaAliasToCanonical = {};
CCAA_ALIAS_GROUPS.forEach((group) => {
  const canonical = group[0];
  group.forEach((alias) => {
    ccaaAliasToCanonical[alias.toLowerCase()] = canonical;
  });
});

// Indica si el nombre de provincia del API corresponde a la región clicada en el mapa (GeoJSON)
export function matchesProvince(svgProvinceName, apiProvinceName) {
  if (!apiProvinceName) return false;
  if (normalizeName(svgProvinceName) === normalizeName(apiProvinceName)) {
    return true;
  }
  const nApi = normalizeName(apiProvinceName);
  const aliases = PROVINCE_ALIASES[svgProvinceName];
  const candidates = aliases ? [svgProvinceName, ...aliases] : [svgProvinceName];
  return candidates.some((c) => normalizeName(c) === nApi);
}

// Indica si el nombre de CCAA del API corresponde a la CCAA clicada en el mapa
export function matchesCCAA(svgCcaaName, apiCcaaName) {
  if (!apiCcaaName) return false;
  if (normalizeName(svgCcaaName) === normalizeName(apiCcaaName)) {
    return true;
  }
  const nApi = normalizeName(apiCcaaName);

  const groupForSvg = CCAA_ALIAS_GROUPS.find((g) =>
    g.some((x) => normalizeName(x) === normalizeName(svgCcaaName)),
  );
  if (groupForSvg) {
    return groupForSvg.some((x) => normalizeName(x) === nApi);
  }
  return normalizeName(svgCcaaName) === nApi;
}

// Suma votos del backend (claves por nombre INE) al nombre de provincia del GeoJSON (heatmap)
export function votesForMapProvince(mapProvinceName, byProvince) {
  if (!byProvince || typeof byProvince !== "object") return 0;

  const keys = PROVINCE_ALIASES[mapProvinceName];
  if (keys) {
    return keys.reduce((s, k) => s + (Number(byProvince[k]) || 0), 0);
  }

  const directValue = Number(byProvince[mapProvinceName]) || 0;
  if (directValue > 0) return directValue;

  const lowerName = mapProvinceName.toLowerCase();
  for (const [key, value] of Object.entries(byProvince)) {
    if (key.toLowerCase() === lowerName) {
      return Number(value) || 0;
    }
  }

  return 0;
}