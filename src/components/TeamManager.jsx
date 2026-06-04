import React, { useState, useRef } from 'react';
import { exportAllData, importAllData, getTeams, analyzeImportConflicts, applyImportWithResolutions } from '../utils/storage';
import { generateShareUrl, generateShareUrlViaApi } from '../utils/shareUrl';
import ImportConflictDialog from './ImportConflictDialog';
import './TeamManager.css';

function TeamManager({ 
  teams, 
  currentTeamId, 
  onSelectTeam, 
  onCreateTeam, 
  onRenameTeam, 
  onDeleteTeam,
  onDataImported,
  onShowToast,
  onRequestConfirm
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isRenaming, setIsRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [importConflict, setImportConflict] = useState(null);
  const fileInputRef = useRef(null);

  const handleCreate = () => {
    if (newTeamName.trim()) {
      onCreateTeam(newTeamName.trim());
      setNewTeamName('');
      setIsCreating(false);
    }
  };

  const handleRename = (teamId) => {
    if (renameValue.trim()) {
      onRenameTeam(teamId, renameValue.trim());
      setIsRenaming(null);
      setRenameValue('');
    }
  };

  const handleDelete = (teamId) => {
    const teamList = Object.values(teams);
    const team = teamList.find(t => t.id === teamId);
    onRequestConfirm?.({
      title: 'Delete Team',
      message: `Delete team "${team.name}"? This will also delete all game history for this team.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: () => {
        onDeleteTeam(teamId);
        onShowToast?.(`Team ${team.name} deleted`, 'error');
      }
    });
  };

  const startRename = (team) => {
    setIsRenaming(team.id);
    setRenameValue(team.name);
  };

  const handleExport = () => {
    try {
      const csv = exportAllData();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batting-order-backup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      onShowToast?.('Data exported successfully', 'success');
    } catch (error) {
      onShowToast?.('Error exporting data: ' + error.message, 'error');
    }
  };

  const handleShareLink = async () => {
    try {
      const csv = exportAllData();
      let shareUrl;
      try {
        shareUrl = await generateShareUrlViaApi(csv);
      } catch (apiError) {
        console.warn('Share API unavailable, falling back to compressed URL:', apiError.message);
        shareUrl = await generateShareUrl(csv);
        onShowToast?.('Storage unavailable — using a longer URL instead. Set up Vercel Blob to enable short links.', 'warning');
      }

      // Try native share first (mobile), fall back to clipboard
      if (navigator.share) {
        await navigator.share({
          title: 'Batting Order Generator - Team Data',
          url: shareUrl
        });
        onShowToast?.('Share link sent!', 'success');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        onShowToast?.('Share link copied to clipboard!', 'success');
      } else {
        // Fallback: prompt with the URL
        window.prompt('Copy this link to share your team data:', shareUrl);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        onShowToast?.('Error creating share link: ' + error.message, 'error');
      }
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        processImportContent(content);
      }
      // Reset file input
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const processImportContent = (content) => {
    try {
      const analysis = analyzeImportConflicts(content);

      if (analysis.conflicts.length > 0) {
        // Show conflict resolution dialog
        setImportConflict({ analysis, content });
      } else {
        // No conflicts — just do a simple import of new teams
        const confirmMsg = `Import ${analysis.newTeams.length} new team(s)? They will be added to your existing teams.`;
        onRequestConfirm?.({
          title: 'Import Data',
          message: confirmMsg,
          confirmLabel: 'Import',
          cancelLabel: 'Cancel',
          destructive: false,
          onConfirm: () => {
            const result = applyImportWithResolutions(analysis.importData, [], analysis.newTeams);
            if (result.success) {
              onShowToast?.(`Imported ${analysis.newTeams.length} new team(s)`, 'success');
              onDataImported?.();
            } else {
              onShowToast?.('Error importing data: ' + result.error, 'error');
            }
          }
        });
      }
    } catch (error) {
      onShowToast?.('Error reading import file: ' + error.message, 'error');
    }
  };

  const handleConflictResolve = (resolutions) => {
    if (!importConflict) return;
    const { analysis } = importConflict;
    const result = applyImportWithResolutions(analysis.importData, resolutions, analysis.newTeams);
    setImportConflict(null);
    if (result.success) {
      const actions = resolutions.map(r => r.action);
      const replaced = actions.filter(a => a === 'replace').length;
      const musicUpdated = actions.filter(a => a === 'keep_update_music').length;
      const kept = actions.filter(a => a === 'keep').length;
      const parts = [];
      if (replaced) parts.push(`${replaced} replaced`);
      if (musicUpdated) parts.push(`${musicUpdated} music updated`);
      if (kept) parts.push(`${kept} kept`);
      if (analysis.newTeams.length) parts.push(`${analysis.newTeams.length} new`);
      onShowToast?.(`Import complete: ${parts.join(', ')}`, 'success');
      onDataImported?.();
    } else {
      onShowToast?.('Error importing data: ' + result.error, 'error');
    }
  };

  const teamList = Object.values(teams);

  return (
    <div className="team-manager">
      <div className="team-manager-header">
        <h3>My Teams</h3>
        {!isCreating && (
          <button 
            className="btn-create-team" 
            onClick={() => setIsCreating(true)}
          >
            + New Team
          </button>
        )}
      </div>

      {isCreating && (
        <div className="team-create-form">
          <input
            type="text"
            placeholder="Enter team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewTeamName('');
              }
            }}
            autoFocus
          />
          <div className="button-group">
            <button className="btn-save" onClick={handleCreate}>
              Create
            </button>
            <button 
              className="btn-cancel" 
              onClick={() => {
                setIsCreating(false);
                setNewTeamName('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {teamList.length === 0 && !isCreating && (
        <p className="no-teams">No teams yet. Create your first team to get started!</p>
      )}

      <div className="teams-list">
        {teamList.map(team => (
          <div 
            key={team.id} 
            className={`team-item ${team.id === currentTeamId ? 'active' : ''}`}
          >
            {isRenaming === team.id ? (
              <div className="team-rename-form">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(team.id);
                    if (e.key === 'Escape') {
                      setIsRenaming(null);
                      setRenameValue('');
                    }
                  }}
                  autoFocus
                />
                <div className="button-group-inline">
                  <button className="btn-icon-save" onClick={() => handleRename(team.id)}>
                    ✓
                  </button>
                  <button 
                    className="btn-icon-cancel" 
                    onClick={() => {
                      setIsRenaming(null);
                      setRenameValue('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div 
                  className="team-info" 
                  onClick={() => onSelectTeam(team.id)}
                >
                  <div className="team-name">{team.name}</div>
                  <div className="team-meta">
                    {team.players?.length || 0} players
                  </div>
                </div>
                <div className="team-actions">
                  <button
                    className="btn-icon-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(team);
                    }}
                    title="Rename team"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(team.id);
                    }}
                    title="Delete team"
                  >
                    🗑️
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="import-export-section">
        {teamList.length > 0 && (
          <button className="btn-export" onClick={handleExport} title="Export all teams and data">
            📥 Export Data
          </button>
        )}
        {teamList.length > 0 && (
          <button className="btn-export" onClick={handleShareLink} title="Copy a shareable link with all your team data">
            🔗 Share Link
          </button>
        )}
        <button className="btn-import" onClick={handleImport} title="Import teams and data from file">
          📤 Import Data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {importConflict && (
        <ImportConflictDialog
          conflicts={importConflict.analysis.conflicts}
          newTeams={importConflict.analysis.newTeams}
          onResolve={handleConflictResolve}
          onCancel={() => setImportConflict(null)}
        />
      )}
    </div>
  );
}

export default TeamManager;
