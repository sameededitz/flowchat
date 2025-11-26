import { Link } from '@inertiajs/react'
import React, { useState } from 'react'
import Iconify from '../Iconify'
import UserAvatar from './UserAvatar'
import GroupAvatar from './GroupAvatar'
import GroupInfoModal from './GroupInfoModal'
import { Tooltip } from 'flowbite-react'

const ConversationHeader = ({ selectedConversation }) => {
    const [showGroupInfo, setShowGroupInfo] = useState(false);

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
                    
                    {/* Group Info Button */}
                    {selectedConversation.is_group && (
                        <div className="flex items-center">
                            <Tooltip content="Group Info">
                                <button
                                    onClick={() => setShowGroupInfo(true)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Iconify icon="mdi:information" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
            )}

            {/* Group Info Modal */}
            {selectedConversation?.is_group && (
                <GroupInfoModal
                    show={showGroupInfo}
                    onClose={() => setShowGroupInfo(false)}
                    group={selectedConversation}
                />
            )}
        </>
    )
}

export default ConversationHeader