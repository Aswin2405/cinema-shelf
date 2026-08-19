import React, { Suspense, useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Movie } from "@/constants/data";
import { MoviePoster } from "@/components/MoviePoster";
import { GenreBadge } from "@/components/GenreBadge";
import { SkeletonBox } from "@/components/SkeletonBox";
import { LightColors, Typography, Spacing, Radius, Shadow } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { searchMovies, fullPosterUrl, isTmdbConfigured } from "@/services/tmdb";

const MovieDetailModal = React.lazy(() =>
  import("@/components/MovieDetailModal").then((m) => ({ default: m.MovieDetailModal }))
);

// Only what fits on screen is mounted; the rest streams in as you scroll
const INITIAL_RENDER = 8;
const BATCH_SIZE = 8;

type Styles = ReturnType<typeof makeStyles>;

// ── Result row ────────────────────────────────────────────────────────────────
const SearchResultCard = React.memo(function SearchResultCard({
  movie,
  onPress,
  colors,
  styles,
}: {
  movie: Movie;
  onPress: (movie: Movie) => void;
  colors: typeof LightColors;
  styles: Styles;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        Shadow.sm,
      ]}
      onPress={() => onPress(movie)}
      activeOpacity={0.85}
    >
      <MoviePoster movie={movie} width={62} height={88} dimmed={movie.watched} />

      <View style={styles.cardBody}>
        <Text
          style={[
            styles.cardTitle,
            { color: movie.watched ? colors.textTertiary : colors.text },
            movie.watched && { textDecorationLine: "line-through" },
          ]}
          numberOfLines={2}
        >
          {movie.title}
        </Text>

        <View style={styles.cardMeta}>
          <GenreBadge category={movie.category} size="sm" />
          {movie.watchOn ? (
            <View style={[styles.platformBadge, { backgroundColor: colors.background }]}>
              <Ionicons name="tv-outline" size={10} color={colors.textTertiary} />
              <Text style={[styles.platformText, { color: colors.textTertiary }]}>
                {movie.watchOn}
              </Text>
            </View>
          ) : null}
        </View>

        {movie.notes ? (
          <Text style={[styles.cardNotes, { color: colors.textSecondary }]} numberOfLines={1}>
            {movie.notes}
          </Text>
        ) : null}

        {(movie.subMovies?.length ?? 0) > 0 && (
          <View style={styles.subRow}>
            <Ionicons name="layers-outline" size={11} color={colors.primary} />
            <Text style={[styles.subText, { color: colors.primary }]}>
              {movie.subMovies!.filter((s) => s.watched).length}/{movie.subMovies!.length} parts
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.statusDot,
          { backgroundColor: movie.watched ? colors.success : colors.border },
        ]}
      />
    </TouchableOpacity>
  );
});

