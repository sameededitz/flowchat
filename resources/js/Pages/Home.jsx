import ConversationHeader from '@/Components/Chat/ConversationHeader'
import MessageInput from '@/Components/Chat/MessageInput'
import MessageItem from '@/Components/Chat/MessageItem'
import Iconify from '@/Components/Iconify'
import ChatLayout from '@/Layouts/ChatLayout'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useEventBus } from '@/EventBus'
import axios from 'axios'

function Home({ messages, selectedConversation: initialSelectedConversation }) {
    const [localMessages, setLocalMessages] = useState([])
    const [isLoadingOlder, setIsLoadingOlder] = useState(false)
    const [hasMoreMessages, setHasMoreMessages] = useState(true)
    const [editingMessage, setEditingMessage] = useState(null)
    const [selectedConversation, setSelectedConversation] = useState(initialSelectedConversation)
    const { on } = useEventBus()

    const messagesCtrRef = useRef(null);
    const shouldScrollToBottom = useRef(true);
    const lastLoadTime = useRef(0);

    // Auto scroll to bottom only for new messages
    useLayoutEffect(() => {
        const el = messagesCtrRef.current;
        if (el && shouldScrollToBottom.current) {
            // Temporarily disable smooth scrolling for immediate positioning
            el.classList.add('disable-smooth-scroll');
            
            setTimeout(() => {
                el.scrollTop = el.scrollHeight;
                
                // Re-enable smooth scrolling after positioning
                setTimeout(() => {
                    el.classList.remove('disable-smooth-scroll');
                }, 10);
            }, 50);
        }
    }, [localMessages, selectedConversation]);

    // Initialize messages and pagination state
    useEffect(() => {
        if (messages) {
            setLocalMessages(messages?.data.reverse() || []);

            const hasNext = !!(messages?.links?.next || messages?.next_page_url);

            setHasMoreMessages(hasNext);
            shouldScrollToBottom.current = true;
            setIsLoadingOlder(false);
        }
    }, [messages])

    // Update selected conversation when it changes
    useEffect(() => {
        setSelectedConversation(initialSelectedConversation);
    }, [initialSelectedConversation])

    const loadOlderMessages = async () => {
        if (isLoadingOlder || !hasMoreMessages || localMessages.length === 0) return;

        // Throttle requests - prevent loading more than once every 500ms
        const now = Date.now();
        if (now - lastLoadTime.current < 500) return;
        lastLoadTime.current = now;

        setIsLoadingOlder(true);
        shouldScrollToBottom.current = false; // Don't auto-scroll when loading older messages

        const oldestMessage = localMessages[0];

        const scrollElement = messagesCtrRef.current;
        const scrollHeightBefore = scrollElement.scrollHeight;
        const scrollTopBefore = scrollElement.scrollTop;

        try {
            const response = await axios.get(route('message.load.older', oldestMessage.id));
            const olderMessages = response.data.data || response.data;

            if (olderMessages.length > 0) {
                // Get the oldest message's timestamp for comparison
                const oldestMessageTime = new Date(oldestMessage.created_at).getTime();
                const existingIds = new Set(localMessages.map(msg => msg.id));

                // Filter out duplicates and messages that aren't actually older
                const newOlderMessages = olderMessages.filter(msg => {
                    const messageTime = new Date(msg.created_at).getTime();
                    return messageTime < oldestMessageTime && !existingIds.has(msg.id);
                });

                // If no new messages after filtering, we've reached the end
                if (newOlderMessages.length === 0) {
                    // Check server pagination status
                    const responseData = response.data;
                    const hasNext = !!(
                        responseData.links?.next ||
                        responseData.next_page_url ||
                        (responseData.meta && responseData.meta.current_page < responseData.meta.last_page)
                    );
                    setHasMoreMessages(hasNext);
                } else {
                    // Add new messages to the state
                    setLocalMessages(prevMessages => {
                        return [...newOlderMessages.reverse(), ...prevMessages];
                    });

                    // Check for more messages
                    const responseData = response.data;
                    const hasNext = !!(
                        responseData.links?.next ||
                        responseData.next_page_url ||
                        (responseData.meta && responseData.meta.current_page < responseData.meta.last_page)
                    );
                    setHasMoreMessages(hasNext);

                    // Maintain scroll position after DOM update
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            // Temporarily disable smooth scrolling for position adjustment
                            scrollElement.classList.add('disable-smooth-scroll');
                            
                            const scrollHeightAfter = scrollElement.scrollHeight;
                            const heightDifference = scrollHeightAfter - scrollHeightBefore;
                            scrollElement.scrollTop = scrollTopBefore + heightDifference;
                            
                            // Re-enable smooth scrolling after a brief delay
                            setTimeout(() => {
                                scrollElement.classList.remove('disable-smooth-scroll');
                            }, 50);
                        });
                    });
                }
            } else {
                setHasMoreMessages(false);
            }
        } catch (error) {
            console.error('Error loading older messages:', error);
            setHasMoreMessages(false);
        } finally {
            setIsLoadingOlder(false);
        }
    };

    // Handle scroll events for loading older messages
    const handleScroll = (e) => {
        const { scrollTop } = e.target;

        // Only trigger if we have more messages to load
        if (!hasMoreMessages || isLoadingOlder) return;

        // Load older messages when scrolled to top
        if (scrollTop <= 50) {
            loadOlderMessages();
        }
    };

    // Handle new messages from WebSocket
    const handleNewMessage = (newMessage) => {
        shouldScrollToBottom.current = true; // Auto-scroll for new messages
        setLocalMessages(prevMessages => {
            const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
            if (messageExists) {
                return prevMessages;
            }
            return [...prevMessages, newMessage];
        });
    };

    useEffect(() => {
        if (!selectedConversation) return;

        const unsubscribe = on('message.received', ({ message, conversationId, isGroup }) => {
            if ((isGroup && selectedConversation.is_group && conversationId === selectedConversation.id) ||
                (!isGroup && !selectedConversation.is_group && conversationId === selectedConversation.id)) {
                handleNewMessage(message);
            }
        });

        return unsubscribe;
    }, [selectedConversation, on]);

    // Handle message updates (edit)
    const handleMessageUpdate = (updatedMessage) => {
        setLocalMessages(prevMessages =>
            prevMessages.map(msg =>
                msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
            )
        );
    };

    // Handle message deletions
    const handleMessageDelete = (messageId) => {
        setLocalMessages(prevMessages =>
            prevMessages.filter(msg => msg.id !== messageId)
        );
    };

    // Listen for message updates
    useEffect(() => {
        if (!selectedConversation) return;

        const unsubscribe = on('message.updated', ({ message, conversationId, isGroup }) => {
            if ((isGroup && selectedConversation.is_group && conversationId === selectedConversation.id) ||
                (!isGroup && !selectedConversation.is_group && conversationId === selectedConversation.id)) {
                handleMessageUpdate(message);
            }
        });

        return unsubscribe;
    }, [selectedConversation, on]);

    // Listen for message deletions
    useEffect(() => {
        if (!selectedConversation) return;

        const unsubscribe = on('message.deleted', ({ messageId, conversationId, isGroup }) => {
            if ((isGroup && selectedConversation.is_group && conversationId === selectedConversation.id) ||
                (!isGroup && !selectedConversation.is_group && conversationId === selectedConversation.id)) {
                handleMessageDelete(messageId);
            }
        });

        return unsubscribe;
    }, [selectedConversation, on]);

    // Listen for block status changes
    useEffect(() => {
        if (!selectedConversation || selectedConversation.is_group) return;

        const unsubscribe = on('user.block.status', ({ blockerId, blockedId, isBlocked }) => {
            // Update selected conversation if it involves the blocked/unblocked user
            if (selectedConversation.id === blockedId || selectedConversation.id === blockerId) {
                setSelectedConversation(prev => ({
                    ...prev,
                    i_blocked: selectedConversation.id === blockedId ? isBlocked : prev.i_blocked,
                    blocked_me: selectedConversation.id === blockerId ? isBlocked : prev.blocked_me
                }));
            }
        });

        return unsubscribe;
    }, [selectedConversation, on]);

    useEffect(() => {
        if (!selectedConversation || !selectedConversation.is_group) return;

        const unsubscribe = on('group.user.left', ({ groupId, userId }) => {
            if (selectedConversation.id === groupId) {
                setSelectedConversation(prev => {
                    if (prev?.users) {
                        return {
                            ...prev,
                            users: prev.users.filter(u => u.id !== userId)
                        };
                    }
                    return prev;
                });
            }
        });

        return unsubscribe;
    }, [selectedConversation, on]);

    return (
        <>
            {!messages && (
                <div className="flex flex-col items-center justify-center h-full opacity-35 px-4">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-300 text-center">
                        Please select a conversation to see messages
                    </div>
                    <Iconify icon="mdi:message-outline" className="mt-4 h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                </div>
            )}

            {messages && (
                <div className="flex flex-col flex-1 min-h-0">
                    <ConversationHeader selectedConversation={selectedConversation} />

                    {/* scrollable messages container */}
                    <div
                        ref={messagesCtrRef}
                        className="flex-1 overflow-y-auto p-5 messages-container overflow-x-hidden"
                        onScroll={handleScroll}
                    >
                        {/* Loading indicator */}
                        {isLoadingOlder && (
                            <div className="flex justify-center py-4">
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                                    <span className="text-sm">Loading older messages...</span>
                                </div>
                            </div>
                        )}

                        {/* No more messages indicator */}
                        {!hasMoreMessages && localMessages.length > 0 && (
                            <div className="flex justify-center py-4">
                                <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                    No more messages
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {localMessages.length > 0 ? (
                            localMessages.map((message) => (
                                <MessageItem 
                                    key={message.id} 
                                    message={message}
                                    onEditMessage={(msg) => setEditingMessage(msg)}
                                    isGroup={selectedConversation?.is_group}
                                />
                            ))
                        ) : (
                            <div className="text-center text-gray-500">No messages yet.</div>
                        )}
                    </div>

                    {/* message input bar fixed below */}
                    <div className="shrink-0 border-t border-gray-200 dark:border-gray-700">
                        <MessageInput
                            conversation={selectedConversation}
                            editingMessage={editingMessage}
                            onCancelEdit={() => setEditingMessage(null)}
                        />
                    </div>
                </div>
            )}

        </>
    )
}

Home.layout = (page) => <ChatLayout children={page} />

export default Home