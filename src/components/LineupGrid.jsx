import React from 'react';
import './LineupGrid.css';

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

function LineupGrid({ lineup, numInnings, showHeader = true }) {
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
    <div className="lineup-grid">
      {showHeader && (
        <div className="grid-header">
          <h3>⚾ Batting Order & Positions</h3>
          <p className="grid-subtitle">Game Lineup</p>
        </div>
      )}

      <div className="grid-table-container">
        <table className="grid-table">
          <thead>
            <tr>
              <th className="grid-order-col">#</th>
              <th className="grid-player-col">Player</th>
              <th className="grid-number-col">No.</th>
              {Array.from({ length: numInnings }, (_, i) => (
                <th key={i} className="grid-inning-col">
                  <div className="grid-inning-header">
                    <span className="grid-inning-label">Inning</span>
                    <span className="grid-inning-number">{i + 1}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lineup.battingOrder.map((player, index) => (
              <tr key={player.id}>
                <td className="grid-order-col">{index + 1}</td>
                <td className="grid-player-col">{player.name}</td>
                <td className="grid-number-col">{player.number || '-'}</td>
                {Array.from({ length: numInnings }, (_, inningIndex) => (
                  <td key={inningIndex} className="grid-inning-col">
                    {getPlayerPosition(player.id, inningIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-footer">
        <div className="grid-position-legend">
          <strong>Position Key:</strong> P=Pitcher, C=Catcher, 1B=First Base, 2B=Second Base, 3B=Third Base, 
          SS=Shortstop, LF=Left Field, CF=Center Field, RF=Right Field, RC=Right Center
        </div>
      </div>
    </div>
  );
}

export default LineupGrid;
