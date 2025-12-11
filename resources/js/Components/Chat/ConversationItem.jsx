import { router, usePage } from '@inertiajs/react';
import React from 'react'
import UserAvatar from './UserAvatar';
import GroupAvatar from './GroupAvatar';
import UserOptions from './UserOptions';
import { formatMessageDateLong } from '@/Helpers/Date';

const ConversationItem = ({ conversation, online, selectedConversation = null }) => {
  const page = usePage();
  const user = page.props.auth.user;

  const isSelected =
    selectedConversation &&
    ((!selectedConversation.is_group && !conversation.is_group && selectedConversation.id === conversation.id) ||
      (selectedConversation.is_group && conversation.is_group && selectedConversation.id === conversation.id));

  const handleClick = () => {
    // Show info message if blocked
    if (conversation.i_blocked || conversation.blocked_me) {
      // Still allow navigation but user will see the blocked state
    }
    
    if (conversation.is_group) {
      router.visit(route('chat.group', conversation.id), { preserveState: true });
    } else {
      router.visit(route('chat.user', conversation.id), { preserveState: true });
    }
  };

  const isBlocked = conversation.i_blocked || conversation.blocked_me;

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-gray-800 dark:text-gray-300 border-l-4 ${conversation.is_user && user._is_admin ? 'pr-2' : 'pr-4'} ${isSelected ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'}`}
    >
      <div className={isBlocked ? 'opacity-60' : ''}>
        {conversation.is_user && (
          <UserAvatar user={conversation} online={online} />
        )}
        {conversation.is_group && <GroupAvatar group={conversation} />}
      </div>
      <div className={`flex-1 text-xs max-w-full overflow-hidden ${isBlocked ? 'opacity-60' : ''}`}>
        <div className='flex gap-1 justify-between items-center'>
          <h3 className='text-sm font-semibold overflow-hidden text-nowrap text-ellipsis'>
            {conversation.name}
            {Boolean(isBlocked) && (
              <span className='ml-2 text-xs text-red-500 dark:text-red-400'>
                {conversation.i_blocked ? '(Blocked)' : '(Blocked You)'}
              </span>
            )}
          </h3>
          {conversation.last_message_date && (
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              {formatMessageDateLong(conversation.last_message_date)}
            </span>
          )}
        </div>
        {conversation.last_message && (
          <p className='text-xs text-gray-500 dark:text-gray-400 overflow-hidden text-nowrap text-ellipsis'>
            {conversation.last_message}
          </p>
        )}
      </div>
      <UserOptions conversation={conversation} />
    </div>
  )
}

export default ConversationItem