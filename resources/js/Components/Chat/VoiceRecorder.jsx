import { useEffect, useRef, useState } from 'react';
import Iconify from '../Iconify';
import { useToast } from '../../Hooks/useToast';

// Global storage for recording state that survives component remounts
let globalRecordingState = {
  isRecording: false,
  startTime: null,
  intervalId: null,
  timeoutId: null
};

const VoiceRecorder = ({ onVoiceRecorded, disabled = false }) => {
  const toast = useToast();
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioStream, setAudioStream] = useState(null);
  const [error, setError] = useState(null);

  const recordingIntervalRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    // If global state says we're recording, sync with local state
    if (globalRecordingState.isRecording) {
      setIsRecording(true);
      recordingIntervalRef.current = globalRecordingState.intervalId;
      recordingTimeoutRef.current = globalRecordingState.timeoutId;
      
      // Update our time based on elapsed time
      if (globalRecordingState.startTime) {
        const elapsed = Math.floor((Date.now() - globalRecordingState.startTime) / 1000);
        setRecordingTime(elapsed);
        recordingTimeRef.current = elapsed;
      }
    }
    
    return () => {
      // Don't clear intervals if we're recording - let them survive remount
      if (!globalRecordingState.isRecording) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
        }
        // Clean up audio stream
        if (audioStream) {
          audioStream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [audioStream]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      setAudioStream(stream);
      
      // Check available MIME types and pick the best one
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      const audioChunks = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { 
          type: recorder.mimeType || 'audio/webm' 
        });
        
        // Create voice message file object
        const voiceFile = new File(
          [audioBlob], 
          `voice_${Date.now()}.${recorder.mimeType?.includes('mp4') ? 'mp4' : 'webm'}`,
          { type: audioBlob.type }
        );
        
        const voiceMessage = {
          file: voiceFile,
          url: URL.createObjectURL(audioBlob),
          id: Math.random().toString(36).substr(2, 9),
          type: 'voice',
          duration: recordingTimeRef.current,
          isVoiceMessage: true
        };
        
        // Call parent callback with voice message
        onVoiceRecorded(voiceMessage);
        
        // Show success toast
        toast.voiceSent();
        
        // Clean up and reset states
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
        setIsRecording(false);
        setMediaRecorder(null);
        setRecordingTime(0);
        recordingTimeRef.current = 0;
        
        // Clear global state
        globalRecordingState.isRecording = false;
        globalRecordingState.startTime = null;
        globalRecordingState.intervalId = null;
        globalRecordingState.timeoutId = null;
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      
      // Show recording toast
      toast.voiceRecording();
      
      // Update global state
      globalRecordingState.isRecording = true;
      globalRecordingState.startTime = Date.now();
      
      // Recording timer
      let simpleCounter = 0;
      const simpleTimer = setInterval(() => {
        simpleCounter++;
        recordingTimeRef.current = simpleCounter;
        setRecordingTime(prevTime => simpleCounter);
      }, 1000);
      
      // Store the timer in refs and global state
      recordingIntervalRef.current = simpleTimer;
      globalRecordingState.intervalId = simpleTimer;
      
      // Auto-stop after 5 minutes
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 300000);
      
      // Store timeout in global state too
      globalRecordingState.timeoutId = recordingTimeoutRef.current;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Unable to access microphone. Please check permissions.');
      toast.error('Unable to access microphone. Please check permissions.');
      timeoutRef.current = setTimeout(() => setError(null), 3000);
    }
  };
  
  const stopRecording = () => {
    // Check minimum recording time
    if (recordingTimeRef.current < 1) {
      // Don't stop if less than 1 second, let it continue
      return;
    }
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    // Clear the timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    // Clear global state
    globalRecordingState.intervalId = null;
    globalRecordingState.timeoutId = null;
  };

  // Force stop for testing (removes minimum time check)
  const forceStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    // Clear the timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    // Clear global state
    globalRecordingState.intervalId = null;
    globalRecordingState.timeoutId = null;
  };
  
  const cancelRecording = () => {
    // Set a flag to indicate this is a cancellation, not a normal stop
    const wasRecording = isRecording;
    
    // Clear states first to prevent onstop from creating a file
    setIsRecording(false);
    setMediaRecorder(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    
    // Clear global state
    globalRecordingState.isRecording = false;
    globalRecordingState.startTime = null;
    globalRecordingState.intervalId = null;
    globalRecordingState.timeoutId = null;
    
    // Stop the MediaRecorder if it's recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      // Remove the onstop handler to prevent file creation
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    
    // Clean up audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    
    // Clear timers
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Voice Recording Controls */}
      {!isRecording ? (
        <button 
          className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
          onClick={startRecording}
          disabled={disabled}
          title="Click to start recording voice message"
        >
          <Iconify icon='ic:round-mic' className='w-6' />
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <button 
            className='p-1 text-red-500 hover:text-red-600 transition-colors animate-pulse'
            onClick={cancelRecording}
            title="Cancel recording"
          >
            <Iconify icon='mdi:close' className='w-6' />
          </button>
          <div className="flex items-center space-x-2 px-2 py-1 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {formatRecordingTime(recordingTime)}
            </span>
          </div>
          <button 
            className='p-1 text-blue-500 hover:text-blue-600 transition-colors'
            onClick={forceStopRecording}
            title="Stop and send recording"
          >
            <Iconify icon='mdi:stop' className='w-6' />
          </button>
        </div>
      )}
    </>
  );
};

export default VoiceRecorder;