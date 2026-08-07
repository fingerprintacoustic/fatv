/**
 * Hierarchical Channel Parser
 * Extracts continent, country, and category from M3U metadata
 * - Country: extracted from tvg-id (e.g., "123tv.de@SD" → "de" → Germany)
 * - Category: from group-title
 * - Continent: mapped from country code
 */

import { Channel, HierarchicalFilter } from "@/lib/types/iptv";

// Country code to continent mapping
const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // Africa
  dz: "Africa", ao: "Africa", bj: "Africa", bw: "Africa", bf: "Africa", bi: "Africa",
  cm: "Africa", cv: "Africa", cf: "Africa", td: "Africa", km: "Africa", cg: "Africa",
  cd: "Africa", ci: "Africa", dj: "Africa", eg: "Africa", gq: "Africa", er: "Africa",
  et: "Africa", ga: "Africa", gm: "Africa", gh: "Africa", gn: "Africa", gw: "Africa",
  ke: "Africa", ls: "Africa", lr: "Africa", ly: "Africa", mg: "Africa", mw: "Africa",
  ml: "Africa", mr: "Africa", mu: "Africa", ma: "Africa", mz: "Africa", na: "Africa",
  ne: "Africa", ng: "Africa", rw: "Africa", st: "Africa", sn: "Africa", sc: "Africa",
  sl: "Africa", so: "Africa", za: "Africa", ss: "Africa", sd: "Africa", sz: "Africa",
  tz: "Africa", tg: "Africa", tn: "Africa", ug: "Africa", zm: "Africa", zw: "Africa",

  // Asia
  af: "Asia", am: "Asia", az: "Asia", bh: "Asia", bd: "Asia", bt: "Asia", bn: "Asia",
  kh: "Asia", cn: "Asia", ge: "Asia", hk: "Asia", in: "Asia", id: "Asia", ir: "Asia",
  iq: "Asia", il: "Asia", jp: "Asia", jo: "Asia", kz: "Asia", kp: "Asia", kr: "Asia",
  kw: "Asia", kg: "Asia", la: "Asia", lb: "Asia", mo: "Asia", my: "Asia", mv: "Asia",
  mn: "Asia", mm: "Asia", np: "Asia", om: "Asia", pk: "Asia", ph: "Asia", qa: "Asia",
  sa: "Asia", sg: "Asia", lk: "Asia", sy: "Asia", tw: "Asia", tj: "Asia", th: "Asia",
  tl: "Asia", tr: "Asia", tm: "Asia", ae: "Asia", uz: "Asia", vn: "Asia", ye: "Asia",

  // Europe
  al: "Europe", ad: "Europe", at: "Europe", by: "Europe", be: "Europe", ba: "Europe",
  bg: "Europe", hr: "Europe", cy: "Europe", cz: "Europe", dk: "Europe", ee: "Europe",
  fi: "Europe", fr: "Europe", de: "Europe", gr: "Europe", hu: "Europe", is: "Europe",
  ie: "Europe", it: "Europe", xk: "Europe", lv: "Europe", li: "Europe", lt: "Europe",
  lu: "Europe", mt: "Europe", md: "Europe", mc: "Europe", me: "Europe", nl: "Europe",
  no: "Europe", pl: "Europe", pt: "Europe", ro: "Europe", ru: "Europe", sm: "Europe",
  rs: "Europe", sk: "Europe", si: "Europe", es: "Europe", se: "Europe", ch: "Europe",
  ua: "Europe", gb: "Europe", va: "Europe",

  // North America
  ag: "North America", bs: "North America", bb: "North America", bz: "North America",
  ca: "North America", cr: "North America", cu: "North America", dm: "North America",
  do: "North America", sv: "North America", gd: "North America", gt: "North America",
  ht: "North America", hn: "North America", jm: "North America", mx: "North America",
  ni: "North America", pa: "North America", kn: "North America", lc: "North America",
  vc: "North America", tt: "North America", us: "North America",

  // South America
  ar: "South America", bo: "South America", br: "South America", cl: "South America",
  co: "South America", ec: "South America", gy: "South America", py: "South America",
  pe: "South America", sr: "South America", uy: "South America", ve: "South America",

  // Oceania
  au: "Oceania", fj: "Oceania", ki: "Oceania", mh: "Oceania", fm: "Oceania",
  nr: "Oceania", nz: "Oceania", pw: "Oceania", pg: "Oceania", ws: "Oceania",
  sb: "Oceania", to: "Oceania", tv: "Oceania", vu: "Oceania",
};

