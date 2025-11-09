import React, { useState } from 'react';
import './GameHistory.css';

function GameHistory({ history, onDeleteGame }) {
  const [expandedGame, setExpandedGame] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="game-history">
        <h3>Game History</h3>
        <p className="no-history">No previous games yet. Generate a lineup to start tracking history!</p>
      </div>
    );
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const toggleExpand = (gameId) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  return (
    <div className="game-history">
      <h3>Game History ({history.length})</h3>
      <p className="history-hint">Click on a game to see the full lineup used</p>
      
      <div className="history-list">
        {history.map((game, index) => (
          <div key={game.id} className="history-item">
            <div 
              className="history-header"
              onClick={() => toggleExpand(game.id)}
            >
              <div className="history-info">
                <div className="history-title">
                  Game #{history.length - index}
                </div>
                <div className="history-date">
                  {formatDate(game.date)}
                </div>
                <div className="history-meta">
                  {game.settings?.numInnings || 6} innings · 
                  {game.battingOrder?.length || 0} players
                </div>
              </div>
              <div className="history-actions">
                <button
                  className="btn-expand"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(game.id);
                  }}
                >
                  {expandedGame === game.id ? '▲' : '▼'}
                </button>
                <button
                  className="btn-delete-game"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this game from history?')) {
                      onDeleteGame(game.id);
                    }
                  }}
                  title="Delete game"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {expandedGame === game.id && (
              <div className="history-details">
                <h4>Game Lineup</h4>
                {game.lineup ? (
                  <div className="game-lineup-container">
                    {game.lineup.innings.map((inning, inningIndex) => (
                      <div key={inningIndex} className="history-inning">
                        <div className="history-inning-header">
                          Inning {inningIndex + 1}
                        </div>
                        <div className="history-positions">
                          {Object.entries(inning)
                            .filter(([pos]) => pos !== 'Bench')
                            .map(([position, player]) => (
                              <div key={position} className="history-position-item">
                                <span className="history-position-label">{position}</span>
                                <span className="history-player-name">
                                  {player.name} {player.number && `#${player.number}`}
                                </span>
                              </div>
                            ))}
                        </div>
                        {inning.Bench && inning.Bench.length > 0 && (
                          <div className="history-bench">
                            <strong>Bench:</strong>{' '}
                            {inning.Bench.map((p) => `${p.name} ${p.number ? `#${p.number}` : ''}`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="batting-order-list">
                    {game.battingOrder.map((player, idx) => (
                      <div key={idx} className="batting-order-item">
                        <span className="order-number">{idx + 1}</span>
                        <span className="player-name">{player.name}</span>
                        {player.number && (
                          <span className="player-number">#{player.number}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameHistory;
