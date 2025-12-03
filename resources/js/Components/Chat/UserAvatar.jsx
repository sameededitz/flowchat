import { Avatar } from 'flowbite-react'
import React from 'react'

const UserAvatar = ({ user, online = null, profile = false, size = null }) => {
  let onlineStatus = online === true ? 'online' : online === false ? 'offline' : '';

  const avatarSize = size || (profile ? 'w-40 h-40' : 'w-8 h-8');
  return (
    <>
      {user.avatar_url ? (
        <Avatar rounded img={user.avatar_url} alt={user.name} status={onlineStatus} statusPosition="top-right" className={avatarSize} />
      ) : (
        <Avatar rounded img={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&rounded=true&size=64`} status={onlineStatus} statusPosition="top-right" alt={user.name} placeholderInitials={user.name.substring(0,1)} className={avatarSize} />
      )}
    </>
  )
}

export default UserAvatar