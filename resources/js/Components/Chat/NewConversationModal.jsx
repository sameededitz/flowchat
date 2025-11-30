import React, { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalHeader, Button, Tabs, TextInput, Label, Textarea } from 'flowbite-react';
import Iconify from '../Iconify';
import UserAvatar from './UserAvatar';
import AvatarUpload from './AvatarUpload';
import MembersPicker from './MembersPicker';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useToast } from '../../Hooks/useToast';

const NewConversationModal = ({ show, onClose }) => {
    const [activeTab, setActiveTab] = useState('conversation'); // 'conversation' or 'group'
    const [loading, setLoading] = useState(false);
    
    // Conversation tab state
    const [email, setEmail] = useState('');
    const [searchStatus, setSearchStatus] = useState(''); // 'searching', 'found', 'not-found', ''
    const [foundUser, setFoundUser] = useState(null);
    
    // Group tab state
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [avatarFiles, setAvatarFiles] = useState([]);
    
    const toast = useToast();

    // Real-time email search
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email.trim()) {
            setSearchStatus('');
            setFoundUser(null);
            return;
        }

        if (!emailRegex.test(email)) {
            setSearchStatus('');
            setFoundUser(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setSearchStatus('searching');
                const response = await axios.get(`/users/search?query=${email}`);
                
                if (response.data && response.data.length > 0) {
                    const user = response.data.find(u => u.email.toLowerCase() === email.toLowerCase());
                    if (user) {
                        setFoundUser(user);
                        setSearchStatus('found');
                    } else {
                        setFoundUser(null);
                        setSearchStatus('not-found');
                    }
                } else {
                    setFoundUser(null);
                    setSearchStatus('not-found');
                }
            } catch (error) {
                console.error('Search error:', error);
                setSearchStatus('not-found');
                setFoundUser(null);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [email]);

    const handleCreateConversation = async () => {
        if (!email.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/conversation/find-or-create', {
                email: email.trim()
            });
            
            if (response.data.user_id) {
                toast.success(response.data.has_conversation ? 'Opening conversation...' : 'Conversation created');
                router.visit(route('chat.user', response.data.user_id));
                handleClose();
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            toast.error(error.response?.data?.message || 'User not found or failed to create conversation');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast.error('Group name is required');
            return;
        }

        if (selectedUsers.length === 0) {
            toast.error('Please select at least one member');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('name', groupName);
            formData.append('description', groupDescription);
            
            // Add selected user IDs
            selectedUsers.forEach((user, index) => {
                formData.append(`user_ids[${index}]`, user.id);
            });

            // Add avatar if selected
            if (avatarFiles.length > 0) {
                const file = avatarFiles[0].file;
                if (file instanceof File) {
                    formData.append('avatar', file, file.name);
                }
            }

            const response = await axios.post('/group/store', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Group created successfully');
            router.visit(route('chat.group', response.data.group.id));
            handleClose();
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error(error.response?.data?.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setActiveTab('conversation');
        setEmail('');
        setSearchStatus('');
        setFoundUser(null);
        setSelectedUsers([]);
        setGroupName('');
        setGroupDescription('');
        setAvatarFiles([]);
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} size="2xl">
            <ModalHeader>
                <div className="flex items-center gap-2">
                    <Iconify icon="mdi:plus-circle" className="w-6 h-6" />
                    <span>New {activeTab === 'conversation' ? 'Conversation' : 'Group'}</span>
                </div>
            </ModalHeader>
            <ModalBody>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'conversation'
                                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab('conversation')}
                    >
                        <div className="flex items-center gap-2">
                            <Iconify icon="mdi:account" className="w-5 h-5" />
                            <span>New Conversation</span>
                        </div>
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'group'
                                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setActiveTab('group')}
                    >
                        <div className="flex items-center gap-2">
                            <Iconify icon="mdi:account-group" className="w-5 h-5" />
                            <span>New Group</span>
                        </div>
                    </button>
                </div>

                {/* Conversation Tab */}
                {activeTab === 'conversation' && (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="user-email">User Email Address</Label>
                            <div className="relative">
                                <TextInput
                                    id="user-email"
                                    type="email"
                                    placeholder="Enter user's email address..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && email.trim() && foundUser) {
                                            handleCreateConversation();
                                        }
                                    }}
                                    icon={() => <Iconify icon="mdi:email-outline" className="w-5 h-5" />}
                                    autoFocus
                                    color={searchStatus === 'found' ? 'success' : searchStatus === 'not-found' ? 'failure' : 'gray'}
                                />
                                {searchStatus === 'searching' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Iconify icon="mdi:loading" className="w-5 h-5 text-gray-400 animate-spin" />
                                    </div>
                                )}
                                {searchStatus === 'found' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Iconify icon="mdi:check-circle" className="w-5 h-5 text-green-500" />
                                    </div>
                                )}
                                {searchStatus === 'not-found' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Iconify icon="mdi:close-circle" className="w-5 h-5 text-red-500" />
                                    </div>
                                )}
                            </div>
                            
                            {/* User found preview */}
                            {foundUser && searchStatus === 'found' && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar user={foundUser} online={false} profile={false} />
                                        <div className="flex-1">
                                            <div className="font-medium text-green-900 dark:text-green-100">
                                                {foundUser.name}
                                            </div>
                                            <div className="text-sm text-green-700 dark:text-green-300">
                                                {foundUser.email}
                                            </div>
                                        </div>
                                        <Iconify icon="mdi:check-circle" className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            )}
                            
                            {/* User not found message */}
                            {searchStatus === 'not-found' && (
                                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                                        <Iconify icon="mdi:alert-circle" className="w-5 h-5" />
                                        <span className="text-sm">User not found with this email address</span>
                                    </div>
                                </div>
                            )}
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Enter the email address of the user you want to chat with. If a conversation already exists, it will be reopened.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button color="gray" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button 
                                color="blue" 
                                onClick={handleCreateConversation}
                                disabled={!foundUser || loading}
                            >
                                {loading ? 'Opening Chat...' : 'Start Chat'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Group Tab */}
                {activeTab === 'group' && (
                    <div className="space-y-4">
                        <div>
                            <Label>Group Avatar (optional)</Label>
                            <AvatarUpload
                                existingAvatar={null}
                                onFilesChange={setAvatarFiles}
                                onRemoveAvatar={() => setAvatarFiles([])}
                                isOpen={show}
                            />
                        </div>

                        <div>
                            <Label htmlFor="group-name">Group Name *</Label>
                            <TextInput
                                id="group-name"
                                type="text"
                                placeholder="Enter group name..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="group-description">Description (optional)</Label>
                            <Textarea
                                id="group-description"
                                placeholder="Enter group description..."
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <MembersPicker
                            selectedUsers={selectedUsers}
                            onUsersChange={setSelectedUsers}
                            label="Add Members"
                            placeholder="Search by name or email..."
                            required={true}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button color="gray" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button 
                                color="blue" 
                                onClick={handleCreateGroup}
                                disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
                            >
                                {loading ? 'Creating...' : 'Create Group'}
                            </Button>
                        </div>
                    </div>
                )}
            </ModalBody>
        </Modal>
    );
};

export default NewConversationModal;
