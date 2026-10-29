import type { Wire } from './remote';

export function countryTop(data: Wire | undefined, metric: string) {
  if (metric === 'anime') return { items: [] as Wire[], label: '' };
  const reviews = metric === 'reviews';
  return {
    items: ((reviews ? data?.topReviewed : data?.topViewed) ?? []) as Wire[],
    label: reviews
      ? 'Más reviews · todo el tiempo'
      : metric === 'popularidad'
        ? 'Más populares · todo el tiempo'
        : 'Más vistos · todo el tiempo',
  };
}
