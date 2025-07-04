import { usePage } from '@inertiajs/react';
import React from 'react';
import UserAvatar from './UserAvatar';
import { formatMessageDateLong } from '@/Helpers/Date';

const MessageItem = ({ message }) => {
  const user = usePage().props.auth.user;
  const isSender = message.sender.id === user.id;

  return (
    <div className={`flex items-start gap-2.5 ${isSender ? 'flex-row-reverse' : ''}`}>
      <UserAvatar user={message.sender} />

      <div className={`flex flex-col gap-1 w-full max-w-[320px] ${isSender ? 'items-end' : ''}`}>
        {/* Name + Time */}
        <div className={`flex items-center ${isSender ? 'flex-row-reverse gap-2' : 'gap-2'}`}>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {isSender ? 'You' : message.sender.name}
          </span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {formatMessageDateLong(message.created_at)}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`flex flex-col leading-1.5 p-4 border border-gray-200 dark:border-gray-600 ${
            isSender
              ? 'bg-blue-100 dark:bg-blue-700 rounded-l-xl rounded-br-xl'
              : 'bg-gray-100 dark:bg-gray-700 rounded-r-xl rounded-bl-xl'
          }`}
        >
          <p className="text-sm font-normal text-gray-900 dark:text-white">
            {message.message}
          </p>
        </div>

        {/* Status */}
        <span
          className={`text-sm font-normal capitalize text-gray-500 dark:text-gray-400 ${
            isSender ? 'text-right' : ''
          }`}
        >
          {message.status}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;
