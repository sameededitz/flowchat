import { useEffect, useRef, useState } from 'react'
import Iconify from '../Iconify';
import TextMessage from './TextMessage';
import { Button } from 'flowbite-react';
import axios from 'axios';

const MessageInput = ({ conversation = null }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onSendClick = async () => {
    if (isSending) return; // prevent double sends

    if (!message.trim()) {
      setError("Please enter a message or select a file before sending.");
      timeoutRef.current = setTimeout(() => setError(null), 3000);
      return;
    }

    const data = new FormData();
    data.append('message', message);
    if (conversation.is_user) {
      data.append('receiver_id', conversation.id);
    } else if (conversation.is_group) {
      data.append('group_id', conversation.id);
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await axios.post(route('message.store'), data, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log("Message sent successfully:", response.data);
      setMessage('');
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (message.trim()) {
      setError(null);
    }
  }, [message]);

  return (
    <div className='flex flex-wrap items-start border-t border-gray-200 dark:border-gray-700 py-1'>
      <div className='order-2 flex-1 xs:flex-none xs:order-1 p-2'>
        <button
          className='p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors relative'
          disabled={isSending}
        >
          <Iconify icon='ic:round-attach-file' className='text-base' />
          <input type="file" multiple className='absolute inset-0 w-full h-full opacity-0 cursor-pointer' />
        </button>
        <button className='p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors relative'>
          <Iconify icon='ic:round-add-photo-alternate' className='text-lg' />
          <input type="file" accept="image/*" multiple className='absolute inset-0 w-full h-full opacity-0 cursor-pointer' />
        </button>
      </div>
      <div className='flex-1 order-1 xs:order-2 px-3 xs:px-0 relative min-w-[220px] basis-full xs:basis-0 py-2'>
        <div className='flex'>
          <TextMessage
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError("");
            }}
            onSend={onSendClick}
          />
          <Button size='sm' onClickCapture={onSendClick} className="rounded-s-none bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800">
            {isSending ? (
              <>
                <Iconify icon='fluent:spinner-ios-16-regular' className='animate-spin' />
                <span className='hidden sm:inline'>Loading</span>
              </>
            ) : (
              <>
                <Iconify icon='ic:round-send' className='w-6' />
                <span className='hidden sm:inline'>Send</span>
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className='text-red-500 text-sm mt-1'>
            {error}
          </div>
        )}
      </div>
      <div className='flex order-3 xs:order-3 p-2'>
        <button className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
          <Iconify icon='ic:round-mic' className='w-6' />
        </button>
        <button className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
          <Iconify icon='ic:round-mood' className='w-6' />
        </button>
      </div>
    </div>
  )
}

export default MessageInput