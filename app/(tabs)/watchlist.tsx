import React, { useState, useCallback, useRef, useMemo, Suspense } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  ViewToken,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useWatchlist } from "@/hooks/useWatchlist";
import { MovieCard } from "@/components/MovieCard";
import { UndoSnackbar } from "@/components/UndoSnackbar";
import { MoviePoster } from "@/components/MoviePoster";
import { SkeletonBox } from "@/components/SkeletonBox";
import { Movie } from "@/constants/data";
import { LightColors, Typography, Spacing, Radius, Shadow } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { searchMovies, fullPosterUrl, isTmdbConfigured } from "@/services/tmdb";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_H = 124; // approximate MovieCard height

const MovieDetailModal = React.lazy(() =>
  import("@/components/MovieDetailModal").then((m) => ({ default: m.MovieDetailModal }))
);

type Tab = "toWatch" | "watched";
const PAGE_SIZE = 10;
const CW_W = 90;
const CW_H = Math.round(CW_W * 1.5);

export default function WatchlistScreen() {
  const {
    toWatch,
    watched,
    removeMovie,
    markWatched,
    unmarkWatched,
    unmarkCurrentlyWatching,
    undoRemove,
    lastRemoved,
    loading,
    updateMoviePoster,
  } = useWatchlist();

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
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>("toWatch");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listRef = useRef<FlatList>(null);

  const currentlyWatchingMovies = useMemo(
    () => toWatch.filter((m) => m.currentlyWatching),
    [toWatch]
  );
  const regularToWatch = useMemo(
    () => toWatch.filter((m) => !m.currentlyWatching),
    [toWatch]
  );

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setVisibleCount(PAGE_SIZE);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleRemove = (id: string) => {
    const movie = [...toWatch, ...watched].find((m) => m.id === id);
    removeMovie(id);
    if (movie) {
      setSnackbarMessage(`Removed "${movie.title}"`);
      setSnackbarVisible(true);
    }
  };

  const handleUndo = () => {
    undoRemove();
    setSnackbarVisible(false);
  };

  const handleEndReached = useCallback(() => {
    const source = activeTab === "toWatch" ? regularToWatch : watched;
    if (visibleCount < source.length) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, source.length));
    }
  }, [activeTab, regularToWatch, watched, visibleCount]);

  const source = activeTab === "toWatch" ? regularToWatch : watched;
  const paginatedMovies = source.slice(0, visibleCount);
  const hasMore = visibleCount < source.length;

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const renderItem = useCallback(
    ({ item }: { item: Movie }) => (
      <MovieCard
        movie={item}
        onMarkWatched={markWatched}
        onUnmarkWatched={unmarkWatched}
        onRemove={handleRemove}
        onPress={setSelectedMovie}
        showWatched={activeTab === "watched"}
        isCurrentlyWatching={!!item.currentlyWatching}
      />
    ),
    [activeTab, markWatched, unmarkWatched]
  );

  const ListHeader = (
    <>
      {/* Continue Watching horizontal strip */}
      {activeTab === "toWatch" && currentlyWatchingMovies.length > 0 && (
        <View style={styles.cwSection}>
          <View style={styles.cwTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: "#F59E0B" }]} />
            <Text style={[styles.cwTitle, { color: colors.text }]}>Continue Watching</Text>
            <Text style={[styles.cwCount, { color: colors.textTertiary }]}>
              {currentlyWatchingMovies.length}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cwScroll}
          >
            {currentlyWatchingMovies.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cwCard}
                onPress={() => setSelectedMovie(item)}
                activeOpacity={0.82}
              >
                <View style={styles.cwPosterWrap}>
                  <MoviePoster movie={item} width={CW_W} height={CW_H} />
                  <View style={styles.cwPlayOverlay}>
                    <Ionicons name="play-circle" size={26} color="rgba(255,255,255,0.9)" />
                  </View>
                  <TouchableOpacity
                    style={styles.cwPauseBtn}
                    onPress={() => unmarkCurrentlyWatching(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="pause" size={9} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.cwCardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Section label row */}
      {source.length > 0 && (
        <View style={styles.sectionRow}>
          <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.sectionLabel, { color: colors.text }]}>
            {activeTab === "toWatch" ? "Up Next" : "Completed"}
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
            {source.length} {source.length === 1 ? "film" : "films"}
          </Text>
        </View>
      )}
    </>
  );

  const ListEmpty = (
    <View style={styles.empty}>
      <Ionicons
        name={activeTab === "toWatch" ? "film-outline" : "checkmark-circle-outline"}
        size={52}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {activeTab === "toWatch" ? "Nothing queued" : "Nothing watched yet"}
      </Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
        {activeTab === "toWatch"
          ? "Tap + to add movies to your list"
          : "Mark movies as watched and they'll appear here"}
      </Text>
    </View>
  );

  const ListFooter = (
    <View>
      {hasMore && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <View style={{ height: 148 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={{ gap: 6 }}>
            <SkeletonBox width={60} height={10} borderRadius={4} />
            <SkeletonBox width={130} height={26} borderRadius={6} />
          </View>
          <View style={{ flexDirection: "row", gap: Spacing.xs }}>
            <SkeletonBox width={52} height={32} borderRadius={Radius.full} />
            <SkeletonBox width={52} height={32} borderRadius={Radius.full} />
          </View>
        </View>
        <SkeletonBox width={SCREEN_WIDTH - Spacing.base * 2} height={46} borderRadius={Radius.xl} style={{ marginHorizontal: Spacing.base, marginBottom: Spacing.base }} />
        <View style={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flexDirection: "row", gap: Spacing.base, alignItems: "center" }}>
              <SkeletonBox width={76} height={CARD_H} borderRadius={Radius.lg} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBox width="80%" height={14} borderRadius={4} />
                <SkeletonBox width="50%" height={11} borderRadius={4} />
                <SkeletonBox width="35%" height={11} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerLabel, { color: colors.primary }]}>MY LIST</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Watchlist</Text>
          </View>
          <View style={styles.headerStats}>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={[styles.statPillText, { color: colors.text }]}>{toWatch.length}</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
              <Text style={[styles.statPillText, { color: colors.text }]}>{watched.length}</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceElevated }]}>
          {(["toWatch", "watched"] as Tab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, active && [styles.tabActive, { backgroundColor: colors.primary }]]}
                onPress={() => switchTab(tab)}
              >
                <Text style={[styles.tabText, { color: active ? "#fff" : colors.textSecondary }]}>
                  {tab === "toWatch" ? "To Watch" : "Watched"}
                </Text>
                <View style={[
                  styles.tabBadge,
                  { backgroundColor: active ? "rgba(255,255,255,0.2)" : colors.background },
                ]}>
                  <Text style={[styles.tabBadgeText, { color: active ? "#fff" : colors.textTertiary }]}>
                    {tab === "toWatch" ? toWatch.length : watched.length}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Movie list */}
        <FlatList
          ref={listRef}
          data={paginatedMovies}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={PAGE_SIZE}
          maxToRenderPerBatch={PAGE_SIZE}
          windowSize={5}
          viewabilityConfig={viewabilityConfig.current}
          onViewableItemsChanged={onViewableItemsChanged}
          getItemLayout={(_, index) => ({
            length: CARD_H + Spacing.sm,
            offset: (CARD_H + Spacing.sm) * index,
            index,
          })}
        />

        <UndoSnackbar
          visible={snackbarVisible}
          message={snackbarMessage}
          onUndo={handleUndo}
          onDismiss={() => setSnackbarVisible(false)}
        />
      </View>

      {selectedMovie && (
        <Suspense fallback={null}>
          <MovieDetailModal
            movie={selectedMovie}
            visible
            onClose={() => setSelectedMovie(null)}
            onMarkWatched={markWatched}
            onRemove={handleRemove}
          />
        </Suspense>
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors: typeof LightColors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1 },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    headerLabel: {
      fontSize: Typography.size.xs,
      fontWeight: "800",
      letterSpacing: 3,
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: Typography.size["2xl"],
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    headerStats: {
      flexDirection: "row",
      gap: Spacing.xs,
    },
    statPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: Radius.full,
      ...Shadow.sm,
    },
    statPillText: {
      fontSize: Typography.size.sm,
      fontWeight: "700",
    },

    // Tab switcher
    tabContainer: {
      flexDirection: "row",
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.base,
      borderRadius: Radius.xl,
      padding: 4,
      ...Shadow.sm,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.lg,
      gap: Spacing.xs,
    },
    tabActive: {
      ...Shadow.sm,
    },
    tabText: {
      fontSize: Typography.size.base,
      fontWeight: "700",
    },
    tabBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    tabBadgeText: {
      fontSize: Typography.size.xs,
      fontWeight: "700",
    },

    // List
    list: { flex: 1, paddingHorizontal: Spacing.base },
    listContent: { paddingTop: Spacing.xs, paddingBottom: 78 },

    // Continue Watching
    cwSection: { marginBottom: Spacing.lg },
    cwTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    sectionDot: { width: 4, height: 16, borderRadius: 2 },
    cwTitle: { fontSize: Typography.size.md, fontWeight: "800", flex: 1, letterSpacing: -0.2 },
    cwCount: { fontSize: Typography.size.sm, fontWeight: "600" },
    cwScroll: { gap: Spacing.sm },
    cwCard: { width: CW_W, gap: 6 },
    cwPosterWrap: { position: "relative", borderRadius: Radius.lg, overflow: "hidden" },
    cwPlayOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.22)",
    },
    cwPauseBtn: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
    },
    cwCardTitle: {
      fontSize: Typography.size.xs,
      fontWeight: "600",
      lineHeight: 15,
    },

    // Section row
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    sectionLabel: { fontSize: Typography.size.md, fontWeight: "800", flex: 1, letterSpacing: -0.2 },
    sectionCount: { fontSize: Typography.size.sm, fontWeight: "600" },

    // Loading
    loadingRow: { alignItems: "center", paddingVertical: Spacing.base },

    // Empty
    empty: {
      alignItems: "center",
      paddingTop: 80,
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    emptyTitle: { fontSize: Typography.size.lg, fontWeight: "700", textAlign: "center", marginTop: Spacing.sm },
    emptySub: { fontSize: Typography.size.base, textAlign: "center", lineHeight: 22 },
  });
}
