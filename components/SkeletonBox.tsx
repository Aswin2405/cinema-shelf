import React, { useMemo, useState } from "react";
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useRepeatingTiming } from "@/hooks/useRepeatingTiming";

interface SkeletonBoxProps {
  width: number | `${number}%`;
  height: number | `${number}%`;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const SWEEP_MS = 1250;

/**
 * Placeholder block with a shimmer sweep travelling across it.
 *
 * The highlight band is a gradient the full width of the box, translated from
 * one edge to the other. Percentage widths are measured on layout, since the
 * sweep distance has to be a real pixel value.
 */
export const SkeletonBox = React.memo(function SkeletonBox({
  width,
  height,
  borderRadius = Radius.md,
  style,
}: SkeletonBoxProps) {
  const { isDark } = useTheme();
  const progress = useRepeatingTiming(SWEEP_MS);
  const [measuredWidth, setMeasuredWidth] = useState(
    typeof width === "number" ? width : 0
  );

  const base = isDark ? "#1F2232" : "#E2E5EF";
  const highlight = isDark ? "#2E3348" : "#F4F6FC";

  const translateX = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-measuredWidth, measuredWidth],
      }),
    [progress, measuredWidth]
  );

  return (
    <View
      style={[{ width, height, borderRadius, backgroundColor: base, overflow: "hidden" }, style]}
      onLayout={
        typeof width === "number"
          ? undefined
          : (e) => setMeasuredWidth(e.nativeEvent.layout.width)
      }
    >
      {measuredWidth > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={[base, highlight, base]}
            locations={[0.25, 0.5, 0.75]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
});
