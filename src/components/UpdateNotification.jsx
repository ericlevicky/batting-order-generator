import React, { useState, useEffect } from 'react';
import './UpdateNotification.css';

function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates every 60 seconds
        const intervalId = setInterval(() => {
          reg.update();
        }, 60000);

        // Check for updates when tab becomes visible
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            reg.update();
          }
        });

        return () => clearInterval(intervalId);
      });

      // Listen for the controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Don't show update notification if this is the first installation
        if (navigator.serviceWorker.controller) {
          setShowUpdate(true);
        }
      });

      // Check if there's a waiting service worker
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          setShowUpdate(true);
        }

        // Listen for new service worker waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed and ready
              setShowUpdate(true);
            }
          });
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Reload the page to get the new version
    window.location.reload();
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
          <button className="btn-update" onClick={handleUpdate}>
            Update Now
          </button>
          <button className="btn-dismiss" onClick={handleDismiss}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateNotification;
