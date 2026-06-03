import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  isAuthenticated,
  startAuthFlow,
  handleAuthCallback,
  clearTokens,
  getUserPlaylists,
  getPlaylistTracks,
  playTrack,
  pausePlayback,
  getPlaybackState,
  transferPlayback,
  formatMs,
  parseTimeToMs,
  getAvailableDevices,
  getPreferredDeviceId,
  setPreferredDeviceId,
  selectBestDevice,
  filterPlayableDevices,
  pollForDevice,
} from '../utils/spotify';
import { playAppleMusicTrack, searchAppleMusicSongs } from '../utils/appleMusic';
import {
  getTeamWalkUpMusic,
  setTeamPlaylist,
  setTeamMusicType,
  setTeamApplePlaylist,
  setPlayerWalkUpSong,
  removePlayerWalkUpSong,
} from '../utils/storage';
import './WalkUpMusicPage.css';

function WalkUpMusicPage({ teamId, teamName, players, gameHistory, onBack }) {
  // Auth state
  const [authenticated, setAuthenticated] = useState(false);

  // Data state
  const [walkUpConfig, setWalkUpConfig] = useState({ musicType: 'spotify', spotifyPlaylistId: null, spotifyPlaylistName: null, players: {} });
  const [playlists, setPlaylists] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'play'
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [gameMode, setGameMode] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [currentBatterIndex, setCurrentBatterIndex] = useState(0);

  // Internal toast state
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const stopTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Load config and handle auth callback on mount
  useEffect(() => {
    const config = getTeamWalkUpMusic(teamId);
    setWalkUpConfig(config);

    // Handle OAuth callback (only relevant for Spotify)
    if (config.musicType !== 'apple') {
      handleAuthCallback()
        .then((wasCallback) => {
          if (wasCallback) {
            setAuthenticated(true);
            showToast('Connected to Spotify!', 'success');
          } else {
            setAuthenticated(isAuthenticated());
          }
        })
        .catch((err) => {
          showToast(err.message, 'error');
          setAuthenticated(false);
        });
    }

    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
    };
  }, [teamId, showToast]);

  // Load playlists when authenticated
  useEffect(() => {
    if (authenticated) {
      loadPlaylists();
    }
  }, [authenticated]);

  // Load tracks when playlist is selected
  useEffect(() => {
    if (authenticated && walkUpConfig.spotifyPlaylistId) {
      loadPlaylistTracks(walkUpConfig.spotifyPlaylistId);
    }
  }, [authenticated, walkUpConfig.spotifyPlaylistId]);

  // Keepalive: poll Spotify every 20s to prevent device session from going inactive
  useEffect(() => {
    if (!authenticated) return;

    const KEEPALIVE_INTERVAL_MS = 20000;

    const keepalive = async () => {
      try {
        const preferredId = getPreferredDeviceId();
        if (!preferredId) return;

        const devices = await getAvailableDevices();
        const playable = filterPlayableDevices(devices);
        const preferred = playable.find(d => d.id === preferredId);

        // If preferred playable device exists but is inactive, re-transfer without playing
        if (preferred && !preferred.is_active) {
          await transferPlayback(preferredId, false);
        }
      } catch {
        // Silently ignore keepalive errors — don't disrupt the user
      }
    };

    const intervalId = setInterval(keepalive, KEEPALIVE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [authenticated]);

  const loadPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const lists = await getUserPlaylists();
      setPlaylists(lists);
    } catch (err) {
      showToast(`Failed to load playlists: ${err.message}`, 'error');
      if (err.message.includes('log in')) {
        setAuthenticated(false);
      }
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const loadPlaylistTracks = async (playlistId) => {
    setLoadingTracks(true);
    try {
      const result = await getPlaylistTracks(playlistId);
      setPlaylistTracks(result.tracks);
    } catch (err) {
      showToast(`Failed to load tracks: ${err.message}`, 'error');
    } finally {
      setLoadingTracks(false);
    }
  };

  // --- Auth Handlers ---

  const handleLogin = async () => {
    try {
      await startAuthFlow();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    clearTokens();
    setAuthenticated(false);
    setPlaylists([]);
    setPlaylistTracks([]);
    showToast('Disconnected from Spotify', 'info');
  };

  // --- Config Handlers ---

  const handleMusicTypeChange = (newType) => {
    setTeamMusicType(teamId, newType);
    const updated = { ...walkUpConfig, musicType: newType };
    setWalkUpConfig(updated);
    if (newType === 'apple') {
      // No Spotify auth needed for Apple Music
      setAuthenticated(false);
    } else {
      setAuthenticated(isAuthenticated());
    }
  };

  const handleSelectPlaylist = (playlistId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      setTeamPlaylist(teamId, playlistId, playlist.name);
      const updated = { ...walkUpConfig, spotifyPlaylistId: playlistId, spotifyPlaylistName: playlist.name };
      setWalkUpConfig(updated);
    }
  };

  const handleSaveApplePlaylist = (playlistUrl, playlistName) => {
    setTeamApplePlaylist(teamId, playlistUrl, playlistName);
    const updated = { ...walkUpConfig, applePlaylistUrl: playlistUrl, applePlaylistName: playlistName };
    setWalkUpConfig(updated);
  };

  const handleAssignSong = (playerName, track, startTime, endTime) => {
    const startMs = parseTimeToMs(startTime) || 0;
    const endMs = parseTimeToMs(endTime);

    const songConfig = {
      trackUri: track.uri,
      trackId: track.id,
      trackName: track.name,
      artistName: track.artist,
      albumArt: track.albumArt,
      durationMs: track.durationMs,
      startMs,
      endMs,
    };

    setPlayerWalkUpSong(teamId, playerName, songConfig);
    const updated = { ...walkUpConfig, players: { ...walkUpConfig.players, [playerName]: songConfig } };
    setWalkUpConfig(updated);
    setEditingPlayer(null);
    showToast(`Walk-up song set for ${playerName}`, 'success');
  };

  const handleAssignAppleSong = (playerName, songConfig) => {
    setPlayerWalkUpSong(teamId, playerName, songConfig);
    const updated = { ...walkUpConfig, players: { ...walkUpConfig.players, [playerName]: songConfig } };
    setWalkUpConfig(updated);
    setEditingPlayer(null);
    showToast(`Walk-up song set for ${playerName}`, 'success');
  };

  const handleRemoveSong = (playerName) => {
    removePlayerWalkUpSong(teamId, playerName);
    const updatedPlayers = { ...walkUpConfig.players };
    delete updatedPlayers[playerName];
    setWalkUpConfig({ ...walkUpConfig, players: updatedPlayers });
  };

  // --- Playback Handlers ---

  const handlePlay = useCallback(async (playerName) => {
    const config = walkUpConfig.players[playerName];
    if (!config) {
      showToast(`No walk-up song configured for ${playerName}`, 'error');
      return;
    }

    // Clear any existing stop timer
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    // Apple Music playback via deep link
    if (walkUpConfig.musicType === 'apple') {
      playAppleMusicTrack(config.appleMusicUrl);
      setCurrentlyPlaying(playerName);
      showToast(`Opening "${config.trackName}" in Apple Music...`, 'info');
      return;
    }

    // Spotify playback
    let targetDeviceId = null;
    let debugDevices = [];
    let debugPreferredId = null;
    try {
      // Resolve the target device for playback:
      // 1. Try the previously successful device (stored in localStorage)
      // 2. If that device isn't available, look for a smartphone
      // 3. If nothing found, let Spotify decide (no device_id)
      try {
        debugDevices = await getAvailableDevices();
        debugPreferredId = getPreferredDeviceId();
        targetDeviceId = selectBestDevice(debugDevices, debugPreferredId);
      } catch {
        // Continue without a device ID — Spotify will use the last active device
      }

      // If no playable devices were found, wake up Spotify and poll for device
      if (!targetDeviceId && filterPlayableDevices(debugDevices).length === 0) {
        // Open Spotify app to wake it up and register the device
        const deepLink = config.trackUri || 'spotify://';
        window.open(deepLink, '_blank');
        showToast('Waking up Spotify on your phone... hang tight.', 'info');

        // Poll for the device to appear (up to 10 seconds)
        targetDeviceId = await pollForDevice(10000, 1500);

        if (!targetDeviceId) {
          showToast('Could not find your Spotify device. Make sure Spotify is open on your phone and try again.', 'error');
          return;
        }
      }

      await playTrack(config.trackUri, config.startMs || 0, targetDeviceId);
      // Remember this device for future playback
      if (targetDeviceId) {
        setPreferredDeviceId(targetDeviceId);
      }
      setCurrentlyPlaying(playerName);

      // Set up auto-pause if end time is configured
      if (config.endMs != null && config.endMs > (config.startMs || 0)) {
        const duration = config.endMs - (config.startMs || 0);
        stopTimerRef.current = setTimeout(async () => {
          try {
            await pausePlayback();
          } catch {
            // Ignore pause errors
          }
          setCurrentlyPlaying(null);
          stopTimerRef.current = null;
        }, duration);
      }
    } catch (err) {
      const deviceList = debugDevices.map(d => `${d.name} (${d.type}, active=${d.is_active})`).join(', ') || 'none';
      showToast(`Playback failed: ${err.message} | Devices: [${deviceList}] | Target: ${targetDeviceId || 'none'}`, 'error');
      setCurrentlyPlaying(null);
    }
  }, [walkUpConfig, showToast]);

  const handlePause = useCallback(async () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    try {
      await pausePlayback();
    } catch {
      // Ignore
    }
    setCurrentlyPlaying(null);
  }, []);

  // --- Game Mode ---

  const getBattingOrder = () => {
    if (!selectedGameId || !gameHistory) return [];
    const game = gameHistory.find((g) => g.id === selectedGameId);
    return game?.battingOrder || [];
  };

  const handleNextBatter = async () => {
    const order = getBattingOrder();
    if (order.length === 0) return;

    await handlePause();

    const nextIndex = (currentBatterIndex + 1) % order.length;
    setCurrentBatterIndex(nextIndex);

    const batter = order[nextIndex];
    if (batter && walkUpConfig.players[batter.name]) {
      await handlePlay(batter.name);
    }
  };

  const handlePrevBatter = async () => {
    const order = getBattingOrder();
    if (order.length === 0) return;

    await handlePause();

    const prevIndex = (currentBatterIndex - 1 + order.length) % order.length;
    setCurrentBatterIndex(prevIndex);

    const batter = order[prevIndex];
    if (batter && walkUpConfig.players[batter.name]) {
      await handlePlay(batter.name);
    }
  };

  // --- Active players list ---
  const activePlayers = players.filter((p) => p.active !== false);

  return (
    <div className="walkup-page">
      {/* Internal Toast Notifications */}
      {toasts.length > 0 && (
        <div className="walkup-page-toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`walkup-page-toast walkup-page-toast-${t.type}`} onClick={() => dismissToast(t.id)}>
              <span className="walkup-page-toast-icon">
                {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
              </span>
              <span className="walkup-page-toast-message">{t.message}</span>
              <button className="walkup-page-toast-close" onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}>×</button>
            </div>
          ))}
        </div>
      )}

      <header className="walkup-page-header">
        <button className="walkup-page-back" onClick={onBack}>← Back</button>
        <h1>🎵 Walk-Up Music</h1>
        <span className="walkup-page-team">{teamName}</span>
      </header>

      {/* Tabs */}
      <div className="walkup-page-tabs">
        <button
          className={`walkup-page-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Configure
        </button>
        <button
          className={`walkup-page-tab ${activeTab === 'play' ? 'active' : ''}`}
          onClick={() => setActiveTab('play')}
        >
          ▶️ Play
        </button>
      </div>

      <div className="walkup-page-content">
        {/* Music Provider Selector */}
        <div className="walkup-page-provider-section">
          <h3>🎶 Music Provider</h3>
          <div className="walkup-page-provider-toggle">
            <button
              className={`walkup-page-provider-btn ${walkUpConfig.musicType === 'spotify' ? 'active' : ''}`}
              onClick={() => handleMusicTypeChange('spotify')}
            >
              🟢 Spotify
            </button>
            <button
              className={`walkup-page-provider-btn ${walkUpConfig.musicType === 'apple' ? 'active' : ''}`}
              onClick={() => handleMusicTypeChange('apple')}
            >
              🍎 Apple Music
            </button>
          </div>
        </div>

        {/* Spotify Flow */}
        {walkUpConfig.musicType === 'spotify' && !authenticated && (
          <div className="walkup-page-auth-section">
            <div className="walkup-page-auth-info">
              <h3>🔗 Connect to Spotify</h3>
              <p>Play walk-up songs through any device running Spotify. Click below to connect your account.</p>
            </div>

            <div className="walkup-page-setup-step">
              <p className="walkup-page-step-description">
                You&apos;ll be redirected to Spotify to grant permission. A <strong>Spotify Premium</strong> account is required for playback control.
              </p>
              <button className="walkup-page-btn-spotify" onClick={handleLogin}>
                🎵 Connect to Spotify
              </button>
            </div>

            <p className="walkup-page-auth-note">
              ℹ️ Your Spotify app must be open and active on a device (phone, speaker, computer). This app sends play/pause commands via Spotify Connect.
            </p>
          </div>
        )}

        {walkUpConfig.musicType === 'spotify' && authenticated && activeTab === 'config' && (
         <PageConfigTab
           walkUpConfig={walkUpConfig}
           playlists={playlists}
           playlistTracks={playlistTracks}
           loadingPlaylists={loadingPlaylists}
           loadingTracks={loadingTracks}
           activePlayers={activePlayers}
           editingPlayer={editingPlayer}
           onSelectPlaylist={handleSelectPlaylist}
           onRefreshPlaylist={() => walkUpConfig.spotifyPlaylistId && loadPlaylistTracks(walkUpConfig.spotifyPlaylistId)}
           onEditPlayer={setEditingPlayer}
           onAssignSong={handleAssignSong}
           onRemoveSong={handleRemoveSong}
           onLogout={handleLogout}
         />
        )}

        {walkUpConfig.musicType === 'spotify' && authenticated && activeTab === 'play' && (
          <PagePlayTab
            walkUpConfig={walkUpConfig}
            activePlayers={activePlayers}
            currentlyPlaying={currentlyPlaying}
            gameHistory={gameHistory}
            gameMode={gameMode}
            selectedGameId={selectedGameId}
            currentBatterIndex={currentBatterIndex}
            onPlay={handlePlay}
            onPause={handlePause}
            onToggleGameMode={() => setGameMode(!gameMode)}
            onSelectGame={setSelectedGameId}
            onNextBatter={handleNextBatter}
            onPrevBatter={handlePrevBatter}
            onSetBatterIndex={setCurrentBatterIndex}
          />
        )}

        {/* Apple Music Flow - no auth required */}
        {walkUpConfig.musicType === 'apple' && activeTab === 'config' && (
          <AppleConfigTab
            walkUpConfig={walkUpConfig}
            activePlayers={activePlayers}
            editingPlayer={editingPlayer}
            onEditPlayer={setEditingPlayer}
            onAssignSong={handleAssignAppleSong}
            onRemoveSong={handleRemoveSong}
          />
        )}

        {walkUpConfig.musicType === 'apple' && activeTab === 'play' && (
          <PagePlayTab
            walkUpConfig={walkUpConfig}
            activePlayers={activePlayers}
            currentlyPlaying={currentlyPlaying}
            gameHistory={gameHistory}
            gameMode={gameMode}
            selectedGameId={selectedGameId}
            currentBatterIndex={currentBatterIndex}
            onPlay={handlePlay}
            onPause={handlePause}
            onToggleGameMode={() => setGameMode(!gameMode)}
            onSelectGame={setSelectedGameId}
            onNextBatter={handleNextBatter}
            onPrevBatter={handlePrevBatter}
            onSetBatterIndex={setCurrentBatterIndex}
          />
        )}
      </div>
    </div>
  );
}

// --- Config Tab Sub-Component ---

function PageConfigTab({
  walkUpConfig,
  playlists,
  playlistTracks,
  loadingPlaylists,
  loadingTracks,
  activePlayers,
  editingPlayer,
  onSelectPlaylist,
  onRefreshPlaylist,
  onEditPlayer,
  onAssignSong,
  onRemoveSong,
  onLogout,
}) {
  return (
    <div className="walkup-page-config">
      {/* Spotify Status */}
      <div className="walkup-page-status-bar">
        <span className="walkup-page-connected">✅ Spotify Connected</span>
        <div className="walkup-page-status-actions">
          <button className="walkup-page-btn-logout" onClick={onLogout}>Disconnect</button>
        </div>
      </div>

      {/* Playlist Selection */}
      <div className="walkup-page-playlist-section">
        <h3>📋 Select Playlist</h3>
        {loadingPlaylists ? (
          <div className="walkup-page-loading">Loading playlists...</div>
        ) : (
          <div className="walkup-page-playlist-controls">
            <select
              className="walkup-page-playlist-select"
              value={walkUpConfig.spotifyPlaylistId || ''}
              onChange={(e) => onSelectPlaylist(e.target.value)}
            >
              <option value="">-- Select a playlist --</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.trackCount} tracks)
                </option>
              ))}
            </select>
            {walkUpConfig.spotifyPlaylistId && (
              <button
                className="walkup-page-btn-refresh"
                onClick={onRefreshPlaylist}
                disabled={loadingTracks}
                title="Refresh playlist to load added/removed songs"
              >
                🔄 Refresh
              </button>
            )}
          </div>
        )}
      </div>

      {/* Player Song Assignments */}
      {walkUpConfig.spotifyPlaylistId && (
        <div className="walkup-page-assignments">
          <h3>🎤 Player Songs</h3>
          {loadingTracks ? (
            <div className="walkup-page-loading">Loading tracks...</div>
          ) : (
            <div className="walkup-page-player-list">
              {activePlayers.map((player) => {
                const songConfig = walkUpConfig.players[player.name];

                return (
                  <div key={player.id} className="walkup-page-player-item">
                    <div className="walkup-page-player-info">
                      <span className="walkup-page-player-number">#{player.number}</span>
                      <span className="walkup-page-player-name">{player.name}</span>
                    </div>

                    {songConfig && (
                      <div className="walkup-page-song-assigned">
                        <div className="walkup-page-song-details">
                          {songConfig.albumArt && (
                            <img src={songConfig.albumArt} alt="" className="walkup-page-album-art" />
                          )}
                          <div className="walkup-page-song-text">
                            <div className="walkup-page-song-title">{songConfig.trackName}</div>
                            <div className="walkup-page-song-artist">{songConfig.artistName}</div>
                            <div className="walkup-page-song-times">
                              {formatMs(songConfig.startMs)}
                              {songConfig.endMs != null ? ` → ${formatMs(songConfig.endMs)}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="walkup-page-song-actions">
                          <button className="walkup-page-btn-edit" onClick={() => onEditPlayer(player.name)}>✏️</button>
                          <button className="walkup-page-btn-remove" onClick={() => onRemoveSong(player.name)}>🗑️</button>
                        </div>
                      </div>
                    )}

                    {!songConfig && (
                      <button className="walkup-page-btn-assign" onClick={() => onEditPlayer(player.name)}>
                        + Assign Song
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingPlayer && (
        <SongPickerModal
          playerName={editingPlayer}
          tracks={playlistTracks}
          currentConfig={walkUpConfig.players[editingPlayer]}
          onSave={(track, startTime, endTime) => onAssignSong(editingPlayer, track, startTime, endTime)}
          onCancel={() => onEditPlayer(null)}
        />
      )}
    </div>
  );
}

