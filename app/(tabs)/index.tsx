import { GenreBadge } from "@/components/GenreBadge";
import { MoviePoster } from "@/components/MoviePoster";
import { SkeletonBox } from "@/components/SkeletonBox";
import { Movie } from "@/constants/data";
import { LightColors, Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { fullPosterUrl, isTmdbConfigured, searchMovies } from "@/services/tmdb";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { Suspense, useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MovieDetailModal = React.lazy(() =>
  import("@/components/MovieDetailModal").then((m) => ({ default: m.MovieDetailModal }))
);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = Spacing.base;
const GRID_GAP = 10;
const NUM_COLS = 3;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GRID_GAP * (NUM_COLS - 1)) / NUM_COLS;
const POSTER_H = Math.round(CARD_WIDTH * 1.5);
const HERO_W = SCREEN_WIDTH - H_PAD * 2;
const HERO_H = 230;
const CW_W = 110;
const CW_H = Math.round(CW_W * 1.5);

const COLUMN_WRAPPER = { gap: GRID_GAP, paddingHorizontal: H_PAD, marginBottom: GRID_GAP } as const;

// ── Filter chips ──────────────────────────────────────────────────────────────
const FilterRow = React.memo(function FilterRow({
  items, selected, onSelect, colors,
}: {
  items: string[];
  selected: string | null;
  onSelect: (v: string | null) => void;
  colors: typeof LightColors;
}) {
  if (items.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: H_PAD, gap: Spacing.xs }}>
      {["All", ...items].map((item) => {
        const active = item === "All" ? !selected : selected === item;
        return (
          <TouchableOpacity
            key={item}
            onPress={() => onSelect(item === "All" ? null : selected === item ? null : item)}
            style={[chipStyle, active
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            <Text style={[chipTextStyle, { color: active ? "#fff" : colors.textSecondary }]}>
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const chipStyle = { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 };
const chipTextStyle = { fontSize: Typography.size.sm, fontWeight: "600" as const };

// ── Skeleton loading screen ───────────────────────────────────────────────────
const HomeSkeleton = React.memo(function HomeSkeleton({ colors }: { colors: typeof LightColors }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: H_PAD, paddingTop: Spacing.lg, paddingBottom: Spacing.base, gap: 6 }}>
        <SkeletonBox width={80} height={12} borderRadius={4} />
        <SkeletonBox width={160} height={28} borderRadius={6} />
      </View>
      {/* Hero */}
      <View style={{ paddingHorizontal: H_PAD, marginBottom: Spacing.xl }}>
        <SkeletonBox width={HERO_W} height={HERO_H} borderRadius={Radius.xl} />
      </View>
      {/* Grid */}
      <View style={{ paddingHorizontal: H_PAD, gap: GRID_GAP }}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={{ flexDirection: "row", gap: GRID_GAP }}>
            {[0, 1, 2].map((col) => (
              <View key={col} style={{ gap: 6 }}>
                <SkeletonBox width={CARD_WIDTH} height={POSTER_H} borderRadius={Radius.lg} />
                <SkeletonBox width={CARD_WIDTH * 0.8} height={11} borderRadius={4} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { toWatch, watched, markWatched, removeMovie, loading, updateMoviePoster } = useWatchlist();
  const { colors, isDark, toggleTheme } = useTheme();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Track which movie IDs have already had a poster fetch attempted
  const fetchedPosters = useRef(new Set<string>());

  const allMovies = useMemo(() => [...toWatch, ...watched], [toWatch, watched]);
  const featuredMovie = useMemo(() => toWatch[0] ?? watched[0] ?? null, [toWatch, watched]);
  const currentlyWatching = useMemo(() => toWatch.filter((m) => m.currentlyWatching), [toWatch]);

  const categories = useMemo(
    () => Array.from(new Set(allMovies.map((m) => m.category))).filter(Boolean), [allMovies]);
  const platforms = useMemo(
    () => Array.from(new Set(allMovies.map((m) => m.watchOn))).filter(Boolean), [allMovies]);
  const languages = useMemo(
    () => Array.from(new Set(allMovies.map((m) => m.language ?? ""))).filter(Boolean), [allMovies]);

  const displayMovies = useMemo(() =>
    allMovies.filter((m) => {
      const matchCat = !selectedCategory || m.category === selectedCategory;
      const matchPlat = !selectedPlatform || m.watchOn === selectedPlatform;
      const matchLang = !selectedLanguage || m.language === selectedLanguage;
      return matchCat && matchPlat && matchLang;
    }),
    [allMovies, selectedCategory, selectedPlatform, selectedLanguage]
  );

  // Fetch poster only when a movie scrolls into view
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

  const renderGridItem = useCallback(({ item: movie }: { item: Movie }) => (
    <TouchableOpacity
      style={{ width: CARD_WIDTH }}
      onPress={() => setSelectedMovie(movie)}
      activeOpacity={0.82}
    >
      <View style={styles.posterWrapper}>
        <MoviePoster movie={movie} width={CARD_WIDTH} height={POSTER_H} dimmed={movie.watched} />
        {movie.watched && (
          <View style={styles.watchedBadge}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
        {movie.currentlyWatching && !movie.watched && (
          <View style={styles.playingBadge}>
            <Ionicons name="play" size={8} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
        {movie.title}
      </Text>
    </TouchableOpacity>
  ), [colors, styles]);

  const listHeader = useMemo(() => (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.appLabel, { color: colors.primary }]}>CINEMA SHELF</Text>
          <Text style={[styles.appTitle, { color: colors.text }]}>Your Movies</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated }]}
          onPress={toggleTheme} activeOpacity={0.7}>
          <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={19} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Featured hero */}
      {featuredMovie && (
        <TouchableOpacity style={styles.heroWrap} onPress={() => setSelectedMovie(featuredMovie)} activeOpacity={0.9}>
          <MoviePoster movie={featuredMovie} width={HERO_W} height={HERO_H} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.72)", colors.background]}
            locations={[0.3, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroPlayBtn}>
            <Ionicons name="play" size={14} color="#fff" />
          </View>
          <View style={styles.heroInfo}>
            <GenreBadge category={featuredMovie.category} />
            <Text style={styles.heroTitle} numberOfLines={2}>{featuredMovie.title}</Text>
            <View style={styles.heroMeta}>
              {featuredMovie.watchOn ? (
                <>
                  <Ionicons name="tv-outline" size={12} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.heroPlatform}>{featuredMovie.watchOn}</Text>
                </>
              ) : null}
              {featuredMovie.currentlyWatching && (
                <View style={styles.heroContinueBadge}>
                  <Ionicons name="play-circle" size={11} color="#F59E0B" />
                  <Text style={styles.heroContinueText}>Continue</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Continue Watching */}
      {currentlyWatching.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: "#F59E0B" }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Watching</Text>
            <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>{currentlyWatching.length}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {currentlyWatching.map((movie) => (
              <TouchableOpacity key={movie.id} style={styles.cwCard} onPress={() => setSelectedMovie(movie)} activeOpacity={0.82}>
                <View style={styles.cwPosterWrap}>
                  <MoviePoster movie={movie} width={CW_W} height={CW_H} />
                  <View style={styles.cwPlayOverlay}>
                    <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
                  </View>
                </View>
                <Text style={[styles.cwTitle, { color: colors.text }]} numberOfLines={2}>{movie.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filters */}
      {allMovies.length > 0 && (
        <View style={styles.filtersBlock}>
          {categories.length > 0 && (
            <FilterRow items={categories} selected={selectedCategory} onSelect={setSelectedCategory} colors={colors} />
          )}
          {platforms.length > 0 && (
            <FilterRow items={platforms} selected={selectedPlatform} onSelect={setSelectedPlatform} colors={colors} />
          )}
          {languages.length > 0 && (
            <FilterRow items={languages} selected={selectedLanguage} onSelect={setSelectedLanguage} colors={colors} />
          )}
        </View>
      )}

      {/* Grid heading */}
      {displayMovies.length > 0 && (
        <View style={[styles.sectionHeader, { paddingHorizontal: H_PAD, marginBottom: Spacing.sm }]}>
          <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory || selectedPlatform || selectedLanguage
              ? [selectedCategory, selectedPlatform, selectedLanguage].filter(Boolean).join(" · ")
              : "All Movies"}
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>{displayMovies.length}</Text>
        </View>
      )}
    </View>
  ), [
    styles, colors, isDark, toggleTheme, featuredMovie,
    currentlyWatching, categories, platforms, languages,
    selectedCategory, selectedPlatform, selectedLanguage,
    displayMovies.length, allMovies.length,
  ]);

  const listEmpty = useMemo(() =>
    allMovies.length === 0 ? (
      <View style={styles.empty}>
        <Ionicons name="film-outline" size={52} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No movies yet</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Tap + to add your first movie</Text>
      </View>
    ) : (
      <View style={[styles.empty, { paddingTop: Spacing.xl }]}>
        <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No matches</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try a different filter</Text>
      </View>
    ),
    [styles, colors, allMovies.length]
  );

  // Show skeleton while data loads
  if (loading) return <HomeSkeleton colors={colors} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={displayMovies}
        keyExtractor={(item) => item.id}
        renderItem={renderGridItem}
        numColumns={NUM_COLS}
        columnWrapperStyle={COLUMN_WRAPPER}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={<View style={{ height: 78 }} />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={9}
        maxToRenderPerBatch={6}
        windowSize={5}
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged}
        getItemLayout={(_, index) => ({
          length: POSTER_H + 38,
          offset: (POSTER_H + 38) * Math.floor(index / NUM_COLS),
          index,
        })}
      />

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

function makeStyles(_colors: typeof LightColors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: H_PAD,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.base,
    },
    appLabel: { fontSize: Typography.size.xs, fontWeight: "800", letterSpacing: 3, marginBottom: 2 },
    appTitle: { fontSize: Typography.size["2xl"], fontWeight: "900", letterSpacing: -0.5 },
    iconBtn: { width: 40, height: 40, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", ...Shadow.sm },
    heroWrap: { marginHorizontal: H_PAD, marginBottom: Spacing.xl, borderRadius: Radius.xl, overflow: "hidden", height: HERO_H, ...Shadow.md },
    heroPlayBtn: {
      position: "absolute", top: Spacing.base, right: Spacing.base,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.55)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
      alignItems: "center", justifyContent: "center",
    },
    heroInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: Spacing.base, gap: 6 },
    heroTitle: { fontSize: Typography.size.xl, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
    heroMeta: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    heroPlatform: { fontSize: Typography.size.sm, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
    heroContinueBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(245,158,11,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
    heroContinueText: { fontSize: Typography.size.xs, fontWeight: "700", color: "#F59E0B" },
    section: { marginBottom: Spacing.xl },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingHorizontal: H_PAD, marginBottom: Spacing.md },
    sectionDot: { width: 4, height: 16, borderRadius: 2 },
    sectionTitle: { fontSize: Typography.size.md, fontWeight: "800", flex: 1, letterSpacing: -0.2 },
    sectionCount: { fontSize: Typography.size.sm, fontWeight: "600" },
    hScroll: { paddingHorizontal: H_PAD, gap: Spacing.sm },
    cwCard: { width: CW_W, gap: 6 },
    cwPosterWrap: { position: "relative", borderRadius: Radius.lg, overflow: "hidden" },
    cwPlayOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" },
    cwTitle: { fontSize: Typography.size.xs, fontWeight: "600", lineHeight: 15 },
    filtersBlock: { gap: Spacing.sm, marginBottom: Spacing.xl },
    posterWrapper: { borderRadius: Radius.lg, overflow: "hidden", position: "relative" },
    watchedBadge: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" },
    playingBadge: { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center" },
    cardTitle: { fontSize: Typography.size.xs, fontWeight: "700", lineHeight: 15, marginTop: 6 },
    empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    emptyTitle: { fontSize: Typography.size.lg, fontWeight: "700", textAlign: "center", marginTop: Spacing.sm },
    emptySub: { fontSize: Typography.size.base, textAlign: "center", lineHeight: 22 },
  });
}
