import React from 'react';
import { useToast } from '../../Hooks/useToast';
import { useEventBus } from '../../EventBus';

const ToastDemo = () => {
  const toast = useToast();
  const eventBus = useEventBus();

  const showSuccessToast = () => {
    toast.success('Message sent successfully!');
  };

  const showErrorToast = () => {
    toast.error('Failed to send message. Please try again.');
  };

  const showWarningToast = () => {
    toast.warning('Your session will expire in 5 minutes.');
  };

  const showInfoToast = () => {
    toast.info('New voice message feature is now available!');
  };

  const showCustomToast = () => {
    toast.toast('success', 'Custom success message with longer duration!', {
      duration: 6000
    });
  };

  const showMultipleToasts = () => {
    toast.success('First toast');
    setTimeout(() => toast.warning('Second toast'), 500);
    setTimeout(() => toast.info('Third toast'), 1000);
    setTimeout(() => toast.error('Fourth toast'), 1500);
  };

  const showVoiceToasts = () => {
    toast.voiceRecording();
    setTimeout(() => {
      toast.voiceSent();
    }, 3000);
  };

  const toggleSound = () => {
    eventBus.emit('toast-sound-toggle');
  };

  const showLoadingDemo = () => {
    const dismiss = toast.loading('Processing your request...');
    
    // Auto dismiss after 3 seconds for demo
    setTimeout(() => {
      dismiss();
      toast.success('Processing completed!');
    }, 3000);
  };

  const showMessageToast = () => {
    // Simulate a message notification
    toast.messageNotification({
      user: {
        id: 2,
        name: 'John Doe',
        avatar: null // Will use fallback avatar
      },
      message: 'Hey! This is a test message notification. How are you doing today?',
      group_id: null // Set to a number for group messages
    });
  };

  const showGroupMessageToast = () => {
    // Simulate a group message notification
    toast.messageNotification({
      user: {
        id: 3,
        name: 'Sarah Wilson', 
        avatar: null
      },
      message: 'Anyone up for a quick meeting?',
      group_id: 1 // Group message
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Toast Notification Demo</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={showSuccessToast}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Success Toast
        </button>
        
        <button
          onClick={showErrorToast}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Error Toast
        </button>
        
        <button
          onClick={showWarningToast}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Warning Toast
        </button>
        
        <button
          onClick={showInfoToast}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Info Toast
        </button>
        
        <button
          onClick={showCustomToast}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Custom Duration
        </button>
        
        <button
          onClick={showMultipleToasts}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Multiple Toasts
        </button>
        
        <button
          onClick={showVoiceToasts}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 col-span-2"
        >
          Voice Message Demo
        </button>
        
        <button
          onClick={toggleSound}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Toggle Sound Effects
        </button>
        
        <button
          onClick={showLoadingDemo}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
        >
          Loading Demo
        </button>
        
        <button
          onClick={showMessageToast}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 col-span-2"
        >
          Message Notification Demo
        </button>
        
        <button
          onClick={showGroupMessageToast}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 col-span-2"
        >
          Group Message Demo
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h3 className="font-semibold mb-2">Usage Examples:</h3>
        <pre className="text-sm"><code>{`
// In any component:
import { useToast } from '../../Hooks/useToast';

const MyComponent = () => {
  const toast = useToast();
  
  // Basic usage
  toast.success('Success!');
  toast.error('Error occurred');
  toast.warning('Warning message');
  toast.info('Info message');
  
  // Custom options
  toast.success('Message', { duration: 6000 });
  
  // Voice message specific
  toast.voiceRecording();
  toast.voiceSent();
  
  return <div>...</div>;
};
        `}</code></pre>
      </div>
    </div>
  );
};

export default ToastDemo;