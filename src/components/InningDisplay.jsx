import React from 'react';
import BaseballField from './BaseballField';
import './InningDisplay.css';

function InningDisplay({ inningNumber, assignments, positions, hasCatcher }) {
  const benchPlayers = assignments['Bench'] || [];
  const fieldAssignments = Object.entries(assignments).filter(
    ([pos]) => pos !== 'Bench'
  );

  return (
    <div className="inning-card">
      <h4>Inning {inningNumber}</h4>

      <div className="inning-content">
        {/* Desktop: Show field overlay */}
        <div className="field-view desktop-only">
          <BaseballField assignments={assignments} hasCatcher={hasCatcher} />
        </div>

        {/* Mobile: Show list view */}
        <div className="list-view mobile-only">
          <div className="positions-list">
            {fieldAssignments.map(([position, player]) => (
              <div key={position} className="position-assignment">
                <span className="position-label">{position}</span>
                <span className="player-assigned">
                  {player.name} #{player.number}
                </span>
              </div>
            ))}
          </div>
        </div>

        {benchPlayers.length > 0 && (
          <div className="bench-section">
            <strong>Bench:</strong>{' '}
            {benchPlayers.map((p) => `${p.name} #${p.number}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

export default InningDisplay;
