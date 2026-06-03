// Spotify Connect API utilities
// Uses OAuth 2.0 PKCE flow (no backend needed) + Spotify Web API for playback control

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Client ID is set at build time via environment variable (VITE_SPOTIFY_CLIENT_ID).
// This avoids requiring each user to create their own Spotify Developer App.
const APP_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  TOKEN_EXPIRY: 'spotify_token_expiry',
  CODE_VERIFIER: 'spotify_code_verifier',
  PREFERRED_DEVICE: 'spotify_preferred_device_id',
};

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

// --- PKCE Helpers ---

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- Token Management ---

export function getClientId() {
  return APP_CLIENT_ID;
}

function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    expiry: parseInt(localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) || '0', 10),
  };
}

function storeTokens(accessToken, refreshToken, expiresIn) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
  // Store expiry as timestamp with 60s buffer
  const expiry = Date.now() + (expiresIn - 60) * 1000;
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  localStorage.removeItem(STORAGE_KEYS.PREFERRED_DEVICE);
}

export function getPreferredDeviceId() {
  return localStorage.getItem(STORAGE_KEYS.PREFERRED_DEVICE) || null;
}

export function setPreferredDeviceId(deviceId) {
  if (deviceId) {
    localStorage.setItem(STORAGE_KEYS.PREFERRED_DEVICE, deviceId);
  }
}

// Device types that should never be targeted for playback (they aren't
// meant to be controlled from this app, e.g. Echo Show, smart speakers)
const EXCLUDED_DEVICE_TYPES = ['Speaker'];

/**
 * Filter a list of Spotify devices to only those eligible for playback.
 * Excludes smart speakers and similar devices.
 */
export function filterPlayableDevices(devices) {
  return devices.filter(d => !EXCLUDED_DEVICE_TYPES.includes(d.type));
}

/**
 * Select the best device for playback from a list of devices.
 * Returns the device ID or null if no suitable device is found.
 */
export function selectBestDevice(devices, preferredId) {
  const playable = filterPlayableDevices(devices);
  if (playable.length === 0) return null;

  // 1. Preferred device (if still available and playable)
  if (preferredId) {
    const preferred = playable.find(d => d.id === preferredId);
    if (preferred) return preferred.id;
  }

  // 2. Currently active device
  const active = playable.find(d => d.is_active);
  if (active) return active.id;

  // 3. Smartphone
  const phone = playable.find(d => d.type === 'Smartphone');
  if (phone) return phone.id;

  // 4. Any playable device (Computer, etc.)
  return playable[0].id;
}

export function isAuthenticated() {
  const { accessToken, expiry } = getStoredTokens();
  return !!accessToken && Date.now() < expiry;
}

// --- OAuth 2.0 PKCE Flow ---

export async function startAuthFlow() {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error('Spotify Client ID is not configured');
  }

  const codeVerifier = generateRandomString(64);
  localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  const redirectUri = getRedirectUri();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

function getRedirectUri() {
  // Use the current origin + path (works for both dev and production)
  return window.location.origin + window.location.pathname;
}

export async function handleAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (error) {
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error(`Spotify authorization failed: ${error}`);
  }

  if (!code) {
    return false; // No auth callback in progress
  }

  const codeVerifier = localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
  if (!codeVerifier) {
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error('Missing code verifier - please try logging in again');
  }

  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    window.history.replaceState({}, document.title, window.location.pathname);
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Failed to exchange authorization code');
  }

  const data = await response.json();
  storeTokens(data.access_token, data.refresh_token, data.expires_in);

  // Clean up URL and code verifier
  localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
  window.history.replaceState({}, document.title, window.location.pathname);

  return true;
}

async function refreshAccessToken() {
  const { refreshToken } = getStoredTokens();
  const clientId = getClientId();

  if (!refreshToken || !clientId) {
    clearTokens();
    throw new Error('Session expired - please log in again');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    clearTokens();
    throw new Error('Failed to refresh token - please log in again');
  }

  const data = await response.json();
  storeTokens(data.access_token, data.refresh_token || refreshToken, data.expires_in);
  return data.access_token;
}

async function getValidToken() {
  const { accessToken, expiry } = getStoredTokens();

  if (!accessToken) {
    throw new Error('Not authenticated - please log in to Spotify');
  }

  if (Date.now() >= expiry) {
    return refreshAccessToken();
  }

  return accessToken;
}

// --- API Helpers ---

async function spotifyFetch(endpoint, options = {}) {
  const token = await getValidToken();

  const authHeader = 'Bearer ' + token;

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // 204 No Content is a success for playback commands
  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Spotify API error (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

// --- Playlist & Track APIs ---

export async function getUserPlaylists(limit = 50, offset = 0) {
  const data = await spotifyFetch(`/me/playlists?limit=${limit}&offset=${offset}`);
  return data.items.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.images?.[0]?.url || null,
    trackCount: p.tracks?.total || 0,
    owner: p.owner?.display_name || '',
  }));
}

