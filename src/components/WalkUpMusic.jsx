import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  isAuthenticated,
  startAuthFlow,
  handleAuthCallback,
  clearTokens,
  getClientId,
  setClientId,
  getUserPlaylists,
  getPlaylistTracks,
  playTrack,
  pausePlayback,
  formatMs,
  parseTimeToMs,
  getAvailableDevices,
} from '../utils/spotify';
import {
  getTeamWalkUpMusic,
  saveTeamWalkUpMusic,
  setTeamPlaylist,
  setPlayerWalkUpSong,
  removePlayerWalkUpSong,
} from '../utils/storage';
import './WalkUpMusic.css';

function WalkUpMusic({ teamId, teamName, players, gameHistory, onClose, onShowToast }) {
  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [clientId, setClientIdState] = useState('');
  const [showClientIdSetup, setShowClientIdSetup] = useState(false);

  // Data state
  const [walkUpConfig, setWalkUpConfig] = useState({ spotifyPlaylistId: null, spotifyPlaylistName: null, players: {} });
  const [playlists, setPlaylists] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [devices, setDevices] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'play'
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [gameMode, setGameMode] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [currentBatterIndex, setCurrentBatterIndex] = useState(0);

  const stopTimerRef = useRef(null);

  // Load config and handle auth callback on mount
  useEffect(() => {
    const config = getTeamWalkUpMusic(teamId);
    setWalkUpConfig(config);
    setClientIdState(getClientId());

    // Handle OAuth callback
    handleAuthCallback()
      .then((wasCallback) => {
        if (wasCallback) {
          setAuthenticated(true);
          onShowToast('Connected to Spotify!', 'success');
        } else {
          setAuthenticated(isAuthenticated());
        }
      })
      .catch((err) => {
        onShowToast(err.message, 'error');
        setAuthenticated(false);
      });

    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
    };
  }, [teamId]);

  // Load playlists when authenticated
  useEffect(() => {
    if (authenticated) {
      loadPlaylists();
      loadDevices();
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
      onShowToast(`Failed to load playlists: ${err.message}`, 'error');
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
      onShowToast(`Failed to load tracks: ${err.message}`, 'error');
    } finally {
      setLoadingTracks(false);
    }
  };

  const loadDevices = async () => {
    try {
      const devs = await getAvailableDevices();
      setDevices(devs);
    } catch {
      // Silently fail - devices will be empty
    }
  };

  // --- Auth Helpers ---

  const hasClientId = !!getClientId();

  const handleCopyRedirectUri = () => {
    const uri = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(uri).then(
      () => onShowToast('Redirect URI copied!', 'success'),
      () => onShowToast('Could not copy — please copy manually', 'error')
    );
  };

  // --- Auth Handlers ---

  const handleSaveClientId = () => {
    if (!clientId.trim()) {
      onShowToast('Please enter a Spotify Client ID', 'error');
      return;
    }
    setClientId(clientId.trim());
    setShowClientIdSetup(false);
    onShowToast('Client ID saved! Now click "Connect to Spotify" to log in.', 'success');
  };

  const handleLogin = async () => {
    if (!getClientId()) {
      setShowClientIdSetup(true);
      return;
    }
    try {
      await startAuthFlow();
    } catch (err) {
      onShowToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    clearTokens();
    setAuthenticated(false);
    setPlaylists([]);
    setPlaylistTracks([]);
    setDevices([]);
    onShowToast('Disconnected from Spotify', 'info');
  };

  // --- Config Handlers ---

  const handleSelectPlaylist = (playlistId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      setTeamPlaylist(teamId, playlistId, playlist.name);
      const updated = { ...walkUpConfig, spotifyPlaylistId: playlistId, spotifyPlaylistName: playlist.name };
      setWalkUpConfig(updated);
    }
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
    onShowToast(`Walk-up song set for ${playerName}`, 'success');
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
      onShowToast(`No walk-up song configured for ${playerName}`, 'error');
      return;
    }

    // Clear any existing stop timer
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    try {
      await playTrack(config.trackUri, config.startMs || 0);
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
      onShowToast(`Playback failed: ${err.message}`, 'error');
      setCurrentlyPlaying(null);
    }
  }, [walkUpConfig, onShowToast]);

  const handleStop = useCallback(async () => {
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
          {/* Spotify Connection */}
          {!authenticated && (
            <div className="walkup-auth-section">
              <div className="walkup-auth-info">
                <h3>🔗 Connect to Spotify</h3>
                <p>Play walk-up songs through any device running Spotify. Follow the steps below to get started.</p>
              </div>

              {/* Step 1 – Create a Spotify App */}
              <div className={`walkup-setup-step ${hasClientId ? 'completed' : 'active'}`}>
                <div className="walkup-step-header">
                  <span className="walkup-step-number">{hasClientId ? '✅' : '1'}</span>
                  <span className="walkup-step-title">
                    {hasClientId ? 'Spotify App configured' : 'Create a free Spotify Developer App'}
                  </span>
                  {hasClientId && !showClientIdSetup && (
                    <button className="btn-walkup-change-id" onClick={() => setShowClientIdSetup(true)}>
                      Change
                    </button>
                  )}
                </div>

                {(!hasClientId || showClientIdSetup) && (
                  <div className="walkup-step-body">
                    <ol className="walkup-setup-instructions">
                      <li>
                        Go to{' '}
                        <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer">
                          developer.spotify.com/dashboard
                        </a>{' '}
                        and log in (or create a free account)
                      </li>
                      <li>Click <strong>Create App</strong> — give it any name (e.g. &quot;Walk-Up Music&quot;)</li>
                      <li>
                        Set the <strong>Redirect URI</strong> to:{' '}
                        <span className="walkup-redirect-uri">
                          <code>{window.location.origin + window.location.pathname}</code>
                          <button className="btn-walkup-copy" onClick={handleCopyRedirectUri} title="Copy redirect URI">
                            📋
                          </button>
                        </span>
                      </li>
                      <li>Under &quot;Which API/SDKs are you planning to use?&quot; check <strong>Web API</strong></li>
                      <li>Save the app, then copy your <strong>Client ID</strong> and paste it below</li>
                    </ol>

                    <div className="walkup-client-id-form">
                      <input
                        id="spotify-client-id"
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientIdState(e.target.value)}
                        placeholder="Paste your Client ID here"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveClientId()}
                      />
                      <button className="btn-walkup-save" onClick={handleSaveClientId}>Save</button>
                      {hasClientId && (
                        <button className="btn-walkup-cancel" onClick={() => setShowClientIdSetup(false)}>Cancel</button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 – Connect */}
              <div className={`walkup-setup-step ${hasClientId ? 'active' : 'disabled'}`}>
                <div className="walkup-step-header">
                  <span className="walkup-step-number">2</span>
                  <span className="walkup-step-title">Connect your Spotify account</span>
                </div>

                {hasClientId && !showClientIdSetup && (
                  <div className="walkup-step-body">
                    <p className="walkup-step-description">
                      You&apos;ll be redirected to Spotify to grant permission. A <strong>Spotify Premium</strong> account is required for playback control.
                    </p>
                    <button className="btn-spotify-login" onClick={handleLogin}>
                      🎵 Connect to Spotify
                    </button>
                  </div>
                )}
              </div>

              <p className="walkup-auth-note">
                ℹ️ Your Spotify app must be open and active on a device (phone, speaker, computer). This app sends play/pause commands via Spotify Connect.
              </p>
            </div>
          )}

          {authenticated && activeTab === 'config' && (
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
              onRefreshDevices={loadDevices}
              devices={devices}
            />
          )}

          {authenticated && activeTab === 'play' && (
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
  onRefreshDevices,
  devices,
}) {
  return (
    <div className="walkup-config">
      {/* Spotify Status */}
      <div className="walkup-status-bar">
        <span className="walkup-connected">✅ Spotify Connected</span>
        <div className="walkup-status-actions">
          <button className="btn-walkup-refresh" onClick={onRefreshDevices} title="Refresh devices">
            🔄 Devices ({devices.length})
          </button>
          <button className="btn-walkup-logout" onClick={onLogout}>Disconnect</button>
        </div>
      </div>

      {/* Devices List */}
      {devices.length > 0 && (
        <div className="walkup-devices">
          <h4>Available Devices</h4>
          <div className="walkup-devices-list">
            {devices.map((d) => (
              <div key={d.id} className={`walkup-device ${d.is_active ? 'active' : ''}`}>
                <span className="device-icon">{d.type === 'Smartphone' ? '📱' : d.type === 'Computer' ? '💻' : '🔊'}</span>
                <span className="device-name">{d.name}</span>
                {d.is_active && <span className="device-active-badge">Active</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {devices.length === 0 && (
        <div className="walkup-no-devices">
          <p>⚠️ No active Spotify devices found. Open Spotify on your phone or computer and play any song briefly to activate it.</p>
        </div>
      )}

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
