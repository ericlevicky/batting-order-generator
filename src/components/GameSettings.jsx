import React from 'react';
import './GameSettings.css';

function GameSettings({
  numInnings,
  setNumInnings,
  numOutfielders,
  setNumOutfielders,
  hasCatcher,
  setHasCatcher,
}) {
  return (
    <div className="game-settings">
      <h3>Game Settings</h3>

      <div className="settings-grid">
        <div className="setting-item">
          <label htmlFor="innings">Number of Innings</label>
          <input
            id="innings"
            type="number"
            min="1"
            max="9"
            value={numInnings}
            onChange={(e) => setNumInnings(parseInt(e.target.value))}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="outfielders">Number of Outfielders</label>
          <input
            id="outfielders"
            type="number"
            min="2"
            max="4"
            value={numOutfielders}
            onChange={(e) => setNumOutfielders(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="checkbox-item">
        <input
          id="catcher"
          type="checkbox"
          checked={hasCatcher}
          onChange={(e) => setHasCatcher(e.target.checked)}
        />
        <label htmlFor="catcher">Include Catcher Position</label>
      </div>
    </div>
  );
}

export default GameSettings;
