import React, { useState } from 'react';
import './ImportConflictDialog.css';

function ImportConflictDialog({ conflicts, newTeams, onResolve, onCancel }) {
  // Initialize resolutions based on recommendations
  const [resolutions, setResolutions] = useState(() =>
    conflicts.map(conflict => ({
      existingTeamId: conflict.existingTeamId,
      importTeamId: conflict.importTeamId,
      action: conflict.recommendation === 'import' ? 'replace' : 
              conflict.recommendation === 'keep' ? 'keep_update_music' : 'keep'
    }))
  );

  const updateResolution = (index, action) => {
    setResolutions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], action };
      return updated;
    });
  };

  const handleConfirm = () => {
    onResolve(resolutions);
  };

  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-dialog import-conflict-dialog">
        <h4 className="confirm-title">Import Conflicts Detected</h4>
        <p className="confirm-message">
          The import contains team(s) that match your existing teams by name. 
          Choose how to handle each conflict:
        </p>

        <div className="conflict-list">
          {conflicts.map((conflict, index) => (
            <div key={conflict.existingTeamId} className="conflict-item">
              <div className="conflict-team-name">
                <strong>{conflict.teamName}</strong>
              </div>
              
              <div className="conflict-summary">
                <div className="conflict-stat">
                  <span className="stat-label">Games:</span>
                  <span className="stat-value">
                    Current: {conflict.existingGames} | Import: {conflict.importGames}
                  </span>
                </div>

                {conflict.playerDifferences.length > 0 && (
                  <div className="conflict-detail">
                    <span className="stat-label">Player changes:</span>
                    <ul className="diff-list">
                      {conflict.playerDifferences.map((diff, i) => (
                        <li key={i} className={`diff-${diff.type}`}>
                          {diff.type === 'added' ? '+ ' : '− '}
                          {diff.player.name}{diff.player.number ? ` #${diff.player.number}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {conflict.musicDifferences.length > 0 && (
                  <div className="conflict-detail">
                    <span className="stat-label">Music changes:</span>
                    <ul className="diff-list">
                      {conflict.musicDifferences.slice(0, 5).map((diff, i) => (
                        <li key={i} className="diff-music">
                          {diff.type === 'playlist' 
                            ? `${diff.service} playlist: "${diff.existing}" → "${diff.imported}"`
                            : `${diff.playerName}: "${diff.existing}" → "${diff.imported}"`
                          }
                        </li>
                      ))}
                      {conflict.musicDifferences.length > 5 && (
                        <li className="diff-more">
                          ...and {conflict.musicDifferences.length - 5} more music change(s)
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="conflict-recommendation">
                {conflict.recommendation === 'import' && (
                  <span className="rec-badge rec-import">
                    ⬆️ Import has more games — recommended to replace
                  </span>
                )}
                {conflict.recommendation === 'keep' && (
                  <span className="rec-badge rec-keep">
                    ✅ You have more games — recommended to keep yours
                  </span>
                )}
                {conflict.recommendation === 'equal' && (
                  <span className="rec-badge rec-equal">
                    ⚖️ Same number of games — your choice
                  </span>
                )}
              </div>

              <div className="conflict-actions">
                <label className={`conflict-option ${resolutions[index]?.action === 'replace' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`conflict-${index}`}
                    value="replace"
                    checked={resolutions[index]?.action === 'replace'}
                    onChange={() => updateResolution(index, 'replace')}
                  />
                  <span className="option-text">Replace with import</span>
                  <span className="option-desc">Use imported players, games & music</span>
                </label>
                <label className={`conflict-option ${resolutions[index]?.action === 'keep' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`conflict-${index}`}
                    value="keep"
                    checked={resolutions[index]?.action === 'keep'}
                    onChange={() => updateResolution(index, 'keep')}
                  />
                  <span className="option-text">Keep mine</span>
                  <span className="option-desc">Keep current players, games & music</span>
                </label>
                <label className={`conflict-option ${resolutions[index]?.action === 'keep_update_music' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`conflict-${index}`}
                    value="keep_update_music"
                    checked={resolutions[index]?.action === 'keep_update_music'}
                    onChange={() => updateResolution(index, 'keep_update_music')}
                  />
                  <span className="option-text">Keep mine, update music</span>
                  <span className="option-desc">Keep current players & games, use imported music</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {newTeams.length > 0 && (
          <div className="new-teams-note">
            <span>➕ {newTeams.length} new team(s) will also be added: </span>
            <strong>{newTeams.map(t => t.team.name).join(', ')}</strong>
          </div>
        )}

        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={handleConfirm}>Apply Import</button>
        </div>
      </div>
    </div>
  );
}

export default ImportConflictDialog;
