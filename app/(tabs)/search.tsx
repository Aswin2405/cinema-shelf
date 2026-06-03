import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Movie } from "@/constants/data";
import { MoviePoster } from "@/components/MoviePoster";
import { GenreBadge } from "@/components/GenreBadge";
import { MovieDetailModal } from "@/components/MovieDetailModal";
import { LightColors, Typography, Spacing, Radius, Shadow } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

export default function SearchScreen() {
  const { toWatch, watched, markWatched, removeMovie } = useWatchlist();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const allMovies = [...toWatch, ...watched];
  const categories = Array.from(new Set(allMovies.map((m) => m.category))).filter(Boolean);

  const filtered = useMemo(() => {
    return allMovies.filter((m) => {
      const matchQuery =
        !query ||
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.category.toLowerCase().includes(query.toLowerCase()) ||
        (m.watchOn || "").toLowerCase().includes(query.toLowerCase());
      const matchCat = !selectedCategory || m.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [query, selectedCategory, toWatch, watched]);

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Search</Text>
          <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Title, category or platform..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
                      setSelectedCategory(cat === "All" ? null : (selectedCategory === cat ? null : cat))
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
                      style={[
                        styles.chipText,
                        { color: active ? "#fff" : colors.textSecondary },
                      ]}
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
        {allMovies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No movies yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add movies from the Home tab to search them here
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.resultCount, { color: colors.textTertiary }]}>
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </Text>

            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>😔</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No matches</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              filtered.map((movie) => (
                <TouchableOpacity
                  key={movie.id}
                  style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, Shadow.sm]}
                  onPress={() => setSelectedMovie(movie)}
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

                  {/* Status indicator */}
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: movie.watched ? colors.success : colors.border },
                    ]}
                  />
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 148 }} />
          </ScrollView>
        )}
      </View>

      <MovieDetailModal
        movie={selectedMovie}
        visible={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onMarkWatched={markWatched}
        onRemove={removeMovie}
      />
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
