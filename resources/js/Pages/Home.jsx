import ConversationHeader from '@/Components/Chat/ConversationHeader'
import MessageInput from '@/Components/Chat/MessageInput'
import MessageItem from '@/Components/Chat/MessageItem'
import Iconify from '@/Components/Iconify'
import ChatLayout from '@/Layouts/ChatLayout'
import React, { useEffect, useRef, useState } from 'react'

function Home({ messages, selectedConversation }) {
    console.log('messages', messages);

    const [localMessages, setLocalMessages] = useState([])

    const messagesCtrRef = useRef(null);

    useEffect(() => {
        if (messages) {
            setLocalMessages(messages?.data.reverse() || []);
        }
    }, [messages])

    return (
        <>
            {!messages && (
                <div className="flex flex-col items-center justify-center h-full opacity-35">
                    <div className='text-2xl font-bold text-gray-500 dark:text-gray-300'>
                        Please select a conversation from the left sidebar to see the messages.
                    </div>
                    <Iconify icon="mdi:message-outline" className="mt-4 h-12 w-12 text-gray-400" />
                </div>
            )}
            {messages && (
                <>
                    <ConversationHeader selectedConversation={selectedConversation} />
                    <div ref={messagesCtrRef} className='flex-1 overflow-y-auto p-5'>
                        {localMessages.length > 0 ? (
                            localMessages.map((message) => (
                                <MessageItem key={message.id} message={message} />
                            ))
                        ) : (
                            <div className='text-center text-gray-500'>No messages yet.</div>
                        )}
                    </div>
                    <MessageInput conversation={selectedConversation} />
                </>
            )}
        </>
    )
}

Home.layout = (page) => <ChatLayout children={page} />

export default Home