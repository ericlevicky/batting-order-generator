import React, { useState } from 'react';
import './FeatureSuggestion.css';

const ISSUE_URL = 'https://github.com/ericlevicky/batting-order-generator/issues/new';
const MAX_FEATURE_TITLE_LENGTH = 120;

function FeatureSuggestion({ onClose, onIssueFormOpened, onIssueFormBlocked }) {
  const [featureTitle, setFeatureTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const title = `Feature Request: ${featureTitle.trim()}`;
    const body = `## Summary
${featureTitle.trim()}

## Problem to Solve
${problemDescription.trim()}

## Proposed Solution
${proposedSolution.trim()}

## Additional Context
${additionalContext.trim() || 'N/A'}
`;

    const params = new URLSearchParams({
      title,
      body,
      labels: 'enhancement'
    });

    const issueWindow = window.open(`${ISSUE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');

    if (issueWindow) {
      onIssueFormOpened?.();
      onClose();
      return;
    }

    onIssueFormBlocked?.();
  };

  return (
    <div className="feature-suggestion-overlay" onClick={onClose}>
      <div className="feature-suggestion-modal" onClick={(event) => event.stopPropagation()}>
        <div className="feature-suggestion-header">
          <h2>💡 Suggest a Feature</h2>
          <button className="btn-close-feature-suggestion" onClick={onClose} aria-label="Close feature suggestion form">✕</button>
        </div>

        <form className="feature-suggestion-form" onSubmit={handleSubmit}>
          <label className="feature-suggestion-field">
            <span>Feature title</span>
            <input
              type="text"
              value={featureTitle}
              onChange={(event) => setFeatureTitle(event.target.value)}
              placeholder="Example: Save multiple lineup presets"
              required
              maxLength={MAX_FEATURE_TITLE_LENGTH}
            />
          </label>

          <label className="feature-suggestion-field">
            <span>What problem does this solve?</span>
            <textarea
              value={problemDescription}
              onChange={(event) => setProblemDescription(event.target.value)}
              placeholder="Describe what is difficult today."
              required
              rows={4}
            />
          </label>

          <label className="feature-suggestion-field">
            <span>What should happen instead?</span>
            <textarea
              value={proposedSolution}
              onChange={(event) => setProposedSolution(event.target.value)}
              placeholder="Describe your ideal workflow."
              required
              rows={4}
            />
          </label>

          <label className="feature-suggestion-field">
            <span>Additional context (optional)</span>
            <textarea
              value={additionalContext}
              onChange={(event) => setAdditionalContext(event.target.value)}
              placeholder="Examples, edge cases, or other notes."
              rows={3}
            />
          </label>

          <div className="feature-suggestion-actions">
            <button type="button" className="btn-cancel-feature-suggestion" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-feature-suggestion">
              Create GitHub Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeatureSuggestion;
