import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import React, { Fragment } from 'react'
import Iconify from '../Iconify';
import axios from 'axios';

function UserOptions({ conversation }) {
  const handleBlockUser = () => {
    if (!conversation.is_user) {
      return;
    }

    axios.post(route('user.block', conversation.id))
      .then(response => {
        // Handle successful block
        console.log('User blocked:', response.data);
      })
      .catch(error => {
        // Handle error
        console.error('Error blocking user:', error);
      });
  }

  const handleUserRole = () => {
    if (!conversation.is_user) {
      return;
    }

    axios.post(route('user.role', conversation.id))
      .then(response => {
        // Handle successful role change
        console.log('User role changed:', response.data);
      })
      .catch(error => {
        // Handle error
        console.error('Error changing user role:', error);
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
          <MenuItems className="absolute right-0 mt-2 w-48 rounded-md bg-slate-400 dark:bg-gray-700 shadow-lg z-50 focus:outline-none">
            <div className='p-1'>
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={handleBlockUser}
                    className={`${focus ? 'bg-slate-500 text-white' : 'text-gray-900 dark:text-gray-200'
                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  >
                    {conversation.blocked_at ? (
                      <>
                        <Iconify icon="mdi:account-off" className="w-6 h-6 mr-2" />
                        <span>Unblock User</span>
                      </>
                    ) : (
                      <>
                        <Iconify icon="mdi:account-check" className="w-6 h-6 mr-2" />
                        <span>Block User</span>
                      </>
                    )}
                  </button>
                )}
              </MenuItem>
            </div>
            <div className='p-1'>
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={handleUserRole}
                    className={`${focus ? 'bg-slate-500 text-white' : 'text-gray-900 dark:text-gray-200'
                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                  >
                    {conversation.is_admin ? (
                      <>
                        <Iconify icon="solar:user-linear" className="w-6 h-6 mr-2" />
                        <span>Make User</span>
                      </>
                    ) : (
                      <>
                        <Iconify icon="iconamoon:shield-yes-light" className="w-6 h-6 mr-2" />
                        <span>Make Admin</span>
                      </>
                    )}
                  </button>
                )}
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  )
}

export default UserOptions