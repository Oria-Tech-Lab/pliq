import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationDefaults {
  defaultTime: string;
  defaultDaysBefore: number;
}

const DEFAULT_SETTINGS: NotificationDefaults = { defaultTime: '09:00', defaultDaysBefore: 1 };

export function useNotificationSettings() {
  const [settings, setSettingsState] = useState<NotificationDefaults>(DEFAULT_SETTINGS);
  const [rowId, setRowId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('notification_settings').select('*').limit(1).single();
      if (data) {
        setRowId(data.id);
        setSettingsState({ defaultTime: data.default_time, defaultDaysBefore: data.default_days_before });
      }
    };
    load();
  }, []);

  const updateSettings = useCallback(async (partial: Partial<NotificationDefaults>) => {
    const next = { ...settings, ...partial };
    setSettingsState(next);
    if (rowId) {
      await supabase.from('notification_settings').update({
        default_time: next.defaultTime, default_days_before: next.defaultDaysBefore,
      }).eq('id', rowId);
    }
  }, [settings, rowId]);

  return { settings, updateSettings };
}
