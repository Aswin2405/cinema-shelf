import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Typography, Spacing, Radius } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

const PALETTE_LIGHT = [
  { bg: "#EDE9FF", text: "#6B4EFF" },
  { bg: "#FFF3E0", text: "#E65100" },
  { bg: "#E8F5E9", text: "#2E7D32" },
  { bg: "#FCE4EC", text: "#C62828" },
  { bg: "#F3E5F5", text: "#6A1B9A" },
  { bg: "#E3F2FD", text: "#1565C0" },
  { bg: "#E0F7FA", text: "#00695C" },
  { bg: "#E8EAF6", text: "#283593" },
  { bg: "#FFF8E1", text: "#F57F17" },
  { bg: "#F1F8E9", text: "#33691E" },
];

const PALETTE_DARK = [
  { bg: "#1E1A3A", text: "#8B71FF" },
  { bg: "#2A1A00", text: "#FB923C" },
  { bg: "#0A2010", text: "#4ADE80" },
  { bg: "#2A0A0A", text: "#F87171" },
  { bg: "#1A0A2A", text: "#C084FC" },
  { bg: "#0A1A2A", text: "#60A5FA" },
  { bg: "#0A2A2A", text: "#34D399" },
  { bg: "#0A0F2A", text: "#818CF8" },
  { bg: "#2A2000", text: "#FBBF24" },
  { bg: "#102010", text: "#86EFAC" },
];

function hashCategory(category: string): number {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = ((hash * 31) + category.charCodeAt(i)) >>> 0;
  }
  return hash;
}

interface GenreBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export const GenreBadge = React.memo(function GenreBadge({ category, size = "md" }: GenreBadgeProps) {
  const { isDark } = useTheme();
  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;
  const badgeColors = palette[hashCategory(category) % palette.length];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeColors.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: badgeColors.text },
          isSmall && styles.textSm,
        ]}
      >
        {category}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: Typography.size.sm,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: Typography.size.xs,
  },
});
