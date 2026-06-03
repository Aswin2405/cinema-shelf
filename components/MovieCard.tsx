import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Movie } from "@/constants/data";
import { MoviePoster } from "./MoviePoster";
import { GenreBadge } from "./GenreBadge";
import { Typography, Spacing, Radius, Shadow } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

interface MovieCardProps {
  movie: Movie;
  onMarkWatched?: (id: string) => void;
  onUnmarkWatched?: (id: string) => void;
  onRemove?: (id: string) => void;
  onPress?: (movie: Movie) => void;
  showWatched?: boolean;
  isCurrentlyWatching?: boolean;
}

export const MovieCard = React.memo(function MovieCard({
  movie,
  onMarkWatched,
  onUnmarkWatched,
  onRemove,
  onPress,
  showWatched = false,
  isCurrentlyWatching = false,
}: MovieCardProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(movie.watched ? 1 : 0)).current;

  const subCount = movie.subMovies?.length ?? 0;
  const watchedSubs = movie.subMovies?.filter((s) => s.watched).length ?? 0;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 15,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 15,
    }).start();
  };

  const handleCheck = () => {
    if (showWatched) {
      onUnmarkWatched?.(movie.id);
      return;
    }
    Animated.spring(checkAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start(() => {
      setTimeout(() => onMarkWatched?.(movie.id), 400);
    });
  };

  const handleRemove = () => {
    Alert.alert("Remove Movie", `Remove "${movie.title}" from watchlist?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onRemove?.(movie.id) },
    ]);
  };

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.3, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(movie)}
        onLongPress={!showWatched ? handleRemove : undefined}
        style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, Shadow.sm]}
      >
        <View>
          <MoviePoster movie={movie} width={76} height={108} dimmed={showWatched} />
          {isCurrentlyWatching && (
            <View style={styles.playBadge}>
              <Ionicons name="play" size={9} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              showWatched && { textDecorationLine: "line-through", color: colors.textTertiary },
            ]}
            numberOfLines={2}
          >
            {movie.title}
          </Text>

          <View style={styles.categoryRow}>
            <GenreBadge category={movie.category} />
          </View>

          {/* Sub-movies indicator */}
          {subCount > 0 && (
            <View style={styles.subCountRow}>
              <Ionicons name="layers-outline" size={12} color={colors.primary} />
              <Text style={[styles.subCountText, { color: colors.primary }]}>
                {watchedSubs}/{subCount} parts
              </Text>
            </View>
          )}

          {isCurrentlyWatching && (
            <View style={styles.nowWatchingRow}>
              <Ionicons name="play-circle" size={12} color="#F59E0B" />
              <Text style={styles.nowWatchingText}>Watching now</Text>
            </View>
          )}

          {movie.notes ? (
            <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={1}>
              {movie.notes}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={handleCheck} style={styles.checkWrapper}>
          <Animated.View
            style={[
              styles.checkbox,
              { borderColor: colors.border },
              showWatched && { backgroundColor: colors.primary, borderColor: colors.primary },
              { transform: [{ scale: checkScale }] },
            ]}
          >
            {showWatched && <Ionicons name="checkmark" size={16} color="#fff" />}
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.base,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: "700",
    letterSpacing: 0,
  },
  categoryRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  subCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  subCountText: {
    fontSize: Typography.size.xs,
    fontWeight: "600",
  },
  notes: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  playBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  nowWatchingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  nowWatchingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F59E0B",
  },
  checkWrapper: {
    padding: Spacing.xs,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
