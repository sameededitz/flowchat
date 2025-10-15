import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import Iconify from '../Iconify';

const VoiceMessagePreview = ({ fileObj, onRemove, isOwn = false }) => {
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Memoize WaveSurfer options
  const wavesurferOptions = useMemo(() => ({
    height: 30,
    waveColor: 'rgba(59, 130, 246, 0.4)',
    progressColor: 'rgba(59, 130, 246, 0.8)',
    cursorColor: 'rgba(59, 130, 246, 0.9)',
    cursorWidth: 1,
    barWidth: 1.5,
    barRadius: 1,
    barGap: 1,
    responsive: true,
    normalize: true,
    backend: 'WebAudio',
    mediaControls: false,
    interact: true,
  }), []);

  // Use the hook without URL initially
  const { wavesurfer, isReady } = useWavesurfer({
    container: containerRef,
    ...wavesurferOptions,
  });

  // Load blob or URL after wavesurfer is created
  useEffect(() => {
    if (!wavesurfer) return;

    if (fileObj.file instanceof File) {
      wavesurfer.loadBlob(fileObj.file);
    } else if (fileObj.url) {
      wavesurfer.load(fileObj.url);
    }
  }, [wavesurfer, fileObj]);

  // Handle wavesurfer events
  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setDuration(wavesurfer.getDuration());
    };

    const handleTimeUpdate = (time) => setCurrentTime(time);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleFinish = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    wavesurfer.on('ready', handleReady);
    wavesurfer.on('timeupdate', handleTimeUpdate);
    wavesurfer.on('play', handlePlay);
    wavesurfer.on('pause', handlePause);
    wavesurfer.on('finish', handleFinish);

    return () => {
      wavesurfer.un('ready', handleReady);
      wavesurfer.un('timeupdate', handleTimeUpdate);
      wavesurfer.un('play', handlePlay);
      wavesurfer.un('pause', handlePause);
      wavesurfer.un('finish', handleFinish);
    };
  }, [wavesurfer]);

  const togglePlayPause = useCallback(() => {
    if (wavesurfer && isReady) {
      if (isPlaying) {
        wavesurfer.pause();
      } else {
        wavesurfer.play();
      }
    }
  }, [wavesurfer, isReady, isPlaying]);

  const formatRecordingTime = useCallback((seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="relative w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-3 group">
      <div className="flex items-center space-x-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={!isReady}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            !isReady
              ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 cursor-pointer'
          } text-blue-600 dark:text-blue-300`}
          title={isPlaying ? 'Pause preview' : 'Play preview'}
        >
          {!isReady ? (
            <Iconify icon="lucide:loader-2" size={16} className="animate-spin" />
          ) : (
            <Iconify 
              icon={isPlaying ? "lucide:pause" : "lucide:play"} 
              size={16} 
            />
          )}
        </button>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Voice Message</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
              {isPlaying || currentTime > 0 ? (
                <span>
                  {formatRecordingTime(currentTime)} / {formatRecordingTime(duration || fileObj.duration || 0)}
                </span>
              ) : (
                <span>{formatRecordingTime(fileObj.duration || 0)}</span>
              )}
            </p>
          </div>
          
          {/* Waveform */}
          <div className="w-full">
            <div 
              ref={containerRef} 
              className={`w-full h-6 cursor-pointer ${isReady ? 'block' : 'hidden'}`}
            />
            
            {!isReady && (
              <div className="flex items-center space-x-1 h-6">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-blue-400 dark:bg-blue-300 rounded-full animate-pulse"
                    style={{
                      height: `${8 + (i % 4) * 3}px`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(fileObj.id)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg z-10"
        title="Remove voice message"
      >
        <Iconify icon="lucide:x" size={16} />
      </button>

      {/* File Name Tooltip */}
      {fileObj.file?.name && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
          {fileObj.file.name}
        </div>
      )}
    </div>
  );
};

export default VoiceMessagePreview;