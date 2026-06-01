import React, { useState, useEffect } from 'react';
import './UpdateNotification.css';

function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    let fallbackTimeout = null;

    // When a new service worker takes control, reload the page automatically
    // This fires after skipWaiting() + clients.claim() in the new SW
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      window.location.reload();
    });

    // Check for updates and show notification when a new SW is waiting
    navigator.serviceWorker.ready.then((reg) => {
      // Check for updates periodically
      const intervalId = setInterval(() => {
        reg.update().catch(() => {});
      }, 60000);

      // Check for updates when tab becomes visible
      const handleVisibility = () => {
        if (!document.hidden) {
          reg.update().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      // If there's already a waiting worker, show update notification
      if (reg.waiting) {
        setShowUpdate(true);
      }

      // Listen for new service worker installing
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // New SW installed and waiting - since we use skipWaiting(), 
          // it should activate immediately. But as a fallback, show notification.
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true);
          }
        });
      });

      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    });
  }, []);

  const handleUpdate = () => {
    setUpdating(true);
    
    // The new SW should already be active (skipWaiting is called in install).
    // But if there's a waiting SW for some reason, tell it to activate.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          // SW already activated, just reload
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
    
    // Fallback: if controllerchange doesn't fire within 3 seconds, force reload
    fallbackTimeout = setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="update-notification">
      <div className="update-content">
        <span className="update-icon">🔄</span>
        <div className="update-text">
          <strong>Update Available</strong>
          <p>A new version is available. Refresh to get the latest features.</p>
        </div>
        <div className="update-actions">
          <button className="btn-update" onClick={handleUpdate} disabled={updating}>
            {updating ? 'Updating...' : 'Update Now'}
          </button>
          <button className="btn-dismiss" onClick={handleDismiss} disabled={updating}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateNotification;
