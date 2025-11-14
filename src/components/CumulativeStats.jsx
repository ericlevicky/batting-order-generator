import React from 'react';
import './CumulativeStats.css';

/**
 * Calculate cumulative statistics for all players across all games
 */
function calculateCumulativeStats(gameHistory) {
  const playerStats = {};

  // Aggregate stats from all games
  gameHistory.forEach(game => {
    if (!game.lineup || !game.lineup.battingOrder) return;

    game.lineup.battingOrder.forEach(player => {
      if (!playerStats[player.name]) {
        playerStats[player.name] = {
          name: player.name,
          number: player.number || '',
          totalGames: 0,
          totalInfield: 0,
          totalOutfield: 0,
          totalBench: 0,
          battingPositions: {}, // Track count of games in each batting position (for average)
          fieldingPositions: {}, // Track count of innings in each fielding position
        };
      }

      playerStats[player.name].totalGames++;
      playerStats[player.name].totalInfield += player.infieldInnings || 0;
      playerStats[player.name].totalOutfield += player.outfieldInnings || 0;
      playerStats[player.name].totalBench += player.benchInnings || 0;
      
      // Track batting order position for average calculation
      const battingPos = player.battingOrder;
      if (battingPos) {
        playerStats[player.name].battingPositions[battingPos] = 
          (playerStats[player.name].battingPositions[battingPos] || 0) + 1;
      }
      
      // Keep the most recent number if it exists
      if (player.number) {
        playerStats[player.name].number = player.number;
      }
    });

    // Track fielding positions from innings data
    if (game.lineup.innings) {
      game.lineup.innings.forEach(inning => {
        // Iterate through each position in the inning
        Object.entries(inning).forEach(([positionName, playerOrPlayers]) => {
          // Handle bench (array of players) vs field positions (single player)
          if (positionName === 'Bench') {
            if (Array.isArray(playerOrPlayers)) {
              playerOrPlayers.forEach(player => {
                if (playerStats[player.name]) {
                  playerStats[player.name].fieldingPositions[positionName] = 
                    (playerStats[player.name].fieldingPositions[positionName] || 0) + 1;
                }
              });
            }
          } else {
            // Single player in a field position
            if (playerOrPlayers && playerOrPlayers.name && playerStats[playerOrPlayers.name]) {
              playerStats[playerOrPlayers.name].fieldingPositions[positionName] = 
                (playerStats[playerOrPlayers.name].fieldingPositions[positionName] || 0) + 1;
            }
          }
        });
      });
    }
  });

  // Convert to array, calculate batting position stats, and sort by name
  return Object.values(playerStats).map(player => {
    // Calculate average batting position
    let totalPositionWeight = 0;
    let totalGamesWithPosition = 0;
    
    for (const [position, count] of Object.entries(player.battingPositions)) {
      totalPositionWeight += parseInt(position) * count;
      totalGamesWithPosition += count;
    }
    
    const avgBattingPosition = totalGamesWithPosition > 0 
      ? (totalPositionWeight / totalGamesWithPosition).toFixed(1)
      : '-';
    
    return {
      ...player,
      avgBattingPosition,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function CumulativeStats({ history, hideHeader = false }) {
  if (!history || history.length === 0) {
    return null;
  }

  const stats = calculateCumulativeStats(history);

  if (stats.length === 0) {
    return null;
  }

  // Collect all unique fielding positions used across all games
  const allFieldingPositions = new Set();
  stats.forEach(player => {
    Object.keys(player.fieldingPositions).forEach(pos => allFieldingPositions.add(pos));
  });

  // Define position order for display
  const positionOrder = [
    'Pitcher', 'Catcher', '1st Base', '2nd Base', '3rd Base', 'Shortstop',
    'Left Field', 'Center Field', 'Right Field', 'Right Center',
    'Left Center', // Additional outfield positions that might be used
    'Bench'
  ];

  // Filter and sort positions that actually exist in the data
  const displayPositions = positionOrder.filter(pos => allFieldingPositions.has(pos));
  
  // Add any positions not in our predefined order (for future-proofing)
  allFieldingPositions.forEach(pos => {
    if (!positionOrder.includes(pos)) {
      displayPositions.push(pos);
    }
  });

  // Helper function to get short abbreviation for position
  const getPositionAbbr = (position) => {
    const abbrevMap = {
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
      'Left Center': 'LC',
      'Bench': 'Bench'
    };
    return abbrevMap[position] || position;
  };

  return (
    <div className="cumulative-stats-card card">
      {!hideHeader && (
        <>
          <h3>Cumulative Statistics</h3>
          <p className="stats-description">
            Total innings across all {history.length} game{history.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
      {hideHeader && (
        <p className="stats-description" style={{marginTop:0}}>
          Total innings across all {history.length} game{history.length !== 1 ? 's' : ''}
        </p>
      )}
      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Number</th>
              <th>Games</th>
              <th>Avg Position</th>
              <th>Infield</th>
              <th>Outfield</th>
              <th>Bench</th>
              <th>Total Active</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((player) => (
              <tr key={player.name}>
                <td className="player-name-cell">{player.name}</td>
                <td className="number-cell">{player.number ? `#${player.number}` : '-'}</td>
                <td className="stat-cell">{player.totalGames}</td>
                <td className="stat-cell">{player.avgBattingPosition}</td>
                <td className="stat-cell">{player.totalInfield}</td>
                <td className="stat-cell">{player.totalOutfield}</td>
                <td className="stat-cell">{player.totalBench}</td>
                <td className="stat-cell total-active">
                  {player.totalInfield + player.totalOutfield}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="batting-position-breakdown">
        <h4>Fielding Position Breakdown</h4>
        <p className="stats-description">Number of innings in each fielding position</p>
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                {displayPositions.map(position => (
                  <th key={position}>{getPositionAbbr(position)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((player) => (
                <tr key={player.name}>
                  <td className="player-name-cell">{player.name}</td>
                  {displayPositions.map(position => (
                    <td key={position} className="stat-cell">
                      {player.fieldingPositions[position] || 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CumulativeStats;
export { calculateCumulativeStats };
