import React from 'react';
import BattingOrder from './BattingOrder';
import InningDisplay from './InningDisplay';
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

      {/* Screen version - detailed view */}
      <div className="screen-only">
        <BattingOrder battingOrder={lineup.battingOrder} />

        <div className="innings-section">
          <h3>Position Assignments by Inning</h3>
          {lineup.innings.map((inning, index) => (
            <InningDisplay
              key={index}
              inningNumber={index + 1}
              assignments={inning}
              positions={lineup.positions}
              hasCatcher={hasCatcher}
            />
          ))}
        </div>

        <PlayerStats stats={lineup.battingOrder} />
      </div>
    </div>
  );
}

export default LineupDisplay;
