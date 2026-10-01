import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { reminderDestination } from '../logic/reminders';
import { syncReminders } from '../notifications/reminders';
import { useProgress } from '../store/progress';
import { useReminderSettings } from '../store/reminders';
import { useSettings } from '../store/settings';

export function useReminderSync(ready: boolean): void {
  const router = useRouter();
  const navigation = useRootNavigationState();
  const prefs = useReminderSettings((s) => s.prefs);
  const lang = useSettings((s) => s.lang);
  const examDate = useSettings((s) => s.examDate);
  const goal = useSettings((s) => s.dailyGoalMin);
  const onboarded = useSettings((s) => s.onboarded);
  const cards = useProgress((s) => s.cards);
  const handled = useRef(new Set<string>());
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const sync = () => { if (useReminderSettings.persist.hasHydrated()) void syncReminders().catch(() => undefined); };
    const timer = setTimeout(sync, 300);
    const unsub = useReminderSettings.persist.onFinishHydration(sync);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') sync(); });
    return () => { clearTimeout(timer); unsub(); listener.remove(); };
  }, [ready, prefs, lang, examDate, goal, onboarded, cards]);
  useEffect(() => {
    if (!ready || !onboarded || !navigation?.key || Platform.OS === 'web') return;
    let live = true;
    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!live || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const id = response.notification.request.identifier;
      const route = reminderDestination(response.notification.request.content.data);
      if (!route || handled.current.has(id)) return;
      handled.current.add(id);
      router.push(route);
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    };
    void Notifications.getLastNotificationResponseAsync().then(handle).catch(() => undefined);
    const listener = Notifications.addNotificationResponseReceivedListener(handle);
    return () => { live = false; listener.remove(); };
  }, [ready, onboarded, navigation?.key, router]);
}
