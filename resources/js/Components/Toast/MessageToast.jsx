import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { router } from '@inertiajs/react';

const MessageToast = ({ toast, onRemove }) => {
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

  const handleReply = () => {
    if (toast.data?.group_id) {
      // Navigate to group chat using the correct route
      router.visit(`/group/${toast.data.group_id}`);
    } else if (toast.data?.user?.id) {
      // Navigate to user chat using the correct route
      router.visit(`/user/${toast.data.user.id}`);
    }
    handleRemove();
  };

  // Get user avatar or fallback
  const getAvatarSrc = () => {
    if (toast.data?.user?.avatar) {
      return toast.data.user.avatar;
    }
    // Fallback to a default avatar or generate one based on name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(toast.data?.user?.name || 'User')}&color=7F9CF5&background=EBF4FF`;
  };

  const getUserName = () => {
    return toast.data?.user?.name || 'Unknown User';
  };

  const getMessage = () => {
    return toast.data?.message || 'Sent a message';
  };

  const isGroupMessage = () => {
    return toast.data?.group_id;
  };

  return (
    <div
      className={`
        w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:bg-gray-800 dark:text-gray-400
        transform transition-all duration-200 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        ${isRemoving ? 'translate-x-full opacity-0 scale-95' : ''}
      `}
      role="alert"
    >
      <div className="flex">
        {/* User Avatar */}
        <img 
          className="w-8 h-8 rounded-full object-cover" 
          src={getAvatarSrc()} 
          alt={`${getUserName()} avatar`}
          onError={(e) => {
            // Fallback if image fails to load
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName())}&color=7F9CF5&background=EBF4FF`;
          }}
        />
        
        {/* Message Content */}
        <div className="ms-3 text-sm font-normal flex-1 min-w-0">
          <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white block truncate">
            {getUserName()}
            {isGroupMessage() && (
              <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                in group
              </span>
            )}
          </span>
          <div className="mb-2 text-sm font-normal break-words">
            <div className="line-clamp-2">
              {getMessage()}
            </div>
          </div>
          <button 
            onClick={handleReply}
            className="inline-flex px-2.5 py-1.5 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 transition-colors duration-150"
          >
            Reply
          </button>
        </div>
        
        {/* Close Button */}
        <button 
          type="button" 
          className="ms-auto -mx-1.5 -my-1.5 bg-white justify-center items-center shrink-0 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
          onClick={handleRemove}
          aria-label="Close"
        >
          <Icon icon="mdi:close" className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default MessageToast;