import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widgetHandler';
import notifee from '@notifee/react-native';

if (Platform.OS === 'android') {
  try {
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (err) {
    console.warn('[widget] task handler not registered:', err);
  }

  try {
    notifee.registerForegroundService((notification) => {
      return new Promise((resolve) => {
        // Automatically close/cancel after 15 minutes
        const duration = 15 * 60 * 1000;
        setTimeout(async () => {
          try {
            await notifee.cancelNotification(notification.id);
          } catch (e) {}
          resolve();
        }, duration);
      });
    });
  } catch (err) {
    console.warn('[notification] foreground service registration failed:', err);
  }
}

import 'expo-router/entry';
