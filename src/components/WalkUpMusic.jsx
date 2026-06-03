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
  formatMs,
  parseTimeToMs,
  getAvailableDevices,
  getPreferredDeviceId,
  setPreferredDeviceId,
  selectBestDevice,
  filterPlayableDevices,
} from '../utils/spotify';
import { playAppleMusicTrack, searchAppleMusicSongs } from '../utils/appleMusic';
import {
  getTeamWalkUpMusic,
  saveTeamWalkUpMusic,
  setTeamPlaylist,
  setTeamMusicType,
  setTeamApplePlaylist,
  setPlayerWalkUpSong,
  removePlayerWalkUpSong,
} from '../utils/storage';
import './WalkUpMusic.css';

function WalkUpMusic({ teamId, teamName, players, gameHistory, onClose }) {
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
  const audioRef = useRef(null);

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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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

    // Apple Music playback via preview URL (in-browser) or deep link fallback
    if (walkUpConfig.musicType === 'apple') {
      if (config.previewUrl) {
        // Stop any currently playing preview
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = new Audio(config.previewUrl);
        audioRef.current = audio;

        const startSec = (config.startMs || 0) / 1000;
        audio.currentTime = startSec;

        audio.play().catch((err) => {
          showToast(`Could not play preview for "${config.trackName}": ${err.message}`, 'error');
        });

        setCurrentlyPlaying(playerName);
        const nowPlayingMsg = config.artistName
          ? `Now playing "${config.trackName}" — ${config.artistName}`
          : `Now playing "${config.trackName}"`;
        showToast(nowPlayingMsg, 'info');

        // Auto-stop if end time is configured
        if (config.endMs != null && config.endMs > (config.startMs || 0)) {
          const duration = config.endMs - (config.startMs || 0);
          stopTimerRef.current = setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
            }
            setCurrentlyPlaying(null);
            stopTimerRef.current = null;
          }, duration);
        } else {
          // Auto-clear playing state when the preview ends naturally
          audio.addEventListener('ended', () => {
            setCurrentlyPlaying(null);
            audioRef.current = null;
          }, { once: true });
        }
      } else {
        // No preview URL available — fall back to opening Apple Music app
        playAppleMusicTrack(config.appleMusicUrl);
        setCurrentlyPlaying(playerName);
        showToast(`Opening "${config.trackName}" in Apple Music...`, 'info');
      }
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

      // If no playable devices were found, try to open Spotify app with the specific track
      if (!targetDeviceId && filterPlayableDevices(debugDevices).length === 0) {
        // Open the specific track in the Spotify native app via deep link
        // Use the track URI (e.g. spotify:track:ABC123) so it starts playing that song
        const deepLink = config.trackUri || 'spotify://';
        window.open(deepLink, '_blank');
        showToast('No playable device found. Opening song in Spotify app... Tap play again in a few seconds if needed.', 'info');
        return;
      }

      await playTrack(config.trackUri, config.startMs || 0, targetDeviceId);
      // Remember this device for future playback
      if (targetDeviceId) {
        setPreferredDeviceId(targetDeviceId);
      }
      setCurrentlyPlaying(playerName);

      // Set up auto-stop if end time is configured
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
      showToast(`Playback failed: ${err.message} | Devices found: [${deviceList}] | Target: ${targetDeviceId || 'none'} | Preferred: ${debugPreferredId || 'none'}`, 'error');
      setCurrentlyPlaying(null);
    }
  }, [walkUpConfig, showToast]);

  const handleStop = useCallback(async () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    // Stop any in-browser Apple Music preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
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

    // Stop current
    await handleStop();

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

    await handleStop();

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
    <div className="walkup-overlay" onClick={onClose}>
      <div className="walkup-modal" onClick={(e) => e.stopPropagation()}>
        {/* Internal Toast Notifications */}
        {toasts.length > 0 && (
          <div className="walkup-toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`walkup-toast walkup-toast-${t.type}`} onClick={() => dismissToast(t.id)}>
                <span className="walkup-toast-icon">
                  {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
                </span>
                <span className="walkup-toast-message">{t.message}</span>
                <button className="walkup-toast-close" onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="walkup-header">
          <h2>🎵 Walk-Up Music</h2>
          <span className="walkup-team-name">{teamName}</span>
          <button className="btn-close-walkup" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="walkup-tabs">
          <button
            className={`walkup-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            ⚙️ Configure
          </button>
          <button
            className={`walkup-tab ${activeTab === 'play' ? 'active' : ''}`}
            onClick={() => setActiveTab('play')}
          >
            ▶️ Play
          </button>
        </div>

        <div className="walkup-content">
          {/* Music Provider Selector */}
          <div className="walkup-provider-section">
            <div className="walkup-provider-toggle">
              <button
                className={`walkup-provider-btn ${walkUpConfig.musicType === 'spotify' ? 'active' : ''}`}
                onClick={() => handleMusicTypeChange('spotify')}
              >
                🟢 Spotify
              </button>
              <button
                className={`walkup-provider-btn ${walkUpConfig.musicType === 'apple' ? 'active' : ''}`}
                onClick={() => handleMusicTypeChange('apple')}
              >
                🍎 Apple Music
              </button>
            </div>
          </div>

          {/* Spotify Flow */}
          {walkUpConfig.musicType === 'spotify' && !authenticated && (
            <div className="walkup-auth-section">
              <div className="walkup-auth-info">
                <h3>🔗 Connect to Spotify</h3>
                <p>Play walk-up songs through any device running Spotify. Click below to connect your account.</p>
              </div>

              <div className="walkup-setup-step active">
                <div className="walkup-step-body">
                  <p className="walkup-step-description">
                    You&apos;ll be redirected to Spotify to grant permission. A <strong>Spotify Premium</strong> account is required for playback control.
                  </p>
                  <button className="btn-spotify-login" onClick={handleLogin}>
                    🎵 Connect to Spotify
                  </button>
                </div>
              </div>

              <p className="walkup-auth-note">
                ℹ️ Your Spotify app must be open and active on a device (phone, speaker, computer). This app sends play/pause commands via Spotify Connect.
              </p>
            </div>
          )}

          {walkUpConfig.musicType === 'spotify' && authenticated && activeTab === 'config' && (
            <ConfigTab
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
            <PlayTab
              walkUpConfig={walkUpConfig}
              activePlayers={activePlayers}
              currentlyPlaying={currentlyPlaying}
              gameHistory={gameHistory}
              gameMode={gameMode}
              selectedGameId={selectedGameId}
              currentBatterIndex={currentBatterIndex}
              onPlay={handlePlay}
              onStop={handleStop}
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
            <PlayTab
              walkUpConfig={walkUpConfig}
              activePlayers={activePlayers}
              currentlyPlaying={currentlyPlaying}
              gameHistory={gameHistory}
              gameMode={gameMode}
              selectedGameId={selectedGameId}
              currentBatterIndex={currentBatterIndex}
              onPlay={handlePlay}
              onStop={handleStop}
              onToggleGameMode={() => setGameMode(!gameMode)}
              onSelectGame={setSelectedGameId}
              onNextBatter={handleNextBatter}
              onPrevBatter={handlePrevBatter}
              onSetBatterIndex={setCurrentBatterIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Config Tab Sub-Component ---

function ConfigTab({
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
    <div className="walkup-config">
      {/* Spotify Status */}
      <div className="walkup-status-bar">
        <span className="walkup-connected">✅ Spotify Connected</span>
        <div className="walkup-status-actions">
          <button className="btn-walkup-logout" onClick={onLogout}>Disconnect</button>
        </div>
      </div>

      {/* Playlist Selection */}
      <div className="walkup-playlist-section">
        <h3>📋 Select Playlist</h3>
        {loadingPlaylists ? (
          <div className="walkup-loading">Loading playlists...</div>
        ) : (
          <div className="walkup-playlist-controls">
            <select
              className="walkup-playlist-select"
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
                className="btn-walkup-refresh"
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
        <div className="walkup-assignments">
          <h3>🎤 Player Songs</h3>
          {loadingTracks ? (
            <div className="walkup-loading">Loading tracks...</div>
          ) : (
            <div className="walkup-player-list">
              {activePlayers.map((player) => {
                const songConfig = walkUpConfig.players[player.name];
                const isEditing = editingPlayer === player.name;

                return (
                  <div key={player.id} className="walkup-player-item">
                    <div className="walkup-player-info">
                      <span className="walkup-player-number">#{player.number}</span>
                      <span className="walkup-player-name">{player.name}</span>
                    </div>

                    {songConfig && !isEditing && (
                      <div className="walkup-song-assigned">
                        <div className="walkup-song-details">
                          {songConfig.albumArt && (
                            <img src={songConfig.albumArt} alt="" className="walkup-album-art" />
                          )}
                          <div>
                            <div className="walkup-song-title">{songConfig.trackName}</div>
                            <div className="walkup-song-artist">{songConfig.artistName}</div>
                            <div className="walkup-song-times">
                              {formatMs(songConfig.startMs)}
                              {songConfig.endMs != null ? ` → ${formatMs(songConfig.endMs)}` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="walkup-song-actions">
                          <button className="btn-walkup-edit" onClick={() => onEditPlayer(player.name)}>✏️</button>
                          <button className="btn-walkup-remove" onClick={() => onRemoveSong(player.name)}>🗑️</button>
                        </div>
                      </div>
                    )}

                    {!songConfig && !isEditing && (
                      <button className="btn-walkup-assign" onClick={() => onEditPlayer(player.name)}>
                        + Assign Song
                      </button>
                    )}

                    {isEditing && (
                      <SongPicker
                        tracks={playlistTracks}
                        currentConfig={songConfig}
                        onSave={(track, startTime, endTime) => onAssignSong(player.name, track, startTime, endTime)}
                        onCancel={() => onEditPlayer(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Song Picker Sub-Component ---

function SongPicker({ tracks, currentConfig, onSave, onCancel }) {
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
    <div className="walkup-song-picker">
      <input
        type="text"
        className="walkup-search-input"
        placeholder="Search songs..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
      />

      <div className="walkup-track-list">
        {filteredTracks.slice(0, 50).map((track) => (
          <div
            key={track.id}
            className={`walkup-track-item ${selectedTrackId === track.id ? 'selected' : ''}`}
            onClick={() => setSelectedTrackId(track.id)}
          >
            {track.albumArt && <img src={track.albumArt} alt="" className="walkup-track-art" />}
            <div className="walkup-track-info">
              <div className="walkup-track-name">{track.name}</div>
              <div className="walkup-track-artist">{track.artist}</div>
            </div>
            <div className="walkup-track-duration">{formatMs(track.durationMs)}</div>
          </div>
        ))}
      </div>

      {selectedTrackId && (
        <div className="walkup-time-config">
          <div className="walkup-time-field">
            <label>Start Time (m:ss)</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="0:00"
            />
          </div>
          <div className="walkup-time-field">
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

      <div className="walkup-picker-actions">
        <button className="btn-walkup-save" onClick={handleSave} disabled={!selectedTrackId}>
          Save
        </button>
        <button className="btn-walkup-cancel" onClick={onCancel}>
          Cancel
        </button>
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
    <div className="walkup-config">
      {/* Apple Music Info */}
      <div className="walkup-status-bar">
        <span className="walkup-connected">🍎 Apple Music (No login required)</span>
      </div>

      {/* Player Song Assignments */}
      <div className="walkup-assignments">
        <h3>🎤 Player Songs</h3>
        <div className="walkup-player-list">
          {activePlayers.map((player) => {
            const songConfig = walkUpConfig.players[player.name];
            const isEditing = editingPlayer === player.name;

            return (
              <div key={player.id} className="walkup-player-item">
                <div className="walkup-player-info">
                  <span className="walkup-player-number">#{player.number}</span>
                  <span className="walkup-player-name">{player.name}</span>
                </div>

                {songConfig && !isEditing && (
                  <div className="walkup-song-assigned">
                    <div className="walkup-song-details">
                      {songConfig.albumArt && (
                        <img src={songConfig.albumArt} alt="" className="walkup-album-art" />
                      )}
                      <div>
                        <div className="walkup-song-title">{songConfig.trackName}</div>
                        <div className="walkup-song-artist">{songConfig.artistName}</div>
                      </div>
                    </div>
                    <div className="walkup-song-actions">
                      <button className="btn-walkup-edit" onClick={() => onEditPlayer(player.name)}>✏️</button>
                      <button className="btn-walkup-remove" onClick={() => onRemoveSong(player.name)}>🗑️</button>
                    </div>
                  </div>
                )}

                {!songConfig && !isEditing && (
                  <button className="btn-walkup-assign" onClick={() => onEditPlayer(player.name)}>
                    + Assign Song
                  </button>
                )}

                {isEditing && (
                  <AppleSongPicker
                    currentConfig={songConfig}
                    onSave={(config) => onAssignSong(player.name, config)}
                    onCancel={() => onEditPlayer(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Apple Music Song Picker ---

function AppleSongPicker({ currentConfig, onSave, onCancel }) {
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
          previewUrl: currentConfig.previewUrl || null,
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
      previewUrl: selectedTrack.previewUrl || null,
      startMs,
      endMs,
      musicType: 'apple',
    });
  };

  return (
    <div className="walkup-song-picker">
      <input
        type="text"
        className="walkup-search-input"
        placeholder="Search Apple Music songs..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        autoFocus
      />

      {searching && <div className="walkup-loading">Searching...</div>}
      {searchError && <div className="walkup-search-error">⚠️ {searchError}</div>}

      {results.length > 0 && (
        <div className="walkup-track-list">
          {results.map((track) => (
            <div
              key={track.id}
              className={`walkup-track-item ${selectedTrack?.id === track.id ? 'selected' : ''}`}
              onClick={() => setSelectedTrack(track)}
            >
              {track.albumArt && <img src={track.albumArt} alt="" className="walkup-track-art" />}
              <div className="walkup-track-info">
                <div className="walkup-track-name">{track.name}</div>
                <div className="walkup-track-artist">{track.artist}</div>
              </div>
              <div className="walkup-track-duration">{formatMs(track.durationMs)}</div>
            </div>
          ))}
        </div>
      )}

      {selectedTrack && (
        <div className="walkup-selected-track">
          <span className="walkup-selected-label">Selected:</span>
          <strong>{selectedTrack.name}</strong>
          {selectedTrack.artist && <span> — {selectedTrack.artist}</span>}
        </div>
      )}

      {selectedTrack && (
        <div className="walkup-time-config">
          <div className="walkup-time-field">
            <label>Start Time (m:ss)</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="0:00"
            />
          </div>
          <div className="walkup-time-field">
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

      <div className="walkup-picker-actions">
        <button className="btn-walkup-save" onClick={handleSave} disabled={!selectedTrack}>
          Save
        </button>
        <button className="btn-walkup-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// --- Play Tab Sub-Component ---

function PlayTab({
  walkUpConfig,
  activePlayers,
  currentlyPlaying,
  gameHistory,
  gameMode,
  selectedGameId,
  currentBatterIndex,
  onPlay,
  onStop,
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
      <div className="walkup-empty-play">
        <p>No walk-up songs configured yet.</p>
        <p>Go to the Configure tab to assign songs to players.</p>
      </div>
    );
  }

  return (
    <div className="walkup-play">
      {/* Mode Toggle */}
      {hasGameHistory && (
        <div className="walkup-mode-toggle">
          <button
            className={`walkup-mode-btn ${!gameMode ? 'active' : ''}`}
            onClick={() => { if (gameMode) onToggleGameMode(); }}
          >
            👤 Simple Mode
          </button>
          <button
            className={`walkup-mode-btn ${gameMode ? 'active' : ''}`}
            onClick={() => { if (!gameMode) onToggleGameMode(); }}
          >
            ⚾ Game Mode
          </button>
        </div>
      )}

      {/* Currently Playing Indicator */}
      {currentlyPlaying && (
        <div className="walkup-now-playing">
          <div className="walkup-now-playing-info">
            <span className="now-playing-pulse">🎵</span>
            <span>Now Playing: <strong>{currentlyPlaying}</strong></span>
            <span className="now-playing-song">{walkUpConfig.players[currentlyPlaying]?.trackName}</span>
          </div>
          <button className="btn-walkup-stop" onClick={onStop}>⏹ Stop</button>
        </div>
      )}

      {/* Simple Mode - Player List */}
      {!gameMode && (
        <div className="walkup-play-list">
          {configuredPlayers.map((player) => {
            const song = walkUpConfig.players[player.name];
            const isPlaying = currentlyPlaying === player.name;
            return (
              <div
                key={player.id}
                className={`walkup-play-item ${isPlaying ? 'playing' : ''}`}
                onClick={() => isPlaying ? onStop() : onPlay(player.name)}
              >
                <div className="walkup-play-player">
                  <span className="walkup-play-number">#{player.number}</span>
                  <span className="walkup-play-name">{player.name}</span>
                </div>
                <div className="walkup-play-song">
                  {song.albumArt && <img src={song.albumArt} alt="" className="walkup-play-art" />}
                  <div>
                    <div className="walkup-play-track">{song.trackName}</div>
                    <div className="walkup-play-artist">{song.artistName}</div>
                  </div>
                </div>
                <button className={`btn-walkup-play ${isPlaying ? 'playing' : ''}`}>
                  {isPlaying ? '⏹' : '▶️'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Game Mode - Batting Order */}
      {gameMode && (
        <div className="walkup-game-mode">
          <div className="walkup-game-select">
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
              <div className="walkup-batting-order">
                {battingOrder.map((batter, index) => {
                  const song = walkUpConfig.players[batter.name];
                  const isCurrent = index === currentBatterIndex;
                  const isPlaying = currentlyPlaying === batter.name;
                  return (
                    <div
                      key={index}
                      className={`walkup-batter-item ${isCurrent ? 'current' : ''} ${isPlaying ? 'playing' : ''} ${!song ? 'no-song' : ''}`}
                      onClick={() => {
                        onSetBatterIndex(index);
                        if (song) {
                          if (isPlaying) {
                            onStop();
                          } else {
                            onPlay(batter.name);
                          }
                        }
                      }}
                    >
                      <span className="walkup-batter-order">{index + 1}</span>
                      <span className="walkup-batter-number">#{batter.number}</span>
                      <span className="walkup-batter-name">{batter.name}</span>
                      {song && (
                        <span className="walkup-batter-song">{song.trackName}</span>
                      )}
                      {!song && (
                        <span className="walkup-batter-no-song">No song</span>
                      )}
                      {isPlaying && <span className="walkup-batter-playing">🎵</span>}
                    </div>
                  );
                })}
              </div>

              <div className="walkup-game-controls">
                <button className="btn-walkup-prev" onClick={onPrevBatter}>⏮ Prev</button>
                <button
                  className="btn-walkup-play-current"
                  onClick={() => {
                    const batter = battingOrder[currentBatterIndex];
                    if (batter && walkUpConfig.players[batter.name]) {
                      if (currentlyPlaying === batter.name) {
                        onStop();
                      } else {
                        onPlay(batter.name);
                      }
                    }
                  }}
                >
                  {currentlyPlaying === battingOrder[currentBatterIndex]?.name ? '⏹ Stop' : '▶️ Play'}
                </button>
                <button className="btn-walkup-next" onClick={onNextBatter}>Next ⏭</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default WalkUpMusic;
