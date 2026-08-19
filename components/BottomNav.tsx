import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, Map, FileText, Bell, User, Settings } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface BottomNavProps {
  user: UserType | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ user }) => {
  if (!user) return null;

  const navLinks = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
    { path: '/map', label: 'Map', icon: Map, roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
    { path: '/reports', label: 'Reports', icon: FileText, roles: [UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
    { path: '/notifications', label: 'Alerts', icon: Bell, roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
    { path: '/profile', label: 'Profile', icon: User, roles: [UserRole.ADMIN, UserRole.COLLECTOR, UserRole.COMMUNITY_MEMBER] },
  ];

  // Add settings for admin only
  if (user.role === UserRole.ADMIN) {
    navLinks.push({ path: '/settings', label: 'Settings', icon: Settings, roles: [UserRole.ADMIN] });
  }

  const filteredLinks = navLinks.filter(link => link.roles.includes(user.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 glass-panel rounded-none border-x-0 border-b-2 border-t-0 border-blue-600 z-50 px-2 flex justify-around items-center">
      {filteredLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${
                isActive ? 'text-blue-500' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full"
                  />
                )}
                <Icon size={20} className="mb-1 relative z-10" />
                <span className="text-[8px] font-black uppercase tracking-widest mono relative z-10">{link.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
