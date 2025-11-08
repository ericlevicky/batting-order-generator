import React, { useState, useRef, useEffect } from 'react';
import './PlayerInput.css';

function PlayerInput({ players, setPlayers }) {
  const [currentName, setCurrentName] = useState('');
  const [currentNumber, setCurrentNumber] = useState('');
  const nameInputRef = useRef(null);

  const loadExamplePlayers = () => {
    const examplePlayers = [
      { id: Date.now() + 1, name: 'Johnny Smith', number: '7' },
      { id: Date.now() + 2, name: 'Sarah Johnson', number: '12' },
      { id: Date.now() + 3, name: 'Mike Davis', number: '3' },
      { id: Date.now() + 4, name: 'Emma Wilson', number: '9' },
      { id: Date.now() + 5, name: 'Alex Martinez', number: '15' },
      { id: Date.now() + 6, name: 'Olivia Brown', number: '21' },
      { id: Date.now() + 7, name: 'Liam Taylor', number: '8' },
      { id: Date.now() + 8, name: 'Sophia Anderson', number: '11' },
      { id: Date.now() + 9, name: 'Noah Thomas', number: '5' },
    ];
    setPlayers(examplePlayers);
  };

  const addPlayer = () => {
    if (currentName.trim()) {
      const newPlayer = {
        id: Date.now(),
        name: currentName.trim(),
        number: currentNumber.trim() || (players.length + 1).toString(),
      };
      setPlayers([...players, newPlayer]);
      setCurrentName('');
      setCurrentNumber('');
      // Focus back on name input
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Tab' && field === 'number' && !e.shiftKey) {
      e.preventDefault();
      addPlayer();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'name' && currentName.trim()) {
        // Move to number field
        document.getElementById('player-number-input')?.focus();
      } else if (field === 'number') {
        addPlayer();
      }
    }
  };

  const removePlayer = (id) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const movePlayer = (index, direction) => {
    const newPlayers = [...players];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < players.length) {
      [newPlayers[index], newPlayers[newIndex]] = [newPlayers[newIndex], newPlayers[index]];
      setPlayers(newPlayers);
    }
  };

  return (
    <div className="player-input-section">
      <div className="players-header">
        <h3>Players</h3>
        <button
          type="button"
          className="btn-example"
          onClick={loadExamplePlayers}
        >
          Load Example Team
        </button>
      </div>
      <p className="input-hint">
        Enter player name and number, then press Tab to add the next player
      </p>

      <div className="add-player-form">
        <div className="input-group">
          <label htmlFor="player-name-input">Player Name</label>
          <input
            id="player-name-input"
            ref={nameInputRef}
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'name')}
            placeholder="Enter name"
            autoFocus
          />
        </div>

        <div className="input-group input-number">
          <label htmlFor="player-number-input">Number (Optional)</label>
          <input
            id="player-number-input"
            type="text"
            value={currentNumber}
            onChange={(e) => setCurrentNumber(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'number')}
            placeholder="Auto"
            maxLength="3"
          />
        </div>

        <button
          type="button"
          className="btn-add"
          onClick={addPlayer}
          disabled={!currentName.trim()}
        >
          Add Player
        </button>
      </div>

      {players.length > 0 && (
        <div className="players-list">
          <div className="players-list-header">
            <span>Batting Order</span>
            <span>{players.length} Player{players.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="players-items">
            {players.map((player, index) => (
              <div key={player.id} className="player-item">
                <div className="player-order">{index + 1}</div>
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  <span className="player-number">#{player.number}</span>
                </div>
                <div className="player-actions">
                  <button
                    className="btn-icon"
                    onClick={() => movePlayer(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => movePlayer(index, 1)}
                    disabled={index === players.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className="btn-icon btn-remove"
                    onClick={() => removePlayer(player.id)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerInput;
