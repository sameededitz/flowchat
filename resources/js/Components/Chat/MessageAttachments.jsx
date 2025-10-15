import React, { useState } from 'react';
import { Modal, Button, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import Iconify from '../Iconify';
import AudioPlayer from 'react-h5-audio-player';
import VoiceMessage from './VoiceMessage';
import 'react-h5-audio-player/lib/styles.css';

const MessageAttachments = ({ attachments = [], isOwn = false }) => {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Group attachments by type
  const images = attachments.filter(att => att.type === 'image');
  const videos = attachments.filter(att => att.type === 'video');
  const audios = attachments.filter(att => att.type === 'audio' && !att.is_voice_message);
  const voiceMessages = attachments.filter(att => att.is_voice_message);
  const documents = attachments.filter(att => att.type === 'document');

  // Combine images and videos for gallery
  const mediaItems = [...images, ...videos];

  // Media modal handlers
  const openMediaModal = (media, index = 0) => {
    setSelectedMedia(media);
    setCurrentMediaIndex(index);
    setShowMediaModal(true);
  };

  const closeMediaModal = () => {
    setShowMediaModal(false);
    setSelectedMedia(null);
    setCurrentMediaIndex(0);
  };

  const nextMedia = () => {
    if (currentMediaIndex < mediaItems.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  // Download handler
  const downloadFile = (attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file extension
  const getFileExtension = (filename) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  // Render media gallery
  const renderMediaGallery = () => {
    if (mediaItems.length === 0) return null;

    if (mediaItems.length === 1) {
      // Single media item
      const media = mediaItems[0];
      return (
        <div className="mt-2">
          <div
            className="relative cursor-pointer group max-w-xs rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
            onClick={() => openMediaModal(mediaItems, 0)}
          >
            {media.type === 'image' ? (
              <img
                src={media.url}
                alt={media.name}
                className="w-full h-auto max-h-64 object-cover"
              />
            ) : (
              <div className="relative">
                <video
                  src={media.url}
                  className="w-full h-auto max-h-64 object-cover"
                  preload="metadata"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Iconify icon="mdi:play-circle" className="w-12 h-12 text-white opacity-80" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
          </div>
        </div>
      );
    }

    if (mediaItems.length <= 4) {
      // Small gallery (2-4 items)
      return (
        <div className="mt-2">
          <div className={`grid gap-1 max-w-xs ${
            mediaItems.length === 2 ? 'grid-cols-2' : 
            mediaItems.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
          }`}>
            {mediaItems.slice(0, 4).map((media, index) => (
              <div
                key={media.id}
                className="relative cursor-pointer group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                onClick={() => openMediaModal(mediaItems, index)}
              >
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={media.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="relative">
                    <video
                      src={media.url}
                      className="w-full h-24 object-cover"
                      preload="metadata"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Iconify icon="mdi:play-circle" className="w-8 h-8 text-white opacity-80" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Large gallery (5+ items)
    return (
      <div className="mt-2">
        <div className="grid grid-cols-2 gap-1 max-w-xs">
          {mediaItems.slice(0, 3).map((media, index) => (
            <div
              key={media.id}
              className="relative cursor-pointer group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
              onClick={() => openMediaModal(mediaItems, index)}
            >
              {media.type === 'image' ? (
                <img
                  src={media.url}
                  alt={media.name}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="relative">
                  <video
                    src={media.url}
                    className="w-full h-24 object-cover"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Iconify icon="mdi:play-circle" className="w-6 h-6 text-white opacity-80" />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
            </div>
          ))}
          {mediaItems.length > 3 && (
            <div
              className="relative cursor-pointer group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-black bg-opacity-50 flex items-center justify-center"
              onClick={() => openMediaModal(mediaItems, 3)}
            >
              <div className="text-white text-lg font-semibold">
                +{mediaItems.length - 3}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render file attachments
  const renderFileAttachments = () => {
    const fileAttachments = [...documents]; // Only documents, we'll handle audio separately
    if (fileAttachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {fileAttachments.map((file) => (
          <div
            key={file.id}
            className="flex items-center space-x-3 p-3 max-w-xs bg-gray-50 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Iconify
                  icon="mdi:file-document"
                  className="w-5 h-5 text-blue-600 dark:text-blue-300"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getFileExtension(file.name)} • {formatFileSize(file.size)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => downloadFile(file)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700"
              >
                <Iconify icon="mdi:download" className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render audio attachments with player
  const renderAudioAttachments = () => {
    if (audios.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {audios.map((audio) => (
          <div
            key={audio.id}
            className="p-3 bg-gray-50 dark:bg-gray-600 max-w-xs rounded-lg border border-gray-200 dark:border-gray-500"
          >
            {/* Audio file info header */}
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Iconify
                    icon="mdi:music"
                    className="w-5 h-5 text-green-600 dark:text-green-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {audio.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {getFileExtension(audio.name)} • {formatFileSize(audio.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadFile(audio)}
                className="inline-flex items-center justify-center w-8 h-8 text-gray-500 bg-white border border-gray-300 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:ring-2 focus:outline-none focus:ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-700 transition-colors flex-shrink-0"
                title="Download audio file"
              >
                <Iconify icon="mdi:download" className="w-4 h-4" />
              </button>
            </div>
            
            {/* Audio player with better styling */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <AudioPlayer
                src={audio.url}
                showFilledProgress={true}
                customAdditionalControls={[]}
                volume={0.8}
                className="!bg-transparent !shadow-none !border-none audio-player-custom"
                style={{
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  border: 'none',
                  fontSize: '14px',
                  padding: '0',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render voice messages
  const renderVoiceMessages = () => {
    if (voiceMessages.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {voiceMessages.map((voice) => (
          <VoiceMessage 
            key={voice.id} 
            attachment={voice} 
            isOwn={isOwn}
          />
        ))}
      </div>
    );
  };

  // Don't render anything if no attachments
  if (attachments.length === 0) return null;

  return (
    <>
      {/* Render attachments */}
      {renderMediaGallery()}
      {renderVoiceMessages()}
      {renderAudioAttachments()}
      {renderFileAttachments()}

      {/* Media Preview Modal */}
      <Modal show={showMediaModal} onClose={closeMediaModal} size="6xl">
        <ModalHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Iconify
                icon={mediaItems[currentMediaIndex]?.type === 'video' ? 'mdi:video' : 'mdi:image'}
                className="w-5 h-5"
              />
              <span>Media Preview</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentMediaIndex + 1} of {mediaItems.length}
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="p-0 max-h-[80vh] overflow-hidden">
          {selectedMedia && mediaItems[currentMediaIndex] && (
            <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[50vh] max-h-[80vh]">
              {mediaItems[currentMediaIndex].type === 'image' ? (
                <img
                  src={mediaItems[currentMediaIndex].url}
                  alt={mediaItems[currentMediaIndex].name}
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: 'calc(80vh - 120px)' }}
                />
              ) : (
                <video
                  src={mediaItems[currentMediaIndex].url}
                  controls
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: 'calc(80vh - 120px)' }}
                  autoPlay={false}
                  preload="metadata"
                />
              )}

              {/* Navigation arrows */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    disabled={currentMediaIndex === 0}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Iconify icon="mdi:chevron-left" className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextMedia}
                    disabled={currentMediaIndex === mediaItems.length - 1}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Iconify icon="mdi:chevron-right" className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* File name overlay */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                {mediaItems[currentMediaIndex].name}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {mediaItems[currentMediaIndex] && (
                <>
                  <span>Size: {formatFileSize(mediaItems[currentMediaIndex].size)}</span>
                  <span className="ml-4">Type: {mediaItems[currentMediaIndex].mime}</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => downloadFile(mediaItems[currentMediaIndex])}
                color="blue"
              >
                <Iconify icon="mdi:download" className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={closeMediaModal} color="gray">
                Close
              </Button>
            </div>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default MessageAttachments;