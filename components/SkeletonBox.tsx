import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface SkeletonBoxProps {
  width: number | `${number}%`;
  height: number | `${number}%`;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonBox = React.memo(function SkeletonBox({
  width,
  height,
  borderRadius = 10,
  style,
}: SkeletonBoxProps) {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? "#1F2232" : "#E2E5EF",
          opacity,
        },
        style,
      ]}
    />
  );
});
