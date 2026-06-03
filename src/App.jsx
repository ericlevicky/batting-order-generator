import React, { useState, useEffect, useRef } from 'react';
import PlayerInput from './components/PlayerInput';
import GameSettings from './components/GameSettings';
import TeamManager from './components/TeamManager';
import GameHistory from './components/GameHistory';
import CumulativeStats from './components/CumulativeStats';
import InstallPrompt from './components/InstallPrompt';
import Instructions from './components/Instructions';
import FeatureSuggestion from './components/FeatureSuggestion';
import UpdateNotification from './components/UpdateNotification';
import ToastContainer from './components/ToastContainer';
import ConfirmDialog from './components/ConfirmDialog';
import WalkUpMusicPage from './components/WalkUpMusicPage';
import { generateLineup } from './utils/lineupGenerator';
import {
  getTeams,
  getCurrentTeamId,
  getCurrentTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  setCurrentTeamId,
  saveLineupToHistory,
  getTeamGameHistory,
  deleteGameFromHistory,
  updateTeamLastSettings,
  getNextGameNumber,
  deleteAllGamesFromHistory
} from './utils/storage';
import './App.css';

function App() {
  const [teams, setTeams] = useState({});
  const [currentTeamId, setCurrentTeamIdState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [numInnings, setNumInnings] = useState(6);
  const [numOutfielders, setNumOutfielders] = useState(3);
  const [hasCatcher, setHasCatcher] = useState(true);
  const [rotatingBattingOrder, setRotatingBattingOrder] = useState(false);
  const [lineup, setLineup] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showFeatureSuggestion, setShowFeatureSuggestion] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showCumulativeStats, setShowCumulativeStats] = useState(false);
  const [lastGeneratedGameId, setLastGeneratedGameId] = useState(null);
  const [presetTouched, setPresetTouched] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showWalkUpMusic, setShowWalkUpMusic] = useState(false);
  const initialSelectRef = useRef(true);

  // Load teams and current team on mount
  useEffect(() => {
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    const currentId = getCurrentTeamId();
    if (currentId && loadedTeams[currentId]) {
      setCurrentTeamIdState(currentId);
      loadTeamData(currentId);
    }

  // Auto-open WalkUpMusic page when returning from Spotify OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') || params.has('error')) {
      setShowWalkUpMusic(true);
    }
  }, []);

  const loadTeamData = (teamId) => {
    const team = getTeams()[teamId];
    if (team) {
      setPlayers(team.players || []);
      // Load last saved settings if present
      if (team.lastSettings) {
        setNumInnings(team.lastSettings.numInnings ?? 6);
        setNumOutfielders(team.lastSettings.numOutfielders ?? 3);
        setHasCatcher(team.lastSettings.hasCatcher ?? true);
        setRotatingBattingOrder(team.lastSettings.rotatingBattingOrder ?? false);
      }
      setLineup(null);
      const history = getTeamGameHistory(teamId);
      setGameHistory(history);
      setPresetTouched(false);
    }
  };

  const handleSelectTeam = (teamId) => {
    setCurrentTeamIdState(teamId);
    setCurrentTeamId(teamId);
    loadTeamData(teamId);
    const selectedTeam = getTeams()[teamId] || teams[teamId];
    if (initialSelectRef.current) {
      // first programmatic selection; suppress toast
      initialSelectRef.current = false;
      return;
    }
    if (selectedTeam?.name) {
      showToast(`Now viewing team ${selectedTeam.name}`, 'info');
    }
  };

  const handleCreateTeam = (teamName) => {
    const teamId = createTeam(teamName, []);
    const updatedTeams = getTeams();
    setTeams(updatedTeams);
    handleSelectTeam(teamId);
  };

  const handleRenameTeam = (teamId, newName) => {
    updateTeam(teamId, { name: newName });
    const updatedTeams = getTeams();
    setTeams(updatedTeams);
  };

  const handleDeleteTeam = (teamId) => {
    deleteTeam(teamId);
    const updatedTeams = getTeams();
    setTeams(updatedTeams);
    if (teamId === currentTeamId) {
      setCurrentTeamIdState(null);
      setPlayers([]);
      setLineup(null);
      setGameHistory([]);
    }
  };

  // Update team players when players change
  useEffect(() => {
    if (currentTeamId && teams[currentTeamId]) {
      updateTeam(currentTeamId, { players });
    }
  }, [players, currentTeamId]);

  const showToast = (message, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const requestConfirm = ({ title = 'Confirm', message, confirmLabel = 'OK', cancelLabel = 'Cancel', destructive = false, onConfirm }) => {
    setConfirmDialog({ title, message, confirmLabel, cancelLabel, destructive, onConfirm });
  };

  const handleGenerateLineup = () => {
    if (players.length < 9) {
      showToast('Please add at least 9 players', 'error');
      return;
    }

    if (!currentTeamId) {
      showToast('Please create or select a team first', 'error');
      return;
    }

    const generatedLineup = generateLineup(
      players,
      numInnings,
      numOutfielders,
      hasCatcher,
      gameHistory,  // Pass game history to balance across games
      rotatingBattingOrder,
      presetTouched ? players : null  // Honour manually set order when touched
    );
    setLineup(generatedLineup);
    setPresetTouched(false);

    // Trigger full-screen flash animation
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 950);

    // Save to history
    const settings = { numInnings, numOutfielders, hasCatcher, rotatingBattingOrder };
    const upcomingGameNumber = getNextGameNumber(currentTeamId);
    const gameRecord = saveLineupToHistory(currentTeamId, generatedLineup, settings);
    updateTeamLastSettings(currentTeamId, settings);

    setLastGeneratedGameId(gameRecord.id);

    // Reload history
    const history = getTeamGameHistory(currentTeamId);
    setGameHistory(history);
    showToast(`Game ${upcomingGameNumber} generated`, 'success');
  };

  const handleDeleteGame = (gameId) => {
    if (currentTeamId) {
      deleteGameFromHistory(currentTeamId, gameId);
      const history = getTeamGameHistory(currentTeamId);
      setGameHistory(history);
    }
  };

  const handleDeleteAllGames = () => {
    if (currentTeamId) {
      deleteAllGamesFromHistory(currentTeamId);
      const history = getTeamGameHistory(currentTeamId);
      setGameHistory(history);
      setLastGeneratedGameId(null);
    }
  };

  const handleDataImported = () => {
    // Reload all data after import
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    const currentId = getCurrentTeamId();
    if (currentId && loadedTeams[currentId]) {
      setCurrentTeamIdState(currentId);
      loadTeamData(currentId);
    } else {
      setCurrentTeamIdState(null);
      setPlayers([]);
      setLineup(null);
      setGameHistory([]);
    }
  };

  const currentTeam = currentTeamId ? teams[currentTeamId] : null;

  // If Walk-Up Music page is active, render it as a full page
  if (showWalkUpMusic && currentTeam) {
    return (
      <WalkUpMusicPage
        teamId={currentTeamId}
        teamName={currentTeam.name}
        players={players}
        gameHistory={gameHistory}
        onBack={() => setShowWalkUpMusic(false)}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>⚾ Little League Batting Order Generator</h1>
            <p>Generate batting orders and field positions for your game</p>
          </div>
          <div className="header-actions">
            {currentTeam && players.filter(p => p.active !== false).length > 0 && (
              <button
                className="btn-walkup-music"
                onClick={() => setShowWalkUpMusic(true)}
                title="Walk-up music player"
              >
                🎵 Walk-Up Music
              </button>
            )}
            <button
              className="btn-feature-suggestion"
              onClick={() => setShowFeatureSuggestion(true)}
              title="Suggest a feature"
            >
              💡 Suggest Feature
            </button>
            <button
              className="btn-help"
              onClick={() => setShowInstructions(true)}
              title="How to use this app"
            >
              ❓ Help
            </button>
          </div>
        </div>
      </header>

      <div className="app-content">
        <div className="config-section">
          <TeamManager
            teams={teams}
            currentTeamId={currentTeamId}
            onSelectTeam={handleSelectTeam}
            onCreateTeam={handleCreateTeam}
            onRenameTeam={handleRenameTeam}
            onDeleteTeam={handleDeleteTeam}
            onDataImported={handleDataImported}
            onShowToast={showToast}
            onRequestConfirm={requestConfirm}
          />

          {currentTeam && (
            <div className="card">
              <div className="team-header-badge">
                <h2>Game Configuration</h2>
                <div className="current-team-label">
                  Team: <strong>{currentTeam.name}</strong>
                </div>
              </div>

              <PlayerInput players={players} setPlayers={setPlayers} onOrderTouched={() => setPresetTouched(true)} />

              <GameSettings
                numInnings={numInnings}
                setNumInnings={setNumInnings}
                numOutfielders={numOutfielders}
                setNumOutfielders={setNumOutfielders}
                hasCatcher={hasCatcher}
                setHasCatcher={setHasCatcher}
                rotatingBattingOrder={rotatingBattingOrder}
                setRotatingBattingOrder={setRotatingBattingOrder}
              />

              <button className="btn-primary" onClick={handleGenerateLineup}>
                Generate Lineup
              </button>
            </div>
          )}

          {!currentTeam && (
            <div className="card no-team-message">
              <p>👆 Create or select a team above to get started!</p>
            </div>
          )}
        </div>

        {currentTeam && gameHistory.length > 0 && (
          <div className="config-section">
            <GameHistory
              history={gameHistory}
              onDeleteGame={handleDeleteGame}
              onDeleteAllGames={handleDeleteAllGames}
              onShowToast={showToast}
              onRequestConfirm={requestConfirm}
              initialExpandGameId={lastGeneratedGameId}
            />
            <div className="card cumulative-stats-wrapper">
              <div className="cumulative-stats-header" onClick={() => setShowCumulativeStats(v => !v)} style={{cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{margin:0}}>Cumulative Statistics</h3>
                <button 
                  className="btn-expand" 
                  style={{marginLeft:'auto'}}
                  onClick={(e) => { e.stopPropagation(); setShowCumulativeStats(v => !v); }}
                  title={showCumulativeStats ? 'Collapse cumulative statistics' : 'Expand cumulative statistics'}
                >
                  {showCumulativeStats ? '▲' : '▼'}
                </button>
              </div>
              {showCumulativeStats && <CumulativeStats history={gameHistory} hideHeader />}
            </div>
          </div>
        )}
      </div>

      <InstallPrompt />
      <UpdateNotification />
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
          onConfirmAction={() => {
            confirmDialog.onConfirm?.();
            setConfirmDialog(null);
          }}
        />
      )}
      
      {showInstructions && (
        <Instructions onClose={() => setShowInstructions(false)} />
      )}

      {showFeatureSuggestion && (
        <FeatureSuggestion
          onClose={() => setShowFeatureSuggestion(false)}
          onSubmitSuccess={(issueNumber) => showToast(`Feature request #${issueNumber} submitted! Thank you.`, 'success')}
          onSubmitError={(message) => showToast(message, 'error')}
        />
      )}


      {showFlash && (
        <div className="lineup-flash-overlay" role="status" aria-live="polite" aria-label="Lineup generated">
          <span className="lineup-flash-text">⚾ Lineup Set!</span>
        </div>
      )}
    </div>
  );
}

export default App;
