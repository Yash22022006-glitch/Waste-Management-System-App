import React, { useEffect, useState, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import NotificationCard from '../components/NotificationCard';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(() => {
    setNotifications(notificationService.getNotifications());
  }, []);

  useEffect(() => {
    fetchNotifications();
    notificationService.subscribe(setNotifications);
    return () => {
      notificationService.unsubscribe(setNotifications);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Notifications</h2>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Mark All As Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-600">No new notifications.</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;