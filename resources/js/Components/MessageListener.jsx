import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useEventBus } from '@/EventBus';

const MessageListener = () => {
    const { props, url } = usePage();
    const user = props.auth.user;
    const conversations = props.conversations;
    const { emit } = useEventBus();

    // Check if user is currently in the chat for this message
    const isCurrentlyInChat = (messageData) => {
        const currentUrl = url;
        
        if (messageData.group_id) {
            // Check if currently viewing this specific group chat
            const groupPattern = `/group/${messageData.group_id}`;
            return currentUrl === groupPattern || currentUrl.startsWith(groupPattern + '?');
        } else if (messageData.sender?.id) {
            // Check if currently viewing this specific user chat
            const userPattern = `/user/${messageData.sender.id}`;
            return currentUrl === userPattern || currentUrl.startsWith(userPattern + '?');
        } else if (messageData.user?.id) {
            // Fallback check with user field
            const userPattern = `/user/${messageData.user.id}`;
            return currentUrl === userPattern || currentUrl.startsWith(userPattern + '?');
        }
        
        return false;
    };

    useEffect(() => {
        if (!conversations || !user) return;

        const messageChannels = [];

        // Listen to all conversation channels in one place
        conversations.forEach(conversation => {
            let channelName;
            let channel;
            
            if (conversation.is_group) {
                channelName = `message.group.${conversation.id}`;
                channel = Echo.private(channelName)
                    .listen('SocketMessage', (e) => {
                        const messageData = e.message?.data || e.message || e.data;
                        
                        // Emit events for different components to handle
                        emit('message.received', {
                            message: messageData,
                            conversationId: conversation.id,
                            isGroup: true
                        });

                        // Emit notification if it's from another user AND not currently in this chat
                        if (messageData.sender_id !== user.id) {
                            const notificationData = {
                                user: messageData.sender,
                                group_id: messageData.group_id,
                                message: messageData.message?.length > 50
                                    ? messageData.message.substring(0, 47) + '...'
                                    : messageData.message || 'Shared a message'
                            };

                            // Only emit notification if user is not currently in this chat
                            if (!isCurrentlyInChat(notificationData)) {
                                emit('newMessageNotification', notificationData);
                            }
                        }
                    });
            } else {
                channelName = `message.user.${[parseInt(user.id), parseInt(conversation.id)].sort((a, b) => a - b).join('-')}`;
                channel = Echo.private(channelName)
                    .listen('SocketMessage', (e) => {
                        const messageData = e.message?.data || e.message || e.data;
                        
                        // Emit events for different components to handle
                        emit('message.received', {
                            message: messageData,
                            conversationId: conversation.id,
                            isGroup: false
                        });

                        // Emit notification if it's from another user AND not currently in this chat
                        if (messageData.sender_id !== user.id) {
                            const notificationData = {
                                user: messageData.sender,
                                message: messageData.message?.length > 50
                                    ? messageData.message.substring(0, 47) + '...'
                                    : messageData.message || 'Shared a message'
                            };

                            // Only emit notification if user is not currently in this chat
                            if (!isCurrentlyInChat(notificationData)) {
                                emit('newMessageNotification', notificationData);
                            }
                        }
                    });
            }
            
            messageChannels.push({ channelName, channel });
        });

        // Cleanup function
        return () => {
            messageChannels.forEach(({ channelName }) => {
                Echo.leave(channelName);
            });
        };
    }, [conversations, user, emit, url]); // Include url to re-evaluate when route changes

    // This component doesn't render anything
    return null;
};

export default MessageListener;
