import React from 'react';
import LineupGrid from './LineupGrid';
import { getTeamWalkUpMusic } from '../utils/storage';
import './WizardResult.css';

function WizardResult({ lineup, numInnings, teamId, teamName, onStartOver, onShowWalkUpMusic, players }) {
  const walkUpMusic = teamId ? getTeamWalkUpMusic(teamId) : null;
  const hasActivePlayers = players && players.filter(p => p.active !== false).length > 0;

  const handleShare = async () => {
    const text = `${teamName} - Today's Lineup`;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text: text });
      } catch (e) {
        // User cancelled share
      }
    }
  };

  return (
    <div className="wizard-result">
      <div className="wizard-result-header">
        <h2 className="wizard-result-title">⚾ Today's Lineup</h2>
        <p className="wizard-result-subtitle">{teamName}</p>
      </div>

      <div className="wizard-result-actions-top">
        {navigator.share && (
          <button className="wizard-result-btn share" onClick={handleShare} type="button">
            📤 Share
          </button>
        )}
        {hasActivePlayers && onShowWalkUpMusic && (
          <button className="wizard-result-btn music" onClick={onShowWalkUpMusic} type="button">
            🎵 Walk-Up Music
          </button>
        )}
      </div>

      <div className="wizard-result-grid">
        <LineupGrid lineup={lineup} numInnings={numInnings} walkUpMusic={walkUpMusic} />
      </div>

      <div className="wizard-result-footer">
        <button className="wizard-result-start-over" onClick={onStartOver} type="button">
          ↺ Generate a new lineup
        </button>
      </div>
    </div>
  );
}

export default WizardResult;
