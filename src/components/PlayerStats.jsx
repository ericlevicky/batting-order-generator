import React from 'react';
import './PlayerStats.css';

function PlayerStats({ stats }) {
  return (
    <div className="player-stats-card card">
      <h3>Player Statistics</h3>
      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Number</th>
              <th>Batting Order</th>
              <th>Infield</th>
              <th>Outfield</th>
              <th>Bench</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((player) => (
              <tr key={player.id}>
                <td className="player-name-cell">{player.name}</td>
                <td className="number-cell">#{player.number}</td>
                <td className="order-cell">{player.battingOrder}</td>
                <td className="stat-cell">{player.infieldInnings}</td>
                <td className="stat-cell">{player.outfieldInnings}</td>
                <td className="stat-cell">{player.benchInnings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PlayerStats;
