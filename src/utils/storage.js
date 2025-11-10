// LocalStorage utilities for team and lineup management

const STORAGE_KEYS = {
  TEAMS: 'batting_order_teams',
  CURRENT_TEAM: 'batting_order_current_team',
  TEAM_HISTORY: 'batting_order_team_history'
};

// Team Management
export const saveTeams = (teams) => {
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
};

export const getTeams = () => {
  const teams = localStorage.getItem(STORAGE_KEYS.TEAMS);
  return teams ? JSON.parse(teams) : {};
};

export const createTeam = (teamName, players = []) => {
  const teams = getTeams();
  const teamId = Date.now().toString();
  teams[teamId] = {
    id: teamId,
    name: teamName,
    players: players,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveTeams(teams);
  return teamId;
};

export const updateTeam = (teamId, updates) => {
  const teams = getTeams();
  if (teams[teamId]) {
    teams[teamId] = {
      ...teams[teamId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveTeams(teams);
    return true;
  }
  return false;
};

export const deleteTeam = (teamId) => {
  const teams = getTeams();
  delete teams[teamId];
  saveTeams(teams);
  
  // Also delete team history
  const history = getTeamHistory();
  delete history[teamId];
  saveTeamHistory(history);
  
  // Clear current team if it was deleted
  if (getCurrentTeamId() === teamId) {
    setCurrentTeamId(null);
  }
};

export const getTeam = (teamId) => {
  const teams = getTeams();
  return teams[teamId] || null;
};

// Current Team Selection
export const setCurrentTeamId = (teamId) => {
  if (teamId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TEAM, teamId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TEAM);
  }
};

export const getCurrentTeamId = () => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_TEAM);
};

export const getCurrentTeam = () => {
  const teamId = getCurrentTeamId();
  return teamId ? getTeam(teamId) : null;
};

// Game History
const saveTeamHistory = (history) => {
  localStorage.setItem(STORAGE_KEYS.TEAM_HISTORY, JSON.stringify(history));
};

export const getTeamHistory = () => {
  const history = localStorage.getItem(STORAGE_KEYS.TEAM_HISTORY);
  return history ? JSON.parse(history) : {};
};

export const saveLineupToHistory = (teamId, lineup, settings) => {
  const history = getTeamHistory();
  if (!history[teamId]) {
    history[teamId] = [];
  }
  
  const gameRecord = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    lineup: lineup,
    settings: settings,
    battingOrder: lineup.battingOrder.map(p => ({ name: p.name, number: p.number }))
  };
  
  // Keep only last 20 games per team
  history[teamId].unshift(gameRecord);
  if (history[teamId].length > 20) {
    history[teamId] = history[teamId].slice(0, 20);
  }
  
  saveTeamHistory(history);
  return gameRecord;
};

export const getTeamGameHistory = (teamId) => {
  const history = getTeamHistory();
  return history[teamId] || [];
};

export const deleteGameFromHistory = (teamId, gameId) => {
  const history = getTeamHistory();
  if (history[teamId]) {
    history[teamId] = history[teamId].filter(game => game.id !== gameId);
    saveTeamHistory(history);
  }
};

// Utility to shuffle array (Fisher-Yates algorithm)
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Import/Export functionality
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape double quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const unescapeCSV = (value) => {
  if (!value) return '';
  let str = value.trim();
  // Remove surrounding quotes and unescape double quotes
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.slice(1, -1).replace(/""/g, '"');
  }
  return str;
};

export const exportAllData = () => {
  const teams = getTeams();
  const currentTeamId = getCurrentTeamId();
  const history = getTeamHistory();
  
  const data = {
    teams,
    currentTeamId,
    history,
    exportedAt: new Date().toISOString()
  };
  
  // Convert to CSV format
  const rows = [];
  
  // Header
  rows.push('Type,Key,Value');
  
  // Metadata
  rows.push(`Metadata,ExportedAt,${escapeCSV(data.exportedAt)}`);
  rows.push(`Metadata,CurrentTeamId,${escapeCSV(currentTeamId || '')}`);
  
  // Teams data
  rows.push(`Data,Teams,${escapeCSV(JSON.stringify(teams))}`);
  
  // History data
  rows.push(`Data,History,${escapeCSV(JSON.stringify(history))}`);
  
  return rows.join('\n');
};

export const importAllData = (csvContent) => {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Skip header
    const header = lines[0];
    if (!header.includes('Type') || !header.includes('Key') || !header.includes('Value')) {
      throw new Error('Invalid CSV format - missing required headers');
    }
    
    let teams = null;
    let history = null;
    let currentTeamId = null;
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV parsing - split on comma, handling quoted values
      const parts = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            // Escaped quote
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          parts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current);
      
      if (parts.length < 3) continue;
      
      const type = unescapeCSV(parts[0]);
      const key = unescapeCSV(parts[1]);
      const value = unescapeCSV(parts[2]);
      
      if (type === 'Metadata' && key === 'CurrentTeamId') {
        currentTeamId = value || null;
      } else if (type === 'Data' && key === 'Teams') {
        teams = JSON.parse(value);
      } else if (type === 'Data' && key === 'History') {
        history = JSON.parse(value);
      }
    }
    
    // Validate required data
    if (teams === null) {
      throw new Error('Invalid data - Teams information is missing');
    }
    
    if (history === null) {
      throw new Error('Invalid data - History information is missing');
    }
    
    // Import data to localStorage
    saveTeams(teams);
    saveTeamHistory(history);
    if (currentTeamId && teams[currentTeamId]) {
      setCurrentTeamId(currentTeamId);
    }
    
    return {
      success: true,
      teamsCount: Object.keys(teams).length,
      currentTeamId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
