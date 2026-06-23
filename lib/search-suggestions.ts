export type SearchSuggestionProductSource = {
  id: string;
  name: string;
  category: string;
  gender: string;
  tags?: string[] | null;
  fabric?: string | null;
  features?: string[] | null;
  colors?: { name: string; hex?: string; images?: string[] }[] | null;
  isNew?: boolean | null;
  isPremium?: boolean | null;
  displayOrder?: number | null;
  stock: number;
  searchText?: string | null;
};

type MerchandisingPoolInput<T extends SearchSuggestionProductSource> = {
  premiumProducts: T[];
  newProducts: T[];
  displayOrderProducts: T[];
  seed: string;
  limit?: number;
};

type PhraseInput = {
  products: SearchSuggestionProductSource[];
  seed: string;
  limit?: number;
  minMatches?: number;
  query?: string;
};

const CATEGORY_LABELS: Record<string, { singular: string; plural: string }> = {
  tshirt: { singular: "tee", plural: "tees" },
  cargo: { singular: "cargo", plural: "cargos" },
  jogger: { singular: "jogger", plural: "joggers" },
  shirt: { singular: "shirt", plural: "shirts" },
  jeans: { singular: "jeans", plural: "jeans" },
  hoodie: { singular: "hoodie", plural: "hoodies" },
  jacket: { singular: "jacket", plural: "jackets" },
  shorts: { singular: "shorts", plural: "shorts" },
  accessory: { singular: "accessory", plural: "accessories" },
};

const STOP_TOKENS = new Set([
  "xilar",
  "shirt",
  "shirts",
  "tshirt",
  "tee",
  "tees",
  "polo",
  "polos",
  "jean",
  "jeans",
  "fit",
  "edition",
  "premium",
  "classic",
]);

const DESCRIPTOR_STOP_TOKENS = new Set(["premium", "xilar"]);

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashString(seed || "xilar-search-suggestions");
  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: string) {
  const shuffled = [...items];
  const random = createSeededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function mergeMerchandisingSuggestionPool<T extends SearchSuggestionProductSource>({
  premiumProducts,
  newProducts,
  displayOrderProducts,
  seed,
  limit = 3,
}: MerchandisingPoolInput<T>) {
  const byId = new Map<string, T>();

  for (const product of [...premiumProducts, ...newProducts, ...displayOrderProducts]) {
    if (product.stock <= 0 || byId.has(product.id)) continue;
    byId.set(product.id, product);
  }

  return seededShuffle(Array.from(byId.values()), seed).slice(0, limit);
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function cleanDescriptor(value: string) {
  const words = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z\s]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !DESCRIPTOR_STOP_TOKENS.has(word.toLowerCase()));

  return titleCase(words.join(" "));
}

function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] || {
    singular: category,
    plural: category.endsWith("s") ? category : `${category}s`,
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function phraseWords(phrase: string) {
  return normalize(phrase)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
      if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
      return word;
    });
}

function productHaystack(product: SearchSuggestionProductSource) {
  return normalize([
    product.name,
    product.category,
    product.gender,
    product.fabric,
    product.searchText,
    ...(product.tags || []),
    ...(product.features || []),
    ...(product.colors || []).map((color) => color.name),
    product.isPremium ? "premium" : "",
    product.isNew ? "new" : "",
  ].filter(Boolean).join(" "));
}

function countPhraseMatches(phrase: string, products: SearchSuggestionProductSource[]) {
  const words = phraseWords(phrase);
  return products.filter((product) => {
    const haystack = productHaystack(product);
    return words.every((word) => haystack.includes(word));
  }).length;
}

function getStyleTokens(name: string) {
  return titleCase(name)
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/gi, ""))
    .filter((token) => /^[a-z]+$/i.test(token) && token.length >= 4 && !STOP_TOKENS.has(token.toLowerCase()))
    .slice(0, 3);
}

function addPhrase(candidatePhrases: Set<string>, phrase: string) {
  const normalized = phrase.replace(/\s+/g, " ").trim();
  if (normalized.length > 2) candidatePhrases.add(normalized);
}

export function buildGeneralSearchPhrases({
  products,
  seed,
  limit = 4,
  minMatches = 6,
  query,
}: PhraseInput) {
  const activeProducts = products.filter((product) => product.stock > 0);
  const exactProductNames = new Set(activeProducts.map((product) => normalize(product.name)));
  const candidates = new Set<string>();

  for (const product of activeProducts) {
    const category = getCategoryLabel(product.category);

    if (product.isPremium) addPhrase(candidates, `Premium ${category.plural}`);
    if (product.isNew) addPhrase(candidates, `New ${category.plural}`);

    if (product.gender === "men") addPhrase(candidates, `Men ${category.plural}`);
    if (product.gender === "women") addPhrase(candidates, `Women ${category.plural}`);

    for (const color of product.colors || []) {
      const colorName = cleanDescriptor(color.name);
      if (colorName) addPhrase(candidates, `${colorName} ${category.plural}`);
    }

    if (product.fabric) {
      const fabric = cleanDescriptor(product.fabric);
      if (fabric) addPhrase(candidates, `${fabric} ${category.plural}`);
    }

    for (const token of getStyleTokens(product.name)) {
      addPhrase(candidates, `${token} ${category.plural}`);
    }
  }

  const normalizedQuery = normalize(query || "");
  const validated = Array.from(candidates).filter((phrase) => {
    if (exactProductNames.has(normalize(phrase))) return false;
    if (countPhraseMatches(phrase, activeProducts) < minMatches) return false;
    if (!normalizedQuery) return true;
    return normalize(phrase).includes(normalizedQuery);
  });

  return seededShuffle(validated, seed).slice(0, limit);
}
