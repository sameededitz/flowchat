import ConversationItem from '@/Components/Chat/ConversationItem';
import Iconify from '@/Components/Iconify';
import TextInput from '@/Components/TextInput';
import { usePage } from '@inertiajs/react'
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem, Tooltip } from "flowbite-react";
import React, { useEffect, useState } from 'react'

const ChatLayout = ({ user, children }) => {
    const page = usePage();

    const conversations = page.props.conversations;
    const selectedConversation = page.props.selectedConversation;
    const [localConversations, setLocalConversations] = useState(null);
    const [sortedConversations, setSortedConversations] = useState({});

    const [onlineUsers, setOnlineUsers] = useState({});

    const isUserOnline = (userId) => !!onlineUsers[userId];

    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setLocalConversations(
            conversations.filter((conversation) => {
                return conversation.name?.toLowerCase().includes(searchTerm);
            })
        );
    };

    useEffect(() => {
        setSortedConversations(
            localConversations?.sort((a, b) => {
                if (a.blocked_at && b.blocked_at) {
                    return a.blocked_at > b.blocked_at ? 1 : -1;
                } else if (a.blocked_at) {
                    return 1;
                } else if (b.blocked_at) {
                    return -1;
                }

                if (a.last_message_date && b.last_message_date) {
                    return b.last_message_date.localeCompare(a.last_message_date);
                } else if (a.last_message_date) {
                    return -1;
                } else if (b.last_message_date) {
                    return 1;
                } else {
                    return 0;
                }
            })
        );
    }, [localConversations]);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        Echo.join('online')
            .here((users) => {
                setOnlineUsers(users.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {}));
            })
            .joining((user) => {
                setOnlineUsers((prev) => ({ ...prev, [user.id]: user }));
            })
            .leaving((user) => {
                setOnlineUsers((prev) => {
                    const newState = { ...prev };
                    delete newState[user.id];
                    return newState;
                });
            });

        return () => {
            Echo.leave('online');
        }
    }, []);

    return (
        <>
            <nav className=" z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start rtl:justify-end">
                            <a href="https://flowbite.com" className="flex ms-2 md:me-24">
                                <img src="https://flowbite.com/docs/images/logo.svg" className="h-8 me-3" alt="FlowBite Logo" />
                                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">Flowbite</span>
                            </a>
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center ms-3">
                                <Dropdown
                                    arrowIcon={false}
                                    inline={true}
                                    label={
                                        <div className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">
                                            <span className="sr-only">Open user menu</span>
                                            <img className="w-8 h-8 rounded-full" src="https://flowbite.com/docs/images/people/profile-picture-5.jpg" alt="user photo" />
                                        </div>
                                    }
                                >
                                    <DropdownHeader>
                                        <span className="block text-sm">Neil Sims</span>
                                        <span className="block truncate text-sm font-medium">neil.sims@flowbite.com</span>
                                    </DropdownHeader>
                                    <DropdownItem>
                                        <Iconify icon="mdi:home" className="w-4 h-4 me-2" />
                                        Dashboard
                                    </DropdownItem>
                                    <DropdownDivider />
                                    <DropdownItem>
                                        <Iconify icon="mdi:settings" className="w-4 h-4 me-2" />
                                        Logout
                                    </DropdownItem>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </div>
            </nav >

            <div className="flex-1 w-full flex overflow-hidden bg-white text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 h-screen">
                <div
                    className={`transition-all w-full sm:w-[220px] md:w-[300px] bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedConversation ? 'hidden sm:block' : 'block'}`}
                >
                    <div className='flex items-center justify-between py-2 px-3 text-xl font-medium'>
                        <span>Conversations</span>
                        <Tooltip content="New Conversation">
                            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                <Iconify icon="mdi:plus" className="w-6 h-6" />
                            </button>
                        </Tooltip>
                    </div>
                    <div className='px-2 py-2'>
                        <TextInput onKeyUp={handleSearch} placeholder="Search conversations..." className="w-full" />
                    </div>
                    <div className='flex-1 overflow-y-auto px-1'>
                        {sortedConversations?.length > 0 ? (
                            sortedConversations.map((conversation) => (
                                <ConversationItem
                                    key={`${conversation.is_group
                                        ? "group_" + conversation.id
                                        : "user_" + conversation.id
                                        }`}
                                    conversation={conversation}
                                    online={!!isUserOnline(conversation.is_group ? null : conversation.id)}
                                    selectedConversation={selectedConversation}
                                />
                            ))
                        ) : (
                            <div className='p-3 text-md text-center text-gray-500'>No conversations found.</div>
                        )}
                    </div>
                </div>
                <div className='flex flex-1 flex-col overflow-hidden'>
                    {children}
                </div>
            </div>
        </>
    )
}

export default ChatLayout