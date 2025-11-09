import React from 'react';
import './PrintableLineup.css';

// Position abbreviations mapping
const POSITION_ABBREV = {
  'Pitcher': 'P',
  'Catcher': 'C',
  '1st Base': '1B',
  '2nd Base': '2B',
  '3rd Base': '3B',
  'Shortstop': 'SS',
  'Left Field': 'LF',
  'Center Field': 'CF',
  'Right Field': 'RF',
  'Right Center': 'RC',
  'Bench': 'Bench'
};

function PrintableLineup({ lineup, numInnings }) {
  // Create a matrix: players x innings with their positions
  const getPlayerPosition = (playerId, inningIndex) => {
    const inning = lineup.innings[inningIndex];
    
    // Check each position in this inning
    for (const [positionName, assignedPlayer] of Object.entries(inning)) {
      if (positionName === 'Bench') {
        // Bench can have multiple players
        if (Array.isArray(assignedPlayer)) {
          const found = assignedPlayer.find(p => p.id === playerId);
          if (found) return POSITION_ABBREV['Bench'];
        }
      } else {
        // Regular position has one player
        if (assignedPlayer && assignedPlayer.id === playerId) {
          return POSITION_ABBREV[positionName] || positionName;
        }
      }
    }
    return '-';
  };

  return (
    <div className="printable-lineup">
      <div className="print-header">
        <h1>⚾ Batting Order & Positions</h1>
        <p className="print-subtitle">Little League Game Lineup</p>
      </div>

      <table className="lineup-table">
        <thead>
          <tr>
            <th className="order-col">#</th>
            <th className="player-col">Player</th>
            <th className="number-col">No.</th>
            {Array.from({ length: numInnings }, (_, i) => (
              <th key={i} className="inning-col">Inn {i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineup.battingOrder.map((player, index) => (
            <tr key={player.id}>
              <td className="order-col">{index + 1}</td>
              <td className="player-col">{player.name}</td>
              <td className="number-col">{player.number}</td>
              {Array.from({ length: numInnings }, (_, inningIndex) => (
                <td key={inningIndex} className="inning-col">
                  {getPlayerPosition(player.id, inningIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-footer">
        <div className="position-legend">
          <strong>Position Key:</strong> P=Pitcher, C=Catcher, 1B=First Base, 2B=Second Base, 3B=Third Base, 
          SS=Shortstop, LF=Left Field, CF=Center Field, RF=Right Field, RC=Right Center
        </div>
      </div>
    </div>
  );
}

export default PrintableLineup;
