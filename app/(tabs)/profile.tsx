import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useWatchlist } from "@/hooks/useWatchlist";
import { LightColors, Typography, Spacing, Radius, Shadow } from "@/constants/theme";
import { GenreBadge } from "@/components/GenreBadge";
import { useTheme } from "@/context/ThemeContext";
import { useLock } from "@/context/LockContext";
import {
  NotificationPrefs,
  DEFAULT_PREFS,
  getPrefs,
  savePrefs,
  requestPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
} from "@/services/notifications";

// ── Share helper ──────────────────────────────────────────────────────────────
function buildShareText(
  toWatch: ReturnType<typeof useWatchlist>["toWatch"],
  watched: ReturnType<typeof useWatchlist>["watched"]
): string {
  const fmt = (m: (typeof toWatch)[0]) => {
    let line = `• ${m.title}`;
    if (m.category) line += ` [${m.category}]`;
    if (m.watchOn) line += ` — ${m.watchOn}`;
    if (m.notes) line += `\n  📝 ${m.notes}`;
    const subs = m.subMovies || [];
    if (subs.length > 0) {
      const subLines = subs.map((s) => `    ${s.watched ? "✅" : "⬜"} ${s.title}`).join("\n");
      line += `\n${subLines}`;
    }
    return line;
  };
  const lines: string[] = ["🎬 My Movie Watchlist", ""];
  if (toWatch.length > 0) {
    lines.push(`📋 To Watch (${toWatch.length}):`);
    toWatch.forEach((m) => lines.push(fmt(m)));
    lines.push("");
  }
  if (watched.length > 0) {
    lines.push(`✅ Watched (${watched.length}):`);
    watched.forEach((m) => lines.push(fmt(m)));
    lines.push("");
  }
  lines.push("Shared via Watchlist App");
  return lines.join("\n");
}

