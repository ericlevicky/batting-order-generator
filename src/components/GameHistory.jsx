import React, { useState, useRef } from 'react';
import LineupGrid from './LineupGrid';
import PlayerStats from './PlayerStats';
import './GameHistory.css';

function GameHistory({ history, onDeleteGame, onDeleteAllGames, onShowToast, onRequestConfirm, initialExpandGameId }) {
  const [expandedGame, setExpandedGame] = useState(initialExpandGameId || null);
  const printRef = useRef({});

  React.useEffect(() => {
    if (initialExpandGameId) {
      setExpandedGame(initialExpandGameId);
    }
  }, [initialExpandGameId]);

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

  const handlePrintGame = (gameId) => {
    const printContent = printRef.current[gameId];
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Game Lineup</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .lineup-grid { width: 100%; }
            .grid-header { text-align: center; margin-bottom: 1rem; }
            .grid-header h3 { font-size: 1.5rem; margin: 0 0 0.5rem 0; color: #1e293b; }
            .grid-subtitle { font-size: 1rem; color: #64748b; margin: 0; }
            .grid-table-container { overflow: visible; border: 1px solid #e2e8f0; border-radius: 8px; }
            .grid-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
            .grid-table thead { background: #1e293b; color: white; }
            .grid-table th { padding: 0.4rem 0.3rem; text-align: center; font-weight: 600; border: 1px solid #475569; }
            .grid-inning-header { display: flex; flex-direction: column; align-items: center; }
            .grid-inning-label { font-size: 0.6rem; text-transform: uppercase; color: rgba(255,255,255,0.8); }
            .grid-inning-number { font-size: 1rem; font-weight: 700; }
            .grid-table td { padding: 0.35rem 0.3rem; text-align: center; border: 1px solid #e2e8f0; }
            .grid-table tbody tr:nth-child(even) { background: #f8fafc; }
            .grid-order-col { width: 40px; font-weight: 700; color: #667eea; }
            .grid-player-col { text-align: left; padding-left: 0.5rem !important; font-weight: 600; min-width: 120px; }
            .grid-number-col { width: 50px; color: #64748b; font-weight: 600; }
            .grid-inning-col { width: 50px; font-weight: 600; color: #1e293b; }
            .grid-footer { margin-top: 1rem; font-size: 0.75rem; color: #64748b; }
            .grid-position-legend { line-height: 1.4; }
            @media print {
              @page { size: letter; margin: 0.5in; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="game-history">
      <h3>Game History ({history.length})</h3>
      <p className="history-hint">Click on a game to see the full lineup used</p>
      {history.length > 1 && (
        <div style={{marginBottom:'0.75rem', textAlign:'right'}}>
          <button
            className="btn-delete-all-games"
            onClick={() => {
              onRequestConfirm?.({
                title: 'Delete All Games',
                message: 'Delete ALL games for this team? This action cannot be undone.',
                confirmLabel: 'Delete All',
                cancelLabel: 'Cancel',
                destructive: true,
                onConfirm: () => {
                  onDeleteAllGames?.();
                  onShowToast?.('All games deleted', 'error');
                }
              });
            }}
          >
            🗑️ Delete All Games
          </button>
        </div>
      )}
      <div className="history-list">
        {history.map((game, index) => (
          <div key={game.id} className="history-item">
            <div 
              className="history-header"
              onClick={() => toggleExpand(game.id)}
            >
              <div className="history-info">
                <div className="history-title">
                  {game.gameNumber ? `Game #${game.gameNumber}` : `Game #${history.length - index}`}
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
                    const gameNumber = game.gameNumber || (history.length - index);
                    onRequestConfirm?.({
                      title: `Delete Game ${gameNumber}`,
                      message: `This will permanently remove Game ${gameNumber} from history. Continue?`,
                      confirmLabel: 'Delete',
                      cancelLabel: 'Cancel',
                      destructive: true,
                      onConfirm: () => {
                        onDeleteGame(game.id);
                        onShowToast?.(`Game ${gameNumber} deleted`, 'error');
                      }
                    });
                  }}
                  title="Delete game"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {expandedGame === game.id && (
              <div className="history-details">
                <div className="history-details-header" style={{display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center'}}>
                  <h4 style={{marginRight:'auto'}}>Game Lineup</h4>
                  <button
                    className="btn-print-game"
                    onClick={() => handlePrintGame(game.id)}
                    title="Print this game"
                  >
                    🖨️ Print
                  </button>
                </div>
                {game.lineup ? (
                  <div ref={el => printRef.current[game.id] = el}>
                    <LineupGrid
                      lineup={game.lineup}
                      numInnings={game.settings?.numInnings || 6}
                      showHeader={true}
                    />
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
                <div style={{marginTop:'0.75rem'}}>
                  <PlayerStats
                    stats={game.lineup ? game.lineup.battingOrder : game.battingOrder}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameHistory;
