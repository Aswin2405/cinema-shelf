import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Movie, SubMovie } from "@/constants/data";
import { MoviePoster } from "./MoviePoster";
import { GenreBadge } from "./GenreBadge";
import { getCategoryPosterColor } from "@/constants/categoryColors";
import { Typography, Spacing, Radius, Shadow } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useWatchlist } from "@/hooks/useWatchlist";

interface MovieDetailModalProps {
  movie: Movie | null;
  visible: boolean;
  onClose: () => void;
  onMarkWatched?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function MovieDetailModal({
  movie,
  visible,
  onClose,
  onMarkWatched,
  onRemove,
}: MovieDetailModalProps) {
  const { colors } = useTheme();
  const {
    toWatch,
    watched,
    updateMovie,
    addSubMovie,
    removeSubMovie,
    toggleSubMovieWatched,
    updateSubMovie,
    markCurrentlyWatching,
    unmarkCurrentlyWatching,
  } = useWatchlist();

  // Always read the live version so edits / sub-movie additions appear immediately
  const liveMovie =
    [...toWatch, ...watched].find((m) => m.id === movie?.id) ?? movie;

  // ── Hero edit state ──────────────────────────────────────────────────────
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editWatchOn, setEditWatchOn] = useState("");
  const [editLanguage, setEditLanguage] = useState("");

  // ── Notes edit state ─────────────────────────────────────────────────────
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  // ── Parts state ──────────────────────────────────────────────────────────
  const [newPartTitle, setNewPartTitle] = useState("");
  const [showAddPart, setShowAddPart] = useState(false);
  // Inline rename: which sub-part is being renamed
  const [renamingSubId, setRenamingSubId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  useEffect(() => {
    if (visible && liveMovie) {
      setEditTitle(liveMovie.title);
      setEditCategory(liveMovie.category);
      setEditWatchOn(liveMovie.watchOn || "");
      setEditLanguage(liveMovie.language || "");
      setEditNotes(liveMovie.notes || "");
      setIsEditingMeta(false);
      setIsEditingNotes(false);
      setShowAddPart(false);
      setNewPartTitle("");
      setRenamingSubId(null);
    }
  }, [visible, movie?.id]);

  if (!liveMovie) return null;

  const heroColor = liveMovie.posterColor || getCategoryPosterColor(liveMovie.category);
  const subMovies = liveMovie.subMovies || [];
  const watchedParts = subMovies.filter((s) => s.watched).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveMeta = () => {
    const t = editTitle.trim();
    const c = editCategory.trim();
    if (!t) return;
    updateMovie(liveMovie.id, {
      title: t,
      category: c || liveMovie.category,
      watchOn: editWatchOn.trim(),
      language: editLanguage.trim() || undefined,
    });
    setIsEditingMeta(false);
  };

  const handleSaveNotes = () => {
    updateMovie(liveMovie.id, { notes: editNotes.trim() });
    setIsEditingNotes(false);
  };

  const handleAddPart = () => {
    const t = newPartTitle.trim();
    if (!t) return;
    const sub: SubMovie = {
      id: Date.now().toString(),
      title: t,
      notes: "",
      watched: false,
      dateAdded: new Date().toISOString().split("T")[0],
    };
    addSubMovie(liveMovie.id, sub);
    setNewPartTitle("");
    setShowAddPart(false);
  };

  const handleStartRename = (sub: SubMovie) => {
    setRenamingSubId(sub.id);
    setRenameText(sub.title);
  };

  const handleSaveRename = (subId: string) => {
    const t = renameText.trim();
    if (t) updateSubMovie(liveMovie.id, subId, t);
    setRenamingSubId(null);
  };

  const handleToggleSub = (subId: string) => {
    const updatedSubs = subMovies.map((s) =>
      s.id === subId ? { ...s, watched: !s.watched } : s
    );
    const allDone = updatedSubs.length > 0 && updatedSubs.every((s) => s.watched);
    toggleSubMovieWatched(liveMovie.id, subId);
    if (allDone && !liveMovie.watched) {
      setTimeout(() => onClose(), 300);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: heroColor }]}>
          <View style={styles.heroOverlay} />

