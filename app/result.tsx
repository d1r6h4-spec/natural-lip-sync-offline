import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Project = {
  id: string;
  title: string;
  sourceUri: string;
  sourceType: string;
  audioName: string;
  style: string;
  intensity: string;
  createdAt: string;
  status: "Completed";
};

export default function ResultScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ sourceUri?: string; sourceType?: string; audioUri?: string; audioName?: string; style?: string; intensity?: string }>();
  const [saved, setSaved] = useState(false);
  const sourceUri = params.sourceUri ?? "";
  const isVideo = params.sourceType === "video";
  const videoPlayer = useVideoPlayer(isVideo ? sourceUri : null, (player) => {
    player.loop = true;
  });
  const project = useMemo<Project>(() => ({
    id: `${Date.now()}`,
    title: "Natural sync preview",
    sourceUri,
    sourceType: params.sourceType ?? "image",
    audioName: params.audioName ?? "Voice track",
    style: params.style ?? "Natural",
    intensity: params.intensity ?? "Balanced",
    createdAt: new Date().toISOString(),
    status: "Completed",
  }), [params.audioName, params.intensity, params.sourceType, params.style, sourceUri]);

  useEffect(() => {
    const save = async () => {
      try {
        const existing = await AsyncStorage.getItem("natural-lipsync-projects");
        const projects: Project[] = existing ? JSON.parse(existing) : [];
        if (!projects.some((item) => item.sourceUri === project.sourceUri && item.audioName === project.audioName)) {
          await AsyncStorage.setItem("natural-lipsync-projects", JSON.stringify([project, ...projects].slice(0, 12)));
        }
        setSaved(true);
      } catch {
        setSaved(false);
      }
    };
    void save();
  }, [project]);

  const shareResult = async () => {
    await Share.share({ message: `Natural Lip-Sync preview · ${project.style} · ${project.audioName}` });
  };

  const downloadResult = () => {
    Alert.alert("Saved locally", "The project is saved in your Natural Lip-Sync history. Gallery export can be connected to a real render service next.");
  };

  return (
    <ScreenContainer className="px-5 pt-3" containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/")} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.55 }]}>
            <IconSymbol name="chevron.right" size={20} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.success }]}>COMPLETE</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Your sync is ready</Text>
          </View>
          <View style={[styles.checkBadge, { backgroundColor: `${colors.success}18` }]}><IconSymbol name="chevron.right" size={16} color={colors.success} /></View>
        </View>

        <View style={[styles.previewFrame, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {isVideo && sourceUri ? (
            <VideoView player={videoPlayer} style={styles.preview} allowsFullscreen allowsPictureInPicture contentFit="cover" />
          ) : sourceUri ? (
            <Image source={{ uri: sourceUri }} style={styles.preview} />
          ) : (
            <View style={styles.emptyPreview}><IconSymbol name="video.fill" size={32} color={colors.primary} /><Text style={[styles.emptyText, { color: colors.muted }]}>Preview source unavailable</Text></View>
          )}
          <View style={[styles.previewTag, { backgroundColor: "rgba(0,0,0,0.58)" }]}><IconSymbol name="sparkles" size={13} color="#fff" /><Text style={styles.previewTagText}>Natural preview</Text></View>
        </View>

        <View style={[styles.audioBanner, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}2f` }]}>
          <View style={[styles.audioIcon, { backgroundColor: `${colors.primary}20` }]}><IconSymbol name="mic.fill" size={18} color={colors.primary} /></View>
          <View style={styles.flexOne}><Text style={[styles.audioName, { color: colors.foreground }]} numberOfLines={1}>{project.audioName}</Text><Text style={[styles.audioMeta, { color: colors.muted }]}>Synced with {project.style.toLowerCase()} expression</Text></View>
          <View style={[styles.savedPill, { backgroundColor: `${colors.success}18` }]}><Text style={[styles.savedText, { color: colors.success }]}>{saved ? "Saved" : "Saving"}</Text></View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>PROJECT DETAILS</Text>
        <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>MOTION</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{project.style}</Text></View>
          <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>INTENSITY</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{project.intensity}</Text></View>
          <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>QUALITY</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>1080p preview</Text></View>
        </View>

        <View style={[styles.prototypeNote, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}35` }]}>
          <Text style={[styles.prototypeNoteText, { color: colors.muted }]}>Prototype preview: your original source is ready for a production lip-sync renderer.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={downloadResult} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.88 }]}><IconSymbol name="square.and.arrow.up" size={18} color="#fff" /><Text style={styles.primaryText}>Save result</Text></Pressable>
          <Pressable onPress={shareResult} style={({ pressed }) => [styles.shareButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}><IconSymbol name="square.and.arrow.up" size={18} color={colors.foreground} /><Text style={[styles.shareText, { color: colors.foreground }]}>Share</Text></Pressable>
        </View>
        <Pressable onPress={() => router.replace("/create")} style={({ pressed }) => [styles.againButton, pressed && { opacity: 0.6 }]}><Text style={[styles.againText, { color: colors.primary }]}>Create another sync</Text><IconSymbol name="chevron.right" size={17} color={colors.primary} /></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 42, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 8 },
  backButton: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(127,127,127,0.12)" },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { fontSize: 27, lineHeight: 33, fontWeight: "800", marginTop: 3 },
  checkBadge: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-45deg" }] },
  previewFrame: { height: 330, borderRadius: 24, borderWidth: 1, overflow: "hidden", position: "relative" },
  preview: { width: "100%", height: "100%" },
  emptyPreview: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { fontSize: 13, fontWeight: "700" },
  previewTag: { position: "absolute", top: 14, left: 14, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6 },
  previewTagText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  audioBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, borderWidth: 1, padding: 12 },
  audioIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  flexOne: { flex: 1, gap: 2 },
  audioName: { fontSize: 13, fontWeight: "800" },
  audioMeta: { fontSize: 11 },
  savedPill: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  savedText: { fontSize: 10, fontWeight: "800" },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 16, marginLeft: 4 },
  detailsCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 11 },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailKey: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  detailValue: { fontSize: 13, fontWeight: "700" },
  prototypeNote: { borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, marginTop: 4 },
  prototypeNoteText: { fontSize: 11, lineHeight: 16, textAlign: "center" },
  actions: { flexDirection: "row", gap: 9, marginTop: 4 },
  primaryButton: { flex: 1, minHeight: 50, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  shareButton: { minWidth: 94, minHeight: 50, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  shareText: { fontSize: 13, fontWeight: "800" },
  againButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  againText: { fontSize: 13, fontWeight: "800" },
});
