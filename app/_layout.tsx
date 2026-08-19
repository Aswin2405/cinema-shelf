import React, { Suspense, useMemo, useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WatchlistProvider, useWatchlist } from "@/hooks/useWatchlist";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ModalProvider, useModal } from "@/context/ModalContext";
import { LockProvider, useLock } from "@/context/LockContext";
import { LockScreen } from "@/components/LockScreen";
import { DatabaseProvider } from "@/components/DatabaseProvider";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { ServerWakingNotice } from "@/components/ServerWakingNotice";
import {
  getPrefs,
  scheduleDailyReminder,
  hasPermission,
} from "@/services/notifications";

// Hold the native splash until AnimatedSplash has painted the same artwork in
// JS, so the handover between the two is seamless.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Lazy-loaded: JS not parsed until the user taps "+"
const AddMovieModal = React.lazy(() =>
  import("@/components/AddMovieModal").then((m) => ({ default: m.AddMovieModal }))
);

function GlobalModals() {
  const { addMovie, toWatch, watched } = useWatchlist();
  const { isAddOpen, closeAdd } = useModal();

  const allMovies = useMemo(() => [...toWatch, ...watched], [toWatch, watched]);
  const existingCategories = useMemo(
    () => Array.from(new Set(allMovies.map((m) => m.category))).filter(Boolean),
    [allMovies]
  );
  const existingWatchOn = useMemo(
    () => Array.from(new Set(allMovies.map((m) => m.watchOn))).filter(Boolean),
    [allMovies]
  );
  const existingLanguages = useMemo(
    () => Array.from(new Set(allMovies.map((m) => m.language ?? ""))).filter(Boolean),
    [allMovies]
  );
  const existingTitles = useMemo(() => allMovies.map((m) => m.title), [allMovies]);

  if (!isAddOpen) return null;

  return (
    <Suspense fallback={null}>
      <AddMovieModal
        visible
        onClose={closeAdd}
        onAdd={addMovie}
        existingCategories={existingCategories}
        existingWatchOn={existingWatchOn}
        existingLanguages={existingLanguages}
        existingTitles={existingTitles}
      />
    </Suspense>
  );
}

function AppContent() {
  const { isDark } = useTheme();
  const { isLocked } = useLock();
  const { toWatch, wakingUp, loadFailed, retryLoad } = useWatchlist();

  // On startup: re-schedule the daily reminder with the current queue count
  // (only on native — web doesn't support push notifications)
  useEffect(() => {
    if (Platform.OS === "web") return;
    const init = async () => {
      const granted = await hasPermission();
      if (!granted) return;
      const prefs = await getPrefs();
      if (prefs.enabled && prefs.dailyReminder) {
        await scheduleDailyReminder(prefs.reminderHour, toWatch.length);
      }
    };
    init().catch(() => {});
  // Run once on mount — toWatch is not a dep intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <GlobalModals />
      {/* Sits over whichever tab's shimmer is showing */}
      {(wakingUp || loadFailed) && (
        <ServerWakingNotice failed={loadFailed} onRetry={retryLoad} />
      )}
      {isLocked && <LockScreen />}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <DatabaseProvider>
        <ThemeProvider>
          <LockProvider>
            <ModalProvider>
              <WatchlistProvider>
                <AppContent />
              </WatchlistProvider>
            </ModalProvider>
          </LockProvider>
        </ThemeProvider>
      </DatabaseProvider>
      </SafeAreaProvider>
      {/* Last child, and full-bleed: covers the app while it boots */}
      <AnimatedSplash />
    </GestureHandlerRootView>
  );
}
