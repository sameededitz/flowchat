import { useEventBus } from '../EventBus';

// Create a simple toast utility using EventBus
export const useToast = () => {
  const eventBus = useEventBus();

  const showToast = (type, message, options = {}) => {
    eventBus.emit('toast', {
      type,
      message,
      ...options
    });
  };

  // Store loading toast IDs for dismissal
  const loadingToasts = new Set();

  return {
    success: (message, options) => showToast('success', message, options),
    error: (message, options) => showToast('error', message, options),
    warning: (message, options) => showToast('warning', message, options),
    info: (message, options) => showToast('info', message, options),
    
    // Generic toast function for custom types
    toast: showToast,
    
    // Loading toast with manual dismissal
    loading: (message, options = {}) => {
      const loadingId = Date.now() + Math.random();
      loadingToasts.add(loadingId);
      
      showToast('info', message, { 
        duration: 0, // No auto-dismiss for loading
        icon: 'mdi:loading',
        id: loadingId,
        ...options 
      });
      
      // Return dismiss function
      return () => {
        if (loadingToasts.has(loadingId)) {
          loadingToasts.delete(loadingId);
          eventBus.emit('toast-dismiss', loadingId);
        }
      };
    },
    
    // Voice message specific toasts
    voiceRecording: () => showToast('info', 'Recording voice message...', {
      duration: 0,
      icon: 'mdi:microphone'
    }),
    
    voiceSent: () => showToast('success', 'Voice message sent!', {
      duration: 2000,
      icon: 'mdi:send'
    }),
    
    // File upload toasts
    fileUploading: (fileName) => showToast('info', `Uploading ${fileName}...`, {
      duration: 0,
      icon: 'mdi:upload'
    }),
    
    fileUploaded: (fileName) => showToast('success', `${fileName} uploaded successfully!`, {
      duration: 3000,
      icon: 'mdi:check-circle'
    }),
    
    // Connection status toasts
    connectionLost: () => showToast('error', 'Connection lost. Trying to reconnect...', {
      duration: 0,
      icon: 'mdi:wifi-off'
    }),
    
    connectionRestored: () => showToast('success', 'Connection restored!', {
      duration: 2000,
      icon: 'mdi:wifi'
    }),
    
    // Message notification toast (for new messages from other users)
    messageNotification: (messageData) => {
      eventBus.emit('newMessageNotification', messageData);
    }
  };
};

// Direct EventBus toast helper (can be used without hooks)
export const toast = {
  emit: (type, message, options = {}) => {
    // This will work if EventBus is available globally
    // For components, prefer useToast hook
    if (window.eventBus) {
      window.eventBus.emit('toast', { type, message, ...options });
    }
  },
  
  success: (message, options) => toast.emit('success', message, options),
  error: (message, options) => toast.emit('error', message, options),
  warning: (message, options) => toast.emit('warning', message, options),
  info: (message, options) => toast.emit('info', message, options)
};

export default useToast;