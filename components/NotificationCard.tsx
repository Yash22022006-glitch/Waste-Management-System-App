import React from 'react';
import { motion } from 'motion/react';
import { Trash2, AlertTriangle, FileText, CheckCircle2, AlertCircle, User as UserIcon, Bell } from 'lucide-react';
import { Notification, NotificationType } from '../types';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onMarkAsRead }) => {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BIN_FULL:
        return <Trash2 className="text-red-600" size={20} />;
      case NotificationType.BIN_NEAR_FULL:
        return <AlertTriangle className="text-amber-600" size={20} />;
      case NotificationType.REPORT_RECEIVED:
        return <FileText className="text-blue-600" size={20} />;
      case NotificationType.BIN_COLLECTED:
        return <CheckCircle2 className="text-emerald-600" size={20} />;
      case NotificationType.BIN_UNCOLLECTED_CRITICAL:
        return <AlertCircle className="text-red-600 animate-pulse" size={20} />;
      case NotificationType.BIN_ASSIGNED_NEAR_FULL:
        return <UserIcon className="text-primary-600" size={20} />;
      case NotificationType.GENERAL_ALERT:
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getBgColor = (read: boolean): string => {
    if (notification.type === NotificationType.BIN_UNCOLLECTED_CRITICAL) {
      return read ? 'bg-red-50' : 'bg-red-100';
    }
    if (notification.type === NotificationType.BIN_ASSIGNED_NEAR_FULL) {
      return read ? 'bg-blue-50' : 'bg-blue-100';
    }
    return read ? 'bg-white' : 'bg-primary-50';
  };

  const getBorderColor = (read: boolean): string => {
    if (notification.type === NotificationType.BIN_UNCOLLECTED_CRITICAL) {
      return 'border-red-500';
    }
    if (notification.type === NotificationType.BIN_ASSIGNED_NEAR_FULL) {
      return 'border-primary-500';
    }
    return read ? 'border-gray-100' : 'border-primary-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start p-4 rounded-2xl shadow-sm mb-3 transition-all duration-200 ${getBgColor(notification.read)} border border-gray-100 border-l-4 ${getBorderColor(notification.read)}`}
    >
      <div className={`flex-shrink-0 mr-4 p-2.5 rounded-xl bg-white shadow-sm border border-gray-50`}>
        {getIcon(notification.type)}
      </div>
      <div className="flex-grow">
        <p className={`text-sm text-gray-800 leading-relaxed ${notification.read ? 'font-normal' : 'font-bold'}`}>
          {notification.message}
        </p>
        <div className="flex items-center mt-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          <span>{new Date(notification.timestamp).toLocaleDateString()}</span>
          <span className="mx-1.5">•</span>
          <span>{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      {!notification.read && (
        <button
          onClick={() => onMarkAsRead(notification.id)}
          className="ml-3 p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          aria-label="Mark as read"
        >
          <CheckCircle2 size={18} />
        </button>
      )}
    </motion.div>
  );
};

export default NotificationCard;