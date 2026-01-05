import { Avatar } from 'flowbite-react'
import React from 'react'

const UserAvatar = ({ user, online = null, profile = false, size = null, showStatus = true }) => {
  let onlineStatus = showStatus && online !== null 
    ? (online === true ? 'online' : 'offline') 
    : '';

  // Only apply size if provided, otherwise let parent control it
  const avatarSize = size || '';
  
  return (
    <>
      {avatarSize ? (
        <div className={`${avatarSize} rounded-full overflow-hidden`}>
          {user.avatar_url ? (
            <Avatar rounded img={user.avatar_url} alt={user.name} status={onlineStatus} statusPosition="top-right" className="w-full h-full" />
          ) : (
            <Avatar rounded img={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&rounded=true&size=64`} status={onlineStatus} statusPosition="top-right" alt={user.name} placeholderInitials={user.name.substring(0,1)} className="w-full h-full" />
          )}
        </div>
      ) : (
        <>
          {user.avatar_url ? (
            <Avatar rounded img={user.avatar_url} alt={user.name} status={onlineStatus} statusPosition="top-right" className="w-full h-full" />
          ) : (
            <Avatar rounded img={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&rounded=true&size=64`} status={onlineStatus} statusPosition="top-right" alt={user.name} placeholderInitials={user.name.substring(0,1)} className="w-full h-full" />
          )}
        </>
      )}
    </>
  )
}

export default UserAvatar