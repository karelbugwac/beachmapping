/**
 * Cross-platform UUID v4 generator.
 * In modern secure contexts (HTTPS or localhost), uses crypto.randomUUID().
 * In insecure contexts (e.g., HTTP over LAN IP like http://192.168.x.x:3000)
 * or older browsers, falls back to a standard Math.random pseudo-UUID.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if randomUUID fails unexpectedly
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
