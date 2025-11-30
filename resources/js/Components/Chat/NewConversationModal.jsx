import React, { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalHeader, Button, Tabs, TextInput, Label, Textarea } from 'flowbite-react';
import Iconify from '../Iconify';
import UserAvatar from './UserAvatar';
import AvatarUpload from './AvatarUpload';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useToast } from '../../Hooks/useToast';

const NewConversationModal = ({ show, onClose }) => {
    const [activeTab, setActiveTab] = useState('conversation'); // 'conversation' or 'group'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Conversation tab state
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Group tab state
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [avatarFiles, setAvatarFiles] = useState([]);
    
    const toast = useToast();

    // Fetch users when modal opens
    useEffect(() => {
        if (show) {
            fetchUsers();
        }
    }, [show]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // TODO: Create this route in Laravel
            const response = await axios.get('/users/search');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateConversation = async () => {
        if (!selectedUser) {
            toast.error('Please select a user');
            return;
        }

        try {
            setLoading(true);
            // TODO: Create this route in Laravel
            const response = await axios.post('/conversation/create', {
                user_id: selectedUser.id
            });
            
            toast.success('Conversation created');
            router.visit(route('chat.user', selectedUser.id));
            handleClose();
        } catch (error) {
            console.error('Error creating conversation:', error);
            toast.error(error.response?.data?.message || 'Failed to create conversation');
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

            // TODO: Create this route in Laravel
            const response = await axios.post('/group/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Group created successfully');
            router.visit(route('chat.group', response.data.id));
            handleClose();
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error(error.response?.data?.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (user) => {
        if (activeTab === 'conversation') {
            setSelectedUser(user);
        } else {
            setSelectedUsers(prev => {
                const isSelected = prev.find(u => u.id === user.id);
                if (isSelected) {
                    return prev.filter(u => u.id !== user.id);
                } else {
                    return [...prev, user];
                }
            });
        }
    };

    const isUserSelected = (user) => {
        if (activeTab === 'conversation') {
            return selectedUser?.id === user.id;
        } else {
            return selectedUsers.some(u => u.id === user.id);
        }
    };

    const handleClose = () => {
        setActiveTab('conversation');
        setSelectedUser(null);
        setSelectedUsers([]);
        setGroupName('');
        setGroupDescription('');
        setAvatarFiles([]);
        setSearchTerm('');
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
                            <Label htmlFor="search-user">Search Users</Label>
                            <TextInput
                                id="search-user"
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={() => <Iconify icon="mdi:magnify" className="w-5 h-5" />}
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            {loading ? (
                                <div className="p-4 text-center">Loading users...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No users found</div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className={`p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                                isUserSelected(user) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                            onClick={() => toggleUserSelection(user)}
                                        >
                                            <UserAvatar user={user} online={false} />
                                            <div className="flex-1">
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                            {isUserSelected(user) && (
                                                <Iconify icon="mdi:check-circle" className="w-6 h-6 text-blue-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button color="gray" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button 
                                color="blue" 
                                onClick={handleCreateConversation}
                                disabled={!selectedUser || loading}
                            >
                                {loading ? 'Creating...' : 'Start Conversation'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Group Tab */}
                {activeTab === 'group' && (
                    <div className="space-y-4">
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

                        <div>
                            <Label>Group Avatar (optional)</Label>
                            <AvatarUpload
                                existingAvatar={null}
                                onFilesChange={setAvatarFiles}
                                onRemoveAvatar={() => setAvatarFiles([])}
                                isOpen={show}
                                size="lg"
                            />
                        </div>

                        <div>
                            <Label htmlFor="search-members">Add Members *</Label>
                            <TextInput
                                id="search-members"
                                type="text"
                                placeholder="Search users to add..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={() => <Iconify icon="mdi:magnify" className="w-5 h-5" />}
                            />
                        </div>

                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full"
                                    >
                                        <span className="text-sm">{user.name}</span>
                                        <button
                                            onClick={() => toggleUserSelection(user)}
                                            className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                                        >
                                            <Iconify icon="mdi:close" className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            {loading ? (
                                <div className="p-4 text-center">Loading users...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">No users found</div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className={`p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                                isUserSelected(user) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                            onClick={() => toggleUserSelection(user)}
                                        >
                                            <UserAvatar user={user} online={false} />
                                            <div className="flex-1">
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                            {isUserSelected(user) && (
                                                <Iconify icon="mdi:check-circle" className="w-6 h-6 text-blue-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

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
