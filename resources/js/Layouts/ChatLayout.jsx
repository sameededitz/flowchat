import ConversationItem from '@/Components/Chat/ConversationItem';
import Iconify from '@/Components/Iconify';
import TextInput from '@/Components/TextInput';
import MessageListener from '@/Components/MessageListener';
import NewConversationModal from '@/Components/Chat/NewConversationModal';
import { Link, usePage } from '@inertiajs/react'
import { Dropdown, DropdownDivider, DropdownItem, Tooltip } from "flowbite-react";
import React, { useEffect, useState } from 'react'
import { useEventBus } from '@/EventBus';
import UserAvatar from '@/Components/Chat/UserAvatar';

const ChatLayout = ({ children }) => {
    const page = usePage();
    const { on } = useEventBus();

    const user = page.props.auth.user;
    const conversations = page.props.conversations;
    const selectedConversation = page.props.selectedConversation;
    const [localConversations, setLocalConversations] = useState(null);
    const [sortedConversations, setSortedConversations] = useState({});
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);

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
            localConversations ? [...localConversations].sort((a, b) => {
                if (a.blocked_at && b.blocked_at) {
                    return a.blocked_at > b.blocked_at ? 1 : -1;
                } else if (a.blocked_at) {
                    return 1;
                } else if (b.blocked_at) {
                    return -1;
                }

                // Use last_message_date if available, otherwise fall back to created_at
                const aDate = a.last_message_date || a.created_at;
                const bDate = b.last_message_date || b.created_at;

                if (aDate && bDate) {
                    return bDate.localeCompare(aDate);
                } else if (aDate) {
                    return -1;
                } else if (bDate) {
                    return 1;
                } else {
                    return 0;
                }
            }) : []
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

    // Listen for message events via EventBus
    useEffect(() => {
        const unsubscribeReceived = on('message.received', ({ message, conversationId, isGroup }) => {
            updateConversationWithNewMessage(conversationId, message, isGroup);
        });

        const unsubscribeUpdated = on('message.updated', ({ message, conversationId, isGroup }) => {
            updateConversationWithNewMessage(conversationId, message, isGroup);
        });

        const unsubscribeDeleted = on('message.deleted', ({ messageId, conversationId, isGroup, newLastMessage }) => {
            if (newLastMessage) {
                updateConversationWithNewMessage(conversationId, newLastMessage, isGroup);
            } else {
                // No messages left, clear the last message
                setLocalConversations(prevConversations => {
                    return prevConversations.map(conv => {
                        if ((isGroup && conv.is_group && conv.id === conversationId) ||
                            (!isGroup && !conv.is_group && conv.id === conversationId)) {
                            return {
                                ...conv,
                                last_message: null,
                                last_message_date: null
                            };
                        }
                        return conv;
                    });
                });
            }
        });

        const unsubscribeGroupDeleting = on('group.deleting', ({ groupId, is_deleting }) => {
            setLocalConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv.is_group && conv.id === groupId) {
                        return {
                            ...conv,
                            is_deleting: is_deleting
                        };
                    }
                    return conv;
                });
            });
        });

        const unsubscribeGroupDeleted = on('group.deleted', ({ groupId }) => {
            // Remove the group from conversations
            setLocalConversations(prevConversations => {
                return prevConversations.filter(conv => {
                    return !(conv.is_group && conv.id === groupId);
                });
            });
        });

        const unsubscribeGroupCreated = on('group.created', ({ group }) => {
            // Add new group to conversations at the top
            setLocalConversations(prevConversations => {
                // Check if group already exists
                const exists = prevConversations.some(conv => conv.is_group && conv.id === group.id);
                if (exists) return prevConversations;
                
                // Add new group at the beginning
                return [group, ...prevConversations];
            });
        });

        const unsubscribeBlockStatus = on('user.block.status', ({ blockerId, blockedId, isBlocked }) => {
            // Update blocking status in conversations
            setLocalConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (!conv.is_group && conv.is_user) {
                        // Check if this conversation involves the blocked/unblocked user
                        if (conv.id === blockedId || conv.id === blockerId) {
                            // If current user is the blocker
                            if (blockerId === user.id && conv.id === blockedId) {
                                return {
                                    ...conv,
                                    i_blocked: isBlocked
                                };
                            }
                            // If current user is the blocked one
                            if (blockedId === user.id && conv.id === blockerId) {
                                return {
                                    ...conv,
                                    blocked_me: isBlocked
                                };
                            }
                        }
                    }
                    return conv;
                });
            });
        });

        return () => {
            unsubscribeReceived();
            unsubscribeUpdated();
            unsubscribeDeleted();
            unsubscribeGroupDeleting();
            unsubscribeGroupDeleted();
            unsubscribeGroupCreated();
            unsubscribeBlockStatus();
        };
    }, [on, user.id]);

    const updateConversationWithNewMessage = (conversationId, message, isGroup) => {
        setLocalConversations(prevConversations => {
            const updated = prevConversations.map(conv => {
                if ((isGroup && conv.is_group && conv.id === conversationId) ||
                    (!isGroup && !conv.is_group && conv.id === conversationId)) {
                    return {
                        ...conv,
                        last_message: message.message,
                        last_message_date: message.created_at
                    };
                }
                return conv;
            });
            return updated;
        });
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            {/* Global Message Listener */}
            <MessageListener />
            
            {/* New Conversation Modal */}
            <NewConversationModal 
                show={showNewConversationModal} 
                onClose={() => setShowNewConversationModal(false)} 
            />
            
            {/* Navbar */}
            <nav className="w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start rtl:justify-end">
                            <Link href={route('home')} className="flex ms-2 md:me-24">
                                <img
                                    src="https://flowbite.com/docs/images/logo.svg"
                                    className="h-8 me-3"
                                    alt="FlowBite Logo"
                                />
                                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                                    FlowChat
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center ms-3">
                                <Dropdown arrowIcon={false} inline={true} label={
                                    <div className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">
                                        <span className="sr-only">Open user menu</span>
                                        <UserAvatar user={user} profile={false} />
                                    </div>
                                }>
                                    <DropdownItem>
                                        <Iconify icon="mdi:home" className="w-4 h-4 me-2" />
                                        Dashboard
                                    </DropdownItem>
                                    <DropdownDivider />
                                    <DropdownItem>
                                        <Link
                                            href={route('logout')} 
                                            method="post"
                                            className="flex items-center w-full"
                                        >
                                            <Iconify icon="mdi:logout" className="w-4 h-4 me-2" />
                                            Logout
                                        </Link>
                                    </DropdownItem>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Chat Layout */}
            <div className="flex-1 w-full flex overflow-hidden bg-white text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700">
                {/* Sidebar */}
                <div
                    className={`transition-all w-full sm:w-[280px] md:w-[320px] lg:w-[360px] bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedConversation ? 'hidden sm:flex' : 'flex'}`}
                >
                    <div className="flex items-center justify-between py-2 px-3 text-xl font-medium">
                        <span>Conversations</span>
                        <Tooltip content="New Conversation or Group">
                            <button 
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                onClick={() => setShowNewConversationModal(true)}
                            >
                                <Iconify icon="mdi:plus" className="w-6 h-6" />
                            </button>
                        </Tooltip>
                    </div>
                    <div className="px-2 py-2">
                        <TextInput onKeyUp={handleSearch} placeholder="Search conversations..." className="w-full" />
                    </div>
                    <div className="flex-1 overflow-y-auto px-1">
                        {sortedConversations?.length > 0 ? (
                            sortedConversations.map((conversation) => (
                                <ConversationItem
                                    key={`${conversation.is_group ? "group_" + conversation.id : "user_" + conversation.id}`}
                                    conversation={conversation}
                                    online={!!isUserOnline(conversation.is_group ? null : conversation.id)}
                                    selectedConversation={selectedConversation}
                                />
                            ))
                        ) : (
                            <div className="p-3 text-md text-center text-gray-500">No conversations found.</div>
                        )}
                    </div>
                </div>

                {/* Messages and other content */}
                <div className={`flex-1 flex flex-col min-h-0 ${!selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default ChatLayout