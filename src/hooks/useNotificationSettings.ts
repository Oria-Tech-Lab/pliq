import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationDefaults {
  defaultTime: string;
  defaultDaysBefore: number;
  emailEnabled: boolean;
  reminderDays: number[];
}

const DEFAULT_SETTINGS: NotificationDefaults = {
  defaultTime: '09:00',
  defaultDaysBefore: 1,
  emailEnabled: true,
  reminderDays: [3, 1, 0],
};

export function useNotificationSettings() {
  const [settings, setSettingsState] = useState<NotificationDefaults>(DEFAULT_SETTINGS);
  const [rowId, setRowId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!data) {
        const inserted = await supabase
          .from('notification_settings')
          .insert({ user_id: user.id })
          .select('*')
          .single();
        data = inserted.data;
      }
      if (data) {
        setRowId(data.id);
        setSettingsState({
          defaultTime: data.default_time,
          defaultDaysBefore: data.default_days_before,
          emailEnabled: (data as any).email_enabled ?? true,
          reminderDays: (data as any).reminder_days_array ?? [3, 1, 0],
        });
      }
    };
    load();
  }, []);

  const updateSettings = useCallback(async (partial: Partial<NotificationDefaults>) => {
    const next = { ...settings, ...partial };
    setSettingsState(next);
    if (rowId) {
      await supabase.from('notification_settings').update({
        default_time: next.defaultTime,
        default_days_before: next.defaultDaysBefore,
        email_enabled: next.emailEnabled,
        reminder_days_array: next.reminderDays,
      } as any).eq('id', rowId);
    }
  }, [settings, rowId]);

  return { settings, updateSettings };
}
