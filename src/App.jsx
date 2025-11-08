import React, { useState } from 'react';
import PlayerInput from './components/PlayerInput';
import GameSettings from './components/GameSettings';
import LineupDisplay from './components/LineupDisplay';
import { generateLineup } from './utils/lineupGenerator';
import './App.css';

function App() {
  const [players, setPlayers] = useState([]);
  const [numInnings, setNumInnings] = useState(6);
  const [numOutfielders, setNumOutfielders] = useState(3);
  const [hasCatcher, setHasCatcher] = useState(true);
  const [lineup, setLineup] = useState(null);

  const handleGenerateLineup = () => {
    if (players.length < 9) {
      alert('Please add at least 9 players');
      return;
    }

    const generatedLineup = generateLineup(
      players,
      numInnings,
      numOutfielders,
      hasCatcher
    );
    setLineup(generatedLineup);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚾ Little League Batting Order Generator</h1>
        <p>Generate batting orders and field positions for your game</p>
      </header>

      <div className="app-content">
        <div className="config-section">
          <div className="card">
            <h2>Game Configuration</h2>

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
        </div>

        {lineup && (
          <LineupDisplay
            lineup={lineup}
            players={players}
            numInnings={numInnings}
            hasCatcher={hasCatcher}
          />
        )}
      </div>
    </div>
  );
}

export default App;
