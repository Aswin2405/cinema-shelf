import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLock } from "@/context/LockContext";
import { useTheme } from "@/context/ThemeContext";
import { Typography, Spacing, Radius, Shadow } from "@/constants/theme";

export function LockScreen() {
  const { unlockApp } = useLock();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    setFailed(false);
    const ok = await unlockApp();
    setLoading(false);
    if (!ok) setFailed(true);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Lock icon */}
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name="lock-closed" size={48} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>App Locked</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Authenticate to access your watchlist
      </Text>

      {failed && (
        <Text style={[styles.error, { color: colors.error }]}>
          Authentication failed. Try again.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.unlockBtn, { backgroundColor: colors.primary }, Shadow.lg]}
        onPress={handleUnlock}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="finger-print-outline" size={22} color="#fff" />
            <Text style={styles.unlockTxt}>Unlock</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    zIndex: 9999,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size["2xl"],
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: Typography.size.base,
    textAlign: "center",
    paddingHorizontal: Spacing["3xl"],
    lineHeight: 22,
  },
  error: {
    fontSize: Typography.size.sm,
    fontWeight: "600",
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.base,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    minWidth: 160,
    justifyContent: "center",
  },
  unlockTxt: {
    color: "#fff",
    fontSize: Typography.size.md,
    fontWeight: "700",
  },
});