// ── Shimmer placeholder ───────────────────────────────────────────────────────
const SearchSkeleton = React.memo(function SearchSkeleton({ styles }: { styles: Styles }) {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonBox width={62} height={88} borderRadius={Radius.md} />
          <View style={styles.skeletonBody}>
            <SkeletonBox width="75%" height={14} borderRadius={4} />
            <SkeletonBox width="45%" height={11} borderRadius={4} />
            <SkeletonBox width="60%" height={11} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const { toWatch, watched, markWatched, removeMovie, loading, updateMoviePoster } =
    useWatchlist();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const allMovies = useMemo(() => [...toWatch, ...watched], [toWatch, watched]);
  const categories = useMemo(
    () => Array.from(new Set(allMovies.map((m) => m.category))).filter(Boolean),
    [allMovies]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allMovies.filter((m) => {
      const matchQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.watchOn || "").toLowerCase().includes(q);
      const matchCat = !selectedCategory || m.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [allMovies, query, selectedCategory]);

  // Posters are fetched only for rows that actually scroll into view
  const fetchedPosters = useRef(new Set<string>());
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 30 });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!isTmdbConfigured()) return;
      viewableItems.forEach(({ item }) => {
        const movie = item as Movie;
        if (movie.posterUrl || fetchedPosters.current.has(movie.id)) return;
        fetchedPosters.current.add(movie.id);
        searchMovies(movie.title).then((results) => {
          if (results[0]?.poster_path) {
            updateMoviePoster(movie.id, fullPosterUrl(results[0].poster_path));
          }
        });
      });
    },
    [updateMoviePoster]
  );

  const renderItem = useCallback(
    ({ item }: { item: Movie }) => (
      <SearchResultCard movie={item} onPress={setSelectedMovie} colors={colors} styles={styles} />
    ),
    [colors, styles]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header — kept outside the list so typing never remounts the input */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Search</Text>
          <View
            style={[
              styles.searchBar,
              { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Title, category or platform..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              editable={!loading}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Category filter chips ── */}
        {categories.length > 0 && (
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {["All", ...categories].map((cat) => {
                const active = cat === "All" ? !selectedCategory : selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() =>
                      setSelectedCategory(
                        cat === "All" ? null : selectedCategory === cat ? null : cat
                      )
                    }
                    activeOpacity={0.75}
                    style={[
                      styles.chip,
                      active
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    ]}
                  >
                    {active && cat !== "All" && (
                      <Ionicons name="checkmark" size={12} color="#fff" style={{ marginRight: 2 }} />
                    )}
                    <Text
                      style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Results ── */}
        {loading ? (
          <SearchSkeleton styles={styles} />
        ) : allMovies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No movies yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add movies from the Home tab to search them here
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            removeClippedSubviews
            initialNumToRender={INITIAL_RENDER}
            maxToRenderPerBatch={BATCH_SIZE}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            viewabilityConfig={viewabilityConfig.current}
            onViewableItemsChanged={onViewableItemsChanged}
            ListHeaderComponent={
              <Text style={[styles.resultCount, { color: colors.textTertiary }]}>
                {filtered.length} {filtered.length === 1 ? "result" : "results"}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>😔</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No matches</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Try a different search term
                </Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: 148 }} />}
          />
        )}
      </View>

      {selectedMovie && (
        <Suspense fallback={null}>
          <MovieDetailModal
            movie={selectedMovie}
            visible
            onClose={() => setSelectedMovie(null)}
            onMarkWatched={markWatched}
            onRemove={removeMovie}
          />
        </Suspense>
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors: typeof LightColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },

    header: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.base,
      gap: Spacing.md,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },

    // Search bar
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      borderRadius: Radius.xl,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm + 2,
      borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: Typography.size.base },

    // Filters
    filterSection: {
      marginBottom: Spacing.sm,
    },
    chipRow: {
      paddingHorizontal: Spacing.base,
      gap: Spacing.sm,
      alignItems: "center",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radius.full,
      borderWidth: 1.5,
    },
    chipText: { fontSize: Typography.size.sm, fontWeight: "600" },

    // Results
    results: { flex: 1 },
    resultsContent: {
      paddingHorizontal: Spacing.base,
      gap: Spacing.sm,
      paddingBottom: 78,
    },
    resultCount: {
      fontSize: Typography.size.xs,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: Spacing.xs,
    },

    // Result card
    card: {
      flexDirection: "row",
      borderRadius: Radius.lg,
      padding: Spacing.base,
      gap: Spacing.base,
      alignItems: "center",
      borderWidth: 1,
    },
    cardBody: { flex: 1, gap: Spacing.xs },
    cardTitle: { fontSize: Typography.size.base, fontWeight: "700" },
    cardMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: Spacing.xs },
    platformBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.full,
    },
    platformText: { fontSize: Typography.size.xs, fontWeight: "500" },
    cardNotes: { fontSize: Typography.size.xs, lineHeight: 16 },
    subRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    subText: { fontSize: Typography.size.xs, fontWeight: "600" },

    // Status dot (right side)
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      alignSelf: "center",
    },

    // Shimmer
    skeletonWrap: { paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingTop: Spacing.xs },
    skeletonRow: {
      flexDirection: "row",
      gap: Spacing.base,
      alignItems: "center",
      padding: Spacing.base,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    skeletonBody: { flex: 1, gap: Spacing.sm },

    // Empty
    emptyState: {
      alignItems: "center",
      paddingTop: 80,
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    emptyEmoji: { fontSize: 52, marginBottom: Spacing.sm },
    emptyTitle: { fontSize: Typography.size.lg, fontWeight: "700", textAlign: "center" },
    emptySubtitle: { fontSize: Typography.size.base, textAlign: "center", lineHeight: 22 },
  });
}
