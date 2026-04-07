import { useCallback, useEffect } from 'react';

const NOTIFICATION_PERMISSION_KEY = 'notification-permission-requested';

export function useNotifications() {
  const isSupported = 'Notification' in window;
  const permission = isSupported ? Notification.permission : 'denied';

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
    return result === 'granted';
  }, [isSupported]);

  const scheduleNotification = useCallback((title: string, body: string, tag: string, dueDate: string) => {
    if (!isSupported || Notification.permission !== 'granted') return;
    
    const due = new Date(dueDate);
    const now = new Date();
    // Notify at 9 AM on the due date
    const notifyAt = new Date(due);
    notifyAt.setHours(9, 0, 0, 0);
    
    const delay = notifyAt.getTime() - now.getTime();
    if (delay <= 0) return; // Already past
    if (delay > 7 * 24 * 60 * 60 * 1000) return; // More than 7 days away, skip for now
    
    setTimeout(() => {
      try {
        new Notification(title, {
          body,
          tag,
          icon: '/placeholder.svg',
        });
      } catch {}
    }, delay);
  }, [isSupported]);

  return { isSupported, permission, requestPermission, scheduleNotification };
}
