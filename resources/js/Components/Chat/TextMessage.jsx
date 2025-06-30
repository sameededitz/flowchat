import React, { useEffect, useRef } from 'react'

const TextMessage = ({ value, onChange, onSend }) => {
  const input = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  const handleChange = (e) => {
    setTimeout(() => {
      adjustHeight();
    }, 100);
    onChange(e);
  }

  const adjustHeight = () => {
    const el = input.current;
    if (!el) return;

    el.style.height = 'auto'; // reset first
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={input}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="w-full text-sm rounded-r-none resize-none overflow-hidden max-h-40 transition-all duration-200 ease-in-out text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      placeholder='Type a message...'
      rows={1}
    />
  )
}

export default TextMessage