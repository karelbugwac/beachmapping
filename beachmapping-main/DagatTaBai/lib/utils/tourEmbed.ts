/**
 * Extracts the usable iframe embed URL or cleans a direct 360 virtual tour URL.
 * Safe to import on both client and server (no 'use client' directive).
 */
export function extractTourEmbedUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Extract src from <iframe ... src="..." ...>
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1].trim();
  }

  // If already a valid URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // If a domain without protocol
  if (trimmed.includes('.') && !trimmed.includes('<') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}
