import isoCountries from 'i18n-iso-countries';
import shapes from '../assets/paises.json';
import type { Country } from './data';
import type { Wire } from './api/remote';
const originalPoints: Record<string, [number, number]> = {
  AR: [32.2, 84.8],
  JP: [88.3, 33.8],
  BR: [35.8, 68.3],
  ES: [48.9, 31],
  US: [22.8, 31.7],
  IS: [44.7, 13.8],
};
export function countryShape(code: string) {
  return isoCountries.alpha2ToAlpha3(code);
}
export function adaptCountry(row: Wire): Country {
  const shape = shapes.find((shape) => shape.iso === countryShape(row.code));
  const coordinates = [...(shape?.path ?? '').matchAll(/([\d.]+),([\d.]+)/g)].map((match) => [
    Number(match[1]),
    Number(match[2]),
  ]);
  const xs = coordinates.map((pair) => pair[0]),
    ys = coordinates.map((pair) => pair[1]);
  const point =
    originalPoints[row.code] ??
    (xs.length
      ? [
          (Math.min(...xs) + Math.max(...xs)) / 2 / 3.6,
          (Math.min(...ys) + Math.max(...ys)) / 2 / 1.45,
        ]
      : [50, 50]);
  return {
    id: row.id,
    name: row.name,
    flag: row.flag,
    reviews: row.reviews ?? 0,
    watched: row.views ?? 0,
    top: [],
    x: point[0],
    y: point[1],
    value: row.value ?? 0,
    intensity: row.intensity ?? 0,
    popularity: row.popularity ?? 0,
  };
}
export const metricCode = (metric: string) =>
  metric === 'vistos' ? 'views' : metric === 'popularidad' ? 'popularity' : metric;
