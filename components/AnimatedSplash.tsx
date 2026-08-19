import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";

/**
 * Full-screen splash artwork rendered in JS, on top of everything, until the
 * app is ready.
 *
 * The native splash cannot do this on its own everywhere: Android 12+ hands the
 * splash to the OS SplashScreen API, which only ever draws a centred icon over
 * a solid colour — a full-bleed image is not possible there. Painting the same
 * artwork in JS gives both platforms an identical edge-to-edge splash, and
 * covers the gap while the providers mount.
 *
 * The native splash uses the same image and background colour (see the
 * expo-splash-screen block in app.json), so the handover is invisible.
 */

// How long the artwork stays at full opacity once the app has mounted
const HOLD_MS = 700;
const FADE_MS = 450;

export function AnimatedSplash() {
  const [mounted, setMounted] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // This JS overlay is already painted, so dropping the native splash now
      // shows the same pixels — no white flash in between.
      await SplashScreen.hideAsync().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, HOLD_MS));
      if (cancelled) return;

      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !cancelled) setMounted(false);
      });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [opacity]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={require("../assets/logo.png")}
        style={styles.image}
        resizeMode="cover"
        // Fills the screen, so the artwork's own background is what shows
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // Matches the splash backgroundColor in app.json
    backgroundColor: "#050506",
    zIndex: 999,
    elevation: 999,
  },
  image: { width: "100%", height: "100%" },
});