/**
 * Extract country code from tvg-id
 * Format: "channelname.countrycode@quality" or "channelname@quality"
 * Example: "123tv.de@SD" → "de"
 */
function extractCountryCode(tvgId?: string): string | undefined {
  if (!tvgId) return undefined;

  // Remove @quality suffix
  const withoutQuality = tvgId.split("@")[0];

  // Get the last part after the last dot
  const parts = withoutQuality.split(".");
  if (parts.length >= 2) {
    const code = parts[parts.length - 1].toLowerCase();
    // Validate it's a 2-letter country code
    if (code.length === 2 && /^[a-z]{2}$/.test(code)) {
      return code;
    }
  }

  return undefined;
}

/**
 * Get country name from country code
 */
function getCountryName(code?: string): string | undefined {
  if (!code) return undefined;
  const countryCode = code.toLowerCase();

  // Direct mapping for common countries
  const countryNames: Record<string, string> = {
    de: "Germany", fr: "France", gb: "United Kingdom", it: "Italy", es: "Spain",
    nl: "Netherlands", be: "Belgium", ch: "Switzerland", at: "Austria", se: "Sweden",
    no: "Norway", dk: "Denmark", fi: "Finland", pl: "Poland", cz: "Czech Republic",
    hu: "Hungary", ro: "Romania", gr: "Greece", pt: "Portugal", ie: "Ireland",
    us: "United States", ca: "Canada", mx: "Mexico", br: "Brazil", ar: "Argentina",
    au: "Australia", nz: "New Zealand", jp: "Japan", cn: "China", in: "India",
    ru: "Russia", za: "South Africa", eg: "Egypt", ng: "Nigeria", ke: "Kenya",
    th: "Thailand", vn: "Vietnam", ph: "Philippines", sg: "Singapore", my: "Malaysia",
    id: "Indonesia", kr: "South Korea", tw: "Taiwan", hk: "Hong Kong", il: "Israel",
    tr: "Turkey", ua: "Ukraine", kz: "Kazakhstan", pk: "Pakistan", bd: "Bangladesh",
  };

  return countryNames[countryCode];
}

/**
 * Parse channel to extract continent, country, and category
 */
export function parseChannelHierarchy(channel: Channel): void {
  // Extract country from tvg-id
  const countryCode = extractCountryCode(channel.tvgId);
  if (countryCode) {
    channel.country = getCountryName(countryCode);
    channel.continent = COUNTRY_TO_CONTINENT[countryCode];
  }

  // Category from group-title
  if (channel.group) {
    // Handle multiple categories separated by semicolon
    const categories = channel.group.split(";").map((c) => c.trim());
    channel.category = categories[0]; // Use first category
  }
}

/**
 * Get unique continents from channels
 */
export function getUniqueContinents(channels: Channel[]): string[] {
  const continents = new Set<string>();
  for (const channel of channels) {
    if (!channel.continent) {
      parseChannelHierarchy(channel);
    }
    if (channel.continent) {
      continents.add(channel.continent);
    }
  }
  return Array.from(continents).sort();
}

/**
 * Get unique countries for a continent
 */
export function getUniqueCountries(channels: Channel[], continent: string): string[] {
  const countries = new Set<string>();
  for (const channel of channels) {
    if (!channel.continent) {
      parseChannelHierarchy(channel);
    }
    if (channel.continent === continent && channel.country) {
      countries.add(channel.country);
    }
  }
  return Array.from(countries).sort();
}

/**
 * Get unique categories for a country
 */
export function getUniqueCategories(channels: Channel[], country: string): string[] {
  const categories = new Set<string>();
  for (const channel of channels) {
    if (!channel.continent) {
      parseChannelHierarchy(channel);
    }
    if (channel.country === country && channel.category) {
      categories.add(channel.category);
    }
  }
  return Array.from(categories).sort();
}

/**
 * Filter channels by hierarchical criteria
 */
export function filterChannelsByHierarchy(
  channels: Channel[],
  filter: HierarchicalFilter
): Channel[] {
  return channels.filter((channel) => {
    if (!channel.continent) {
      parseChannelHierarchy(channel);
    }
    if (filter.continent && channel.continent !== filter.continent) return false;
    if (filter.country && channel.country !== filter.country) return false;
    if (filter.category && channel.category !== filter.category) return false;
    return true;
  });
}