// --- Song Picker Modal ---

function SongPickerModal({ playerName, tracks, currentConfig, onSave, onCancel }) {
  const [selectedTrackId, setSelectedTrackId] = useState(currentConfig?.trackId || '');
  const [startTime, setStartTime] = useState(currentConfig ? formatMs(currentConfig.startMs) : '0:00');
  const [endTime, setEndTime] = useState(currentConfig?.endMs != null ? formatMs(currentConfig.endMs) : '');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredTracks = searchFilter
    ? tracks.filter(
        (t) =>
          t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          t.artist.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : tracks;

  const handleSave = () => {
    const track = tracks.find((t) => t.id === selectedTrackId);
    if (!track) return;
    onSave(track, startTime, endTime);
  };

  return (
    <div className="walkup-page-modal-overlay" onClick={onCancel}>
      <div className="walkup-page-modal" onClick={(e) => e.stopPropagation()}>
        <div className="walkup-page-modal-header">
          <h3>🎵 Select Song for {playerName}</h3>
          <button className="walkup-page-modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="walkup-page-modal-body">
          <input
            type="text"
            className="walkup-page-search-input"
            placeholder="Search songs..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />

          <div className="walkup-page-track-list">
            {filteredTracks.slice(0, 50).map((track) => (
              <div
                key={track.id}
                className={`walkup-page-track-item ${selectedTrackId === track.id ? 'selected' : ''}`}
                onClick={() => setSelectedTrackId(track.id)}
              >
                {track.albumArt && <img src={track.albumArt} alt="" className="walkup-page-track-art" />}
                <div className="walkup-page-track-info">
                  <div className="walkup-page-track-name">{track.name}</div>
                  <div className="walkup-page-track-artist">{track.artist}</div>
                </div>
                <div className="walkup-page-track-duration">{formatMs(track.durationMs)}</div>
              </div>
            ))}
          </div>

          {selectedTrackId && (
            <div className="walkup-page-time-config">
              <div className="walkup-page-time-field">
                <label>Start Time (m:ss)</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="0:00"
                />
              </div>
              <div className="walkup-page-time-field">
                <label>End Time (m:ss)</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}
        </div>

        <div className="walkup-page-modal-footer">
          <button className="walkup-page-btn-save" onClick={handleSave} disabled={!selectedTrackId}>
            Save
          </button>
          <button className="walkup-page-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Apple Music Config Tab ---

function AppleConfigTab({
  walkUpConfig,
  activePlayers,
  editingPlayer,
  onEditPlayer,
  onAssignSong,
  onRemoveSong,
}) {
  return (
    <div className="walkup-page-config">
      {/* Apple Music Info */}
      <div className="walkup-page-status-bar">
        <span className="walkup-page-connected">🍎 Apple Music (No login required)</span>
      </div>

      {/* Player Song Assignments */}
      <div className="walkup-page-assignments">
        <h3>🎤 Player Songs</h3>
        <div className="walkup-page-player-list">
          {activePlayers.map((player) => {
            const songConfig = walkUpConfig.players[player.name];

            return (
              <div key={player.id} className="walkup-page-player-item">
                <div className="walkup-page-player-info">
                  <span className="walkup-page-player-number">#{player.number}</span>
                  <span className="walkup-page-player-name">{player.name}</span>
                </div>

                {songConfig && (
                  <div className="walkup-page-song-assigned">
                    <div className="walkup-page-song-details">
                      {songConfig.albumArt && (
                        <img src={songConfig.albumArt} alt="" className="walkup-page-album-art" />
                      )}
                      <div className="walkup-page-song-text">
                        <div className="walkup-page-song-title">{songConfig.trackName}</div>
                        <div className="walkup-page-song-artist">{songConfig.artistName}</div>
                      </div>
                    </div>
                    <div className="walkup-page-song-actions">
                      <button className="walkup-page-btn-edit" onClick={() => onEditPlayer(player.name)}>✏️</button>
                      <button className="walkup-page-btn-remove" onClick={() => onRemoveSong(player.name)}>🗑️</button>
                    </div>
                  </div>
                )}

                {!songConfig && (
                  <button className="walkup-page-btn-assign" onClick={() => onEditPlayer(player.name)}>
                    + Assign Song
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Song Search Modal for Apple Music */}
      {editingPlayer && (
        <AppleSongPickerModal
          playerName={editingPlayer}
          currentConfig={walkUpConfig.players[editingPlayer]}
          onSave={(songConfig) => onAssignSong(editingPlayer, songConfig)}
          onCancel={() => onEditPlayer(null)}
        />
      )}
    </div>
  );
}

// --- Apple Music Song Picker Modal ---

function AppleSongPickerModal({ playerName, currentConfig, onSave, onCancel }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(
    currentConfig?.trackName
      ? {
          id: currentConfig.appleMusicUrl || currentConfig.trackName,
          name: currentConfig.trackName,
          artist: currentConfig.artistName || '',
          album: '',
          durationMs: 0,
          albumArt: currentConfig.albumArt || null,
          appleMusicUrl: currentConfig.appleMusicUrl || '',
        }
      : null
  );
  const [startTime, setStartTime] = useState(currentConfig ? formatMs(currentConfig.startMs) : '0:00');
  const [endTime, setEndTime] = useState(currentConfig?.endMs != null ? formatMs(currentConfig.endMs) : '');
  const searchTimerRef = useRef(null);

  const handleSearch = (value) => {
    setQuery(value);
    setSearchError(null);
    clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const tracks = await searchAppleMusicSongs(value);
        setResults(tracks);
      } catch (err) {
        setSearchError(err.message);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSave = () => {
    if (!selectedTrack) return;
    const startMs = parseTimeToMs(startTime) || 0;
    const endMs = parseTimeToMs(endTime);
    onSave({
      trackName: selectedTrack.name,
      artistName: selectedTrack.artist,
      albumArt: selectedTrack.albumArt,
      appleMusicUrl: selectedTrack.appleMusicUrl,
      startMs,
      endMs,
      musicType: 'apple',
    });
  };

  return (
    <div className="walkup-page-modal-overlay" onClick={onCancel}>
      <div className="walkup-page-modal" onClick={(e) => e.stopPropagation()}>
        <div className="walkup-page-modal-header">
          <h3>🍎 Search Song for {playerName}</h3>
          <button className="walkup-page-modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="walkup-page-modal-body">
          <input
            type="text"
            className="walkup-page-search-input"
            placeholder="Search Apple Music songs..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />

          {searching && <div className="walkup-page-loading">Searching...</div>}
          {searchError && <div className="walkup-page-search-error">⚠️ {searchError}</div>}

          {results.length > 0 && (
            <div className="walkup-page-track-list">
              {results.map((track) => (
                <div
                  key={track.id}
                  className={`walkup-page-track-item ${selectedTrack?.id === track.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTrack(track)}
                >
                  {track.albumArt && <img src={track.albumArt} alt="" className="walkup-page-track-art" />}
                  <div className="walkup-page-track-info">
                    <div className="walkup-page-track-name">{track.name}</div>
                    <div className="walkup-page-track-artist">{track.artist}</div>
                  </div>
                  <div className="walkup-page-track-duration">{formatMs(track.durationMs)}</div>
                </div>
              ))}
            </div>
          )}

          {selectedTrack && (
            <div className="walkup-page-selected-track">
              <span className="walkup-page-selected-label">Selected:</span>
              <strong>{selectedTrack.name}</strong>
              {selectedTrack.artist && <span> — {selectedTrack.artist}</span>}
            </div>
          )}

          {selectedTrack && (
            <div className="walkup-page-time-config">
              <div className="walkup-page-time-field">
                <label>Start Time (m:ss)</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="0:00"
                />
              </div>
              <div className="walkup-page-time-field">
                <label>End Time (m:ss)</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}
        </div>

        <div className="walkup-page-modal-footer">
          <button className="walkup-page-btn-save" onClick={handleSave} disabled={!selectedTrack}>
            Save
          </button>
          <button className="walkup-page-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Play Tab Sub-Component ---

function PagePlayTab({
  walkUpConfig,
  activePlayers,
  currentlyPlaying,
  gameHistory,
  gameMode,
  selectedGameId,
  currentBatterIndex,
  onPlay,
  onPause,
  onToggleGameMode,
  onSelectGame,
  onNextBatter,
  onPrevBatter,
  onSetBatterIndex,
}) {
  const configuredPlayers = activePlayers.filter((p) => walkUpConfig.players[p.name]);
  const hasGameHistory = gameHistory && gameHistory.length > 0;

  const battingOrder = (() => {
    if (!selectedGameId || !gameHistory) return [];
    const game = gameHistory.find((g) => g.id === selectedGameId);
    return game?.battingOrder || [];
  })();

  if (configuredPlayers.length === 0) {
    return (
      <div className="walkup-page-empty">
        <p>No walk-up songs configured yet.</p>
        <p>Go to the Configure tab to assign songs to players.</p>
      </div>
    );
  }

  return (
    <div className="walkup-page-play">
      {/* Mode Toggle */}
      {hasGameHistory && (
        <div className="walkup-page-mode-toggle">
          <button
            className={`walkup-page-mode-btn ${!gameMode ? 'active' : ''}`}
            onClick={() => { if (gameMode) onToggleGameMode(); }}
          >
            👤 Simple Mode
          </button>
          <button
            className={`walkup-page-mode-btn ${gameMode ? 'active' : ''}`}
            onClick={() => { if (!gameMode) onToggleGameMode(); }}
          >
            ⚾ Game Mode
          </button>
        </div>
      )}

      {/* Simple Mode - Player List */}
      {!gameMode && (
        <div className="walkup-page-play-list">
          {configuredPlayers.map((player) => {
            const song = walkUpConfig.players[player.name];
            const isPlaying = currentlyPlaying === player.name;
            return (
              <div
                key={player.id}
                className={`walkup-page-play-item ${isPlaying ? 'playing' : ''}`}
                onClick={() => isPlaying ? onPause() : onPlay(player.name)}
              >
                <div className="walkup-page-play-item-top">
                  <div className="walkup-page-play-player">
                    <span className="walkup-page-play-number">#{player.number}</span>
                    <span className="walkup-page-play-name">{player.name}</span>
                  </div>
                  <button className={`walkup-page-btn-play ${isPlaying ? 'playing' : ''}`}>
                    {isPlaying ? '⏸' : '▶️'}
                  </button>
                </div>
                <div className="walkup-page-play-song">
                  {song.albumArt && <img src={song.albumArt} alt="" className="walkup-page-play-art" />}
                  <div className="walkup-page-play-song-text">
                    <div className="walkup-page-play-track">{song.trackName}</div>
                    <div className="walkup-page-play-artist">{song.artistName}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Game Mode - Batting Order */}
      {gameMode && (
        <div className="walkup-page-game-mode">
          <div className="walkup-page-game-select">
            <label>Select Game:</label>
            <select
              value={selectedGameId || ''}
              onChange={(e) => {
                onSelectGame(e.target.value);
                onSetBatterIndex(0);
              }}
            >
              <option value="">-- Choose a game --</option>
              {gameHistory.map((g) => (
                <option key={g.id} value={g.id}>
                  Game {g.gameNumber} - {new Date(g.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {selectedGameId && battingOrder.length > 0 && (
            <>
              <div className="walkup-page-batting-order">
                {battingOrder.map((batter, index) => {
                  const song = walkUpConfig.players[batter.name];
                  const isCurrent = index === currentBatterIndex;
                  const isPlaying = currentlyPlaying === batter.name;
                  return (
                    <div
                      key={index}
                      className={`walkup-page-batter-item ${isCurrent ? 'current' : ''} ${isPlaying ? 'playing' : ''} ${!song ? 'no-song' : ''}`}
                      onClick={() => {
                        onSetBatterIndex(index);
                        if (song) {
                          if (isPlaying) {
                            onPause();
                          } else {
                            onPlay(batter.name);
                          }
                        }
                      }}
                    >
                      <span className="walkup-page-batter-order">{index + 1}</span>
                      <span className="walkup-page-batter-number">#{batter.number}</span>
                      <span className="walkup-page-batter-name">{batter.name}</span>
                      {song && (
                        <span className="walkup-page-batter-song">{song.trackName}</span>
                      )}
                      {!song && (
                        <span className="walkup-page-batter-no-song">No song</span>
                      )}
                      {isPlaying && <span className="walkup-page-batter-playing">🎵</span>}
                    </div>
                  );
                })}
              </div>

              <div className="walkup-page-game-controls">
                <button className="walkup-page-btn-prev" onClick={onPrevBatter}>⏮ Prev</button>
                <button
                  className="walkup-page-btn-play-current"
                  onClick={() => {
                    const batter = battingOrder[currentBatterIndex];
                    if (batter && walkUpConfig.players[batter.name]) {
                      if (currentlyPlaying === batter.name) {
                        onPause();
                      } else {
                        onPlay(batter.name);
                      }
                    }
                  }}
                >
                  {currentlyPlaying === battingOrder[currentBatterIndex]?.name ? '⏸ Pause' : '▶️ Play'}
                </button>
                <button className="walkup-page-btn-next" onClick={onNextBatter}>Next ⏭</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default WalkUpMusicPage;
