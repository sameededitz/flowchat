import React, { useState, useEffect } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFilePoster from 'filepond-plugin-file-poster';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-file-poster/dist/filepond-plugin-file-poster.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { useToast } from '../../Hooks/useToast';

// Register FilePond plugins
registerPlugin(
    FilePondPluginFileValidateType,
    FilePondPluginFileValidateSize,
    FilePondPluginFilePoster,
    FilePondPluginImagePreview
);

const AvatarUpload = ({
    existingAvatar = null,
    onFilesChange,
    onRemoveAvatar,
    isOpen = false,
    size = "w-48"
}) => {
    const [avatarFiles, setAvatarFiles] = useState([]);
    const toast = useToast();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (isOpen && existingAvatar) {
            setIsInitialLoad(true);
            setAvatarFiles([{
                source: existingAvatar,
                options: {
                    type: 'local'
                }
            }]);
        } else if (!isOpen) {
            // Reset files when modal closes
            setAvatarFiles([]);
            setIsInitialLoad(true);
        }
    }, [isOpen, existingAvatar]);

    const handleFilesUpdate = (files) => {
        setAvatarFiles(files);
        onFilesChange(files);
    };
    
    const handleRemoveFile = (error, file) => {
        // Reset the files when a file is removed due to error
        setAvatarFiles([]);
        onFilesChange([]);
    };

    const handleRemoveClick = () => {
        setAvatarFiles([]);
        if (existingAvatar && onRemoveAvatar) {
            onRemoveAvatar();
        }
        onFilesChange([]);
    };

    return (
        <div className="space-y-3">
            <div className={`${size} mx-auto`}>
                <FilePond
                    files={avatarFiles}
                    onupdatefiles={handleFilesUpdate}
                    onremovefile={handleRemoveFile}
                    onerror={(error, file, status) => {
                        const errorMessage = error?.main || error?.body || error || 'An error occurred';
                        setTimeout(() => {
                            toast.error(errorMessage);
                            // Clear the failed file after showing error
                            setAvatarFiles([]);
                            onFilesChange([]);
                        }, 0);
                    }}
                    onwarning={(error, file, status) => {
                        const warningMessage = error?.main || error?.body || error || 'A warning occurred';
                        setTimeout(() => {
                            toast.warning(warningMessage);
                            // Clear the failed file after showing warning
                            setAvatarFiles([]);
                            onFilesChange([]);
                        }, 0);
                    }}
                    allowDrop={true}
                    dropOnPage={true}
                    dropValidation={true}
                    allowFileTypeValidation={true}
                    acceptedFileTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']}
                    fileValidateTypeLabelExpectedTypes="Expects {allButLastType} or {lastType}"
                    labelFileTypeNotAllowed="Invalid file type"
                    fileValidateTypeDetectType={(source, type) => new Promise((resolve, reject) => {
                        resolve(type);
                    })}
                    allowMultiple={false}
                    maxFiles={1}
                    allowFileSizeValidation={true}
                    maxFileSize="5MB"
                    labelMaxFileSizeExceeded="File is too large"
                    labelMaxFileSize="Maximum file size is {filesize}"
                    imagePreviewMaxHeight={256}
                    stylePanelLayout="compact circle"
                    styleButtonRemoveItemPosition="center bottom"
                    styleLoadIndicatorPosition="center bottom"
                    styleProgressIndicatorPosition="right bottom"
                    server={{
                        load: (source, load, error, progress, abort) => {
                            fetch(source)
                                .then(response => response.blob())
                                .then(blob => load(blob))
                                .catch(err => error(err.message));
                            
                            return {
                                abort: () => {
                                    abort();
                                }
                            };
                        }
                    }}
                    labelIdle='Drag & Drop your picture or <span class="filepond--label-action">Browse</span>'
                />
            </div>
            {(existingAvatar || avatarFiles.length > 0) && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleRemoveClick}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                        Remove Current Avatar
                    </button>
                </div>
            )}
        </div>
    );
};

export default AvatarUpload;