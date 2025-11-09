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
          <label>Number of Outfielders</label>
          <div className="button-group">
            <button
              type="button"
              className={`button-group-item ${numOutfielders === 3 ? 'active' : ''}`}
              onClick={() => setNumOutfielders(3)}
            >
              3
            </button>
            <button
              type="button"
              className={`button-group-item ${numOutfielders === 4 ? 'active' : ''}`}
              onClick={() => setNumOutfielders(4)}
            >
              4
            </button>
            <button
              type="button"
              className={`button-group-item ${numOutfielders === 'all' ? 'active' : ''}`}
              onClick={() => setNumOutfielders('all')}
            >
              Everyone Else
            </button>
          </div>
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
