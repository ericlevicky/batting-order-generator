import React, { useState } from 'react';
import './FeatureSuggestion.css';

const MAX_FEATURE_TITLE_LENGTH = 120;

function FeatureSuggestion({ onClose, onSubmitSuccess, onSubmitError }) {
  const [featureTitle, setFeatureTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const title = `Feature Request: ${featureTitle.trim()}`;
    const description = `## Summary
${featureTitle.trim()}

## Problem to Solve
${problemDescription.trim()}

## Proposed Solution
${proposedSolution.trim()}

## Additional Context
${additionalContext.trim() || 'N/A'}
`;

    try {
      const response = await fetch('/.netlify/functions/create-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json();

      if (response.ok) {
        onSubmitSuccess?.(data.issueNumber);
        onClose();
      } else {
        onSubmitError?.(data.error || 'Failed to submit feature request.');
      }
    } catch (error) {
      onSubmitError?.('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

          <p className="feature-suggestion-note">
            Your feature request will be submitted directly. No GitHub account needed!
          </p>

          <div className="feature-suggestion-actions">
            <button type="button" className="btn-cancel-feature-suggestion" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-feature-suggestion" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Feature Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeatureSuggestion;
