import React from 'react';
import './BattingOrder.css';

function BattingOrder({ battingOrder }) {
  return (
    <div className="batting-order-card card">
      <h3>Batting Order</h3>
      <div className="batting-order-list">
        {battingOrder.map((player) => (
          <div key={player.id} className="batting-order-item">
            <div className="batting-position">{player.battingOrder}</div>
            <div className="batting-player-info">
              <span className="batting-player-name">{player.name}</span>
              <span className="batting-player-number">#{player.number}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BattingOrder;
