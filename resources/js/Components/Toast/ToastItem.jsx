import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Animation states
  useEffect(() => {
    // Enter animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove();
    }, 200);
  };

  // Toast type configurations (Flowbite style with border)
  const typeConfig = {
    success: {
      bgColor: 'bg-white dark:bg-gray-800',
      borderColor: 'border-l-4 border-green-500',
      textColor: 'text-gray-500 dark:text-gray-400',
      iconBgColor: 'bg-green-100 dark:bg-green-800',
      iconColor: 'text-green-500 dark:text-green-200',
      icon: 'mdi:check-circle'
    },
    error: {
      bgColor: 'bg-white dark:bg-gray-800',
      borderColor: 'border-l-4 border-red-500', 
      textColor: 'text-gray-500 dark:text-gray-400',
      iconBgColor: 'bg-red-100 dark:bg-red-800',
      iconColor: 'text-red-500 dark:text-red-200',
      icon: 'mdi:close-circle'
    },
    warning: {
      bgColor: 'bg-white dark:bg-gray-800',
      borderColor: 'border-l-4 border-yellow-500',
      textColor: 'text-gray-500 dark:text-gray-400',
      iconBgColor: 'bg-yellow-100 dark:bg-yellow-800',
      iconColor: 'text-yellow-500 dark:text-yellow-200', 
      icon: 'mdi:alert-circle'
    },
    info: {
      bgColor: 'bg-white dark:bg-gray-800',
      borderColor: 'border-l-4 border-blue-500',
      textColor: 'text-gray-500 dark:text-gray-400',
      iconBgColor: 'bg-blue-100 dark:bg-blue-800',
      iconColor: 'text-blue-500 dark:text-blue-200', 
      icon: 'mdi:information-circle'
    }
  };

  const config = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      className={`
        flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow-sm
        transform transition-all duration-200 ease-in-out
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        ${isRemoving ? 'translate-x-full opacity-0 scale-95' : ''}
      `}
      role="alert"
    >
      {/* Toast Icon */}
      <div className={`inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg ${config.iconBgColor} ${config.iconColor}`}>
        <Icon icon={config.icon} className="w-5 h-5" />
      </div>
      
      {/* Toast Content */}
      <div className="ms-3 text-sm font-normal flex-1">
        {typeof toast.message === 'string' ? (
          <span>{toast.message}</span>
        ) : (
          toast.message
        )}
        {toast.title && (
          <div className="font-semibold">{toast.title}</div>
        )}
      </div>
      
      {/* Close Button */}
      <button
        type="button"
        className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
        onClick={handleRemove}
        aria-label="Close"
      >
        <Icon icon="mdi:close" className="w-3 h-3" />
      </button>
    </div>
  );
};

export default ToastItem;