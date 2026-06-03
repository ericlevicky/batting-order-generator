import React, { useState } from 'react';
import './LineupWizard.css';

function LineupWizard({
  players,
  setPlayers,
  numInnings,
  setNumInnings,
  numOutfielders,
  setNumOutfielders,
  hasCatcher,
  setHasCatcher,
  rotatingBattingOrder,
  setRotatingBattingOrder,
  onGenerate,
  onShowAllSettings,
  teamName,
}) {
  const [step, setStep] = useState(1);

  const activePlayers = players.filter(p => p.active !== false);
  const inactivePlayers = players.filter(p => p.active === false);

  const togglePlayer = (id) => {
    setPlayers(players.map(p => p.id === id ? { ...p, active: p.active === false } : p));
  };

  const canProceedFromStep1 = activePlayers.length >= 9;

  const handleGenerate = () => {
    onGenerate();
  };

  return (
    <div className="lineup-wizard">
      {/* Progress indicator */}
      <div className="wizard-progress">
        <div className={`wizard-dot ${step >= 1 ? 'active' : ''}`} />
        <div className={`wizard-dot ${step >= 2 ? 'active' : ''}`} />
        <div className={`wizard-dot ${step >= 3 ? 'active' : ''}`} />
      </div>

      {/* Step 1: Who's playing today? */}
      {step === 1 && (
        <div className="wizard-step wizard-step-1">
          <h2 className="wizard-heading">Who's playing today?</h2>
          <p className="wizard-subheading">
            Tap a player to mark them out for today's game. Everyone starts checked in.
          </p>

          <div className="wizard-player-list">
            {players.map(player => {
              const isActive = player.active !== false;
              return (
                <button
                  key={player.id}
                  className={`wizard-player-toggle ${isActive ? 'checked-in' : 'checked-out'}`}
                  onClick={() => togglePlayer(player.id)}
                  type="button"
                >
                  <span className="wizard-player-name">{player.name}</span>
                  <span className="wizard-toggle-indicator">
                    {isActive ? '✓' : '✕'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="wizard-player-count">
            {activePlayers.length} player{activePlayers.length !== 1 ? 's' : ''} checked in
            {activePlayers.length < 9 && (
              <span className="wizard-warning"> — need at least 9</span>
            )}
          </div>

          <div className="wizard-actions">
            <button
              className="wizard-btn-next"
              onClick={() => setStep(2)}
              disabled={!canProceedFromStep1}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: How many innings? */}
      {step === 2 && (
        <div className="wizard-step wizard-step-2">
          <h2 className="wizard-heading">How many innings?</h2>
          <p className="wizard-subheading">
            Most games are 6 innings. Adjust if yours is different.
          </p>

          <div className="wizard-innings-stepper">
            <button
              className="wizard-stepper-btn"
              onClick={() => setNumInnings(Math.max(1, numInnings - 1))}
              disabled={numInnings <= 1}
              type="button"
            >
              −
            </button>
            <span className="wizard-innings-value">{numInnings}</span>
            <button
              className="wizard-stepper-btn"
              onClick={() => setNumInnings(Math.min(9, numInnings + 1))}
              disabled={numInnings >= 9}
              type="button"
            >
              +
            </button>
          </div>

          <div className="wizard-advanced-options">
              <div className="wizard-option-group">
                <label className="wizard-option-label">Outfielders</label>
                <div className="wizard-button-group">
                  <button
                    type="button"
                    className={`wizard-option-btn ${numOutfielders === 3 ? 'active' : ''}`}
                    onClick={() => setNumOutfielders(3)}
                  >
                    3
                  </button>
                  <button
                    type="button"
                    className={`wizard-option-btn ${numOutfielders === 4 ? 'active' : ''}`}
                    onClick={() => setNumOutfielders(4)}
                  >
                    4
                  </button>
                  <button
                    type="button"
                    className={`wizard-option-btn ${numOutfielders === 'all' ? 'active' : ''}`}
                    onClick={() => setNumOutfielders('all')}
                  >
                    Everyone else
                  </button>
                </div>
              </div>

              <label className="wizard-checkbox">
                <input
                  type="checkbox"
                  checked={hasCatcher}
                  onChange={(e) => setHasCatcher(e.target.checked)}
                />
                <span>Include catcher position</span>
              </label>

              <label className="wizard-checkbox">
                <input
                  type="checkbox"
                  checked={rotatingBattingOrder}
                  onChange={(e) => setRotatingBattingOrder(e.target.checked)}
                />
                <span>Different batting order every inning</span>
              </label>
            </div>

          <div className="wizard-actions">
            <button className="wizard-btn-back" onClick={() => setStep(1)} type="button">
              ← Back
            </button>
            <button className="wizard-btn-next" onClick={() => setStep(3)} type="button">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Ready to go! */}
      {step === 3 && (
        <div className="wizard-step wizard-step-3">
          <h2 className="wizard-heading">Ready to go!</h2>
          <p className="wizard-subheading">
            {activePlayers.length} players · {numInnings} innings
          </p>

          <button
            className="wizard-btn-generate"
            onClick={handleGenerate}
            type="button"
          >
            ⚾ Generate Today's Lineup
          </button>

          <p className="wizard-reassurance">
            The app balances positions across games so everyone gets a fair turn.
          </p>

          <div className="wizard-actions">
            <button className="wizard-btn-back" onClick={() => setStep(2)} type="button">
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Footer link to full settings */}
      <div className="wizard-footer">
        <button className="wizard-link-settings" onClick={onShowAllSettings} type="button">
          ⚙️ Show all settings
        </button>
      </div>
    </div>
  );
}

export default LineupWizard;
