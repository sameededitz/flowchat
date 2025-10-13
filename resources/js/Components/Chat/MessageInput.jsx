import { useEffect, useRef, useState } from 'react'
import Iconify from '../Iconify';
import TextMessage from './TextMessage';
import { Button, Popover, Progress } from 'flowbite-react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ conversation = null }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const updatedFiles = [...selectedFiles].map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9), // unique ID for each file
      type: file.type.startsWith('image/') ? 'image' : 'file'
    }));
    
    setFiles((prevFiles) => [...prevFiles, ...updatedFiles]);
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    setFiles(prevFiles => {
      const fileToRemove = prevFiles.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url); // Clean up memory
      }
      return prevFiles.filter(f => f.id !== fileId);
    });
  };

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onSendClick = async () => {
    if (isSending) return; // prevent double sends

    if (!message.trim() && files.length === 0) {
      setError("Please enter a message or select a file before sending.");
      timeoutRef.current = setTimeout(() => setError(null), 3000);
      return;
    }

    const data = new FormData();

    if (files.length > 0) {
      files.forEach(({ file }, index) => {
        data.append(`attachments[${index}]`, file);
      });
    }

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
          setProgress(percentCompleted);
        }
      });

      // Clear the message input after successful send
      setMessage('');
      // Clean up file URLs
      files.forEach(({ url }) => URL.revokeObjectURL(url));
      setFiles([]);

    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (message.trim()) {
      setError(null);
    }
  }, [message]);

  const onEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
  };

  // Detect current theme from HTML element
  const getCurrentTheme = () => {
    const html = document.documentElement;
    // Check for common dark mode class names
    if (html.classList.contains('dark')) return 'dark';
    if (html.classList.contains('theme-dark')) return 'dark';
    if (html.getAttribute('data-theme') === 'dark') return 'dark';
    if (html.getAttribute('data-bs-theme') === 'dark') return 'dark';

    // Check for system preference as fallback
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';

    return 'light';
  };

  return (
    <div className='border-t border-gray-200 dark:border-gray-700'>
      {/* File Previews */}
      {files.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {files.map((fileObj) => (
              <div key={fileObj.id} className="relative group">
                {fileObj.type === 'image' ? (
                  // Image Preview
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <img 
                      src={fileObj.url} 
                      alt={fileObj.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                  </div>
                ) : (
                  // File Preview
                  <div className="w-20 h-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center p-2">
                    <Iconify icon="mdi:file-document" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center mt-1">
                      {fileObj.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Remove Button */}
                <button
                  onClick={() => removeFile(fileObj.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                  title="Remove file"
                >
                  <Iconify icon="mdi:close" className="w-4 h-4" />
                </button>
                
                {/* File Name Tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                  {fileObj.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isSending && progress > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Uploading... {progress}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {files.length > 0 && `${files.length} file${files.length > 1 ? 's' : ''}`}
            </span>
          </div>
          <Progress progress={progress} size="sm" color="blue" />
        </div>
      )}

      {/* Input Area */}
      <div className='flex flex-wrap items-start py-1'>
      <div className='order-2 flex-1 xs:flex-none xs:order-1 p-2'>
        <button
          className='p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors relative'
          disabled={isSending}
        >
          <Iconify icon='ic:round-attach-file' className='text-base' />
          <input type="file" onChange={handleFileChange} multiple className='absolute inset-0 w-full h-full opacity-0 cursor-pointer' />
        </button>
        <button className='p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors relative'>
          <Iconify icon='ic:round-add-photo-alternate' className='text-lg' />
          <input type="file" accept="image/*" onChange={handleFileChange} multiple className='absolute inset-0 w-full h-full opacity-0 cursor-pointer' />
        </button>
      </div>
      <div className='flex-1 order-1 xs:order-2 px-3 xs:px-0 relative min-w-0 basis-full xs:basis-0 py-2'>
        <div className='flex'>
          <TextMessage
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError("");
            }}
            onSend={onSendClick}
          />
          <Button size='sm' onClickCapture={onSendClick} disabled={isSending} className="rounded-s-none bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800">
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

        {/* Emoji Picker with Flowbite Popover */}
        <Popover
          trigger="click"
          placement="top"
          content={
            <div className="w-80 max-w-[90vw] max-w-sm">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={getCurrentTheme()}
                width="100%"
                height={400}
                previewConfig={{
                  showPreview: false
                }}
                searchDisabled={false}
              />
            </div>
          }
        >
          <button className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
            <Iconify icon='ic:round-mood' className='w-6' />
          </button>
        </Popover>
      </div>
    </div>
    </div>
  )
}

export default MessageInput