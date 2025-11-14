import React from 'react';
import './ConfirmDialog.css';

function ConfirmDialog({ title, message, confirmLabel = 'OK', cancelLabel = 'Cancel', destructive = false, onCancel, onConfirmAction }) {
  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        <h4 className="confirm-title">{title}</h4>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn-confirm ${destructive ? 'destructive' : ''}`} onClick={onConfirmAction}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
