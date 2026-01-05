import { usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import UserAvatar from './UserAvatar';
import MessageAttachments from './MessageAttachments';
import MessageActions from './MessageActions';
import { formatMessageDateLong } from '@/Helpers/Date';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const MessageItem = ({ message, onEditMessage, isGroup = false }) => {
  const user = usePage().props.auth.user;
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Safety check for sender
  if (!message.sender) {
    console.warn('Message sender is undefined:', message);
    return null; // or return a loading/error state
  }

  const isSender = message.sender.id === user.id;  // Extract text content from React elements
  const extractTextContent = (element) => {
    if (typeof element === 'string') {
      return element;
    }
    if (typeof element === 'number') {
      return element.toString();
    }
    if (Array.isArray(element)) {
      return element.map(extractTextContent).join('');
    }
    if (element && typeof element === 'object' && element.props) {
      if (element.props.children) {
        return extractTextContent(element.props.children);
      }
    }
    return '';
  };

  // Copy code function with fallback for HTTP
  const copyCode = async (text, index) => {
    try {
      // First try modern clipboard API (works on HTTPS and localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP domains using legacy method
        // Note: execCommand is deprecated but still the only option for HTTP
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        // @ts-ignore - execCommand is deprecated but necessary for HTTP fallback
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('Copy operation failed');
        }
      }

      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      // Provide user feedback
      alert('Copy failed. Please select and copy the code manually.');
    }
  };

  return (
    <div className={`group flex items-start gap-2.5 mb-4 ${isSender ? 'flex-row-reverse' : ''}`}>
      {/* Only show avatar for group conversations */}
      {isGroup && (
        <div className="flex-shrink-0">
          <UserAvatar user={message.sender} size="w-8 h-8" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl ${isSender ? 'items-end' : 'items-start'}`}>
        {/* Name + Time + Actions */}
        <div className={`flex items-center ${isSender ? 'flex-row-reverse gap-2' : 'gap-2'}`}>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {isSender ? 'You' : message.sender.name}
          </span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {formatMessageDateLong(message.created_at)}
          </span>
          <MessageActions 
            message={message} 
            isOwn={isSender}
            onEdit={onEditMessage}
          />
        </div>

        {/* Message Bubble */}
        <div
          className={`flex flex-col leading-1.5 p-4 border border-gray-200 dark:border-gray-600 w-full ${isSender
              ? 'bg-teal-100 dark:bg-teal-600 rounded-l-xl rounded-br-xl'
              : 'bg-gray-100 dark:bg-gray-700 rounded-r-xl rounded-bl-xl'
            }`}
        >
          <div className="text-sm font-normal text-gray-900 dark:text-white break-words message-content">
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Remove default paragraph margins for better chat layout
                p: ({ children }) => <span>{children}</span>,
                // Style other markdown elements
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children, ...props }) => {
                  const codeText = extractTextContent(children);
                  const blockIndex = Math.random().toString(36).substr(2, 9);
                  const isCopied = copiedIndex === blockIndex;

                  return (
                    <div className="relative group">
                      <pre className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded mt-2 mb-2 overflow-x-auto text-xs font-mono pr-12" {...props}>
                        {children}
                      </pre>
                      <button
                        onClick={() => copyCode(codeText, blockIndex)}
                        className={`absolute top-2 right-2 p-1.5 rounded text-xs transition-all ${isCopied
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-gray-200 opacity-0 group-hover:opacity-100'
                          }`}
                      >
                        {isCopied ? '✓' : '📋'}
                      </button>
                      {isCopied && (
                        <span className="absolute top-2 right-12 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Copied!
                        </span>
                      )}
                    </div>
                  );
                },
                // Handle line breaks
                br: () => <br />,
                // Table components
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="border-collapse border border-gray-400 dark:border-gray-500 text-xs min-w-full">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-300 dark:bg-gray-800">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody>
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-400 dark:border-gray-500 px-2 py-1 font-semibold text-left text-gray-900 dark:text-gray-100">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-400 dark:border-gray-500 px-2 py-1 text-gray-900 dark:text-gray-100">
                    {children}
                  </td>
                )
              }}
            >
              {message.message}
            </Markdown>
            
            {/* Render attachments */}
            <MessageAttachments attachments={message.attachments} isOwn={isSender} />
          </div>
        </div>

        {/* Status */}
        <span
          className={`text-sm font-normal capitalize text-gray-500 dark:text-gray-400 ${isSender ? 'text-right' : ''
            }`}
        >
          {message.status}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;
