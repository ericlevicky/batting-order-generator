// Apple Music utilities
// Uses deep links for playback (opens in Apple Music app on device)
// No API auth required - works fully offline with downloaded music

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
  if (trackUrl.includes('music.apple.com')) {
    return trackUrl.replace('https://', 'music://');
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
