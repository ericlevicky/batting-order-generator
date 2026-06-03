import React, { useRef } from 'react';
import LineupGrid from './LineupGrid';
import { getTeamWalkUpMusic, exportAllData } from '../utils/storage';
import { generateShareUrlViaApi } from '../utils/shareUrl';
import './WizardResult.css';

function WizardResult({ lineup, numInnings, teamId, teamName, onStartOver, onRegenerate, onShowWalkUpMusic, players, gameNumber }) {
  const walkUpMusic = teamId ? getTeamWalkUpMusic(teamId) : null;
  const hasActivePlayers = players && players.filter(p => p.active !== false).length > 0;
  const printRef = useRef(null);

  const handleShare = async () => {
    try {
      const csv = exportAllData();
      const shareUrl = await generateShareUrlViaApi(csv);

      if (navigator.share) {
        await navigator.share({
          title: `${teamName} - Today's Lineup`,
          url: shareUrl
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        window.prompt('Copy this link to share your lineup:', shareUrl);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        // Silently handle errors
      }
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Escape user-provided text to prevent XSS in the print window
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const safeTeamName = escapeHtml(teamName);
    const gameLabel = gameNumber ? ` &#8212; Game #${gameNumber}` : '';
    const titleText = `${safeTeamName} - ${gameNumber ? `Game ${gameNumber} ` : ''}Lineup`;

    const printWindow = window.open('', '', 'width=1100,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 0.25in;
              margin: 0;
            }
            .print-game-header { text-align: center; margin-bottom: 0.5rem; }
            .print-game-header h2 { font-size: 1.25rem; margin: 0 0 0.15rem 0; color: #1e293b; }
            .print-game-header p { font-size: 0.85rem; color: #64748b; margin: 0; }
            .lineup-grid { width: 100%; }
            .grid-header { text-align: center; margin-bottom: 0.5rem; }
            .grid-header h3 { font-size: 1.25rem; margin: 0 0 0.25rem 0; color: #1e293b; }
            .grid-subtitle { font-size: 0.85rem; color: #64748b; margin: 0; }
            .grid-table-container { overflow: visible; border: 1px solid #e2e8f0; border-radius: 8px; }
            .grid-table { width: 100%; border-collapse: collapse; font-size: 0.7rem; table-layout: fixed; }
            .grid-table thead { background: #1e293b; color: white; }
            .grid-table th { padding: 0.2rem 0.1rem; text-align: center; font-weight: 600; border: 1px solid #475569; font-size: 0.6rem; }
            .grid-inning-header { display: flex; flex-direction: column; align-items: center; }
            .grid-inning-label { font-size: 0.5rem; text-transform: uppercase; color: rgba(255,255,255,0.8); }
            .grid-inning-number { font-size: 0.8rem; font-weight: 700; }
            .grid-table td { padding: 0.2rem 0.1rem; text-align: center; border: 1px solid #e2e8f0; font-size: 0.7rem; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; }
            .grid-table tbody tr:nth-child(even) { background: #f8fafc; }
            .grid-order-col { width: 20px; font-weight: 700; color: #10b981; }
            .grid-player-col { text-align: left !important; padding-left: 0.2rem !important; font-weight: 600; }
            .grid-number-col { width: 25px; color: #64748b; font-weight: 600; }
            .grid-song-col { text-align: left !important; padding-left: 0.2rem !important; font-size: 0.65rem; color: #64748b; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .grid-inning-col { font-weight: 600; color: #1e293b; }
            .grid-footer { margin-top: 0.5rem; font-size: 0.65rem; color: #64748b; }
            .grid-position-legend { line-height: 1.4; }
            @media print {
              @page { size: letter landscape; margin: 0.3in; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-game-header">
            <h2>&#9918; ${safeTeamName}${gameLabel}</h2>
            <p>${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
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
    <div className="wizard-result">
      <div className="wizard-result-header">
        <h2 className="wizard-result-title">⚾ Today's Lineup</h2>
        <p className="wizard-result-subtitle">{teamName}</p>
        {gameNumber && (
          <p className="wizard-result-game-number">Game #{gameNumber}</p>
        )}
      </div>

      <div className="wizard-result-actions-top">
        <button className="wizard-result-btn print" onClick={handlePrint} type="button">
          🖨️ Print
        </button>
        {navigator.share && (
          <button className="wizard-result-btn share" onClick={handleShare} type="button">
            📤 Share
          </button>
        )}
        {hasActivePlayers && onShowWalkUpMusic && (
          <button className="wizard-result-btn music" onClick={onShowWalkUpMusic} type="button">
            🎵 Walk-Up Music
          </button>
        )}
      </div>

      <div className="wizard-result-grid" ref={printRef}>
        <LineupGrid lineup={lineup} numInnings={numInnings} walkUpMusic={walkUpMusic} />
      </div>

      <div className="wizard-result-footer">
        {onRegenerate && (
          <button className="wizard-result-btn regen" onClick={onRegenerate} type="button">
            🔄 Regenerate This Game
          </button>
        )}
        <button className="wizard-result-start-over" onClick={onStartOver} type="button">
          ↺ Start over for a new game
        </button>
      </div>
    </div>
  );
}

export default WizardResult;
