import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/**
 * Drives an Animated.Value from 0 → 1, over and over.
 *
 * Restarts explicitly from the completion callback instead of using
 * Animated.loop. On web the native animated module is missing, so animations
 * fall back to the JS driver and a looped timing stops after its first pass —
 * leaving shimmers frozen at their end value. Re-running it by hand behaves the
 * same everywhere.
 */
export function useRepeatingTiming(duration: number, enabled: boolean = true) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = () => {
      value.setValue(0);
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !cancelled) run();
      });
    };

    run();
    return () => {
      cancelled = true;
      value.stopAnimation();
    };
  }, [value, duration, enabled]);

  return value;
}
