import React from 'react';
import './Instructions.css';

function Instructions({ onClose }) {
  return (
    <div className="instructions-overlay" onClick={onClose}>
      <div className="instructions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="instructions-header">
          <h2>⚾ How to Use This App</h2>
          <button className="btn-close-instructions" onClick={onClose}>✕</button>
        </div>
        
        <div className="instructions-content">
          <section className="instructions-section">
            <h3>🎯 Why Use This App?</h3>
            <div className="benefits-list">
              <div className="benefit-item">
                <span className="benefit-icon">⚖️</span>
                <div>
                  <strong>Fair Playing Time</strong>
                  <p>Automatically balances infield, outfield, and bench time for each player across games</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">⏱️</span>
                <div>
                  <strong>Save Time</strong>
                  <p>Generate a complete lineup in seconds instead of spending 20+ minutes planning manually</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <div>
                  <strong>Track History</strong>
                  <p>Keep records of all games and cumulative stats to ensure long-term fairness</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🖨️</span>
                <div>
                  <strong>Print & Share</strong>
                  <p>Print professional-looking lineup cards for coaches and parents</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🔄</span>
                <div>
                  <strong>Smart Rotation</strong>
                  <p>Uses an intelligent algorithm to rotate positions fairly throughout the game</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📱</span>
                <div>
                  <strong>Works Everywhere</strong>
                  <p>Use on your phone, tablet, or computer - even works offline after installation</p>
                </div>
              </div>
            </div>
          </section>

          <section className="instructions-section">
            <h3>📝 Quick Start Guide</h3>
            <ol className="tutorial-steps">
              <li>
                <strong>Create or Select a Team</strong>
                <p>Use the Team Manager to create a new team or select an existing one</p>
              </li>
              <li>
                <strong>Add Players</strong>
                <p>Click "Load Example Team" to populate with sample players, or add players manually with names and optional numbers</p>
              </li>
              <li>
                <strong>Configure Game Settings</strong>
                <p>Set the number of innings (1-9), number of outfielders (2-4), and whether you use a catcher</p>
              </li>
              <li>
                <strong>Generate Lineup</strong>
                <p>Click "Generate Lineup" to create a fair rotation. The app considers previous games to balance playing time</p>
              </li>
              <li>
                <strong>Print or Save</strong>
                <p>Click "Print Lineup" to get a printer-friendly version for game day</p>
              </li>
              <li>
                <strong>View History & Stats</strong>
                <p>Click on any previous game to see the full lineup used. Click the print button to print that specific game</p>
              </li>
            </ol>
          </section>

          <section className="instructions-section">
            <h3>💡 Pro Tips</h3>
            <ul className="tips-list">
              <li>The batting order is based on the order you add players - arrange them strategically</li>
              <li>The app remembers previous games and tries to balance playing time across all games</li>
              <li>You can have multiple teams if you coach different age groups or manage multiple teams</li>
              <li>Use the cumulative stats view to ensure fair playing time over the season</li>
              <li>Install as a PWA (Progressive Web App) on your phone for offline access at the field</li>
            </ul>
          </section>

          <section className="instructions-section">
            <h3>🔐 Your Data</h3>
            <p className="privacy-note">
              All your data is stored locally in your browser. Nothing is sent to any server. 
              You can export/import your data using the Team Manager to back it up or transfer to another device.
            </p>
          </section>
        </div>

        <div className="instructions-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}

export default Instructions;
