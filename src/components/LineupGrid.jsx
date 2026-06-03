import React from 'react';
import { formatPlayerName } from '../utils/formatPlayerName';
import { resolvePlayerSongConfig } from '../utils/storage';
import './LineupGrid.css';

// Position abbreviations mapping
const POSITION_ABBREV = {
  'Pitcher': 'P',
  'Catcher': 'C',
  '1st Base': '1B',
  '2nd Base': '2B',
  '3rd Base': '3B',
  'Shortstop': 'SS',
  'Left Field': 'LF',
  'Center Field': 'CF',
  'Right Field': 'RF',
  'Right Center': 'RC',
  'Bench': 'Bench'
};

function getPlayerPositionInInning(playerId, inning) {
  if (!inning) return '-';
  try {
    for (const [positionName, assignedPlayer] of Object.entries(inning)) {
      if (positionName === 'Bench') {
        if (Array.isArray(assignedPlayer)) {
          const found = assignedPlayer.find(p => (p.id || p.name) === playerId || p.name === playerId);
          if (found) return POSITION_ABBREV['Bench'];
        }
      } else {
        if (assignedPlayer && ((assignedPlayer.id || assignedPlayer.name) === playerId)) {
          return POSITION_ABBREV[positionName] || positionName;
        }
      }
    }
  } catch (e) {
    return '-';
  }
  return '-';
}

function LineupGrid({ lineup, numInnings, showHeader = true, walkUpMusic }) {
  const isRotating = Array.isArray(lineup?.inningBattingOrders);

  // Resolve walk-up song name for a player
  const getPlayerSongName = (player) => {
    if (!walkUpMusic || !walkUpMusic.players) return null;
    const playerName = player.name;
    const playerConfig = walkUpMusic.players[playerName] || walkUpMusic.players[player.id];
    if (!playerConfig) return null;
    const songConfig = resolvePlayerSongConfig(playerConfig, walkUpMusic.musicType || 'spotify');
    return songConfig?.trackName || null;
  };

  const hasAnySongs = walkUpMusic?.players && Object.keys(walkUpMusic.players).length > 0;

  // Standard layout: one row per player, one column per inning showing position
  const renderStandardGrid = () => (
    <table className="grid-table">
      <thead>
        <tr>
          <th className="grid-order-col">#</th>
          <th className="grid-player-col">Player</th>
          <th className="grid-number-col">No.</th>
          {hasAnySongs && <th className="grid-song-col">🎵 Walk-Up Song</th>}
          {Array.from({ length: numInnings }, (_, i) => (
            <th key={i} className="grid-inning-col">
              <div className="grid-inning-header">
                <span className="grid-inning-label">Inning</span>
                <span className="grid-inning-number">{i + 1}</span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lineup?.battingOrder?.map((player, index) => (
          <tr key={player.id || player.name}>
            <td className="grid-order-col">{index + 1}</td>
            <td className="grid-player-col">{formatPlayerName(player)}</td>
            <td className="grid-number-col">{player.number || '-'}</td>
            {hasAnySongs && <td className="grid-song-col">{getPlayerSongName(player) || '-'}</td>}
            {Array.from({ length: numInnings }, (_, inningIndex) => (
              <td key={inningIndex} className="grid-inning-col">
                {getPlayerPositionInInning(player.id || player.name, lineup.innings?.[inningIndex])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Rotating layout: one row per batting slot, two columns per inning (name + position)
  const renderRotatingGrid = () => {
    const numPlayers = lineup.battingOrder.length;
    return (
      <table className="grid-table">
        <thead>
          <tr>
            <th className="grid-order-col" rowSpan={2}>#</th>
            {Array.from({ length: numInnings }, (_, i) => (
              <th key={i} className="grid-inning-group-header" colSpan={2}>
                <div className="grid-inning-header">
                  <span className="grid-inning-label">Inning</span>
                  <span className="grid-inning-number">{i + 1}</span>
                </div>
              </th>
            ))}
          </tr>
          <tr>
            {Array.from({ length: numInnings }, (_, i) => (
              <React.Fragment key={i}>
                <th className="grid-rotating-sub-col grid-player-col">Player</th>
                <th className="grid-rotating-sub-col grid-inning-col">Pos</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: numPlayers }, (_, slot) => (
            <tr key={slot}>
              <td className="grid-order-col">{slot + 1}</td>
              {Array.from({ length: numInnings }, (_, inningIndex) => {
                const player = lineup.inningBattingOrders[inningIndex]?.[slot];
                const pos = player
                  ? getPlayerPositionInInning(player.id || player.name, lineup.innings?.[inningIndex])
                  : '-';
                return (
                  <React.Fragment key={inningIndex}>
                    <td className="grid-player-col grid-rotating-player">{player ? formatPlayerName(player) : '-'}</td>
                    <td className="grid-inning-col">{pos}</td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="lineup-grid">
      {showHeader && (
        <div className="grid-header">
          <h3>⚾ Batting Order & Positions</h3>
          <p className="grid-subtitle">Game Lineup</p>
        </div>
      )}

      <div className="grid-table-container">
        {isRotating ? renderRotatingGrid() : renderStandardGrid()}
      </div>

      <div className="grid-footer">
        <div className="grid-position-legend">
          <strong>Position Key:</strong> P=Pitcher, C=Catcher, 1B=First Base, 2B=Second Base, 3B=Third Base, 
          SS=Shortstop, LF=Left Field, CF=Center Field, RF=Right Field, RC=Right Center
        </div>
      </div>
    </div>
  );
}

export default LineupGrid;
