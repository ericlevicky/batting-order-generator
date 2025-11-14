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

function CumulativeStats({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  const stats = calculateCumulativeStats(history);

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="cumulative-stats-card card">
      <h3>Cumulative Statistics</h3>
      <p className="stats-description">
        Total innings across all {history.length} game{history.length !== 1 ? 's' : ''}
      </p>
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
                <th>P</th>
                <th>C</th>
                <th>1B</th>
                <th>2B</th>
                <th>3B</th>
                <th>SS</th>
                <th>LF</th>
                <th>CF</th>
                <th>RF</th>
                <th>RC</th>
                <th>Bench</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((player) => (
                <tr key={player.name}>
                  <td className="player-name-cell">{player.name}</td>
                  <td className="stat-cell">{player.fieldingPositions['Pitcher'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['Catcher'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['1st Base'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['2nd Base'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['3rd Base'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['Shortstop'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['Left Field'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['Center Field'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['Right Field'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['Right Center'] || 0}</td>
                  <td className="stat-cell">{player.fieldingPositions['Bench'] || 0}</td>
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
