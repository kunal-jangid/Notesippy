import { NativeModules, Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  AndroidStyle
} from '@notifee/react-native';
import { Note } from './notesStore';

const { SamsungNowBar } = NativeModules;

export const NOWBAR_NOTIFICATION_ID = 'nowbar-live-note';
const NOWBAR_PINNED_KEY = 'notesippy_pinned_nowbar_note_id';

export async function showLockscreenLiveNote(note: Note) {
  // 1. Ensure runtime notification permission is granted
  await notifee.requestPermission();

  // Track the note currently shown on the lockscreen in MMKV
  try {
    const { storage } = require('./notesStore');
    storage.set(NOWBAR_PINNED_KEY, note.id);
  } catch (e) {
    console.warn('Storage set failed in notificationService:', e);
  }

  // 2. If running on Android and SamsungNowBar native module is available, use it
  if (Platform.OS === 'android' && SamsungNowBar) {
    const durationMs = (note.reminderPeriod || 15) * 60 * 1000;
    const endTimeMillis = Date.now() + durationMs;
    SamsungNowBar.showLiveNote(
      note.content || 'No content',
      '',
      endTimeMillis
    );
    return;
  }

  // 3. Fallback to standard Notifee channel and notification configuration
  const channelId = await notifee.createChannel({
    id: 'nowbar-live-capsule-v4',
    name: 'Live Lockscreen Pill',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: false,
    sound: 'default',
  });

  await notifee.displayNotification({
    id: NOWBAR_NOTIFICATION_ID, // Fixed ID to ensure only one note is pinned
    title: note.content || 'No content',
    body: undefined,
    data: { noteId: note.id },
    android: {
      channelId,
      ongoing: true, // Non-dismissible
      autoCancel: false, // Keeps it pinned
      asForegroundService: true, // System-wide foreground process
      category: AndroidCategory.NAVIGATION, // Triggers System Live Capsule / Samsung Now Bar
      visibility: AndroidVisibility.PUBLIC,
      showChronometer: true,
      chronometerDirection: 'down',
      timestamp: Date.now() + (note.reminderPeriod || 15) * 60 * 1000, // Dynamic countdown timer based on reminderPeriod
      style: {
        type: AndroidStyle.BIGTEXT, // Valid Notifee style type
        text: note.content || 'No content provided',
      },
      actions: [
        {
          title: '📌 Open Note',
          pressAction: {
            id: 'open-note',
            launchActivity: 'default',
          },
        },
      ],
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
  });
}

export async function removeLockscreenNote(noteId: string) {
  try {
    const { storage } = require('./notesStore');
    const pinnedId = storage.getString(NOWBAR_PINNED_KEY);
    // Only cancel the notification if it belongs to the note being deleted/turned off
    if (pinnedId === noteId) {
      if (Platform.OS === 'android' && SamsungNowBar) {
        SamsungNowBar.dismissLiveNote();
      } else {
        await notifee.cancelNotification(NOWBAR_NOTIFICATION_ID);
      }
      storage.delete(NOWBAR_PINNED_KEY);
    }
  } catch (e) {
    console.warn('removeLockscreenNote failed:', e);
  }
}