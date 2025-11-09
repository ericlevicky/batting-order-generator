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
