// Apple Music utilities
// Uses the public iTunes Search API for song search (no developer token required),
// and deep links for playback (opens in Apple Music app on device).

// --- Deep Link Utilities ---

/**
 * Generate an Apple Music deep link for a track.
 * Supports various input formats:
 * - Apple Music URL (https://music.apple.com/...)
 * - Apple Music song ID
 * - Generic music:// deep link
 */
export function getAppleMusicDeepLink(trackUrl) {
  if (!trackUrl) return 'music://';

  // If it's already a music:// deep link, return as-is
  if (trackUrl.startsWith('music://')) {
    return trackUrl;
  }

  // Convert Apple Music web URL to deep link
  // https://music.apple.com/us/album/song-name/123456?i=789
  // becomes music://music.apple.com/us/album/song-name/123456?i=789
  try {
    const url = new URL(trackUrl);
    if (url.hostname === 'music.apple.com' || url.hostname.endsWith('.music.apple.com')) {
      return trackUrl.replace('https://', 'music://');
    }
  } catch {
    // Not a valid URL, continue to other checks
  }

  // If it's just an ID, construct a basic link
  if (/^\d+$/.test(trackUrl)) {
    return `music://music.apple.com/song/${trackUrl}`;
  }

  // Fallback - open Apple Music app
  return 'music://';
}

/**
 * Open a track in the Apple Music app via deep link.
 * This triggers the native Apple Music app which can play downloaded/offline music.
 */
export function playAppleMusicTrack(trackUrl) {
  const deepLink = getAppleMusicDeepLink(trackUrl);
  window.open(deepLink, '_blank');
}

/**
 * Format an Apple Music track configuration for storage.
 */
export function createAppleMusicSongConfig({ trackName, artistName, appleMusicUrl, startMs, endMs }) {
  return {
    trackName: trackName || '',
    artistName: artistName || '',
    appleMusicUrl: appleMusicUrl || '',
    startMs: startMs || 0,
    endMs: endMs || null,
    musicType: 'apple',
  };
}

// --- iTunes Search API ---
// Apple's public search API — no developer token or authentication required.

/**
 * Search for songs using the iTunes Search API.
 * Returns an array of track objects compatible with the walk-up music config.
 */
export async function searchAppleMusicSongs(query, limit = 20) {
  if (!query.trim()) return [];

  const url = `https://itunes.apple.com/search?${new URLSearchParams({
    term: query.trim(),
    entity: 'song',
    limit: String(limit),
  })}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`iTunes search failed (${response.status}). Check your network connection and try again.`);
  }

  const data = await response.json();
  return (data.results || []).map((item) => ({
    id: String(item.trackId),
    name: item.trackName || 'Unknown',
    artist: item.artistName || '',
    album: item.collectionName || '',
    durationMs: item.trackTimeMillis || 0,
    albumArt: item.artworkUrl100 || null,
    appleMusicUrl: item.trackViewUrl || '',
  }));
}
