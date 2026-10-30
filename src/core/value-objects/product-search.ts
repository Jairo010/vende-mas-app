/**
 * Product search the way customers ask for parts ("pastillas para Spark", "aceite Total 20W50",
 * "filtro de aire D-Max"), offline. The catalog of the accounting system keeps all that inside
 * free text: names, notes and category. Every product gets a normalized search text, and the
 * seller's words are normalized the same way, so they match in any order (ADR 0012).
 */

/** Words that stand for the same thing in the catalog: [pattern, replacement]. */
const PHRASES: readonly (readonly [RegExp, string])[] = [
  // Viscosity: 15W-40, 15 W 40 → 15w40.
  [/\b(\d{1,2}) ?w ?(\d{2})\b/g, '$1w$2'],
  // Models written with separators: D-MAX, D/MAX, CX-5, BT-50, RAV 4, CR-V, X-TRAIL, H-1.
  [/\bd max\b/g, 'dmax'],
  [/\bcx (\d)\b/g, 'cx$1'],
  [/\bbt (\d{2})\b/g, 'bt$1'],
  [/\brav 4\b/g, 'rav4'],
  [/\bcr v\b/g, 'crv'],
  [/\bhr v\b/g, 'hrv'],
  [/\bx trail\b/g, 'xtrail'],
  [/\bh 1\b/g, 'h1'],
  // Brake position: R/D (rueda delantera), R/T (rueda trasera).
  [/\br d\b/g, 'delantera'],
  [/\br t\b/g, 'posterior'],
  // Presentation: 1/4 (quart).
  [/\b1 4\b/g, 'cuarto'],
];

/** Single words that stand for the same thing. */
const WORDS: Readonly<Record<string, string>> = {
  chev: 'chevrolet',
  chevy: 'chevrolet',
  tyt: 'toyota',
  vw: 'volkswagen',
  volswagen: 'volkswagen',
  wolkswagen: 'volkswagen',
  hyunday: 'hyundai',
  mitsubichi: 'mitsubishi',
  delantero: 'delantera',
  rd: 'delantera',
  rt: 'posterior',
  trasera: 'posterior',
  trasero: 'posterior',
  post: 'posterior',
  gln: 'galon',
  galones: 'galon',
  ltr: 'litro',
  lts: 'litro',
  semisintetico: 'semisintetico',
  semi: 'semisintetico',
  sintetic: 'sintetico',
  lubricante: 'aceite',
  zapatas: 'zapata',
};

/**
 * Plural to singular, so "pastillas" finds "pastilla" and "filtros" "filtro". Short words and
 * codes are left alone.
 */
function singular(word: string): string {
  if (word.length <= 4 || /\d/.test(word)) return word;
  if (word.endsWith('es') && word.length > 5 && !/[aeiou]es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** Lower case, no accents, punctuation as spaces, variants unified, singular words. */
export function normalizeSearchText(text: string): string {
  let value = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  for (const [pattern, replacement] of PHRASES) value = value.replace(pattern, replacement);
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => singular(WORDS[word] ?? word))
    .join(' ');
}

/** What a product is, when its text does not say it ("LTR QUARTZ 20W50" is an oil). */
function concepts(normalized: string, category: string): string[] {
  const found: string[] = [];
  if (
    /\b\d{1,2}w\d{2}\b|\bsae \d{2,3}\b/.test(normalized) ||
    /\b(aceite|liquido)\b/.test(category)
  ) {
    found.push('aceite');
  }
  if (/\bpastilla\b/.test(category)) found.push('pastilla', 'freno');
  if (/\bfiltro\b/.test(category)) found.push('filtro');
  if (/\bdisco\b/.test(category)) found.push('freno');
  if (/\bzapata\b/.test(normalized)) found.push('freno');
  return found;
}

export interface SearchableProduct {
  readonly code: string;
  readonly name: string;
  readonly brand: string | null;
  readonly description: string | null;
  readonly categoryName: string;
}

/**
 * The text a product is searched in: code, name, notes, brand and category, normalized, plus
 * what it is. Padded with spaces so a word can be matched by its start (" spark").
 */
export function buildProductSearchText(product: SearchableProduct): string {
  const category = normalizeSearchText(product.categoryName);
  const text = normalizeSearchText(
    [product.code, product.name, product.description, product.brand, product.categoryName]
      .filter(Boolean)
      .join(' '),
  );
  const words = new Set([...text.split(' '), ...concepts(text, category)]);
  return ` ${[...words].join(' ')} `;
}

/** The seller's words, normalized and without repeats or filler words. */
export function searchTerms(query: string): string[] {
  const FILLER = new Set([
    'para',
    'de',
    'del',
    'el',
    'la',
    'los',
    'las',
    'un',
    'una',
    'y',
    'con',
    'quiero',
  ]);
  return [...new Set(normalizeSearchText(query).split(' '))].filter(
    (term) => term !== '' && !FILLER.has(term),
  );
}

export interface RankableProduct {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly stockQuantity: number;
  readonly searchText: string;
}

/**
 * Best matches first: the exact code or reference the mechanic gave, then products in stock
 * (what the seller can deliver), then words found in the product's own name or notes over its
 * category or what it is (whole words over word beginnings), then by name.
 */
export function rankProducts<T extends RankableProduct>(
  products: readonly T[],
  terms: readonly string[],
): T[] {
  const rank = (product: T) => {
    const code = normalizeSearchText(product.code).replace(/ /g, '');
    const own = ` ${normalizeSearchText(`${product.name} ${product.description ?? ''}`)} `;
    let relevance = 0;
    for (const term of terms) {
      if (own.includes(` ${term} `)) relevance += 4;
      else if (own.includes(` ${term}`)) relevance += 3;
      else if (product.searchText.includes(` ${term} `)) relevance += 2;
      else relevance += 1;
    }
    return {
      exactCode: terms.includes(code) ? 1 : 0,
      inStock: product.stockQuantity > 0 ? 1 : 0,
      relevance,
    };
  };
  return products
    .map((product) => ({ product, rank: rank(product) }))
    .sort(
      (a, b) =>
        b.rank.exactCode - a.rank.exactCode ||
        b.rank.inStock - a.rank.inStock ||
        b.rank.relevance - a.rank.relevance ||
        a.product.name.localeCompare(b.product.name),
    )
    .map(({ product }) => product);
}
