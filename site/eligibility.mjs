// Shared by the build script (Node) and the browser. Pure functions, no I/O.
// A job is classified ONCE into structured constraints; each candidate's verdict
// is then computed deterministically from their country (design doc, decisions D2/R3).

// name, aliases, definite groups, "maybe" groups (region wording that may or may not include the country)
const C = (name, aliases, groups, maybe = [], match = null) => ({ name, aliases, groups, maybe, match });
const EU = ["EU", "EUROPE", "EMEA"];
const EU_MEMBERS = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta",
  "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
];

export const COUNTRIES = [
  ...EU_MEMBERS.map((n) => C(n, n === "Czech Republic" ? ["Czechia"] : [], EU)),
  C("United Kingdom", ["UK", "U.K.", "Great Britain", "England", "Scotland"], ["EUROPE", "EMEA"]),
  C("Norway", [], ["EUROPE", "EMEA"]),
  C("Switzerland", [], ["EUROPE", "EMEA"]),
  C("Iceland", [], ["EUROPE", "EMEA"]),
  C("Serbia", [], ["EUROPE", "EMEA"]),
  C("Ukraine", [], ["EUROPE", "EMEA"]),
  C("Turkey", ["Türkiye"], ["EMEA"], ["EUROPE"]),
  C("United States", ["US", "USA", "U.S.", "U.S.A."], ["AMERICAS", "NA"]),
  C("Canada", [], ["AMERICAS", "NA"]),
  C("Mexico", [], ["AMERICAS", "LATAM"]),
  C("Brazil", [], ["AMERICAS", "LATAM"]),
  C("Argentina", [], ["AMERICAS", "LATAM"]),
  C("Colombia", [], ["AMERICAS", "LATAM"]),
  C("Chile", [], ["AMERICAS", "LATAM"]),
  C("India", [], ["APAC"]),
  C("Pakistan", [], ["APAC"]),
  C("Bangladesh", [], ["APAC"]),
  C("Philippines", [], ["APAC"]),
  C("Indonesia", [], ["APAC"]),
  C("Vietnam", [], ["APAC"]),
  C("Thailand", [], ["APAC"]),
  C("Malaysia", [], ["APAC"]),
  C("Singapore", [], ["APAC"]),
  C("Japan", [], ["APAC"]),
  C("South Korea", ["Korea"], ["APAC"]),
  C("China", [], ["APAC"]),
  C("Australia", [], ["APAC", "ANZ"]),
  C("New Zealand", [], ["APAC", "ANZ"]),
  C("United Arab Emirates", ["UAE"], ["EMEA", "MEA"]),
  C("Saudi Arabia", [], ["EMEA", "MEA"]),
  C("Israel", [], ["EMEA", "MEA"]),
  C("Egypt", [], ["EMEA", "MEA"]),
  C("Nigeria", [], ["EMEA", "MEA"]),
  C("Kenya", [], ["EMEA", "MEA"]),
  C("South Africa", [], ["EMEA", "MEA"]),
  C("Morocco", [], ["EMEA", "MEA"]),
  // Central Asia and the Caucasus: wording like "EMEA" or "APAC" may or may not include them, so only a "maybe".
  C("Kazakhstan", [], [], ["EMEA", "APAC", "EUROPE"]),
  C("Uzbekistan", [], [], ["EMEA", "APAC"]),
  C("Kyrgyzstan", [], [], ["EMEA", "APAC"]),
  // "Georgia" alone is also a US state, so the country only matches unambiguous wording.
  C("Georgia", [], [], ["EMEA", "EUROPE"], ["Republic of Georgia", "Tbilisi"]),
  C("Armenia", [], [], ["EMEA", "EUROPE"]),
  C("Azerbaijan", [], [], ["EMEA", "EUROPE"]),
];