          <View style={styles.heroTopBar}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            {isEditingMeta ? (
              <TouchableOpacity
                style={[styles.heroIconBtn, styles.heroSaveBtn]}
                onPress={handleSaveMeta}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.heroSaveTxt}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.heroIconBtn}
                onPress={() => setIsEditingMeta(true)}
              >
                <Ionicons name="pencil-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroContent}>
            <MoviePoster movie={liveMovie} width={100} height={140} />
            <View style={styles.heroText}>
              {isEditingMeta ? (
                <>
                  <TextInput
                    style={styles.heroTitleInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Movie title"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoFocus
                    returnKeyType="next"
                  />
                  <TextInput
                    style={styles.heroCategoryInput}
                    value={editCategory}
                    onChangeText={setEditCategory}
                    placeholder="Category"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    returnKeyType="next"
                  />
                  <View style={styles.heroWatchOnRow}>
                    <Ionicons name="tv-outline" size={12} color="rgba(255,255,255,0.55)" />
                    <TextInput
                      style={styles.heroWatchOnInput}
                      value={editWatchOn}
                      onChangeText={setEditWatchOn}
                      placeholder="Where to watch"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.heroWatchOnRow}>
                    <Ionicons name="language-outline" size={12} color="rgba(255,255,255,0.55)" />
                    <TextInput
                      style={styles.heroWatchOnInput}
                      value={editLanguage}
                      onChangeText={setEditLanguage}
                      placeholder="Language"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      returnKeyType="done"
                      onSubmitEditing={handleSaveMeta}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.heroTitle}>{liveMovie.title}</Text>
                  <View style={styles.heroBadgeRow}>
                    <GenreBadge category={liveMovie.category} />
                    {liveMovie.watchOn ? (
                      <View style={styles.watchOnBadge}>
                        <Ionicons name="tv-outline" size={11} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.watchOnText}>{liveMovie.watchOn}</Text>
                      </View>
                    ) : null}
                    {liveMovie.language ? (
                      <View style={styles.watchOnBadge}>
                        <Ionicons name="language-outline" size={11} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.watchOnText}>{liveMovie.language}</Text>
                      </View>
                    ) : null}
                  </View>
                  {subMovies.length > 0 && (
                    <View style={styles.heroSubCount}>
                      <Ionicons name="layers-outline" size={13} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.heroSubCountText}>
                        {watchedParts}/{subMovies.length} parts watched
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* ── Body ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Notes ── */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notes</Text>
              {isEditingNotes ? (
                <TouchableOpacity
                  onPress={handleSaveNotes}
                  style={[styles.miniBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.miniBtnText}>Save</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditNotes(liveMovie.notes || "");
                    setIsEditingNotes(true);
                  }}
                  style={[styles.miniBtn, { backgroundColor: colors.primaryMuted }]}
                >
                  <Ionicons name="pencil-outline" size={13} color={colors.primary} />
                  <Text style={[styles.miniBtnText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingNotes ? (
              <TextInput
                style={[
                  styles.notesInput,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.primary, color: colors.text },
                ]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Add your notes here..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
            ) : liveMovie.notes ? (
              <View style={[styles.notesCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, Shadow.sm]}>
                <Text style={[styles.notesText, { color: colors.text }]}>{liveMovie.notes}</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setEditNotes(""); setIsEditingNotes(true); }}>
                <Text style={[styles.noNotes, { color: colors.textTertiary }]}>Tap Edit to add notes</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Parts / Episodes ── */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Parts / Episodes
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddPart((v) => !v)}
                style={[styles.miniBtn, { backgroundColor: colors.primaryMuted }]}
              >
                <Ionicons name={showAddPart ? "close" : "add"} size={13} color={colors.primary} />
                <Text style={[styles.miniBtnText, { color: colors.primary }]}>
                  {showAddPart ? "Cancel" : "Add Part"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inline add form */}
            {showAddPart && (
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.inlineInput, { color: colors.text }]}
                  placeholder="e.g. Part I, Episode 1..."
                  placeholderTextColor={colors.textTertiary}
                  value={newPartTitle}
                  onChangeText={setNewPartTitle}
                  returnKeyType="done"
                  onSubmitEditing={handleAddPart}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleAddPart}
                  style={[styles.inlineBtn, { backgroundColor: colors.primary }, !newPartTitle.trim() && { opacity: 0.4 }]}
                  disabled={!newPartTitle.trim()}
                >
                  <Text style={styles.inlineBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sub-movie list */}
            {subMovies.length === 0 && !showAddPart ? (
              <Text style={[styles.emptyParts, { color: colors.textTertiary }]}>
                No parts yet. Tap "Add Part" to add episodes or sequels.
              </Text>
            ) : subMovies.length > 0 ? (
              <View style={[styles.subList, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, Shadow.sm]}>
                {subMovies.map((sub, idx) => (
                  <View key={sub.id}>
                    {idx > 0 && <View style={[styles.subDivider, { backgroundColor: colors.borderLight }]} />}

                    {renamingSubId === sub.id ? (
                      /* ── Rename row ── */
                      <View style={styles.subRow}>
                        <TextInput
                          style={[styles.renameInput, { color: colors.text, borderColor: colors.primary }]}
                          value={renameText}
                          onChangeText={setRenameText}
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={() => handleSaveRename(sub.id)}
                        />
                        <TouchableOpacity
                          onPress={() => handleSaveRename(sub.id)}
                          style={[styles.inlineBtn, { backgroundColor: colors.primary }]}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setRenamingSubId(null)}
                          style={[styles.inlineBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
                        >
                          <Ionicons name="close" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* ── Normal row ── */
                      <View style={styles.subRow}>
                        <TouchableOpacity
                          onPress={() => handleToggleSub(sub.id)}
                          style={[
                            styles.subCheck,
                            sub.watched
                              ? { backgroundColor: colors.primary, borderColor: colors.primary }
                              : { borderColor: colors.border },
                          ]}
                        >
                          {sub.watched && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </TouchableOpacity>

                        <View style={styles.subContent}>
                          <Text
                            style={[
                              styles.subTitle,
                              { color: sub.watched ? colors.textTertiary : colors.text },
                              sub.watched && styles.subTitleWatched,
                            ]}
                            numberOfLines={1}
                          >
                            {sub.title}
                          </Text>
                          {sub.watched && (
                            <Text style={[styles.subWatchedLabel, { color: colors.success }]}>
                              Watched
                            </Text>
                          )}
                        </View>

                        {/* Edit name button */}
                        <TouchableOpacity
                          onPress={() => handleStartRename(sub)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.subAction}
                        >
                          <Ionicons name="pencil-outline" size={15} color={colors.textTertiary} />
                        </TouchableOpacity>

                        {/* Delete button */}
                        <TouchableOpacity
                          onPress={() => removeSubMovie(liveMovie.id, sub.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.subAction}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* ── Actions ── */}
          {!liveMovie.watched && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  liveMovie.currentlyWatching
                    ? styles.nowWatchingActiveBtn
                    : styles.nowWatchingBtn,
                ]}
                onPress={() => {
                  if (liveMovie.currentlyWatching) {
                    unmarkCurrentlyWatching(liveMovie.id);
                  } else {
                    markCurrentlyWatching(liveMovie.id);
                  }
                }}
              >
                <Ionicons
                  name={liveMovie.currentlyWatching ? "pause-circle" : "play-circle"}
                  size={20}
                  color={liveMovie.currentlyWatching ? "#fff" : "#F59E0B"}
                />
                <Text
                  style={[
                    styles.nowWatchingBtnText,
                    liveMovie.currentlyWatching && { color: "#fff" },
                  ]}
                >
                  {liveMovie.currentlyWatching ? "Stop Watching" : "Currently Watching"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.watchedBtn, Shadow.lg]}
                onPress={() => { onMarkWatched?.(liveMovie.id); onClose(); }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.watchedBtnText}>Mark as Watched</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1.5, borderColor: colors.error }]}
                onPress={() => { onRemove?.(liveMovie.id); onClose(); }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.removeBtnText, { color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {liveMovie.watched && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated, borderWidth: 1.5, borderColor: colors.error }]}
              onPress={() => { onRemove?.(liveMovie.id); onClose(); }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.removeBtnText, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Hero
  hero: {
    paddingTop: 48,
    paddingBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: Radius["2xl"],
    borderBottomRightRadius: Radius["2xl"],
    overflow: "hidden",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  heroIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroSaveBtn: {
    flexDirection: "row",
    width: "auto",
    paddingHorizontal: Spacing.md,
    gap: 4,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  heroSaveTxt: { color: "#fff", fontSize: Typography.size.sm, fontWeight: "700" },
  heroContent: {
    flexDirection: "row",
    gap: Spacing.lg,
    alignItems: "flex-end",
  },
  heroText: { flex: 1, gap: Spacing.sm },
  heroTitle: {
    fontSize: Typography.size["2xl"],
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0,
  },
  heroTitleInput: {
    fontSize: Typography.size.xl,
    fontWeight: "800",
    color: "#fff",
    borderBottomWidth: 1.5,
    borderBottomColor: "rgba(255,255,255,0.5)",
    paddingBottom: 4,
    letterSpacing: 0,
  },
  heroCategoryInput: {
    fontSize: Typography.size.base,
    color: "rgba(255,255,255,0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.35)",
    paddingBottom: 3,
  },
  heroWatchOnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.25)",
    paddingBottom: 3,
  },
  heroWatchOnInput: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: "rgba(255,255,255,0.8)",
  },
  heroBadgeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flexWrap: "wrap" },
  watchOnBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  watchOnText: { fontSize: Typography.size.xs, color: "rgba(255,255,255,0.9)", fontWeight: "600" },
  heroSubCount: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroSubCountText: { fontSize: Typography.size.sm, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  // Body
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: 60 },
  section: { gap: Spacing.sm },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  miniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.full,
  },
  miniBtnText: { fontSize: Typography.size.xs, fontWeight: "700", color: "#fff" },
  // Notes
  notesCard: { borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1 },
  notesText: { fontSize: Typography.size.base, lineHeight: 24 },
  notesInput: {
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 1.5,
    fontSize: Typography.size.base,
    minHeight: 100,
    lineHeight: 22,
  },
  noNotes: { fontSize: Typography.size.sm, fontStyle: "italic" },
  // Inline row (add part / rename)
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  inlineInput: { flex: 1, fontSize: Typography.size.base, paddingVertical: Spacing.sm },
  inlineBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineBtnText: { color: "#fff", fontSize: Typography.size.sm, fontWeight: "700" },
  emptyParts: { fontSize: Typography.size.sm, fontStyle: "italic", lineHeight: 20 },
  // Sub-list
  subList: { borderRadius: Radius.xl, borderWidth: 1, overflow: "hidden" },
  subDivider: { height: 1, marginLeft: 44 },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  subCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  subContent: { flex: 1 },
  subTitle: { fontSize: Typography.size.base, fontWeight: "600" },
  subTitleWatched: { textDecorationLine: "line-through" },
  subWatchedLabel: { fontSize: Typography.size.xs, fontWeight: "600", marginTop: 2 },
  subAction: { padding: 2 },
  renameInput: {
    flex: 1,
    fontSize: Typography.size.base,
    borderBottomWidth: 1.5,
    paddingBottom: 4,
    paddingVertical: Spacing.xs,
  },
  // Actions
  actions: { gap: Spacing.sm },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
  },
  nowWatchingBtn: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1.5,
    borderColor: "#F59E0B",
  },
  nowWatchingActiveBtn: {
    backgroundColor: "#F59E0B",
  },
  nowWatchingBtnText: {
    fontSize: Typography.size.base,
    fontWeight: "700",
    color: "#F59E0B",
  },
  watchedBtn: { backgroundColor: "#E11D48" },
  watchedBtnText: { color: "#fff", fontSize: Typography.size.base, fontWeight: "700" },
  removeBtnText: { fontSize: Typography.size.base, fontWeight: "600" },
});
