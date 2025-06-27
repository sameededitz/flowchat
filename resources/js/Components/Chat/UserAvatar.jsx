import { Avatar } from 'flowbite-react'
import React from 'react'

const UserAvatar = ({ user, online = null, profile = false }) => {
  let onlineStatus = online === true ? 'online' : online === false ? 'offline' : '';

  const size = profile ? 'w-40' : 'w-8';
  return (
    <>
      {user.avatar_url ? (
        <Avatar rounded img={user.avatar_url} alt={user.name} status={onlineStatus} statusPosition="top-right" className={size} />
      ) : (
        <Avatar rounded alt={user.name} status={onlineStatus} statusPosition="top-right" placeholderInitials={user.name.substring(0,1)} className={size} />
      )}
    </>
  )
}

export default UserAvatar