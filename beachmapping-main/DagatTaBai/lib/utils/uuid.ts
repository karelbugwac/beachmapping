/**
 * Cross-platform UUID v4 generator.
 * In modern secure contexts (HTTPS or localhost), uses crypto.randomUUID().
 * In insecure contexts (e.g., HTTP over LAN IP like http://192.168.x.x:3000)
 * or older browsers, falls back safely to Math.random pseudo-UUID without throwing.
 */
export function generateUUID(): string {
  try {
    const isClient = typeof window !== 'undefined';
    // When accessing over LAN IP (e.g. 192.168.x.x), isSecureContext is false in mobile browsers.
    // Calling or inspecting crypto.randomUUID in insecure contexts throws an error in some engines.
    const isSecure = !isClient || (typeof window.isSecureContext === 'boolean' ? window.isSecureContext : false);
    
    if (isSecure && typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback if randomUUID fails or throws
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
