import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useEventBus } from '@/EventBus';

const MessageListener = () => {
    const { props } = usePage();
    const user = props.auth.user;
    const conversations = props.conversations;
    const { emit } = useEventBus();

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

                        // Emit notification if it's from another user
                        if (messageData.sender_id !== user.id) {
                            emit('newMessageNotification', {
                                user: messageData.sender,
                                group_id: messageData.group_id,
                                message: messageData.message?.length > 50
                                    ? messageData.message.substring(0, 47) + '...'
                                    : messageData.message || 'Shared a message'
                            });
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

                        // Emit notification if it's from another user
                        if (messageData.sender_id !== user.id) {
                            emit('newMessageNotification', {
                                user: messageData.sender,
                                message: messageData.message?.length > 50
                                    ? messageData.message.substring(0, 47) + '...'
                                    : messageData.message || 'Shared a message'
                            });
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
    }, [conversations, user, emit]);

    // This component doesn't render anything
    return null;
};

export default MessageListener;
