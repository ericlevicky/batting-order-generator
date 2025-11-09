// Baseball positions in standard numbering order
const POSITIONS = {
  PITCHER: { name: 'Pitcher', number: 1 },
  CATCHER: { name: 'Catcher', number: 2 },
  FIRST_BASE: { name: '1st Base', number: 3 },
  SECOND_BASE: { name: '2nd Base', number: 4 },
  THIRD_BASE: { name: '3rd Base', number: 5 },
  SHORTSTOP: { name: 'Shortstop', number: 6 },
  LEFT_FIELD: { name: 'Left Field', number: 7 },
  CENTER_FIELD: { name: 'Center Field', number: 8 },
  RIGHT_FIELD: { name: 'Right Field', number: 9 },
  RIGHT_CENTER: { name: 'Right Center', number: 10 },
  BENCH: { name: 'Bench', number: 0 },
};

const POSITION_TYPES = {
  INFIELD: 'infield',
  OUTFIELD: 'outfield',
  BENCH: 'bench',
};

/**
 * Calculate historical statistics for each player across all previous games
 * Returns an object with player names as keys and their historical stats
 */
function calculateHistoricalStats(players, gameHistory) {
  const stats = {};
  
  // Initialize stats for all current players
  players.forEach(player => {
    stats[player.name] = {
      totalInfield: 0,
      totalOutfield: 0,
      totalBench: 0,
      battingPositions: {}, // Maps batting position (1-9) to count
      gamesPlayed: 0
    };
  });
  
  // Accumulate stats from game history
  gameHistory.forEach(game => {
    if (!game.lineup || !game.lineup.battingOrder) return;
    
    game.lineup.battingOrder.forEach(playerData => {
      // Only track stats for players currently on the team
      if (stats[playerData.name]) {
        stats[playerData.name].totalInfield += playerData.infieldInnings || 0;
        stats[playerData.name].totalOutfield += playerData.outfieldInnings || 0;
        stats[playerData.name].totalBench += playerData.benchInnings || 0;
        
        // Track batting order position
        const battingPos = playerData.battingOrder;
        if (battingPos) {
          stats[playerData.name].battingPositions[battingPos] = 
            (stats[playerData.name].battingPositions[battingPos] || 0) + 1;
        }
        
        stats[playerData.name].gamesPlayed++;
      }
    });
  });
  
  return stats;
}

/**
 * Rotate batting order based on historical positions to ensure fairness
 * Players cycle through all batting positions over time - no one stays in the same spot
 * Uses variance tracking to ensure players experience diverse positions, not just alternating ends
 */
function rotateBattingOrder(players, historicalStats) {
  if (players.length === 0) return players;
  
  const playersWithScores = players.map(player => {
    const stats = historicalStats[player.name];
    
    if (!stats || stats.gamesPlayed === 0) {
      // New player - assign middle position average with high variance (needs variety)
      return { 
        player, 
        avgPosition: (players.length + 1) / 2,
        variance: 999, // High variance = needs more variety
        gamesPlayed: 0
      };
    }
    
    // Calculate average batting position AND variance
    let totalPositionWeight = 0;
    let totalGames = 0;
    const positions = [];
    
    for (const [position, count] of Object.entries(stats.battingPositions)) {
      const pos = parseInt(position);
      totalPositionWeight += pos * count;
      totalGames += count;
      // Record each occurrence
      for (let i = 0; i < count; i++) {
        positions.push(pos);
      }
    }
    
    const avgPosition = totalGames > 0 ? totalPositionWeight / totalGames : (players.length + 1) / 2;
    
    // Calculate variance - how spread out their positions have been
    let variance = 0;
    if (positions.length > 0) {
      variance = positions.reduce((sum, pos) => sum + Math.pow(pos - avgPosition, 2), 0) / positions.length;
    } else {
      variance = 999; // High variance for no history
    }
    
    return { 
      player, 
      avgPosition,
      variance,
      gamesPlayed: stats.gamesPlayed
    };
  });
  
  // Sort with a combined strategy:
  // 1. Primary: Balance average position (higher avg position = bat earlier next)
  // 2. Secondary: Players with LOW variance (stuck in same positions) get extra priority
  //    to break them out of their rut
  playersWithScores.sort((a, b) => {
    // Players with low variance (< 3) get a boost to their position priority
    // This helps break players out of middle positions or repetitive patterns
    // The boost is stronger for very low variance
    const aVarianceBoost = a.variance < 1 ? 3 : (a.variance < 3 ? 1.5 : 0);
    const bVarianceBoost = b.variance < 1 ? 3 : (b.variance < 3 ? 1.5 : 0);
    
    const aAdjusted = a.avgPosition + aVarianceBoost;
    const bAdjusted = b.avgPosition + bVarianceBoost;
    
    const diff = bAdjusted - aAdjusted;
    if (Math.abs(diff) < 0.001) {
      // If tied, prefer player with lower variance (needs more variety)
      const varianceDiff = a.variance - b.variance;
      if (Math.abs(varianceDiff) < 0.001) {
        return players.indexOf(a.player) - players.indexOf(b.player);
      }
      return varianceDiff;
    }
    return diff;
  });
  
  return playersWithScores.map(item => item.player);
}

