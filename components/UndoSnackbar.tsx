import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Typography, Spacing, Radius, Shadow } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

interface UndoSnackbarProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoSnackbar({
  visible,
  message,
  onUndo,
  onDismiss,
}: UndoSnackbarProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 20,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(onDismiss, 4000);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.container,
        Shadow.md,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        onPress={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          onUndo();
        }}
      >
        <Text style={[styles.undoText, { color: colors.primaryLight }]}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: "#2D2D3A",
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 999,
  },
  message: {
    color: "#fff",
    fontSize: Typography.size.base,
    fontWeight: "500",
  },
  undoText: {
    fontSize: Typography.size.base,
    fontWeight: "700",
  },
});
