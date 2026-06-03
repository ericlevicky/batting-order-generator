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
  // Use chunked approach to avoid stack overflow with large arrays
  let binaryStr = '';
  const chunkSize = 8192;
  for (let i = 0; i < compressed.length; i += chunkSize) {
    const slice = compressed.subarray(i, i + chunkSize);
    binaryStr += String.fromCharCode(...slice);
  }
  const base64 = btoa(binaryStr);
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
 * Generate a shareable URL containing compressed app data as a query parameter.
 * Uses a query parameter so the URL is recognized as a clickable link by messaging platforms.
 */
export const generateShareUrl = async (csvData) => {
  const compressed = await compressToBase64Url(csvData);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?data=${compressed}`;
};

/**
 * Check the current URL for shared import data.
 * Returns the decompressed CSV string if found, otherwise null.
 * Supports both query parameter (?data=) and legacy hash fragment (#import=).
 */
export const getSharedDataFromUrl = async () => {
  // Check query parameter first (new format)
  const params = new URLSearchParams(window.location.search);
  const queryData = params.get('data');
  if (queryData) {
    try {
      const csvData = await decompressFromBase64Url(queryData);
      return csvData;
    } catch (error) {
      console.error('Failed to decompress shared data from URL:', error);
      return null;
    }
  }

  // Fall back to legacy hash fragment format
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
 * Clear the import data from the URL without reloading.
 * Handles both query parameter and legacy hash fragment formats.
 */
export const clearShareDataFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('data') || params.has('share')) {
    params.delete('data');
    params.delete('share');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    history.replaceState(null, '', newUrl);
  } else if (window.location.hash.startsWith('#import=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

/**
 * Generate a shareable URL by persisting data to Vercel Blob via the API.
 * Returns a short URL with ?share=<uuid>.
 * Throws an error if the API call fails so the caller can inform the user.
 */
export const generateShareUrlViaApi = async (csvData) => {
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: csvData }),
  });

  if (!response.ok) {
    throw new Error('Failed to store shared data (status ' + response.status + ')');
  }

  const { id } = await response.json();
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?share=${id}`;
};

/**
 * Check if the current URL has a share ID (?share=<uuid>).
 * Returns the share ID string if found, otherwise null.
 */
export const getSharedIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('share') || null;
};

/**
 * Fetch shared data from the API using a share ID.
 * Returns the CSV string if successful, otherwise null.
 */
export const fetchSharedDataById = async (shareId) => {
  try {
    const response = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch shared data');
    }
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching shared data:', error);
    return null;
  }
};
