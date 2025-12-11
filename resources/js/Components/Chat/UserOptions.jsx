import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import React, { Fragment } from 'react'
import Iconify from '../Iconify';
import axios from 'axios';
import { router, usePage } from '@inertiajs/react';
import { useToast } from '../../Hooks/useToast';

function UserOptions({ conversation }) {
  const isBlocked = conversation.i_blocked || false;
  const toast = useToast();
  const page = usePage();

  const handleBlockUser = () => {
    if (!conversation.is_user) {
      return;
    }

    const url = isBlocked 
      ? route('user.unblock', conversation.id)
      : route('user.block', conversation.id);
    
    const method = isBlocked ? 'delete' : 'post';

    axios({
      method: method,
      url: url
    })
      .then(response => {
        toast.success(response.data.message);
      })
      .catch(error => {
        toast.error(error.response?.data?.message || 'An error occurred');
        console.error('Error blocking/unblocking user:', error);
      });
  }

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
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={handleBlockUser}
                    className={`${focus ? 'bg-slate-500 text-white' : 'text-gray-900 dark:text-gray-200'
                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  >
                    {isBlocked ? (
                      <>
                        <Iconify icon="mdi:account-check" className="w-6 h-6 mr-2" />
                        <span>Unblock User</span>
                      </>
                    ) : (
                      <>
                        <Iconify icon="mdi:account-off" className="w-6 h-6 mr-2" />
                        <span>Block User</span>
                      </>
                    )}
                  </button>
                )}
              </MenuItem>
              {isBlocked && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this conversation?')) {
                          axios.delete(route('conversation.delete', conversation.id))
                            .then(() => {
                              toast.success('Conversation deleted');
                              // Navigate to home page after deleting conversation
                              router.visit(route('home'));
                            })
                            .catch(error => {
                              toast.error('Failed to delete conversation');
                            });
                        }
                      }}
                      className={`${focus ? 'bg-slate-500 text-white' : 'text-gray-900 dark:text-gray-200'
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                    >
                      <Iconify icon="mdi:delete" className="w-6 h-6 mr-2" />
                      <span>Delete Conversation</span>
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

export default UserOptions