// LocalStorage utilities for team and lineup management

const STORAGE_KEYS = {
  TEAMS: 'batting_order_teams',
  CURRENT_TEAM: 'batting_order_current_team',
  TEAM_HISTORY: 'batting_order_team_history',
  WALKUP_MUSIC: 'batting_order_walkup_music'
};

// Team Management
export const saveTeams = (teams) => {
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
};

export const getTeams = () => {
  const teams = localStorage.getItem(STORAGE_KEYS.TEAMS);
  return teams ? JSON.parse(teams) : {};
};

export const createTeam = (teamName, players = [], lastSettings = { numInnings: 6, numOutfielders: 3, hasCatcher: true }) => {
  const teams = getTeams();
  const teamId = Date.now().toString();
  teams[teamId] = {
    id: teamId,
    name: teamName,
    players: players,
    lastSettings: lastSettings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveTeams(teams);
  return teamId;
};

export const updateTeam = (teamId, updates) => {
  const teams = getTeams();
  if (teams[teamId]) {
    teams[teamId] = Object.assign({}, teams[teamId], updates, { updatedAt: new Date().toISOString() });
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

export const updateTeamLastSettings = (teamId, settings) => {
  const teams = getTeams();
  if (teams[teamId]) {
    teams[teamId].lastSettings = {
      numInnings: settings.numInnings,
      numOutfielders: settings.numOutfielders,
      hasCatcher: settings.hasCatcher,
      rotatingBattingOrder: settings.rotatingBattingOrder ?? false
    };
    teams[teamId].updatedAt = new Date().toISOString();
    saveTeams(teams);
    return true;
  }
  return false;
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

export const getNextGameNumber = (teamId) => {
  const history = getTeamHistory();
  const games = history[teamId] || [];
  let max = 0;
  for (let i = 0; i < games.length; i++) {
    const n = games[i].gameNumber;
    if (typeof n === 'number' && n > max) max = n;
  }
  return max + 1;
};

export const saveLineupToHistory = (teamId, lineup, settings) => {
  const history = getTeamHistory();
  if (!history[teamId]) {
    history[teamId] = [];
  }
  const nextNumber = getNextGameNumber(teamId);
  const gameRecord = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    gameNumber: nextNumber,
    lineup: lineup,
    settings: settings,
    battingOrder: lineup.battingOrder.map(p => ({ name: p.name, number: p.number }))
  };
  history[teamId].unshift(gameRecord);
  // Limit history to 20 games
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

export const deleteAllGamesFromHistory = (teamId) => {
  const history = getTeamHistory();
  if (history[teamId]) {
    history[teamId] = [];
    saveTeamHistory(history);
    return true;
  }
  return false;
};

// Utility to shuffle array (Fisher-Yates algorithm)
export const shuffleArray = (array) => {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
};

// Walk-Up Music Configuration
const getWalkUpMusicData = () => {
  const data = localStorage.getItem(STORAGE_KEYS.WALKUP_MUSIC);
  return data ? JSON.parse(data) : {};
};

const saveWalkUpMusicData = (data) => {
  localStorage.setItem(STORAGE_KEYS.WALKUP_MUSIC, JSON.stringify(data));
};

export const getTeamWalkUpMusic = (teamId) => {
  const data = getWalkUpMusicData();
  return data[teamId] || { spotifyPlaylistId: null, spotifyPlaylistName: null, players: {} };
};

export const saveTeamWalkUpMusic = (teamId, walkUpMusic) => {
  const data = getWalkUpMusicData();
  data[teamId] = walkUpMusic;
  saveWalkUpMusicData(data);
};

export const setPlayerWalkUpSong = (teamId, playerName, songConfig) => {
  const data = getWalkUpMusicData();
  if (!data[teamId]) {
    data[teamId] = { spotifyPlaylistId: null, spotifyPlaylistName: null, players: {} };
  }
  data[teamId].players[playerName] = songConfig;
  saveWalkUpMusicData(data);
};

export const removePlayerWalkUpSong = (teamId, playerName) => {
  const data = getWalkUpMusicData();
  if (data[teamId]?.players) {
    delete data[teamId].players[playerName];
    saveWalkUpMusicData(data);
  }
};

export const setTeamPlaylist = (teamId, playlistId, playlistName) => {
  const data = getWalkUpMusicData();
  if (!data[teamId]) {
    data[teamId] = { spotifyPlaylistId: null, spotifyPlaylistName: null, players: {} };
  }
  data[teamId].spotifyPlaylistId = playlistId;
  data[teamId].spotifyPlaylistName = playlistName;
  saveWalkUpMusicData(data);
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

const parseCSV = (csvContent) => {
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];

    if (char === '"') {
      if (inQuotes && csvContent[i + 1] === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && csvContent[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentValue);
      if (currentRow.some(value => value.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue);
  if (currentRow.some(value => value.trim() !== '')) {
    rows.push(currentRow);
  }

  return rows;
};

export const exportAllData = () => {
  const teams = getTeams();
  const currentTeamId = getCurrentTeamId();
  const history = getTeamHistory();
  const walkUpMusic = getWalkUpMusicData();
  
  const data = {
    teams,
    currentTeamId,
    history,
    walkUpMusic,
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
  
  // Walk-up music data
  rows.push(`Data,WalkUpMusic,${escapeCSV(JSON.stringify(walkUpMusic))}`);
  
  return rows.join('\n');
};

export const importAllData = (csvContent) => {
  try {
    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Skip header
    const header = rows[0];
    if (!Array.isArray(header) || header.length < 3 || header[0] !== 'Type' || header[1] !== 'Key' || header[2] !== 'Value') {
      throw new Error('Invalid CSV format - missing required headers');
    }
    
    let teams = null;
    let history = null;
    let currentTeamId = null;
    let walkUpMusic = null;
    
    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i];
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
      } else if (type === 'Data' && key === 'WalkUpMusic') {
        walkUpMusic = JSON.parse(value);
      }
    }
    
    // Validate required data
    if (teams === null) {
      throw new Error('Invalid data - Teams information is missing');
    }
    
    if (history === null) {
      throw new Error('Invalid data - History information is missing');
    }
    
    // Normalize players: if no active flag, assume true
    Object.values(teams).forEach(team => {
      if (team && Array.isArray(team.players)) {
        team.players = team.players.map(function(p) {
          if (p && typeof p === 'object') {
            var clone = Object.assign({}, p);
            if (clone.active === undefined) {
              clone.active = true;
            }
            return clone;
          }
          return p;
        });
      }
    });
    
    // Merge with existing teams instead of replacing
    const existingTeams = getTeams();
    const existingHistory = getTeamHistory();
    
    // Helper to generate unique team name
    const getUniqueTeamName = (baseName, existingTeamsObj) => {
      const existingNames = Object.values(existingTeamsObj).map(t => t.name.toLowerCase());
      let name = baseName;
      let counter = 1;
      
      while (existingNames.includes(name.toLowerCase())) {
        name = `${baseName} (${counter})`;
        counter++;
      }
      
      return name;
    };
    
    // Merge teams, handling name conflicts
    const mergedTeams = Object.assign({}, existingTeams);
    const teamIdMapping = {}; // Map old IDs to new IDs in case of conflicts

    Object.entries(teams).forEach(([teamId, team]) => {
      if (mergedTeams[teamId]) {
        // Team ID conflict - create new ID and unique name
        const newTeamId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const uniqueName = getUniqueTeamName(team.name, mergedTeams);
        mergedTeams[newTeamId] = Object.assign({}, team, {
          id: newTeamId,
          name: uniqueName,
          updatedAt: new Date().toISOString()
        });
        teamIdMapping[teamId] = newTeamId;
      } else {
        // No ID conflict - check if name conflicts with existing team
        const uniqueName = getUniqueTeamName(team.name, mergedTeams);
        mergedTeams[teamId] = Object.assign({}, team, {
          name: uniqueName,
          updatedAt: new Date().toISOString()
        });
      }
    });

    // Merge history, updating team IDs if necessary
    const mergedHistory = Object.assign({}, existingHistory);
    Object.entries(history).forEach(([teamId, games]) => {
      const newTeamId = teamIdMapping[teamId] || teamId;
      if (mergedHistory[newTeamId]) {
        // Merge game histories, keeping both
        mergedHistory[newTeamId] = mergedHistory[newTeamId].concat(games);
      } else {
        mergedHistory[newTeamId] = games;
      }
    });
    
    // Merge walk-up music, updating team IDs if necessary
    if (walkUpMusic && typeof walkUpMusic === 'object') {
      const existingWalkUpMusic = getWalkUpMusicData();
      const mergedWalkUpMusic = Object.assign({}, existingWalkUpMusic);
      Object.entries(walkUpMusic).forEach(([teamId, config]) => {
        const newTeamId = teamIdMapping[teamId] || teamId;
        // Only import if no existing config for this team
        if (!mergedWalkUpMusic[newTeamId]) {
          mergedWalkUpMusic[newTeamId] = config;
        }
      });
      saveWalkUpMusicData(mergedWalkUpMusic);
    }
    
    // Save merged data to localStorage
    saveTeams(mergedTeams);
    saveTeamHistory(mergedHistory);
    
    // Set current team ID if it exists in merged teams
    const newCurrentTeamId = teamIdMapping[currentTeamId] || currentTeamId;
    if (newCurrentTeamId && mergedTeams[newCurrentTeamId]) {
      setCurrentTeamId(newCurrentTeamId);
    }
    
    return {
      success: true,
      teamsCount: Object.keys(teams).length,
      currentTeamId: newCurrentTeamId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
