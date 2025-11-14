import React, { useState } from 'react';
import './PlayerStats.css';

function PlayerStats({ stats, initialExpanded = false }) {
  const [expanded, setExpanded] = useState(initialExpanded);
  if (!stats || stats.length === 0) return null;
  return (
    <div className="player-stats-card card">
      <div
        className="player-stats-header"
        style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: expanded ? '0.75rem' : 0, cursor:'pointer'}}
        onClick={() => setExpanded(e => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); } }}
        aria-expanded={expanded}
      >
        <h3 style={{margin:0, userSelect:'none'}}>Player Statistics</h3>
        <button
          className="btn-expand"
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          title={expanded ? 'Hide player statistics' : 'Show player statistics'}
          style={{width:'32px', height:'32px'}}
          aria-label={expanded ? 'Collapse player statistics' : 'Expand player statistics'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      {expanded && (
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
                <tr key={player.id || player.name}>
                  <td className="player-name-cell">{player.name}</td>
                  <td className="number-cell">{player.number ? `#${player.number}` : '-'}</td>
                  <td className="order-cell">{player.battingOrder}</td>
                  <td className="stat-cell">{player.infieldInnings}</td>
                  <td className="stat-cell">{player.outfieldInnings}</td>
                  <td className="stat-cell">{player.benchInnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PlayerStats;
