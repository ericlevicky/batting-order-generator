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
        };
      }

      playerStats[player.name].totalGames++;
      playerStats[player.name].totalInfield += player.infieldInnings || 0;
      playerStats[player.name].totalOutfield += player.outfieldInnings || 0;
      playerStats[player.name].totalBench += player.benchInnings || 0;
      
      // Keep the most recent number if it exists
      if (player.number) {
        playerStats[player.name].number = player.number;
      }
    });
  });

  // Convert to array and sort by name
  return Object.values(playerStats).sort((a, b) => a.name.localeCompare(b.name));
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
    </div>
  );
}

export default CumulativeStats;
export { calculateCumulativeStats };
