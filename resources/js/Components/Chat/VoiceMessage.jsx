import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import Iconify from '../Iconify';

const VoiceMessage = ({ attachment, isOwn = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const containerRef = useRef(null);

  // Memoize WaveSurfer options to prevent re-creation on every render
  const wavesurferOptions = useMemo(() => ({
    height: 40,
    waveColor: isOwn ? 'rgba(255, 255, 255, 0.4)' : 'rgba(156, 163, 175, 0.6)',
    progressColor: isOwn ? 'rgba(255, 255, 255, 0.9)' : 'rgba(59, 130, 246, 0.8)',
    cursorColor: isOwn ? 'rgba(255, 255, 255, 0.8)' : 'rgba(59, 130, 246, 1)',
    cursorWidth: 2,
    barWidth: 2,
    barRadius: 2,
    barGap: 1,
    responsive: true,
    normalize: true,
    backend: 'WebAudio',
    mediaControls: false,
    interact: true,
  }), [isOwn]);

  const { wavesurfer, isReady } = useWavesurfer({
    container: containerRef,
    url: attachment.url,
    ...wavesurferOptions,
  });

  // Handle wavesurfer events
  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      const audioDuration = wavesurfer.getDuration();
      if (audioDuration && !isNaN(audioDuration)) {
        setDuration(audioDuration);
      }
    };

    const handleTimeUpdate = (time) => {
      setCurrentTime(time);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleFinish = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleSeek = (time) => {
      setCurrentTime(time);
    };

    wavesurfer.on('ready', handleReady);
    wavesurfer.on('timeupdate', handleTimeUpdate);
    wavesurfer.on('play', handlePlay);
    wavesurfer.on('pause', handlePause);
    wavesurfer.on('finish', handleFinish);
    wavesurfer.on('seeking', handleSeek);
    wavesurfer.on('seeked', handleSeek);

    return () => {
      wavesurfer.un('ready', handleReady);
      wavesurfer.un('timeupdate', handleTimeUpdate);
      wavesurfer.un('play', handlePlay);
      wavesurfer.un('pause', handlePause);
      wavesurfer.un('finish', handleFinish);
      wavesurfer.un('seeking', handleSeek);
      wavesurfer.un('seeked', handleSeek);
    };
  }, [wavesurfer]);

  const togglePlayPause = useCallback(() => {
    if (!wavesurfer) return;
    
    if (isPlaying) {
      wavesurfer.pause();
    } else {
      wavesurfer.play();
    }
  }, [wavesurfer, isPlaying]);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const downloadVoice = useCallback(() => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name || 'voice-message.webm';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [attachment.url, attachment.name]);

  return (
    <div className={`flex items-center space-x-3 p-4 rounded-lg max-w-sm ${
      isOwn 
        ? 'bg-blue-500 text-white' 
        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm'
    }`}>
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={!isReady}
        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
          isOwn
            ? 'bg-white/20 hover:bg-white/30 text-white disabled:bg-white/10'
            : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 disabled:bg-gray-100 dark:disabled:bg-gray-600'
        } ${!isReady ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {!isReady ? (
          <div className="animate-spin">
            <Iconify icon="mdi:loading" className="w-5 h-5" />
          </div>
        ) : (
          <Iconify 
            icon={isPlaying ? 'mdi:pause' : 'mdi:play'} 
            className="w-6 h-6" 
          />
        )}
      </button>

      {/* Waveform and Progress */}
      <div className="flex-1 min-w-0">
        <div className="mb-2 relative">
          <div 
            ref={containerRef} 
            className={`w-full h-10 cursor-pointer rounded-md ${
              !isReady ? 'animate-pulse bg-gray-200 dark:bg-gray-600' : ''
            }`}
            style={{ minWidth: '180px' }}
          />
          {/* Progress overlay to enhance visibility */}
          {isReady && (
            <div className="absolute inset-0 pointer-events-none rounded-md" 
                 style={{ 
                   background: `linear-gradient(90deg, transparent 0%, transparent ${(currentTime / duration) * 100}%, rgba(0,0,0,0.1) ${(currentTime / duration) * 100}%, rgba(0,0,0,0.1) 100%)` 
                 }} 
            />
          )}
        </div>
        
        {/* Time Display */}
        <div className={`flex justify-between text-xs ${
          isOwn ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={downloadVoice}
        className={`flex-shrink-0 p-2 rounded-full transition-all duration-200 ${
          isOwn
            ? 'hover:bg-white/20 text-white/70 hover:text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        title="Download voice message"
      >
        <Iconify icon="mdi:download" className="w-4 h-4" />
      </button>
    </div>
  );
};

export default VoiceMessage;