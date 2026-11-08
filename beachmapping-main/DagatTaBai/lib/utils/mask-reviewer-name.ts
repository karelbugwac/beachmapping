export function maskReviewerName(name?: string | null): string {
  const trimmed = name?.trim();
  if (
    !trimmed
    || /^(dagat ta bai user|verified visitor|verified tourist|community member)$/i.test(trimmed)
  ) {
    return 'Community member';
  }

  const parts = trimmed.replace(/,/g, '').split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0][0]}***`;
  }

  return `${parts[0][0]}*** ${parts[parts.length - 1][0]}***`;
}
