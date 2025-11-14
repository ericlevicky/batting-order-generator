import React from 'react';
import './ToastContainer.css';

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onDismiss(t.id)}>
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }}>×</button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
