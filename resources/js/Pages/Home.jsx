import ConversationHeader from '@/Components/Chat/ConversationHeader'
import MessageInput from '@/Components/Chat/MessageInput'
import MessageItem from '@/Components/Chat/MessageItem'
import Iconify from '@/Components/Iconify'
import ChatLayout from '@/Layouts/ChatLayout'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

function Home({ messages, selectedConversation }) {
    console.log('messages', messages);

    const [localMessages, setLocalMessages] = useState([])

    const messagesCtrRef = useRef(null);

    useLayoutEffect(() => {
        const el = messagesCtrRef.current;
        if (el) {
            // Delay scroll to ensure messages are rendered
            setTimeout(() => {
                el.scrollTop = el.scrollHeight;
            }, 50); // You can try 0, 50 or 100ms depending on render time
        }
    }, [localMessages, selectedConversation]);

    useEffect(() => {
        if (messages) {
            setLocalMessages(messages?.data.reverse() || []);
        }
    }, [messages])

    return (
        <>
            {!messages && (
                <div className="flex flex-col items-center justify-center h-full opacity-35">
                    <div className="text-2xl font-bold text-gray-500 dark:text-gray-300">
                        Please select a conversation from the left sidebar to see the messages.
                    </div>
                    <Iconify icon="mdi:message-outline" className="mt-4 h-12 w-12 text-gray-400" />
                </div>
            )}

            {messages && (
                <div className="flex flex-col flex-1 min-h-0">
                    <ConversationHeader selectedConversation={selectedConversation} />

                    {/* scrollable messages container */}
                    <div ref={messagesCtrRef} className="flex-1 overflow-y-auto p-5">
                        {localMessages.length > 0 ? (
                            localMessages.map((message) => (
                                <MessageItem key={message.id} message={message} />
                            ))
                        ) : (
                            <div className="text-center text-gray-500">No messages yet.</div>
                        )}
                    </div>

                    {/* message input bar fixed below */}
                    <div className="shrink-0 border-t border-gray-200 dark:border-gray-700">
                        <MessageInput conversation={selectedConversation} />
                    </div>
                </div>
            )}

        </>
    )
}

Home.layout = (page) => <ChatLayout children={page} />

export default Home