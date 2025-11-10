import React, { useState, useRef } from 'react';
import { exportAllData, importAllData } from '../utils/storage';
import './TeamManager.css';

function TeamManager({ 
  teams, 
  currentTeamId, 
  onSelectTeam, 
  onCreateTeam, 
  onRenameTeam, 
  onDeleteTeam,
  onDataImported
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isRenaming, setIsRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
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
    if (window.confirm(`Delete team "${team.name}"? This will also delete all game history for this team.`)) {
      onDeleteTeam(teamId);
    }
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
    } catch (error) {
      alert('Error exporting data: ' + error.message);
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
        const confirmMsg = 'Importing will replace all current teams and data. Are you sure you want to continue?';
        if (window.confirm(confirmMsg)) {
          const result = importAllData(content);
          if (result.success) {
            alert(`Successfully imported ${result.teamsCount} team(s)`);
            onDataImported?.();
          } else {
            alert('Error importing data: ' + result.error);
          }
        }
      }
      // Reset file input
      event.target.value = '';
    };
    reader.readAsText(file);
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

      {teamList.length > 0 && (
        <div className="import-export-section">
          <button className="btn-export" onClick={handleExport} title="Export all teams and data">
            📥 Export Data
          </button>
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
      )}
    </div>
  );
}

export default TeamManager;
