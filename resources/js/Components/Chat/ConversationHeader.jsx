import { Link } from '@inertiajs/react'
import React from 'react'
import Iconify from '../Iconify'
import UserAvatar from './UserAvatar'
import GroupAvatar from './GroupAvatar'

const ConversationHeader = ({ selectedConversation }) => {
    return (
        <>
            {selectedConversation && (
                <div className='p-3 flex justify-between items-center border-b border-slate-700 dark:border-slate-600'>
                    <div className='flex items-center gap-3'>
                        <Link
                            href={route('home')}
                            className='inline-block md:hidden'
                        >
                            <Iconify icon="mdi:arrow-left" className='h-6 w-6 text-gray-500 dark:text-gray-400' />
                        </Link>
                        {selectedConversation.is_user && (
                            <UserAvatar user={selectedConversation} />
                        )}
                        {selectedConversation.is_group && <GroupAvatar />}
                        <div>
                            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                                {selectedConversation.name}
                            </h3>
                            {selectedConversation.is_group && (
                                <p className='text-sm text-gray-500 dark:text-gray-400'>{selectedConversation.users.length} members</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ConversationHeader