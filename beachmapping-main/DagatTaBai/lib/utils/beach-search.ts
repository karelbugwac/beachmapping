interface SearchableBeach {
  name: string;
  location: string;
  description?: string | null;
  activities?: string[];
  amenities?: string[];
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function matchesBeachSearch(beach: SearchableBeach, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const location = normalizeSearchText(beach.location);
  const searchableText = normalizeSearchText([
    beach.name,
    beach.location,
    beach.description || '',
    ...(beach.activities || []),
    ...(beach.amenities || []),
  ].join(' '));
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  if (queryTokens.includes('binongkalan')) {
    return searchableText.includes('binongkalan');
  }
  if (queryTokens.includes('catmon')) {
    return location.includes('catmon') || location.includes('binongkalan');
  }

  return searchableText.includes(normalizedQuery) ||
    queryTokens.every((token) => searchableText.includes(token));
}