export function generateLineup(players, numInnings, numOutfielders, hasCatcher, gameHistory = []) {
  // Calculate historical stats for each player across all previous games
  const historicalStats = calculateHistoricalStats(players, gameHistory);
  
  // Rotate batting order based on historical positions
  const rotatedPlayers = rotateBattingOrder(players, historicalStats);
  
  // Initialize player stats for THIS game, but include historical data for balancing
  const playerStats = rotatedPlayers.map((player, index) => ({
    ...player,
    battingOrder: index + 1,
    infieldInnings: 0,
    outfieldInnings: 0,
    benchInnings: 0,
    // Store historical totals separately for balancing decisions
    _historicalInfield: historicalStats[player.name]?.totalInfield || 0,
    _historicalOutfield: historicalStats[player.name]?.totalOutfield || 0,
    _historicalBench: historicalStats[player.name]?.totalBench || 0,
  }));

  // Calculate actual number of outfielders
  // If 'all', calculate how many outfielders needed to field everyone (no bench)
  let actualNumOutfielders = numOutfielders;
  if (numOutfielders === 'all') {
    // Total positions = players.length
    // Infield positions = 5 (P, 1B, 2B, 3B, SS) + 1 if catcher
    const infieldPositions = hasCatcher ? 6 : 5;
    actualNumOutfielders = Math.max(0, players.length - infieldPositions);
  }

  const positions = getPositionsForGame(actualNumOutfielders, hasCatcher);
  const innings = [];

  for (let inning = 0; inning < numInnings; inning++) {
    innings.push(generateInningPositions(playerStats, positions));
  }

  return {
    battingOrder: playerStats,
    innings,
    positions,
  };
}

function getPositionsForGame(numOutfielders, hasCatcher) {
  const positions = [POSITIONS.PITCHER];

  if (hasCatcher) {
    positions.push(POSITIONS.CATCHER);
  }

  positions.push(
    POSITIONS.FIRST_BASE,
    POSITIONS.SECOND_BASE,
    POSITIONS.THIRD_BASE,
    POSITIONS.SHORTSTOP
  );

  const outfieldPositions = [
    POSITIONS.LEFT_FIELD,
    POSITIONS.CENTER_FIELD,
    POSITIONS.RIGHT_FIELD,
    POSITIONS.RIGHT_CENTER,
  ];

  // Add outfield positions up to the requested number
  // If more than 4 are needed, create additional generic outfield positions
  for (let i = 0; i < numOutfielders; i++) {
    if (i < outfieldPositions.length) {
      positions.push(outfieldPositions[i]);
    } else {
      // Create additional generic outfield positions for larger teams
      positions.push({ name: `Outfield ${i + 1}`, number: 10 + i });
    }
  }

  return positions;
}

function getPositionType(position) {
  const outfieldPositions = [
    POSITIONS.LEFT_FIELD,
    POSITIONS.CENTER_FIELD,
    POSITIONS.RIGHT_FIELD,
    POSITIONS.RIGHT_CENTER,
  ];

  if (position.number === 0) {
    return POSITION_TYPES.BENCH;
  } else if (outfieldPositions.includes(position)) {
    return POSITION_TYPES.OUTFIELD;
  } else {
    return POSITION_TYPES.INFIELD;
  }
}

function generateInningPositions(playerStats, positions) {
  const inningAssignments = {};
  const availablePlayers = [...playerStats];

  // Sort players by total active innings (including historical), then by balance between infield/outfield
  availablePlayers.sort((a, b) => {
    // Total innings including history
    const aActive = a.infieldInnings + a.outfieldInnings + (a._historicalInfield || 0) + (a._historicalOutfield || 0);
    const bActive = b.infieldInnings + b.outfieldInnings + (b._historicalInfield || 0) + (b._historicalOutfield || 0);
    if (aActive !== bActive) return aActive - bActive;

    // Balance between infield/outfield including history
    const aBalance = Math.abs((a.infieldInnings + (a._historicalInfield || 0)) - (a.outfieldInnings + (a._historicalOutfield || 0)));
    const bBalance = Math.abs((b.infieldInnings + (b._historicalInfield || 0)) - (b.outfieldInnings + (b._historicalOutfield || 0)));
    return aBalance - bBalance;
  });

  const assignedPlayers = [];

  // Assign field positions
  for (const position of positions) {
    const positionType = getPositionType(position);

    let bestPlayer = null;
    let bestPlayerIndex = -1;

    for (let i = 0; i < availablePlayers.length; i++) {
      const player = availablePlayers[i];
      if (assignedPlayers.includes(player)) continue;

      if (!bestPlayer) {
        bestPlayer = player;
        bestPlayerIndex = i;
      } else {
        // Prefer players who need more of this position type (including historical stats)
        if (positionType === POSITION_TYPES.INFIELD) {
          const playerTotal = player.infieldInnings + (player._historicalInfield || 0);
          const bestTotal = bestPlayer.infieldInnings + (bestPlayer._historicalInfield || 0);
          if (playerTotal < bestTotal) {
            bestPlayer = player;
            bestPlayerIndex = i;
          }
        } else if (positionType === POSITION_TYPES.OUTFIELD) {
          const playerTotal = player.outfieldInnings + (player._historicalOutfield || 0);
          const bestTotal = bestPlayer.outfieldInnings + (bestPlayer._historicalOutfield || 0);
          if (playerTotal < bestTotal) {
            bestPlayer = player;
            bestPlayerIndex = i;
          }
        }
      }
    }

    if (bestPlayer) {
      inningAssignments[position.name] = bestPlayer;
      assignedPlayers.push(bestPlayer);

      // Update player stats (only current game stats)
      if (positionType === POSITION_TYPES.INFIELD) {
        bestPlayer.infieldInnings++;
      } else if (positionType === POSITION_TYPES.OUTFIELD) {
        bestPlayer.outfieldInnings++;
      }
    }
  }

  // Remaining players go to bench
  const benchPlayers = [];
  for (const player of availablePlayers) {
    if (!assignedPlayers.includes(player)) {
      benchPlayers.push(player);
      player.benchInnings++;
    }
  }

  if (benchPlayers.length > 0) {
    inningAssignments[POSITIONS.BENCH.name] = benchPlayers;
  }

  return inningAssignments;
}

export { POSITIONS };
