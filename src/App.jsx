import React, { useState, useEffect, useRef } from 'react';
import PlayerInput from './components/PlayerInput';
import GameSettings from './components/GameSettings';
import TeamManager from './components/TeamManager';
import GameHistory from './components/GameHistory';
import CumulativeStats from './components/CumulativeStats';
import InstallPrompt from './components/InstallPrompt';
import Instructions from './components/Instructions';
import UpdateNotification from './components/UpdateNotification';
import ToastContainer from './components/ToastContainer';
import ConfirmDialog from './components/ConfirmDialog';
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
  const [lineup, setLineup] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showCumulativeStats, setShowCumulativeStats] = useState(false);
  const [lastGeneratedGameId, setLastGeneratedGameId] = useState(null);
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
      }
      setLineup(null);
      const history = getTeamGameHistory(teamId);
      setGameHistory(history);
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
      gameHistory  // Pass game history to balance across games
    );
    setLineup(generatedLineup);

    // Save to history
    const settings = { numInnings, numOutfielders, hasCatcher };
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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>⚾ Little League Batting Order Generator</h1>
            <p>Generate batting orders and field positions for your game</p>
          </div>
          <button 
            className="btn-help"
            onClick={() => setShowInstructions(true)}
            title="How to use this app"
          >
            ❓ Help
          </button>
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

              <PlayerInput players={players} setPlayers={setPlayers} />

              <GameSettings
                numInnings={numInnings}
                setNumInnings={setNumInnings}
                numOutfielders={numOutfielders}
                setNumOutfielders={setNumOutfielders}
                hasCatcher={hasCatcher}
                setHasCatcher={setHasCatcher}
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
              {showCumulativeStats && <CumulativeStats history={gameHistory} />}
            </div>
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>
          Enjoying this app? 
          <a 
            href="https://venmo.com/u/Eric-Levicky" 
            target="_blank" 
            rel="noopener noreferrer"
            className="donate-link"
          >
            ☕ Buy me a coffee
          </a>
        </p>
      </footer>

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
    </div>
  );
}

export default App;