export const GROUP_ALIASES = {
  EU: ["EU", "European Union", "EEA"],
  EUROPE: ["Europe"],
  EMEA: ["EMEA"],
  AMERICAS: ["Americas"],
  NA: ["North America"],
  LATAM: ["LATAM", "Latin America"],
  APAC: ["APAC", "Asia Pacific", "Asia-Pacific"],
  ANZ: ["ANZ"],
  MEA: ["MEA", "MENA", "Middle East"],
};


// US states and a few well-known cities imply a country. "Georgia" is deliberately absent (ambiguous).
const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","San Francisco","Seattle","Austin","Denver","Boston","Chicago"];
const CITIES = { "Abu Dhabi": "United Arab Emirates", Dubai: "United Arab Emirates", London: "United Kingdom", Dublin: "Ireland", Berlin: "Germany", Munich: "Germany", Paris: "France", Amsterdam: "Netherlands", Madrid: "Spain", Warsaw: "Poland", Toronto: "Canada", Vancouver: "Canada", Sydney: "Australia", Singapore: "Singapore", Bangalore: "India", Bengaluru: "India", Tokyo: "Japan", "Sao Paulo": "Brazil", "São Paulo": "Brazil", "Mexico City": "Mexico", "Tel Aviv": "Israel" };
const PLACES = [...US_STATES.map((n) => [n, "United States"]), ...Object.entries(CITIES)];

export const WORLDWIDE = /\b(anywhere in the world|work from anywhere|worldwide|world-wide|globally|global remote|remote[- ]global|fully global)\b|\banywhere\b/i;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Short codes (US, UK, UAE, EU) are case-sensitive so "us" or "uk" in prose do not match.
const wordRe = (term) => new RegExp(`(?<![A-Za-z])${escapeRe(term)}(?![A-Za-z])`, term.length <= 4 && term === term.toUpperCase() ? "" : "i");
// Description text must state a HIRING scope; "customers worldwide" is not one.
export const WORLDWIDE_HIRING = /work (from )?anywhere|remote[^.\n]{0,20}anywhere|anywhere in the world|(hire|hiring|candidates|applicants|team members)[^.\n]{0,40}(worldwide|globally|anywhere|around the world)/i;

// Which countries and groups does this text name?
export function mentions(text) {
  const countries = new Set();
  const groups = new Set();
  for (const c of COUNTRIES) {
    for (const term of c.match || [c.name, ...c.aliases]) if (wordRe(term).test(text)) countries.add(c.name);
  }
  for (const [place, country] of PLACES) if (wordRe(place).test(text)) countries.add(country);
  for (const [g, terms] of Object.entries(GROUP_ALIASES)) {
    for (const t of terms) if (wordRe(t).test(text)) groups.add(g);
  }
  return { countries: [...countries], groups: [...groups] };
}

export const countryInfo = (name) => COUNTRIES.find((c) => c.name === name);

// constraints: { remote, scope: "worldwide"|"limited"|"unknown", countries[], groups[], conflict, quote, sponsorship }
export function evaluate(constraints, countryName) {
  const c = countryInfo(countryName);
  if (!constraints.remote) return { verdict: "NO", why: "Not a remote role" };
  if (constraints.conflict) return { verdict: "UNCLEAR", why: "The posting contradicts itself about location" };
  if (constraints.scope === "worldwide") return { verdict: "YES", why: "Open worldwide" };
  if (constraints.scope === "unknown") return { verdict: "UNCLEAR", why: "Location rules not stated" };
  if (constraints.countries.includes(countryName)) return { verdict: "YES", why: `Names ${countryName}` };
  if (c) {
    for (const g of constraints.groups) if (c.groups.includes(g)) return { verdict: "YES", why: `Open to ${g}` };
    for (const g of constraints.groups) if (c.maybe.includes(g)) return { verdict: "UNCLEAR", why: `Open to ${g}, which may not include ${countryName}` };
  }
  return { verdict: "NO", why: "Restricted to other locations" };
}
