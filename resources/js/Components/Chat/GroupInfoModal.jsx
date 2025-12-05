import React, { useState, useEffect } from 'react';
import { Modal, ModalBody, ModalHeader } from 'flowbite-react';
import Iconify from '../Iconify';
import GroupAvatar from './GroupAvatar';
import UserAvatar from './UserAvatar';
import { usePage, router, Link } from '@inertiajs/react';
import axios from 'axios';
import { useToast } from '../../Hooks/useToast';
import AvatarUpload from './AvatarUpload';
import MembersPicker from './MembersPicker';

const GroupInfoModal = ({ show, onClose, group }) => {
    const { auth } = usePage().props;
    const currentUser = auth.user;
    const isAdmin = group?.owner_id === currentUser.id;

    // Find current user's role in the group
    const currentUserInGroup = group?.users?.find(u => u.id === currentUser.id);
    const currentUserRole = currentUserInGroup?.pivot?.role || 'member';
    const isModeratorOrAdmin = ['admin', 'moderator'].includes(currentUserRole);

    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'members'
    const toast = useToast();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [groupData, setGroupData] = useState({
        name: group?.name || '',
        description: group?.description || '',
        avatar: group?.avatar || null
    });
    const [avatarFiles, setAvatarFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const [selectedUsers, setSelectedUsers] = useState([]);

    if (!group) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleEditGroup = async () => {
        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('name', groupData.name);
            formData.append('description', groupData.description || '');

            if (avatarFiles.length > 0) {
                const fileItem = avatarFiles[0];
                const file = fileItem.file;

                if (file instanceof File) {
                    formData.append('avatar', file, file.name);
                }
            }

            const response = await axios.post(route('group.update', group.id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-HTTP-Method-Override': 'PATCH'
                }
            });

            toast.success(response.data.message);
            setEditModalOpen(false);
            setAvatarFiles([]);
            router.reload({ only: ['selectedConversation'] });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update group');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Are you sure you want to remove the group avatar?')) {
            return;
        }

        try {
            const response = await axios.delete(route('group.avatar.remove', group.id));
            toast.success(response.data.message);
            setGroupData({ ...groupData, avatar: null });
            router.reload({ only: ['selectedConversation'] });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to remove avatar');
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await axios.delete(route('group.destroy', group.id));
            toast.success(response.data.message);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete group');
        }
    };

    const handleInviteMembers = async (userIds) => {
        try {
            const response = await axios.post(route('group.invite', group.id), { user_ids: userIds });
            toast.success(response.data.message);
            setInviteModalOpen(false);
            router.reload({ only: ['selectedConversation'] });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to invite members');
        }
    };

    const handleChangeRole = async (userId, role) => {
        try {
            const response = await axios.post(route('group.member.role', { group: group.id, user: userId }), { role });
            toast.success(response.data.message);
            router.reload({ only: ['selectedConversation'] });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to change role');
        }
    };

    const handleRemoveMember = async (userId, userName) => {
        if (!confirm(`Are you sure you want to remove ${userName} from the group?`)) {
            return;
        }

        try {
            const response = await axios.delete(route('group.member.remove', { group: group.id, user: userId }));
            toast.success(response.data.message);
            router.reload({ only: ['selectedConversation'] });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to remove member');
        }
    };

    const handleTransferOwnership = async (userId, userName) => {
        if (!confirm(`Are you sure you want to transfer ownership of "${group.name}" to ${userName}? You will become a regular admin and this action cannot be undone.`)) {
            return;
        }

        try {
            const response = await axios.post(route('group.transfer-ownership', { group: group.id, user: userId }));
            toast.success(response.data.message);
            router.reload({ only: ['selectedConversation'] });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to transfer ownership');
        }
    };

    const handleOnClose = () => {
        setActiveTab('info');
        onClose();
    }

    return (
        <Modal show={show} onClose={handleOnClose} size="lg">
            <ModalHeader>
                <div className="flex items-center gap-3">
                    <GroupAvatar group={group} />
                    <span>Group Info</span>
                </div>
            </ModalHeader>
            <ModalBody>
                <div className="space-y-6">
                    {/* Group Profile Section */}
                    <div className="flex flex-col items-center text-center pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="mb-4">
                            <GroupAvatar group={group} size="xl" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {group.name}
                        </h2>
                        {group.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-md">
                                {group.description}
                            </p>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${activeTab === 'info'
                                ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Iconify icon="mdi:information" className="inline w-5 h-5 mr-2" />
                            Information
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${activeTab === 'members'
                                ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Iconify icon="mdi:account-group" className="inline w-5 h-5 mr-2" />
                            Members ({group.users?.length || 0})
                        </button>
                    </div>

                    {/* Info Tab */}
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <Iconify icon="mdi:calendar-clock" className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Created</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatDate(group.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <Iconify icon="mdi:crown" className="w-5 h-5 text-yellow-500 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Group Owner</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <UserAvatar user={group.owner} online={false} profile={false} />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {group.owner?.name}
                                            {group.owner_id === currentUser.id && (
                                                <span className="text-blue-600 dark:text-blue-400 ml-1">(You)</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                                <Iconify icon="mdi:account-multiple" className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Total Members</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {group.users?.length || 0} member{group.users?.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {(isAdmin || isModeratorOrAdmin) && (
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Iconify icon="mdi:shield-account" className="w-5 h-5" />
                                        {isAdmin ? 'Owner Actions' : currentUserRole === 'admin' ? 'Admin Actions' : 'Moderator Actions'}
                                    </h3>
                                    <div className="space-y-2">
                                        {(isAdmin || currentUserRole === 'admin') && (
                                            <button
                                                onClick={() => setEditModalOpen(true)}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                                            >
                                                <Iconify icon="mdi:pencil" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                <span className="text-sm text-gray-900 dark:text-white">Edit Group Info</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setInviteModalOpen(true)}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                                        >
                                            <Iconify icon="mdi:account-plus" className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-sm text-gray-900 dark:text-white">Invite Members</span>
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={handleDeleteGroup}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                                            >
                                                <Iconify icon="mdi:delete" className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                <span className="text-sm text-red-600 dark:text-red-400">Delete Group</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {group.users?.map((user) => {
                                const isOwner = user.id === group.owner_id;
                                const userRole = user.pivot?.role || 'member';
                                const canManage = (isAdmin || currentUserRole === 'admin' || currentUserRole === 'moderator') && !isOwner && user.id !== currentUser.id;

                                return (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Link href={`/profile/${user.id}`} className='flex-1 hover:opacity-80 transition-opacity'>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                                                    <img
                                                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {user.name}
                                                        {user.id === currentUser.id && (
                                                            <span className="text-blue-600 dark:text-blue-400 ml-1">(You)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            {isOwner ? (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                                    <Iconify icon="mdi:crown" className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            ) : userRole === 'moderator' ? (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                    <Iconify icon="mdi:shield-account" className="w-3 h-3" />
                                                    Moderator
                                                </span>
                                            ) : userRole === 'admin' ? (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                                    <Iconify icon="mdi:shield-star" className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            ) : null}

                                            {canManage && (
                                                <div className="relative group">
                                                    <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                        <Iconify icon="mdi:dots-vertical" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                    </button>
                                                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => handleTransferOwnership(user.id, user.name)}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Iconify icon="mdi:crown-circle" className="w-4 h-4" />
                                                                Transfer Ownership
                                                            </button>
                                                        )}
                                                        {userRole === 'member' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleChangeRole(user.id, 'admin')}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Iconify icon="mdi:shield-star" className="w-4 h-4" />
                                                                    Make Admin
                                                                </button>
                                                                <button
                                                                    onClick={() => handleChangeRole(user.id, 'moderator')}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Iconify icon="mdi:shield-account" className="w-4 h-4" />
                                                                    Make Moderator
                                                                </button>
                                                            </>
                                                        )}
                                                        {userRole === 'admin' && (
                                                            <button
                                                                onClick={() => handleChangeRole(user.id, 'member')}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Iconify icon="mdi:account-arrow-down" className="w-4 h-4" />
                                                                Remove Admin
                                                            </button>
                                                        )}
                                                        {userRole === 'moderator' && (
                                                            <button
                                                                onClick={() => handleChangeRole(user.id, 'member')}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Iconify icon="mdi:account-arrow-down" className="w-4 h-4" />
                                                                Remove Moderator
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRemoveMember(user.id, user.name)}
                                                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg flex items-center gap-2 transition-colors"
                                                        >
                                                            <Iconify icon="mdi:account-remove" className="w-4 h-4" />
                                                            Remove Member
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </ModalBody>

            {/* Edit Group Modal */}
            {editModalOpen && (
                <Modal show={editModalOpen} onClose={() => setEditModalOpen(false)}>
                    <ModalHeader>Edit Group Info</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Group Avatar
                                </label>
                                <AvatarUpload
                                    existingAvatar={group?.avatar}
                                    onFilesChange={setAvatarFiles}
                                    onRemoveAvatar={handleRemoveAvatar}
                                    isOpen={editModalOpen}
                                    size="w-48"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Group Name
                                </label>
                                <input
                                    type="text"
                                    value={groupData.name}
                                    onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter group name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={groupData.description}
                                    onChange={(e) => setGroupData({ ...groupData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter group description"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditGroup}
                                    disabled={isUploading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                                >
                                    {isUploading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </ModalBody>
                </Modal>
            )}

            {/* Invite Members Modal */}
            {inviteModalOpen && (
                <Modal show={inviteModalOpen} onClose={() => { setInviteModalOpen(false); setSelectedUsers([]); }}>
                    <ModalHeader>Invite Members to {group.name}</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Search and select users to invite to this group. Members who are already in the group will not appear in search results.
                            </p>

                            <MembersPicker
                                selectedUsers={selectedUsers}
                                onUsersChange={setSelectedUsers}
                                label="Select Members to Invite"
                                placeholder="Search by name or email..."
                                required={false}
                                excludeUserIds={group.users?.map(u => u.id) || []}
                            />

                            <div className="flex gap-2 justify-end pt-4">
                                <button
                                    onClick={() => { setInviteModalOpen(false); setSelectedUsers([]); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedUsers.length > 0) {
                                            handleInviteMembers(selectedUsers.map(u => u.id));
                                            setSelectedUsers([]);
                                        }
                                    }}
                                    disabled={selectedUsers.length === 0}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                                >
                                    Invite {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                                </button>
                            </div>
                        </div>
                    </ModalBody>
                </Modal>
            )}
        </Modal>
    );
};

export default GroupInfoModal;
