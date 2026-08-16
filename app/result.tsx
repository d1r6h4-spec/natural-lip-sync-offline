import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Easing, Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import * as Sharing from "expo-sharing";
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
  audioUri: string;
  outputUrl?: string;
  jobId?: string;
  style: string;
  intensity: string;
  trimStart: string;
  trimEnd: string;
  videoTrimStart?: string;
  videoTrimEnd?: string;
  motionUri?: string;
  motionName?: string;
  motionWeight?: string;
  createdAt: string;
  status: "Completed";
};

export default function ResultScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ sourceUri?: string; sourceType?: string; audioUri?: string; audioName?: string; outputUrl?: string; jobId?: string; style?: string; intensity?: string; trimStart?: string; trimEnd?: string; videoTrimStart?: string; videoTrimEnd?: string; motionUri?: string; motionName?: string; motionWeight?: string; audioDuration?: string }>();
  const [saved, setSaved] = useState(false);
  const [sharing, setSharing] = useState(false);
  const sourceUri = params.sourceUri ?? "";
  const outputUrl = params.outputUrl ?? "";
  const isVideo = params.sourceType === "video";
  const videoUri = outputUrl || (isVideo ? sourceUri : "");
  const hasVideo = Boolean(videoUri);
  const videoPlayer = useVideoPlayer(hasVideo ? videoUri : null, (player) => {
    player.loop = true;
  });
  const audioPlayer = useAudioPlayer(params.audioUri ?? null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const mouthPulse = useRef(new Animated.Value(0)).current;
  const trimStartSeconds = Math.max(0, Number(params.trimStart ?? 0) || 0);
  const trimEndSeconds = params.trimEnd && params.trimEnd !== "full" ? Math.max(trimStartSeconds, Number(params.trimEnd) || trimStartSeconds) : audioStatus.duration;
  const project = useMemo<Project>(() => ({
    id: `${Date.now()}`,
    title: "Natural sync preview",
    sourceUri,
    sourceType: params.sourceType ?? "image",
    audioName: params.audioName ?? "Voice track",
    audioUri: params.audioUri ?? "",
    outputUrl: outputUrl || undefined,
    jobId: params.jobId,
    style: params.style ?? "Natural",
    intensity: params.intensity ?? "Balanced",
    trimStart: params.trimStart ?? "0",
    trimEnd: params.trimEnd ?? "full",
    videoTrimStart: params.videoTrimStart,
    videoTrimEnd: params.videoTrimEnd,
    motionUri: params.motionUri,
    motionName: params.motionName,
    motionWeight: params.motionWeight,
    createdAt: new Date().toISOString(),
    status: "Completed",
  }), [outputUrl, params.audioName, params.audioUri, params.intensity, params.jobId, params.motionName, params.motionUri, params.motionWeight, params.sourceType, params.style, params.trimEnd, params.trimStart, params.videoTrimEnd, params.videoTrimStart, sourceUri]);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    const shouldAnimate = !hasVideo && Boolean(params.audioUri) && audioStatus.playing;
    const target = shouldAnimate ? 0.55 + ((Math.sin(audioStatus.currentTime * 13) + 1) / 2) * 0.45 : 0;
    const animation = Animated.timing(mouthPulse, { toValue: target, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true });
    animation.start();
    return () => mouthPulse.stopAnimation();
  }, [audioStatus.currentTime, audioStatus.playing, hasVideo, mouthPulse, params.audioUri]);

  useEffect(() => {
    if (!hasVideo && audioStatus.playing && trimEndSeconds > trimStartSeconds && audioStatus.currentTime >= trimEndSeconds) {
      audioPlayer.pause();
    }
  }, [audioPlayer, audioStatus.currentTime, audioStatus.playing, hasVideo, trimEndSeconds, trimStartSeconds]);

  const toggleAudioPreview = () => {
    if (!params.audioUri) {
      Alert.alert("Audio belum tersedia", "Pilih atau rekam audio referensi sebelum membuat lip-sync.");
      return;
    }
    if (audioStatus.playing) {
      audioPlayer.pause();
      return;
    }
    audioPlayer.seekTo(trimStartSeconds);
    audioPlayer.play();
  };

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
    setSharing(true);
    try {
      const shareAvailable = await Sharing.isAvailableAsync();
      if (Platform.OS !== "web" && hasVideo && videoUri && shareAvailable) {
        await Sharing.shareAsync(videoUri, {
          dialogTitle: "Share your lip-sync",
          mimeType: "video/mp4",
          UTI: "public.movie",
        });
        return;
      }
      await Share.share({
        message: hasVideo
          ? `Natural Lip-Sync video · ${project.style} · ${project.audioName}`
          : "Your lip-sync preview is ready. A rendered video file is needed before sharing to a social platform.",
        title: "Natural Lip-Sync",
      });
    } catch {
      Alert.alert("Sharing unavailable", "The share sheet could not be opened on this device.");
    } finally {
      setSharing(false);
    }
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
          {hasVideo ? (
            <VideoView player={videoPlayer} style={styles.preview} allowsFullscreen allowsPictureInPicture contentFit="cover" />
          ) : sourceUri ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: sourceUri }} style={styles.preview} />
              {params.audioUri ? (
                <View style={styles.syncOverlay}>
                  <Animated.View style={[styles.syncMouth, { transform: [{ scaleY: mouthPulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.35] }) }] }]} />
                  <Text style={styles.syncOverlayText}>{audioStatus.playing ? "AUDIO SYNC ACTIVE" : "TAP PLAY TO SYNC AUDIO"}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyPreview}><IconSymbol name="video.fill" size={32} color={colors.primary} /><Text style={[styles.emptyText, { color: colors.muted }]}>Preview source unavailable</Text></View>
          )}
          <View style={[styles.previewTag, { backgroundColor: "rgba(0,0,0,0.58)" }]}><IconSymbol name="sparkles" size={13} color="#fff" /><Text style={styles.previewTagText}>{outputUrl ? "AI rendered" : "Natural preview"}</Text></View>
        </View>

        <View style={[styles.audioBanner, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}2f` }]}>
          <View style={[styles.audioIcon, { backgroundColor: `${colors.primary}20` }]}><IconSymbol name="mic.fill" size={18} color={colors.primary} /></View>
          <View style={styles.flexOne}><Text style={[styles.audioName, { color: colors.foreground }]} numberOfLines={1}>{project.audioName}</Text><Text style={[styles.audioMeta, { color: colors.muted }]}>{params.audioUri ? `${audioStatus.playing ? "Playing" : "Ready"} · ${project.style.toLowerCase()} expression` : "Audio reference unavailable"}</Text></View>
          {params.audioUri ? <Pressable onPress={toggleAudioPreview} style={({ pressed }) => [styles.audioPlayButton, { backgroundColor: `${colors.primary}18` }, pressed && { opacity: 0.6 }]}><IconSymbol name={audioStatus.playing ? "pause.fill" : "play.fill"} size={16} color={colors.primary} /></Pressable> : null}
          <View style={[styles.savedPill, { backgroundColor: `${colors.success}18` }]}><Text style={[styles.savedText, { color: colors.success }]}>{saved ? "Saved" : "Saving"}</Text></View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>PROJECT DETAILS</Text>
        <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>MOTION</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{project.style}</Text></View>
          <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>INTENSITY</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{project.intensity}</Text></View>
          <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>QUALITY</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>1080p preview</Text></View>
          <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>AUDIO CLIP</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{(() => {
            const start = Number(project.trimStart ?? 0);
            const end = Number(project.trimEnd ?? 1);
            const dur = Number(params.audioDuration ?? 0);
            if (dur > 0) {
              const sSec = Math.round(start * dur);
              const eSec = Math.round(end * dur);
              return `${sSec}s – ${eSec}s (${Math.max(1, eSec - sSec)}s)`;
            }
            return `${Math.round(start * 100)}% – ${Math.round(end * 100)}%`;
          })()}</Text></View>
          {project.sourceType === "video" ? <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>VIDEO CLIP</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{project.videoTrimStart ?? "0"} – {project.videoTrimEnd ?? "full"}</Text></View> : null}
          {project.motionUri ? <View style={styles.detailRow}><Text style={[styles.detailKey, { color: colors.muted }]}>BODY MOTION</Text><Text style={[styles.detailValue, { color: colors.foreground }]}>{project.motionName ?? "Reference video"} · {project.motionWeight ?? "Balanced"}</Text></View> : null}
        </View>

        <View style={[styles.prototypeNote, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}35` }]}>
          <Text style={[styles.prototypeNoteText, { color: colors.muted }]}>{outputUrl ? project.motionUri ? "This video was generated by transferring full-body movement from your reference video, then adding your selected audio. Choose a social app below to share it." : "This video was generated by SadTalker from your photo and audio reference. Choose a social app below to share it." : hasVideo ? "Choose a social app below to pass the local video into its composer." : params.audioUri ? "Image preview keeps the source photo visible while the selected audio and sync timing are active. Start a new render to generate the animated video." : "Add an audio reference to activate image-to-lip-sync preview."}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>SHARE TO SOCIAL</Text>
        <View style={styles.socialGrid}>
          {[
            { label: "Instagram", short: "IG", tint: "#E1306C" },
            { label: "TikTok", short: "TT", tint: "#111111" },
            { label: "WhatsApp", short: "WA", tint: "#25D366" },
          ].map((social) => (
            <Pressable key={social.label} onPress={shareResult} disabled={sharing} style={({ pressed }) => [styles.socialCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }, sharing && { opacity: 0.55 }]}>
              <View style={[styles.socialBadge, { backgroundColor: social.tint }]}><Text style={styles.socialBadgeText}>{social.short}</Text></View>
              <Text style={[styles.socialLabel, { color: colors.foreground }]}>{social.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={shareResult} disabled={sharing} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.88 }, sharing && { opacity: 0.7 }]}>
          <IconSymbol name="square.and.arrow.up" size={18} color="#fff" />
          <Text style={styles.primaryText}>{sharing ? "Opening share sheet…" : "Share video"}</Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable onPress={downloadResult} style={({ pressed }) => [styles.shareButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}><IconSymbol name="square.and.arrow.up" size={18} color={colors.foreground} /><Text style={[styles.shareText, { color: colors.foreground }]}>Save result</Text></Pressable>
          <Pressable onPress={shareResult} disabled={sharing} style={({ pressed }) => [styles.shareButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }, sharing && { opacity: 0.55 }]}><IconSymbol name="paperplane.fill" size={18} color={colors.foreground} /><Text style={[styles.shareText, { color: colors.foreground }]}>More apps</Text></Pressable>
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
  imagePreviewWrap: { flex: 1, position: "relative" },
  syncOverlay: { position: "absolute", left: 0, right: 0, bottom: 18, alignItems: "center", gap: 7 },
  syncMouth: { width: 52, height: 15, borderRadius: 22, borderWidth: 2, borderColor: "#fff", backgroundColor: "rgba(20,28,32,0.72)" },
  syncOverlayText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, backgroundColor: "rgba(0,0,0,0.52)", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  emptyPreview: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { fontSize: 13, fontWeight: "700" },
  previewTag: { position: "absolute", top: 14, left: 14, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6 },
  previewTagText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  audioBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, borderWidth: 1, padding: 12 },
  audioIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  flexOne: { flex: 1, gap: 2 },
  audioName: { fontSize: 13, fontWeight: "800" },
  audioMeta: { fontSize: 11 },
  audioPlayButton: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  savedPill: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  savedText: { fontSize: 10, fontWeight: "800" },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 16, marginLeft: 4 },
  detailsCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 11 },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailKey: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  detailValue: { fontSize: 13, fontWeight: "700" },
  prototypeNote: { borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, marginTop: 4 },
  prototypeNoteText: { fontSize: 11, lineHeight: 16, textAlign: "center" },
  socialGrid: { flexDirection: "row", gap: 9 },
  socialCard: { flex: 1, borderRadius: 17, borderWidth: 1, paddingVertical: 12, alignItems: "center", gap: 7 },
  socialBadge: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  socialBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  socialLabel: { fontSize: 11, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 9, marginTop: 4 },
  primaryButton: { minHeight: 50, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  shareButton: { minWidth: 94, minHeight: 50, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  shareText: { fontSize: 13, fontWeight: "800" },
  againButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  againText: { fontSize: 13, fontWeight: "800" },
});
