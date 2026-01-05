import { Avatar } from 'flowbite-react'
import React from 'react'

const GroupAvatar = ({ group, size = 'md', showRemove = false, onRemove = null }) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8', 
    md: 'w-10 h-10',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  const getGroupAvatar = () => {
    if (group?.avatar) {
      return group.avatar;
    }
    
    // Generate a placeholder based on group name
    const name = group?.name || 'Group';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=ffffff&size=200`;
  };

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden`}>
      <Avatar 
        img={getGroupAvatar()}
        rounded 
        className="w-full h-full"
      />
      {showRemove && group?.avatar && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
          title="Remove avatar"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default GroupAvatar