import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFS_KEY    = "@notifications/prefs";
const DAILY_ID_KEY = "@notifications/daily_id";

export interface NotificationPrefs {
  enabled:       boolean;
  onAdd:         boolean;
  onWatch:       boolean;
  dailyReminder: boolean;
  reminderHour:  number;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  enabled:       false,
  onAdd:         true,
  onWatch:       true,
  dailyReminder: false,
  reminderHour:  20,
};

export async function getPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ── Lazy setup: only loads expo-notifications after the bridge is ready ────────

let configured = false;

async function getNotifications() {
  const N = await import("expo-notifications");
  if (!configured) {
    configured = true;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
  return N;
}

// ── Permissions ───────────────────────────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
  try {
    const N = await getNotifications();
    const { status } = await N.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function hasPermission(): Promise<boolean> {
  try {
    const N = await getNotifications();
    const { status } = await N.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

// ── Instant notifications ─────────────────────────────────────────────────────

async function fire(title: string, body: string): Promise<void> {
  try {
    const N = await getNotifications();
    await N.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch { /* never crash the UI */ }
}

export async function notifyMovieAdded(movieTitle: string): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.enabled || !prefs.onAdd) return;
  await fire("Added to Watchlist 🎬", `"${movieTitle}" saved for later`);
}

export async function notifyMovieWatched(movieTitle: string): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.enabled || !prefs.onWatch) return;
  await fire("Movie Watched ✅", `You finished "${movieTitle}". Great choice!`);
}

export async function notifySeriesCompleted(movieTitle: string): Promise<void> {
  const prefs = await getPrefs();
  if (!prefs.enabled || !prefs.onWatch) return;
  await fire("Series Completed 🎉", `All parts of "${movieTitle}" are done!`);
}

// ── Daily reminder ────────────────────────────────────────────────────────────

export async function scheduleDailyReminder(
  hour: number,
  queueCount: number
): Promise<void> {
  try {
    const N = await getNotifications();
    const existingId = await AsyncStorage.getItem(DAILY_ID_KEY).catch(() => null);
    if (existingId) {
      await N.cancelScheduledNotificationAsync(existingId).catch(() => {});
    }
    const body =
      queueCount > 0
        ? `You have ${queueCount} movie${queueCount > 1 ? "s" : ""} waiting. Pick one tonight! 🍿`
        : "Your watchlist is empty — add something to watch! 🎬";
    const id = await N.scheduleNotificationAsync({
      content: { title: "Movie Night Reminder 🎬", body, sound: true },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
    await AsyncStorage.setItem(DAILY_ID_KEY, id);
  } catch { /* ignore */ }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    const N = await getNotifications();
    const existingId = await AsyncStorage.getItem(DAILY_ID_KEY).catch(() => null);
    if (existingId) {
      await N.cancelScheduledNotificationAsync(existingId).catch(() => {});
      await AsyncStorage.removeItem(DAILY_ID_KEY);
    }
  } catch { /* ignore */ }
}
