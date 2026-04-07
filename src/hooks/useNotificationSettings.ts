import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'notification-default-settings';

export interface NotificationDefaults {
  defaultTime: string; // HH:mm
  defaultDaysBefore: number;
}

const DEFAULT_SETTINGS: NotificationDefaults = {
  defaultTime: '09:00',
  defaultDaysBefore: 1,
};

export function useNotificationSettings() {
  const [settings, setSettingsState] = useState<NotificationDefaults>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = useCallback((partial: Partial<NotificationDefaults>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
