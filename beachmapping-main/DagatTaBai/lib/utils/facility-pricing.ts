export interface FacilityFeeItem {
  label: string;
  amount: number | null | string;
}

const FACILITY_FEE_LABEL_TRANSLATIONS: Record<string, string> = {
  ihi: 'Pee',
  kalibang: 'Toilet',
  kaligo: 'Shower',
};

function normalizeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function translateFacilityFeeLabel(label: string): string {
  return FACILITY_FEE_LABEL_TRANSLATIONS[normalizeLabel(label)] || label;
}

function parseAmount(value: unknown): number | null | string | undefined {
  if (value === null || typeof value === 'number') {
    if (value === null) return null;
    if (!Number.isFinite(value) || value < 0) return String(value);
    return value === 0 ? null : value;
  }
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.toLowerCase() === 'free') return null;
  const numericText = trimmed.replace(/^(?:₱|PHP|P)\s*/i, '').replace(/,/g, '').trim();
  if (/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(numericText)) {
    const amount = Number(numericText);
    if (Number.isFinite(amount) && amount >= 0) return amount === 0 ? null : amount;
  }
  return trimmed;
}

function parseStoredRateArray(value: unknown): FacilityFeeItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null || !('amount' in entry)) return [];
    const amount = parseAmount(entry.amount);
    if (amount === undefined) return [];
    const label = 'label' in entry && typeof entry.label === 'string' && entry.label
      ? translateFacilityFeeLabel(entry.label)
      : 'Fee';
    return [{ label, amount }];
  });
}

function parseTextPricing(value: string): FacilityFeeItem[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+-\s+|\s+·\s+/).filter(Boolean);
  return parts.flatMap((part) => {
    const colonIndex = part.indexOf(':');
    if (colonIndex < 0) {
      const amount = parseAmount(part);
      return amount === undefined ? [{ label: 'Fee', amount: part }] : [{ label: 'Fee', amount }];
    }

    const rawLabel = part.slice(0, colonIndex);
    const rawAmount = part.slice(colonIndex + 1).trim();
    const amount = parseAmount(rawAmount);
    return [{
      label: translateFacilityFeeLabel(rawLabel),
      amount: amount === undefined ? rawAmount || part : amount,
    }];
  });
}

export function getFacilityFeeItems(value: unknown): FacilityFeeItem[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parseStoredRateArray(parsed);
        if (typeof parsed === 'object' && parsed !== null && 'rates' in parsed) {
          return parseStoredRateArray(parsed.rates);
        }
      } catch {
        return parseTextPricing(trimmed);
      }
    }
    return parseTextPricing(trimmed);
  }
  if (Array.isArray(value)) return parseStoredRateArray(value);
  if (typeof value === 'object' && value !== null && 'rates' in value) {
    return parseStoredRateArray(value.rates);
  }
  return [];
}

export function formatFacilityFeeAmount(amount: FacilityFeeItem['amount']): string {
  if (amount === null || amount === 0) return 'Free';
  if (typeof amount === 'string') return amount;
  return `₱${new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 }).format(amount)}`;
}