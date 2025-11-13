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
          battingPositions: {}, // Track count of innings in each batting position
        };
      }

      playerStats[player.name].totalGames++;
      playerStats[player.name].totalInfield += player.infieldInnings || 0;
      playerStats[player.name].totalOutfield += player.outfieldInnings || 0;
      playerStats[player.name].totalBench += player.benchInnings || 0;
      
      // Track batting order position
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
  });

  // Convert to array, calculate batting position stats, and sort by name
  return Object.values(playerStats).map(player => {
    // Calculate average batting position
    let totalPositionWeight = 0;
    let totalGamesWithPosition = 0;
    const uniquePositions = Object.keys(player.battingPositions).length;
    
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
      uniqueBattingPositions: uniquePositions,
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
              <th>Unique Positions</th>
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
                <td className="stat-cell">{player.uniqueBattingPositions}</td>
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
        <h4>Batting Position Breakdown</h4>
        <p className="stats-description">Number of games in each batting order position (1-9)</p>
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos 1</th>
                <th>Pos 2</th>
                <th>Pos 3</th>
                <th>Pos 4</th>
                <th>Pos 5</th>
                <th>Pos 6</th>
                <th>Pos 7</th>
                <th>Pos 8</th>
                <th>Pos 9</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((player) => (
                <tr key={player.name}>
                  <td className="player-name-cell">{player.name}</td>
                  <td className="stat-cell">{player.battingPositions[1] || 0}</td>
                  <td className="stat-cell">{player.battingPositions[2] || 0}</td>
                  <td className="stat-cell">{player.battingPositions[3] || 0}</td>
                  <td className="stat-cell">{player.battingPositions[4] || 0}</td>
                  <td className="stat-cell">{player.battingPositions[5] || 0}</td>
                  <td className="stat-cell">{player.battingPositions[6] || 0}</td>
                  <td className="stat-cell">{player.battingPositions[7] || 0}</td>
                  <td className="stat-cell">{player.battingPositions[8] || 0}</td>
                  <td className="stat-cell">{player.battingPositions[9] || 0}</td>
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
