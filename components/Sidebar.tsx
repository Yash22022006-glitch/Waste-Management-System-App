import React from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose }) => {
  // CRITICAL FIX: Removed lg:translate-x-0 to ensure sidebar is hidden by default on all screen sizes
  const baseClasses = "fixed inset-y-0 left-0 transform bg-gray-800 text-white w-64 p-4 space-y-4 shadow-lg z-40 transition-transform duration-300 ease-in-out";
  const dynamicClasses = isOpen ? "translate-x-0" : "-translate-x-full"; // Controls open/close state for all screen sizes

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
    { path: '/map', label: 'Map', roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
    { path: '/reports', label: 'Reports', roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
    { path: '/notifications', label: 'Notifications', roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
    { path: '/profile', label: 'Profile', roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] }, // New Profile link
    { path: '/settings', label: 'Settings', roles: [UserRole.ADMIN] }, // Example admin-only link
  ];

  return (
    <>
      {/* Overlay for all screen sizes when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30" // Removed lg:hidden here, overlay always active
          onClick={onClose}
          aria-label="Close sidebar by clicking outside"
        ></div>
      )}

      <aside className={`${baseClasses} ${dynamicClasses}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="text-white focus:outline-none p-2 rounded-md hover:bg-gray-700 transition-colors" // Removed lg:hidden here, close button always visible
            aria-label="Close sidebar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <nav>
          <ul className="space-y-2">
            {navLinks.map((link) => (
              user && link.roles.includes(user.role) && (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={onClose} // This correctly closes the sidebar on navigation
                    className="block p-3 rounded-md hover:bg-gray-700 transition duration-200 ease-in-out text-lg"
                  >
                    {link.label}
                  </Link>
                </li>
              )
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;