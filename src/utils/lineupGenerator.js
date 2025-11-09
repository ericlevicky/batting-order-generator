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

export function generateLineup(players, numInnings, numOutfielders, hasCatcher) {
  const playerStats = players.map((player, index) => ({
    ...player,
    battingOrder: index + 1,
    infieldInnings: 0,
    outfieldInnings: 0,
    benchInnings: 0,
  }));

  const positions = getPositionsForGame(numOutfielders, hasCatcher);
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

  for (let i = 0; i < numOutfielders && i < outfieldPositions.length; i++) {
    positions.push(outfieldPositions[i]);
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

  // Sort players by total active innings, then by balance between infield/outfield
  availablePlayers.sort((a, b) => {
    const aActive = a.infieldInnings + a.outfieldInnings;
    const bActive = b.infieldInnings + b.outfieldInnings;
    if (aActive !== bActive) return aActive - bActive;

    const aBalance = Math.abs(a.infieldInnings - a.outfieldInnings);
    const bBalance = Math.abs(b.infieldInnings - b.outfieldInnings);
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
        // Prefer players who need more of this position type
        if (positionType === POSITION_TYPES.INFIELD) {
          if (player.infieldInnings < bestPlayer.infieldInnings) {
            bestPlayer = player;
            bestPlayerIndex = i;
          }
        } else if (positionType === POSITION_TYPES.OUTFIELD) {
          if (player.outfieldInnings < bestPlayer.outfieldInnings) {
            bestPlayer = player;
            bestPlayerIndex = i;
          }
        }
      }
    }

    if (bestPlayer) {
      inningAssignments[position.name] = bestPlayer;
      assignedPlayers.push(bestPlayer);

      // Update player stats
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
