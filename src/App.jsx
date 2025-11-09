import React, { useState, useEffect } from 'react';
import PlayerInput from './components/PlayerInput';
import GameSettings from './components/GameSettings';
import LineupDisplay from './components/LineupDisplay';
import TeamManager from './components/TeamManager';
import GameHistory from './components/GameHistory';
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
  deleteGameFromHistory
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
      setLineup(null); // Clear lineup when switching teams
      const history = getTeamGameHistory(teamId);
      setGameHistory(history);
    }
  };

  const handleSelectTeam = (teamId) => {
    setCurrentTeamIdState(teamId);
    setCurrentTeamId(teamId);
    loadTeamData(teamId);
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

  const handleGenerateLineup = () => {
    if (players.length < 9) {
      alert('Please add at least 9 players');
      return;
    }

    if (!currentTeamId) {
      alert('Please create or select a team first');
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
    saveLineupToHistory(currentTeamId, generatedLineup, settings);
    
    // Reload history
    const history = getTeamGameHistory(currentTeamId);
    setGameHistory(history);
  };

  const handleDeleteGame = (gameId) => {
    if (currentTeamId) {
      deleteGameFromHistory(currentTeamId, gameId);
      const history = getTeamGameHistory(currentTeamId);
      setGameHistory(history);
    }
  };

  const currentTeam = currentTeamId ? teams[currentTeamId] : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚾ Little League Batting Order Generator</h1>
        <p>Generate batting orders and field positions for your game</p>
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

        {lineup && (
          <LineupDisplay
            lineup={lineup}
            players={players}
            numInnings={numInnings}
            hasCatcher={hasCatcher}
          />
        )}

        {currentTeam && gameHistory.length > 0 && (
          <div className="config-section">
            <GameHistory
              history={gameHistory}
              onDeleteGame={handleDeleteGame}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
