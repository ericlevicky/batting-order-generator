import React from 'react';
import PlayerStats from './PlayerStats';
import PrintableLineup from './PrintableLineup';
import './LineupDisplay.css';

function LineupDisplay({ lineup, players, numInnings, hasCatcher }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="lineup-display">
      <div className="lineup-header">
        <h2>Game Lineup</h2>
        <button className="btn-secondary" onClick={handlePrint}>
          Print Lineup
        </button>
      </div>

      {/* Printable version - optimized for 8.5x11 paper */}
      <PrintableLineup lineup={lineup} numInnings={numInnings} />

      {/* Player Statistics */}
      <div className="screen-only">
        <PlayerStats stats={lineup.battingOrder} />
      </div>
    </div>
  );
}

export default LineupDisplay;
