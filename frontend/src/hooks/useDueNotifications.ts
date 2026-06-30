import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useNoteStore } from '@/store/noteStore';
import { useAlertStore } from '@/store/alertStore';

// expo-notifications was removed from Expo Go in SDK 53 (both remote AND local).
// All notification code is guarded and only runs in real dev builds / production APK.
const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    Notifications = null;
  }
}

async function requestPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

export async function cancelNoteNotification(noteId: string): Promise<void> {
  if (isExpoGo || !Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`due-note-${noteId}`);
  } catch {
  }
}

export function useDueNotifications() {
  const notes = useNoteStore(state => state.notes);

  useEffect(() => {
    if (!notes || notes.length === 0) return;

    const now = new Date();

    // Find notes due within 5 days that are still active
    const dueSoonNotes = notes.filter(note => {
      if (note.isGiven) return false;
      const end = new Date(note.endDate);
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 5;
    });

    if (dueSoonNotes.length > 0) {
      if (isExpoGo) {
        // Fallback for Expo Go: Show an in-app Alert!
        const alertMessages = dueSoonNotes.map(note => {
          const end = new Date(note.endDate);
          const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          let urgency = diffDays < 0 ? `OVERDUE (${Math.abs(diffDays)} days)` : diffDays === 0 ? 'DUE TODAY' : `Due in ${diffDays} days`;
          return `• ${note.name}: ₹${note.amount} - ${urgency}`;
        });

        // Use the global CustomAlert instead of the native Alert
        useAlertStore.getState().showAlert({
          title: "💰 Due Notes Alert!",
          message: "The following notes are nearing their deadline or overdue:\n\n" + alertMessages.join('\n'),
          onConfirm: () => {},
          showCancel: false,
          confirmText: 'OK',
        });
      }
    }

    if (isExpoGo || !Notifications) return;

    (async () => {
      try {
        const granted = await requestPermissions();
        if (!granted) return;

        const scheduled = await Notifications!.getAllScheduledNotificationsAsync();
        const scheduledIds = new Set(scheduled.map(n => n.identifier));

        // Cancel notifications for notes that are now given or deleted
        const activeNoteIds = new Set(
          notes.filter(n => !n.isGiven).map(n => `due-note-${n.id}`)
        );
        for (const s of scheduled) {
          if (s.identifier.startsWith('due-note-') && !activeNoteIds.has(s.identifier)) {
            await Notifications!.cancelScheduledNotificationAsync(s.identifier);
          }
        }

        for (const note of dueSoonNotes) {
          const notifId = `due-note-${note.id}`;
          const end = new Date(note.endDate);
          const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let urgencyText: string;
          if (diffDays < 0) {
            urgencyText = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}!`;
          } else if (diffDays === 0) {
            urgencyText = 'Due today!';
          } else {
            urgencyText = `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
          }

          const content = {
            title: `💰 Note Due: ${note.name}`,
            body: `${urgencyText} • ₹${note.amount.toLocaleString()} • Due: ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
            data: { noteId: note.id },
            sound: true,
          };

          // Fire an immediate notification so user sees it right now
          await Notifications!.scheduleNotificationAsync({
            identifier: `${notifId}-immediate`,
            content,
            trigger: null,
          });

          // Schedule daily 9 AM repeat if not already scheduled
          if (!scheduledIds.has(notifId)) {
            await Notifications!.scheduleNotificationAsync({
              identifier: notifId,
              content,
              trigger: {
                type: 'daily' as any,
                hour: 9,
                minute: 0,
                repeats: true,
              } as any,
            });
          }
        }
      } catch (e) {
        // silently fail
      }
    })();
  }, [notes]);
}

export async function setupNotificationChannel() {
  if (isExpoGo || !Notifications) return;
  try {
    if (Platform.OS === 'android') {
      await Notifications!.setNotificationChannelAsync('due-notes', {
        name: 'Due Notes',
        importance: Notifications!.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
        description: 'Daily alerts for notes due within 5 days',
      });
    }
  } catch {
  }
}

export async function sendTestNotification() {
  if (isExpoGo) {
    useAlertStore.getState().showAlert({ title: 'Test Notification', message: 'Push notifications are working perfectly! 🚀 (Simulated in Expo Go)' });
    return;
  }
  if (!Notifications) return;
  try {
    const granted = await requestPermissions();
    if (!granted) return;
    await Notifications!.scheduleNotificationAsync({
      content: {
        title: 'WealthifyPro Test',
        body: 'Push notifications are working perfectly! 🚀',
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    useAlertStore.getState().showAlert({ title: 'Error', message: 'Failed to send notification. Check your device permissions.' });
  }
}
