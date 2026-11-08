export const FACILITY_CATEGORY_CONFIG = {
  comfort_room: { label: 'Comfort Rooms & Showers', className: 'bg-sky-100 text-sky-800' },
  parking: { label: 'Parking', className: 'bg-amber-100 text-amber-800' },
  cottages: { label: 'Cottages', className: 'bg-violet-100 text-violet-800', selectable: false },
  amenity: { label: 'Amenity', className: 'bg-green-100 text-green-800', selectable: false },
  room: { label: 'Room', className: 'bg-violet-100 text-violet-800' },
  grilling_area: { label: 'Grilling Area', className: 'bg-orange-100 text-orange-800' },
  equipment: { label: 'Water Equipment / Life Vests', className: 'bg-slate-100 text-slate-800' },
  water_activities: { label: 'Water Activities', className: 'bg-orange-100 text-orange-800' },
  safety: { label: 'Lifeguard & Safety Station', className: 'bg-rose-100 text-rose-800' },
} as const;

export type FacilityCategory = keyof typeof FACILITY_CATEGORY_CONFIG;

const FALLBACK_CATEGORY_STYLE = 'bg-slate-100 text-slate-800';

export function getFacilityCategoryLabel(category: string): string {
  const normalizedCategory = category.trim().toLowerCase();
  const config = FACILITY_CATEGORY_CONFIG[normalizedCategory as FacilityCategory];
  if (config) return config.label;

  return category
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');
}

export function getFacilityCategoryStyle(category: string): string {
  const normalizedCategory = category.trim().toLowerCase();
  return FACILITY_CATEGORY_CONFIG[normalizedCategory as FacilityCategory]?.className
    || FALLBACK_CATEGORY_STYLE;
}

export function isFacilityCategory(value: unknown): value is FacilityCategory {
  return typeof value === 'string'
    && Object.prototype.hasOwnProperty.call(FACILITY_CATEGORY_CONFIG, value);
}