export async function getPlaylistTracks(playlistId, limit = 100, offset = 0) {
  const data = await spotifyFetch(
    `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(track(id,name,uri,duration_ms,artists(name),album(name,images))),total`
  );
  return {
    total: data.total,
    tracks: data.items
      .filter((item) => item.track && item.track.id)
      .map((item) => ({
        id: item.track.id,
        name: item.track.name,
        uri: item.track.uri,
        durationMs: item.track.duration_ms,
        artist: item.track.artists.map((a) => a.name).join(', '),
        album: item.track.album?.name || '',
        albumArt: item.track.album?.images?.[item.track.album.images.length - 1]?.url || null,
      })),
  };
}

// --- Playback Control (Spotify Connect) ---

export async function getAvailableDevices() {
  const data = await spotifyFetch('/me/player/devices');
  return data.devices || [];
}

/**
 * Poll for a playable device to appear.
 * Useful after opening the Spotify app via deep link — the device may take
 * a few seconds to register with Spotify Connect.
 * Returns the best device ID found, or null if none appeared within the timeout.
 */
export async function pollForDevice(timeoutMs = 10000, intervalMs = 1500) {
  const startTime = Date.now();
  const preferredId = getPreferredDeviceId();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const devices = await getAvailableDevices();
      const playable = filterPlayableDevices(devices);
      if (playable.length > 0) {
        return selectBestDevice(playable, preferredId);
      }
    } catch {
      // Ignore transient errors during polling
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return null;
}

export async function transferPlayback(deviceId, play = true) {
  await spotifyFetch('/me/player', {
    method: 'PUT',
    body: JSON.stringify({
      device_ids: [deviceId],
      play,
    }),
  });
}

export async function playTrack(trackUri, positionMs = 0, deviceId = null) {
  const MAX_RETRIES = 4;
  const RETRY_DELAYS = [1000, 2000, 3000, 4000];
  const DEVICE_ACTIVATION_DELAY = 1500;

  // If a device is specified, transfer playback first to force-activate it
  if (deviceId) {
    try {
      await transferPlayback(deviceId, false);
      await new Promise(resolve => setTimeout(resolve, DEVICE_ACTIVATION_DELAY));
    } catch {
      // Continue anyway - the play call may still work
    }
  }

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const params = deviceId ? `?device_id=${deviceId}` : '';
    try {
      await spotifyFetch(`/me/player/play${params}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: positionMs,
        }),
      });
      return; // Success
    } catch (err) {
      lastError = err;

      const isDeviceError = err.message && (
        err.message.includes('No active device') ||
        err.message.includes('Device not found') ||
        err.message.includes('Player command failed') ||
        err.message.includes('Restriction violated')
      );

      const isTransientError = err.message && (
        err.message.includes('502') ||
        err.message.includes('503') ||
        err.message.includes('Server error')
      );

      if ((!isDeviceError && !isTransientError) || attempt === MAX_RETRIES) {
        break;
      }

      // Wait before retrying, with increasing delay
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));

      // On device errors, re-fetch available devices and try to find a new target
      if (isDeviceError) {
        try {
          const freshDevices = await getAvailableDevices();
          const playable = filterPlayableDevices(freshDevices);

          if (playable.length > 0) {
            // Prefer the originally targeted device if still present
            const stillThere = deviceId && playable.some(d => d.id === deviceId);
            const newTarget = stillThere ? deviceId : selectBestDevice(playable, getPreferredDeviceId());

            if (newTarget) {
              deviceId = newTarget;
              // Re-transfer to wake it up
              try {
                await transferPlayback(deviceId, false);
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch {
                // Continue to retry the play call
              }
            }
          }
        } catch {
          // Device fetch failed, just retry the play call
        }
      }
    }
  }

  throw lastError;
}

export async function pausePlayback(deviceId = null) {
  const params = deviceId ? `?device_id=${deviceId}` : '';
  await spotifyFetch(`/me/player/pause${params}`, {
    method: 'PUT',
  });
}

export async function getPlaybackState() {
  try {
    return await spotifyFetch('/me/player');
  } catch {
    return null;
  }
}

// --- Time Formatting Utilities ---

export function formatMs(ms) {
  if (ms == null) return '';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  // Show fractional seconds only when there's a fractional part
  if (seconds % 1 === 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  const whole = Math.floor(seconds);
  const frac = Math.round((seconds - whole) * 10);
  return `${minutes}:${whole.toString().padStart(2, '0')}.${frac}`;
}

export function parseTimeToMs(timeStr) {
  if (!timeStr || !timeStr.trim()) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0 && seconds < 60) {
      return Math.round((Math.floor(minutes) * 60 + seconds) * 1000);
    }
  }
  // Also try just seconds (e.g. "5.5")
  const secs = parseFloat(timeStr);
  if (!isNaN(secs) && secs >= 0) {
    return Math.round(secs * 1000);
  }
  return null;
}
