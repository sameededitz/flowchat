import React, { useState, useEffect } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Label } from '@headlessui/react';
import UserAvatar from './UserAvatar';
import Iconify from '../Iconify';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

const MembersPicker = ({ 
    selectedUsers = [], 
    onUsersChange, 
    label = "Add Members",
    placeholder = "Search by name or email...",
    required = false,
    excludeUserIds = [] // IDs of users to exclude (e.g., already in group)
}) => {
    const { conversations, auth } = usePage().props;
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Extract users from conversations (known users)
    const knownUsers = conversations
        ?.filter(c => !c.is_group && c.is_user)
        .map(c => ({ 
            id: c.id, 
            name: c.name,
            email: c.email,
            avatar_url: c.avatar_url,
            i_blocked: c.i_blocked,
            blocked_me: c.blocked_me
        }))
        .filter(user => 
            user.id !== auth.user.id && // Exclude current user
            !excludeUserIds.includes(user.id) && // Exclude specified users
            !user.i_blocked && // Exclude users current user has blocked
            !user.blocked_me // Exclude users who blocked current user
        ) || [];    // Filter known users based on query
    const filteredKnownUsers = query === '' 
        ? knownUsers 
        : knownUsers.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        );
    
    
    // Combine known users + API search results, remove duplicates and already selected
    const allUsers = [...filteredKnownUsers, ...searchResults];
    const uniqueUsers = allUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.id === user.id)
    );
    const availableUsers = uniqueUsers.filter(
        user => 
            !selectedUsers.find(u => u.id === user.id) && // Not already selected
            user.id !== auth.user.id && // Not current user
            !excludeUserIds.includes(user.id) // Not in exclude list
    );
    
    // Debounced API search when email-like query entered
    useEffect(() => {
        if (query.includes('@') && filteredKnownUsers.length === 0) {
            const timeoutId = setTimeout(async () => {
                try {
                    setIsSearching(true);
                    const response = await axios.get(`/users/search?query=${query}`);
                    // Filter out blocked users from search results
                    const filteredResults = response.data.filter(user => 
                        !user.i_blocked && !user.blocked_me
                    );
                    setSearchResults(filteredResults);
                } catch (error) {
                    console.error('Search error:', error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 500);
            
            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    }, [query, filteredKnownUsers.length]);
    
    const addUser = (user) => {
        if (user && !selectedUsers.find(u => u.id === user.id)) {
            onUsersChange([...selectedUsers, user]);
            setQuery('');
            setSearchResults([]);
        }
    };
    
    const removeUser = (userId) => {
        onUsersChange(selectedUsers.filter(u => u.id !== userId));
    };
    
    return (
        <div className="space-y-3">
            <Combobox value={null} onChange={addUser}>
                {({ open }) => (
                    <div className="relative">
                        <Label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {label} {required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        <div className="relative">
                            <ComboboxInput
                                className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={placeholder}
                                onChange={(e) => setQuery(e.target.value)}
                                displayValue={() => query}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                {isSearching ? (
                                    <Iconify icon="mdi:loading" className="w-5 h-5 text-gray-400 animate-spin" />
                                ) : (
                                    <Iconify icon="mdi:magnify" className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        </div>
                        
                        {open && (
                            <ComboboxOptions className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {availableUsers.length === 0 && query !== '' ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {isSearching ? 'Searching...' : 'No users found'}
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        Start typing to search users...
                                    </div>
                                ) : (
                                    availableUsers.map((user) => (
                                        <ComboboxOption
                                            key={user.id}
                                            value={user}
                                            className={({ active }) =>
                                                `flex items-center gap-3 px-4 py-2 cursor-pointer ${
                                                    active ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                }`
                                            }
                                        >
                                            <UserAvatar user={user} showStatus={false} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </ComboboxOption>
                                    ))
                                )}
                            </ComboboxOptions>
                        )}
                    </div>
                )}
            </Combobox>
            
            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                        <div
                            key={user.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 rounded-full"
                        >
                            <UserAvatar user={user} size="sm" showStatus={false} />
                            <span className="text-sm text-gray-900 dark:text-white ms-1">{user.name}</span>
                            <button
                                type="button"
                                onClick={() => removeUser(user.id)}
                                className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                            >
                                <Iconify icon="mdi:close" className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MembersPicker;
