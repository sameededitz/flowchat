import React, { useState, useEffect } from 'react';
import { useEventBus } from '../../EventBus';
import ToastItem from './ToastItem';
import MessageToast from './MessageToast';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const eventBus = useEventBus();

  // Sound effects (only if enabled)
  const playSound = (type) => {
    if (!soundEnabled) return;
    
    try {
      // Create audio context for different notification sounds
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Different frequencies for different toast types
      const frequencies = {
        success: [523.25, 659.25], // C5, E5 (happy chord)
        error: [220, 185], // A3, F#3 (dissonant)
        warning: [440, 554.37], // A4, C#5 (attention)
        info: [392, 493.88], // G4, B4 (neutral)
      };

      const freq = frequencies[type] || frequencies.info;
      
      // Create two oscillators for a richer sound
      freq.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime + index * 0.05);
        oscillator.stop(audioContext.currentTime + 0.2 + index * 0.05);
      });
    } catch (error) {
      console.log('Audio not supported or permission denied');
    }
  };

  // Load persisted toasts on mount
  useEffect(() => {
    const persistedToasts = localStorage.getItem('flowchat_toasts');
    if (persistedToasts) {
      try {
        const parsed = JSON.parse(persistedToasts);
        setToasts(parsed);
        localStorage.removeItem('flowchat_toasts'); // Clear after loading
      } catch (error) {
        console.error('Failed to parse persisted toasts:', error);
      }
    }
  }, []);

  // Listen for toast events
  useEffect(() => {
    const unsubscribe = eventBus.on('toast', (toastData) => {
      const newToast = {
        id: Date.now() + Math.random(),
        type: toastData.type || 'info',
        message: toastData.message || 'Notification',
        duration: toastData.duration || 4000,
        timestamp: Date.now(),
        ...toastData
      };

      setToasts(prevToasts => [...prevToasts, newToast]);
      
      // Play sound effect (if enabled)
      playSound(newToast.type);

      // Auto dismiss (only if duration > 0)
      if (newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    });

    const unsubscribeSoundToggle = eventBus.on('toast-sound-toggle', () => {
      setSoundEnabled(prev => !prev);
    });

    const unsubscribeDismiss = eventBus.on('toast-dismiss', (toastId) => {
      removeToast(toastId);
    });

    // Listen for new message notifications
    const unsubscribeMessageNotification = eventBus.on('newMessageNotification', (messageData) => {
      const messageToast = {
        id: Date.now() + Math.random(),
        type: 'message',
        message: 'New message received',
        duration: 8000, // Longer duration for message toasts
        timestamp: Date.now(),
        data: messageData // Store the message data for the MessageToast component
      };

      setToasts(prevToasts => [...prevToasts, messageToast]);
      
      // Play message notification sound (different from regular toasts)
      playSound('info');

      // Auto dismiss after duration
      setTimeout(() => {
        removeToast(messageToast.id);
      }, messageToast.duration);
    });

    return () => {
      unsubscribe();
      unsubscribeSoundToggle();
      unsubscribeDismiss();
      unsubscribeMessageNotification();
    };
  }, [eventBus]); // Remove url dependency since we moved logic to MessageListener

  // Persist toasts before page unload (for Inertia navigation)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (toasts.length > 0) {
        // Only persist toasts that are still fresh (less than 30 seconds old)
        const freshToasts = toasts.filter(toast => 
          Date.now() - toast.timestamp < 30000
        );
        if (freshToasts.length > 0) {
          localStorage.setItem('flowchat_toasts', JSON.stringify(freshToasts));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Also listen for Inertia navigation events
    document.addEventListener('inertia:start', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('inertia:start', handleBeforeUnload);
    };
  }, [toasts]);

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => {
        // Use MessageToast for message notifications
        if (toast.type === 'message') {
          return (
            <MessageToast
              key={toast.id}
              toast={toast}
              onRemove={() => removeToast(toast.id)}
            />
          );
        }
        
        // Use regular ToastItem for other notifications
        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        );
      })}
    </div>
  );
};

export default ToastContainer;