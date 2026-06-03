// Utilities for sharing app data via compressed URL

/**
 * Compress a string using the browser's CompressionStream API (gzip),
 * then encode it as base64url for safe embedding in a URL fragment.
 */
export const compressToBase64Url = async (str) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();

  const reader = cs.readable.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Concatenate chunks into a single Uint8Array
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const compressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert to base64url (URL-safe base64 without padding)
  const base64 = btoa(String.fromCharCode(...compressed));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Decompress a base64url-encoded gzip string back to the original string.
 */
export const decompressFromBase64Url = async (base64url) => {
  // Convert base64url back to standard base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const reader = ds.readable.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const decompressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    decompressed.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(decompressed);
};

/**
 * Generate a shareable URL containing compressed app data in the URL fragment.
 * Uses the hash (#) to avoid sending data to the server.
 */
export const generateShareUrl = async (csvData) => {
  const compressed = await compressToBase64Url(csvData);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#import=${compressed}`;
};

/**
 * Check the current URL for shared import data.
 * Returns the decompressed CSV string if found, otherwise null.
 */
export const getSharedDataFromUrl = async () => {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#import=')) {
    return null;
  }

  const compressed = hash.slice('#import='.length);
  if (!compressed) return null;

  try {
    const csvData = await decompressFromBase64Url(compressed);
    return csvData;
  } catch (error) {
    console.error('Failed to decompress shared data from URL:', error);
    return null;
  }
};

/**
 * Clear the import data from the URL hash without reloading.
 */
export const clearShareDataFromUrl = () => {
  if (window.location.hash.startsWith('#import=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};
