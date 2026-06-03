import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Movie } from "@/constants/data";
import { getCategoryPosterColor } from "@/constants/categoryColors";
import { Radius, Shadow } from "@/constants/theme";
import { SkeletonBox } from "./SkeletonBox";

interface MoviePosterProps {
  movie: Movie;
  width?: number;
  height?: number;
  dimmed?: boolean;
}

export const MoviePoster = React.memo(function MoviePoster({
  movie,
  width = 72,
  height = 100,
  dimmed = false,
}: MoviePosterProps) {
  const bgColor = movie.posterColor || getCategoryPosterColor(movie.category);
  const categoryFontSize = Math.max(9, Math.min(width * 0.14, 16));
  const titleFontSize = Math.max(7, width * 0.1);

  // ── Real TMDB poster with lazy fade-in ──────────────────────────────────────
  if (movie.posterUrl) {
    return (
      <PosterImage
        uri={movie.posterUrl}
        width={width}
        height={height}
        dimmed={dimmed}
      />
    );
  }

  // ── Coloured placeholder ────────────────────────────────────────────────────
  return (
    <View
      style={[
        styles.poster,
        { width, height, backgroundColor: bgColor },
        Shadow.sm,
        dimmed && styles.dimmed,
      ]}
    >
      <View style={styles.overlay} />
      <View style={styles.topSheen} />
      <View style={styles.spine} />
      <View style={[styles.stripe, { top: "18%" }]} />
      <View style={[styles.stripe, { top: "52%" }]} />

      <View style={styles.categoryContainer}>
        <Text
          style={[styles.categoryText, { fontSize: categoryFontSize }]}
          numberOfLines={3}
          adjustsFontSizeToFit
        >
          {movie.category.toUpperCase()}
        </Text>
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.titleText, { fontSize: titleFontSize }]} numberOfLines={2}>
          {movie.title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
});

// ── Separate component so each poster manages its own loading state ───────────
const PosterImage = React.memo(function PosterImage({
  uri,
  width,
  height,
  dimmed,
}: {
  uri: string;
  width: number;
  height: number;
  dimmed: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const onLoad = () => {
    setLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[
        styles.poster,
        { width, height },
        Shadow.sm,
        dimmed && styles.dimmed,
      ]}
    >
      {/* Skeleton shown while image loads */}
      {!loaded && (
        <SkeletonBox
          width={width}
          height={height}
          borderRadius={0}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* Image fades in on load */}
      <Animated.Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
        resizeMode="cover"
        onLoad={onLoad}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  poster: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  dimmed: { opacity: 0.45 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  spine: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: 8,
    width: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  stripe: {
    position: "absolute",
    left: 18,
    right: 10,
    height: 1,
    backgroundColor: "#fff",
    opacity: 0.12,
  },
  categoryContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  categoryText: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
    lineHeight: 18,
  },
  titleContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.68)",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  titleText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
