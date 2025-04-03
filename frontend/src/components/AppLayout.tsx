'use client';

import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, BookOpenIcon, DocumentTextIcon } from '@heroicons/react/24/outline'; // Using Heroicons for icons
import Link from 'next/link';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'My Vocabulary', href: '#', icon: BookOpenIcon }, // TODO: Update href later
    { name: 'My Texts', href: '#', icon: DocumentTextIcon }, // TODO: Update href later
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
        <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-lg font-semibold leading-6 text-gray-900">
          Vibe Spanish Helper
        </div>
      </div>

      {/* Drawer */}
      <Transition show={sidebarOpen}>
        {/* Backdrop */}
        <Dialog className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
           <Transition.Child
             enter="transition-opacity ease-linear duration-300"
             enterFrom="opacity-0"
             enterTo="opacity-100"
             leave="transition-opacity ease-linear duration-300"
             leaveFrom="opacity-100"
             leaveTo="opacity-0"
           >
              <div className="fixed inset-0 bg-gray-900/80" />
           </Transition.Child>
           
           {/* Drawer panel */}
           <div className="fixed inset-0 flex">
              <Transition.Child
                  enter="transition ease-in-out duration-300 transform"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transition ease-in-out duration-300 transform"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
              >
                  <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                     <Transition.Child
                        enter="ease-in-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in-out duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                     >
                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                           <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                              <span className="sr-only">Close sidebar</span>
                              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                           </button>
                        </div>
                     </Transition.Child>
                     
                     {/* Sidebar content */}
                     <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                        <div className="flex h-16 shrink-0 items-center">
                           <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                        </div>
                        <nav className="flex flex-1 flex-col">
                           <ul role="list" className="flex flex-1 flex-col gap-y-7">
                              <li>
                                 <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                    <li key={item.name}>
                                       <Link
                                          href={item.href}
                                          onClick={() => setSidebarOpen(false)} // Close drawer on link click
                                          className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                       >
                                          <item.icon
                                          className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                                          aria-hidden="true"
                                          />
                                          {item.name}
                                       </Link>
                                    </li>
                                    ))}
                                 </ul>
                              </li>
                           </ul>
                        </nav>
                     </div>
                  </Dialog.Panel>
               </Transition.Child>
           </div>
        </Dialog>
      </Transition>

      {/* Static sidebar for desktop (optional, hidden for now) */}
      {/* <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        </div> */}

      {/* Main content area */}
      <main className="py-10">
        <div className="px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 