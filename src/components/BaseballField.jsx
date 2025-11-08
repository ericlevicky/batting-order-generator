import React from 'react';
import './BaseballField.css';

function BaseballField({ assignments, hasCatcher }) {
  const getPlayer = (positionName) => {
    const player = assignments[positionName];
    if (!player) return null;
    return (
      <div className="player-badge">
        <div className="player-name">{player.name}</div>
        <div className="player-num">#{player.number}</div>
      </div>
    );
  };

  return (
    <div className="baseball-field">
      <svg viewBox="0 0 400 400" className="field-svg">
        {/* Outfield grass */}
        <path
          d="M 200 200 L 50 50 L 350 50 Z"
          fill="#7cb342"
          opacity="0.3"
        />

        {/* Infield dirt */}
        <path
          d="M 200 200 L 140 140 L 200 100 L 260 140 Z"
          fill="#d4a574"
          opacity="0.5"
        />

        {/* Bases */}
        <rect x="195" y="195" width="10" height="10" fill="white" stroke="#333" strokeWidth="1" /> {/* Home */}
        <rect x="195" y="95" width="10" height="10" fill="white" stroke="#333" strokeWidth="1" /> {/* 2nd */}
        <rect x="135" y="135" width="10" height="10" fill="white" stroke="#333" strokeWidth="1" /> {/* 3rd */}
        <rect x="255" y="135" width="10" height="10" fill="white" stroke="#333" strokeWidth="1" /> {/* 1st */}

        {/* Pitcher's mound */}
        <circle cx="200" cy="150" r="8" fill="#d4a574" stroke="#333" strokeWidth="1" />

        {/* Foul lines */}
        <line x1="200" y1="200" x2="50" y2="50" stroke="#white" strokeWidth="2" opacity="0.5" />
        <line x1="200" y1="200" x2="350" y2="50" stroke="#white" strokeWidth="2" opacity="0.5" />
      </svg>

      {/* Position labels and players */}
      <div className="position pitcher" title="Pitcher (1)">
        <div className="position-number">1</div>
        <div className="position-name">P</div>
        {getPlayer('Pitcher')}
      </div>

      {hasCatcher && (
        <div className="position catcher" title="Catcher (2)">
          <div className="position-number">2</div>
          <div className="position-name">C</div>
          {getPlayer('Catcher')}
        </div>
      )}

      <div className="position first-base" title="1st Base (3)">
        <div className="position-number">3</div>
        <div className="position-name">1B</div>
        {getPlayer('1st Base')}
      </div>

      <div className="position second-base" title="2nd Base (4)">
        <div className="position-number">4</div>
        <div className="position-name">2B</div>
        {getPlayer('2nd Base')}
      </div>

      <div className="position third-base" title="3rd Base (5)">
        <div className="position-number">5</div>
        <div className="position-name">3B</div>
        {getPlayer('3rd Base')}
      </div>

      <div className="position shortstop" title="Shortstop (6)">
        <div className="position-number">6</div>
        <div className="position-name">SS</div>
        {getPlayer('Shortstop')}
      </div>

      <div className="position left-field" title="Left Field (7)">
        <div className="position-number">7</div>
        <div className="position-name">LF</div>
        {getPlayer('Left Field')}
      </div>

      <div className="position center-field" title="Center Field (8)">
        <div className="position-number">8</div>
        <div className="position-name">CF</div>
        {getPlayer('Center Field')}
      </div>

      <div className="position right-field" title="Right Field (9)">
        <div className="position-number">9</div>
        <div className="position-name">RF</div>
        {getPlayer('Right Field')}
      </div>

      {assignments['Right Center'] && (
        <div className="position right-center" title="Right Center (10)">
          <div className="position-number">10</div>
          <div className="position-name">RC</div>
          {getPlayer('Right Center')}
        </div>
      )}
    </div>
  );
}

export default BaseballField;
