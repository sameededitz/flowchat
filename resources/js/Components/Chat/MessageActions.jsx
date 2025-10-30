import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useToast } from '../../Hooks/useToast';
import axios from 'axios';

const MessageActions = ({ message, isOwn, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const toast = useToast();

  // Check if message is older than 15 minutes
  const isEditableByTime = () => {
    const messageTime = new Date(message.created_at);
    const now = new Date();
    const diffInMinutes = (now - messageTime) / (1000 * 60);
    return diffInMinutes <= 15;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const copyMessage = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.message);
      } else {
        // Fallback for HTTP
        const textArea = document.createElement('textarea');
        textArea.value = message.message;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      toast.success('Message copied to clipboard!');
      setIsOpen(false);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Failed to copy message');
    }
  };

  const editMessage = () => {
    if (!isEditableByTime()) {
      toast.error('Cannot edit messages older than 15 minutes');
      setIsOpen(false);
      return;
    }
    onEdit(message);
    setIsOpen(false);
  };

  const deleteMessage = async () => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await axios.delete(route('message.destroy', message.id), {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Message deleted successfully');
        },
        onError: (errors) => {
          console.error('Delete failed:', errors);
          toast.error('Failed to delete message');
        }
      });
      setIsOpen(false);
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete message');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Three dots button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-1 rounded-lg transition-all duration-150
          ${isOpen 
            ? 'bg-gray-200 dark:bg-gray-600 opacity-100' 
            : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
        `}
        aria-label="Message actions"
      >
        <Icon icon="mdi:dots-vertical" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className={`
            absolute ${isOwn ? 'right-0' : 'left-0'} mt-2 w-48 z-50
            bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600
            py-1
          `}
        >
          {/* Copy */}
          <button
            onClick={copyMessage}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Icon icon="mdi:content-copy" className="w-4 h-4" />
            Copy Message
          </button>

          {/* Edit - only for own messages and within 15 minutes */}
          {isOwn && (
            <button
              onClick={editMessage}
              disabled={!isEditableByTime()}
              className={`
                w-full px-4 py-2 text-left text-sm flex items-center gap-2
                ${isEditableByTime() 
                  ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' 
                  : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                }
              `}
              title={!isEditableByTime() ? 'Can only edit messages within 15 minutes' : ''}
            >
              <Icon icon="mdi:pencil" className="w-4 h-4" />
              Edit Message
            </button>
          )}

          {/* Delete - only for own messages */}
          {isOwn && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
              <button
                onClick={deleteMessage}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Icon icon="mdi:delete" className="w-4 h-4" />
                Delete Message
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageActions;