import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import React, { Fragment } from 'react'
import Iconify from '../Iconify';
import axios from 'axios';
import { router, usePage } from '@inertiajs/react';
import { useToast } from '../../Hooks/useToast';

function GroupOptions({ conversation }) {
  const toast = useToast();
  const { auth } = usePage().props;
  const currentUser = auth.user;
  
  // Check if current user is the group owner
  const isOwner = conversation.owner_id === currentUser.id;
  
  // Find current user's role in the group
  const currentUserInGroup = conversation.users?.find(u => u.id === currentUser.id);
  const currentUserRole = currentUserInGroup?.pivot?.role || 'member';
  const isModeratorOrAdmin = ['admin', 'moderator'].includes(currentUserRole);

  const handleLeaveGroup = () => {
    if (!conversation.is_group) {
      return;
    }

    if (confirm('Are you sure you want to leave this group?')) {
      axios.post(route('group.leave', conversation.id))
        .then(response => {
          toast.success(response.data.message);
          router.visit(route('home'));
        })
        .catch(error => {
          toast.error(error.response?.data?.message || 'Failed to leave group');
        });
    }
  };

  const handleDeleteGroup = () => {
    if (!conversation.is_group || !isOwner) {
      return;
    }

    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      axios.delete(route('group.delete', conversation.id))
        .then(() => {
          toast.success('Group deleted successfully');
          router.visit(route('home'));
        })
        .catch(error => {
          toast.error('Failed to delete group');
        });
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Menu as="div" className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
        <div>
          <MenuButton onClick={(e) => e.stopPropagation()} className="flex justify-center items-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-900 focus:outline-none">
            <span className="sr-only">Open options</span>
            <Iconify icon="mdi:dots-vertical" className="w-4 h-4" />
          </MenuButton>
        </div>
        <Transition
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'
        >
          <MenuItems className="absolute right-0 mt-2 w-48 rounded-md bg-slate-400 dark:bg-gray-700 shadow-lg z-[9999] focus:outline-none">
            <div className='p-1'>
              {/* Group Info */}
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={() => router.visit(route('chat.group', conversation.id))}
                    className={`${focus ? 'bg-slate-500 text-white' : 'text-gray-900 dark:text-gray-200'
                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  >
                    <Iconify icon="mdi:information" className="w-6 h-6 mr-2" />
                    <span>Group Info</span>
                  </button>
                )}
              </MenuItem>

              {/* Leave Group - Show for all members except owner */}
              {!isOwner && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleLeaveGroup}
                      className={`${focus ? 'bg-slate-500 text-white' : 'text-gray-900 dark:text-gray-200'
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                    >
                      <Iconify icon="mdi:exit-run" className="w-6 h-6 mr-2" />
                      <span>Leave Group</span>
                    </button>
                  )}
                </MenuItem>
              )}

              {/* Delete Group - Show only for owner */}
              {isOwner && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleDeleteGroup}
                      className={`${focus ? 'bg-red-600 text-white' : 'text-red-600 dark:text-red-400'
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                    >
                      <Iconify icon="mdi:delete" className="w-6 h-6 mr-2" />
                      <span>Delete Group</span>
                    </button>
                  )}
                </MenuItem>
              )}
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  )
}

export default GroupOptions
