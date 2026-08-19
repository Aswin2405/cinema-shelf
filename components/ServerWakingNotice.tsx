import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LightColors, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useRepeatingTiming } from "@/hooks/useRepeatingTiming";

interface ServerWakingNoticeProps {
  /** The request failed outright — offer a retry instead of a progress bar. */
  failed?: boolean;
  onRetry?: () => void;
}

/**
 * Shown over the shimmer placeholders when the backend is taking a while.
 *
 * The API is on a free host that spins the server down when idle, so the first
 * request after a quiet period pays a 30-60s cold start. Without this the app
 * just looks broken, so say what is happening and roughly how long it takes.
 */
export function ServerWakingNotice({ failed = false, onRetry }: ServerWakingNoticeProps) {
  const { colors, isDark } = useTheme();
  const [seconds, setSeconds] = useState(0);

  const enter = useRef(new Animated.Value(0)).current;
  // Halo ping behind the icon, and the indeterminate bar sweep
  const pulse = useRepeatingTiming(1900, !failed);
  const sweep = useRepeatingTiming(1400, !failed);

  // Fade + rise in, so it does not pop over the shimmer
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    if (failed) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [failed]);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Memoised: the seconds counter re-renders this component once a second, and
  // rebuilding the interpolation nodes each time detaches the running animation.
  const haloScale = useMemo(
    () => pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }),
    [pulse]
  );
  const haloOpacity = useMemo(
    () => pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }),
    [pulse]
  );
  const barTranslate = useMemo(
    () => sweep.interpolate({ inputRange: [0, 1], outputRange: [-BAR_WIDTH * 0.6, BAR_WIDTH] }),
    [sweep]
  );
  const cardTranslate = useMemo(
    () => enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
    [enter]
  );

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Softens the shimmer behind without hiding it */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background, opacity: isDark ? 0.78 : 0.86 },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.card,
          Shadow.md,
          {
            opacity: enter,
            transform: [{ translateY: cardTranslate }],
          },
        ]}
      >
        <View style={styles.iconWrap}>
          {!failed && (
            <Animated.View
              style={[
                styles.halo,
                { backgroundColor: colors.primary, opacity: haloOpacity, transform: [{ scale: haloScale }] },
              ]}
            />
          )}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: failed ? colors.error + "1F" : colors.primaryMuted },
            ]}
          >
            <Ionicons
              name={failed ? "cloud-offline-outline" : "cloud-upload-outline"}
              size={26}
              color={failed ? colors.error : colors.primary}
            />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {failed ? "Can't reach the server" : "Waking up the server"}
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {failed
            ? "Your watchlist is safe in the database — this device just couldn't connect. Check your connection and try again."
            : "The backend sleeps when it's idle, so the first request takes a moment. Your movies will appear automatically."}
        </Text>

        {failed ? (
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={onRetry}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={[styles.bar, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[styles.barFill, { transform: [{ translateX: barTranslate }] }]}
              >
                {/* 8-digit hex rather than "transparent": the keyword is not
                    parsed consistently by the gradient on every platform */}
                <LinearGradient
                  colors={[`${colors.primary}00`, colors.primary, `${colors.primary}00`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>

            <Text style={[styles.meta, { color: colors.textTertiary }]}>
              {seconds < 15
                ? "Usually takes 30–60 seconds"
                : `Still waking up · ${seconds}s`}
            </Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const BAR_WIDTH = 200;

function makeStyles(colors: typeof LightColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      zIndex: 50,
    },
    card: {
      width: "100%",
      maxWidth: 340,
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surfaceElevated,
      borderRadius: Radius["2xl"],
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    iconWrap: { alignItems: "center", justifyContent: "center" },
    halo: {
      position: "absolute",
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: Typography.size.md,
      fontWeight: "800",
      letterSpacing: -0.2,
      textAlign: "center",
    },
    body: {
      fontSize: Typography.size.sm,
      lineHeight: 20,
      textAlign: "center",
    },
    bar: {
      width: BAR_WIDTH,
      height: 4,
      borderRadius: 2,
      overflow: "hidden",
      marginTop: Spacing.xs,
    },
    barFill: {
      width: BAR_WIDTH * 0.6,
      height: "100%",
    },
    meta: {
      fontSize: Typography.size.xs,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.full,
      marginTop: Spacing.xs,
    },
    retryText: { color: "#fff", fontSize: Typography.size.base, fontWeight: "700" },
  });
}
