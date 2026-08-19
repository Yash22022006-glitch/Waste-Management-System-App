import { generateMockNotifications, NOTIFICATION_THRESHOLD, BIN_ASSIGNMENT_THRESHOLD } from '../constants';
import { Bin, Notification, NotificationType } from '../types';
import { authService } from './authService'; // Import authService
import { binService } from './binService';

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private lastNotifiedBinLevels: Map<string, number> = new Map();
  private uncollectedCriticalNotifiedBins: Set<string> = new Set(); // Tracks bins for which a critical alert has been sent
  private assignedNearFullNotifiedBins: Set<string> = new Set(); // Tracks bins that have triggered BIN_ASSIGNED_NEAR_FULL notification

  constructor() {
    // Subscribe to bin updates
    binService.subscribe(this.handleBinUpdates);
  }

  private handleBinUpdates = (updatedBins: Bin[]) => {
    const newNotifications: Notification[] = [];
    const allUsers = authService.getAllUsers(); // Get all users to find collector names

    updatedBins.forEach(bin => {
      const lastLevel = this.lastNotifiedBinLevels.get(bin.id) || 0;

      // BIN_NEAR_FULL notification
      if (bin.fillLevel >= NOTIFICATION_THRESHOLD && lastLevel < NOTIFICATION_THRESHOLD) {
        newNotifications.push({
          id: `notif-${bin.id}-${Date.now()}`,
          type: NotificationType.BIN_NEAR_FULL,
          message: `Bin ${bin.serialNumber} is ${bin.fillLevel}% full!`,
          timestamp: bin.lastUpdated,
          read: false,
          binId: bin.id,
        });
      } 
      // BIN_FULL notification
      else if (bin.fillLevel === 100 && lastLevel < 100) {
         newNotifications.push({
          id: `notif-${bin.id}-${Date.now()}`,
          type: NotificationType.BIN_FULL,
          message: `Bin ${bin.serialNumber} is FULL! Immediate action required.`,
          timestamp: bin.lastUpdated,
          read: false,
          binId: bin.id,
        });
      } 
      // BIN_COLLECTED notification (also clears critical and assigned-near-full tracking)
      else if (bin.status === 'collected' && (this.uncollectedCriticalNotifiedBins.has(bin.id) || this.assignedNearFullNotifiedBins.has(bin.id))) {
        this.uncollectedCriticalNotifiedBins.delete(bin.id);
        this.assignedNearFullNotifiedBins.delete(bin.id);
        newNotifications.push({
          id: `notif-${bin.id}-${Date.now()}`,
          type: NotificationType.BIN_COLLECTED,
          message: `Bin ${bin.serialNumber} has been collected and reset.`,
          timestamp: bin.lastUpdated,
          read: false,
          binId: bin.id,
        });
      }

      // NEW LOGIC: Critical alert for bins that are 100% full and remain uncollected
      if (bin.fillLevel === 100 && bin.status === 'full' && !this.uncollectedCriticalNotifiedBins.has(bin.id)) {
        newNotifications.push({
          id: `critical-notif-${bin.id}-${Date.now()}`,
          type: NotificationType.BIN_UNCOLLECTED_CRITICAL,
          message: `CRITICAL: Bin ${bin.serialNumber} is 100% full and unemptied! Urgent action required.`,
          timestamp: bin.lastUpdated,
          read: false,
          binId: bin.id,
        });
        this.uncollectedCriticalNotifiedBins.add(bin.id); // Mark as notified
      } else if (bin.fillLevel < 100 && this.uncollectedCriticalNotifiedBins.has(bin.id)) {
        // If bin is no longer full (e.g., reset after collection or error), remove from tracking
        this.uncollectedCriticalNotifiedBins.delete(bin.id);
      }

      // NEW LOGIC: Notification for bin assigned near full (75% threshold)
      const assignedCollector = allUsers.find(u => u.assignedBinIds?.includes(bin.id));
      if (bin.fillLevel >= BIN_ASSIGNMENT_THRESHOLD && assignedCollector && !this.assignedNearFullNotifiedBins.has(bin.id) && bin.status !== 'collected') {
        const message = `Bin ${bin.serialNumber} is ${bin.fillLevel}% full and assigned to ${assignedCollector.fullName || assignedCollector.username}!`;
        newNotifications.push({
          id: `assigned-notif-${bin.id}-${Date.now()}`,
          type: NotificationType.BIN_ASSIGNED_NEAR_FULL,
          message: message,
          timestamp: bin.lastUpdated,
          read: false,
          binId: bin.id,
        });
        this.assignedNearFullNotifiedBins.add(bin.id); // Mark as notified
        console.log(`[NotificationService] Generated BIN_ASSIGNED_NEAR_FULL: ${message}`);
      } else if (bin.fillLevel < BIN_ASSIGNMENT_THRESHOLD && this.assignedNearFullNotifiedBins.has(bin.id)) {
        // If fill level drops below threshold, reset tracking
        this.assignedNearFullNotifiedBins.delete(bin.id);
        console.log(`[NotificationService] Reset BIN_ASSIGNED_NEAR_FULL tracking for Bin ${bin.serialNumber}`);
      }


      this.lastNotifiedBinLevels.set(bin.id, bin.fillLevel);
    });

    if (newNotifications.length > 0) {
      // Filter out duplicate critical notifications for the same bin if already present and unread
      const existingUnreadCritical = new Set(
        this.notifications.filter(n => !n.read && n.type === NotificationType.BIN_UNCOLLECTED_CRITICAL).map(n => n.binId)
      );
      // Filter out duplicate assigned-near-full notifications
      const existingUnreadAssigned = new Set(
        this.notifications.filter(n => !n.read && n.type === NotificationType.BIN_ASSIGNED_NEAR_FULL).map(n => n.binId)
      );

      const uniqueNewNotifications = newNotifications.filter(n =>
        !(n.type === NotificationType.BIN_UNCOLLECTED_CRITICAL && existingUnreadCritical.has(n.binId)) &&
        !(n.type === NotificationType.BIN_ASSIGNED_NEAR_FULL && existingUnreadAssigned.has(n.binId))
      );

      if (uniqueNewNotifications.length > 0) {
        this.notifications = [...uniqueNewNotifications.reverse(), ...this.notifications]; // Add new ones to top
        this.notifyListeners();
      }
    }
  };

  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  public addReportNotification(reportId: string, issue: string) {
    const newNotification: Notification = {
      id: `report-notif-${reportId}-${Date.now()}`,
      type: NotificationType.REPORT_RECEIVED,
      message: `New report received: "${issue}" (ID: ${reportId})`,
      timestamp: new Date().toISOString(),
      read: false,
      reportId: reportId,
    };
    this.notifications = [newNotification, ...this.notifications];
    this.notifyListeners();
  }

  public markAsRead(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications[index].read = true;
      this.notifyListeners();
    }
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.notifyListeners();
  }

  public subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener);
    listener(this.getNotifications());
  }

  public unsubscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getNotifications()));
  }
}

export const notificationService = new NotificationService();