// ── Reminder time presets ─────────────────────────────────────────────────────
const REMINDER_TIMES = [
  { label: "6 PM", hour: 18 },
  { label: "7 PM", hour: 19 },
  { label: "8 PM", hour: 20 },
  { label: "9 PM", hour: 21 },
  { label: "10 PM", hour: 22 },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { toWatch, watched } = useWatchlist();
  const { colors, isDark, toggleTheme } = useTheme();
  const { lockApp } = useLock();

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  // Load saved prefs on mount
  useEffect(() => {
    getPrefs().then(setPrefs).catch(() => {});
  }, []);

  const updatePrefs = useCallback(async (patch: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    await savePrefs(next);

    // Reschedule or cancel daily reminder when relevant prefs change
    if ("dailyReminder" in patch || "reminderHour" in patch || "enabled" in patch) {
      if (next.enabled && next.dailyReminder) {
        await scheduleDailyReminder(next.reminderHour, toWatch.length);
      } else {
        await cancelDailyReminder();
      }
    }
  }, [prefs, toWatch.length]);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Push notifications are not available on web.");
      return;
    }
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Denied",
          "Please enable notifications for this app in your device Settings.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    await updatePrefs({ enabled: value });
  }, [updatePrefs]);

  // Stats
  const allMovies = [...toWatch, ...watched];
  const categoryMap: Record<string, number> = {};
  allMovies.forEach((m) => {
    if (m.category) categoryMap[m.category] = (categoryMap[m.category] || 0) + 1;
  });
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  const totalMinutes = allMovies.reduce((acc, m) => {
    const match = m.duration?.match(/(\d+)h\s*(\d+)?m?/);
    if (!match) return acc;
    return acc + parseInt(match[1]) * 60 + parseInt(match[2] || "0");
  }, 0);

  const handleShare = async () => {
    try {
      await Share.share({ message: buildShareText(toWatch, watched) });
    } catch {}
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primary + "28", colors.background]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.avatarRing, { borderColor: colors.primary + "40" }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
              <Text style={styles.avatarEmoji}>🎬</Text>
            </View>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>Aswin</Text>
          <Text style={[styles.handle, { color: colors.textSecondary }]}>@cinephile</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={[styles.statsCard, { borderColor: colors.border }, Shadow.sm]}>
          {[
            { value: allMovies.length, label: "Total" },
            { value: watched.length, label: "Watched" },
            { value: `${Math.floor(totalMinutes / 60)}h`, label: "Runtime" },
            { value: toWatch.length, label: "Queue" },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Categories</Text>
            <View style={[styles.sectionCard, { borderColor: colors.border }, Shadow.sm]}>
              <View style={styles.categoryRow}>
                {topCategories.map((cat) => (
                  <View key={cat} style={styles.categoryItem}>
                    <GenreBadge category={cat} />
                    <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                      {categoryMap[cat]} films
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Notification Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={[styles.sectionCard, { borderColor: colors.border }, Shadow.sm]}>

            {/* Master toggle */}
            <View style={styles.settingRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingLabel}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>Push Notifications</Text>
                <Text style={[styles.settingHint, { color: colors.textTertiary }]}>
                  {prefs.enabled ? "Enabled" : "Tap to enable"}
                </Text>
              </View>
              <Switch
                value={prefs.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Sub-settings (shown when enabled) */}
            {prefs.enabled && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />

                <View style={styles.settingRow}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.settingLabel}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Movie Added</Text>
                    <Text style={[styles.settingHint, { color: colors.textTertiary }]}>
                      When you save a new movie
                    </Text>
                  </View>
                  <Switch
                    value={prefs.onAdd}
                    onValueChange={(v) => updatePrefs({ onAdd: v })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />

                <View style={styles.settingRow}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.settingLabel}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Movie Watched</Text>
                    <Text style={[styles.settingHint, { color: colors.textTertiary }]}>
                      When you mark a movie as watched
                    </Text>
                  </View>
                  <Switch
                    value={prefs.onWatch}
                    onValueChange={(v) => updatePrefs({ onWatch: v })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />

                {/* Daily reminder toggle */}
                <View style={styles.settingRow}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="alarm-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.settingLabel}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Daily Reminder</Text>
                    <Text style={[styles.settingHint, { color: colors.textTertiary }]}>
                      Remind me to watch something
                    </Text>
                  </View>
                  <Switch
                    value={prefs.dailyReminder}
                    onValueChange={(v) => updatePrefs({ dailyReminder: v })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>

                {/* Time picker (shown when daily reminder is on) */}
                {prefs.dailyReminder && (
                  <View style={styles.timePickerWrap}>
                    <Text style={[styles.timePickerLabel, { color: colors.textSecondary }]}>
                      Remind me at
                    </Text>
                    <View style={styles.timeChips}>
                      {REMINDER_TIMES.map((t) => {
                        const active = prefs.reminderHour === t.hour;
                        return (
                          <TouchableOpacity
                            key={t.hour}
                            style={[
                              styles.timeChip,
                              { borderColor: colors.border, backgroundColor: colors.background },
                              active && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => updatePrefs({ reminderHour: t.hour })}
                            activeOpacity={0.75}
                          >
                            <Text style={[
                              styles.timeChipText,
                              { color: active ? "#fff" : colors.textSecondary },
                            ]}>
                              {t.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* ── Other Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={[styles.sectionCard, { borderColor: colors.border }, Shadow.sm]}>
            {[
              {
                icon: (isDark ? "sunny-outline" : "moon-outline") as "sunny-outline" | "moon-outline",
                label: "Appearance",
                hint: isDark ? "Dark mode" : "Light mode",
                onPress: toggleTheme,
              },
              {
                icon: "lock-closed-outline" as const,
                label: "Privacy Lock",
                hint: "Lock app with biometrics",
                onPress: lockApp,
              },
              {
                icon: "share-social-outline" as const,
                label: "Share Watchlist",
                hint: "Export your movie list",
                onPress: handleShare,
              },
            ].map((item, idx, arr) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity style={styles.settingRow} onPress={item.onPress} activeOpacity={0.65}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.settingLabel}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.settingHint, { color: colors.textTertiary }]}>{item.hint}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
                {idx < arr.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: typeof LightColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { paddingBottom: 78 },
    hero: {
      alignItems: "center",
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xl + 8,
      marginBottom: Spacing.base,
      gap: Spacing.xs,
    },
    avatarRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
    },
    avatar: {
      width: 88, height: 88, borderRadius: 44,
      alignItems: "center", justifyContent: "center",
    },
    avatarEmoji: { fontSize: 42 },
    name: { fontSize: Typography.size.xl, fontWeight: "800" },
    handle: { fontSize: Typography.size.base, fontWeight: "500" },
    statsCard: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: Radius.xl,
      marginHorizontal: Spacing.base,
      padding: Spacing.base,
      marginBottom: Spacing.xl,
      borderWidth: 1,
    },
    statItem: { flex: 1, alignItems: "center", gap: Spacing.xs },
    statValue: { fontSize: Typography.size.lg, fontWeight: "800", color: colors.text },
    statLabel: { fontSize: Typography.size.xs, color: colors.textSecondary, fontWeight: "600" },
    divider: { width: 1, backgroundColor: colors.border, marginVertical: Spacing.xs },
    section: { marginBottom: Spacing.xl, gap: Spacing.sm },
    sectionTitle: {
      fontSize: Typography.size.sm, fontWeight: "700", color: colors.textSecondary,
      textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: Spacing.base,
    },
    sectionCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl,
      marginHorizontal: Spacing.base, overflow: "hidden", borderWidth: 1,
    },
    categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, padding: Spacing.base },
    categoryItem: { alignItems: "center", gap: Spacing.xs },
    categoryCount: { fontSize: Typography.size.xs, fontWeight: "500" },
    // Settings rows
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.base,
    },
    menuIcon: {
      width: 36, height: 36, borderRadius: Radius.sm,
      alignItems: "center", justifyContent: "center",
    },
    settingLabel: { flex: 1, gap: 2 },
    menuLabel: { fontSize: Typography.size.base, fontWeight: "600" },
    settingHint: { fontSize: Typography.size.xs, fontWeight: "500" },
    separator: { height: 1, marginLeft: Spacing.base + 36 + Spacing.md },
    // Time picker
    timePickerWrap: {
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.base,
      gap: Spacing.sm,
    },
    timePickerLabel: { fontSize: Typography.size.sm, fontWeight: "600" },
    timeChips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
    timeChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
      borderRadius: Radius.full,
      borderWidth: 1.5,
    },
    timeChipText: { fontSize: Typography.size.sm, fontWeight: "700" },
  });
}
