import {
  buildProductSearchText,
  normalizeSearchText,
  rankProducts,
  searchTerms,
  type SearchableProduct,
} from '@/core/value-objects/product-search';

/** Real catalog rows of the legacy accounting system. */
const CATALOG: (SearchableProduct & { stockQuantity: number })[] = [
  {
    code: 'FR-KS-CH-2480',
    name: 'GDB3195CX5 D1321 CHEVROLET SPARK TODOS DAEWOO LANOS MATIZ CHERY QQ3 RD',
    brand: 'KLASS',
    description: null,
    categoryName: 'PASTILLAS DE FRENO CARBON CERAMICA',
    stockQuantity: 8,
  },
  {
    code: 'FR-LU-GE-2400',
    name: 'LTR QUARTZ 5000 SN 20W50 TOTAL MINERAL II',
    brand: 'TOTAL',
    description: null,
    categoryName: 'LIQUIDOS, LUBRICANTES',
    stockQuantity: 30,
  },
  {
    code: 'FR-LU-GE-2415',
    name: 'GLN 15W40 SEMISINTETICO /GULF MAX ULTRA GDI',
    brand: 'GULF',
    description: null,
    categoryName: 'LIQUIDOS, LUBRICANTES',
    stockQuantity: 0,
  },
  {
    code: 'FR-GE-2190',
    name: 'AA-51943 / A1517 FILTRO DE AIRE ADVANCE CHEVROLET D MAX 3 5 2 4 GASOLINA MITSUBISHI SPORTERO',
    brand: 'ADVANCE',
    description: null,
    categoryName: 'FILTROS',
    stockQuantity: 5,
  },
  {
    code: 'FR-FI-GE-2103',
    name: 'SH2862/FO4515/ PH3387A NEW AVEO - OPTRA-CORSA-LUV 2.2 - D/MAX 2.4 (M18 X 1.5)',
    brand: 'FRENEC',
    description: null,
    categoryName: 'FILTROS',
    stockQuantity: 12,
  },
  {
    code: 'MG-KI-1039',
    name: 'PASTILLA DE FRENO POSTERIOR D1313-8428',
    brand: 'FRENEC',
    description: 'HYUNDAI ACCENT >2012 POST HYUNDAI ELANTRA 2012 POST KIA RIO 2012',
    categoryName: 'PASTILLAS DE FRENO SEMIMETALICAS',
    stockQuantity: 3,
  },
];

const indexed = CATALOG.map((product) => ({
  ...product,
  searchText: buildProductSearchText(product),
}));

/** What the offline catalog does: every term must start a word of the search text. */
function search(query: string): string[] {
  const terms = searchTerms(query);
  const matches = indexed.filter((product) =>
    terms.every((term) => product.searchText.includes(` ${term}`)),
  );
  return rankProducts(matches, terms).map((product) => product.code);
}

describe('normalizeSearchText', () => {
  it('should unify the ways a part is written', () => {
    expect(normalizeSearchText('Aceite 15W-40 GALÓN')).toBe('aceite 15w40 galon');
    expect(normalizeSearchText('Filtros D/MAX y D-Max')).toBe('filtro dmax y dmax');
    expect(normalizeSearchText('Pastillas R/D Mazda CX-5')).toBe('pastilla delantera mazda cx5');
    expect(normalizeSearchText('GLN')).toBe('galon');
  });
});

describe('product search', () => {
  it('should find brake pads by vehicle, in any order', () => {
    expect(search('pastillas spark')).toEqual(['FR-KS-CH-2480']);
    expect(search('spark pastilla delantera')).toEqual(['FR-KS-CH-2480']);
    expect(search('pastillas para el Accent posterior')).toEqual(['MG-KI-1039']);
  });

  it('should find oils by brand and viscosity even if the name never says "aceite"', () => {
    expect(search('aceite total 20w50')).toEqual(['FR-LU-GE-2400']);
    expect(search('aceite 15w-40 galon')).toEqual(['FR-LU-GE-2415']);
    expect(search('aceite')).toEqual(['FR-LU-GE-2400', 'FR-LU-GE-2415']);
  });

  it('should find filters for a vehicle however its model is written', () => {
    expect(search('filtro aire dmax')).toEqual(['FR-GE-2190']);
    expect(search('filtros d-max')).toEqual(['FR-GE-2190', 'FR-FI-GE-2103']);
  });

  it('should find a part by the reference the mechanic gives', () => {
    expect(search('d1321')).toEqual(['FR-KS-CH-2480']);
    expect(search('PH3387A')).toEqual(['FR-FI-GE-2103']);
    expect(search('FR-LU-GE-2400')[0]).toBe('FR-LU-GE-2400');
  });

  it('should rank products in stock first when the match is the same', () => {
    expect(search('gulf')).toEqual(['FR-LU-GE-2415']);
    const oils = search('aceite');
    expect(oils[0]).toBe('FR-LU-GE-2400');
  });
});
