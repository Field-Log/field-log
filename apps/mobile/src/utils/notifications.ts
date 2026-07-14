import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const REMINDER_ID_KEY = "carry_reminder_id";
const REMINDER_ENABLED_KEY = "carry_reminder_enabled";
const REMINDER_HOUR_KEY = "carry_reminder_hour";
const REMINDER_MINUTE_KEY = "carry_reminder_minute";

export const DEFAULT_HOUR = 20;
export const DEFAULT_MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getReminderSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(REMINDER_ENABLED_KEY),
    AsyncStorage.getItem(REMINDER_HOUR_KEY),
    AsyncStorage.getItem(REMINDER_MINUTE_KEY),
  ]);
  return {
    enabled: enabled === "true",
    hour: hour != null ? parseInt(hour, 10) : DEFAULT_HOUR,
    minute: minute != null ? parseInt(minute, 10) : DEFAULT_MINUTE,
  };
}

export async function scheduleCarryReminder(
  hour: number,
  minute: number,
): Promise<void> {
  // Cancel any existing reminder
  const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Field Log",
      body: "Don't forget to log what you're carrying today.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await Promise.all([
    AsyncStorage.setItem(REMINDER_ID_KEY, id),
    AsyncStorage.setItem(REMINDER_ENABLED_KEY, "true"),
    AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour)),
    AsyncStorage.setItem(REMINDER_MINUTE_KEY, String(minute)),
  ]);
}

export async function cancelCarryReminder(): Promise<void> {
  const existingId = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await AsyncStorage.removeItem(REMINDER_ID_KEY);
  }
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, "false");
}
