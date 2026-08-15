import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { BUILTIN_AUDIO_TRACKS, type AudioTrack } from "@/constants/audioLibrary";

type SourceMedia = {
  uri: string;
  type: "image" | "video";
  fileName?: string;
};

type AudioSource = {
  uri: string;
  name: string;
  duration?: number;
};

const stylesList = [
  { key: "Natural", label: "Natural", description: "Soft, human timing" },
  { key: "Expressive", label: "Expressive", description: "More visible emotion" },
  { key: "Calm", label: "Calm", description: "Subtle and steady" },
] as const;

export default function CreateScreen() {
  const colors = useColors();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [media, setMedia] = useState<SourceMedia | null>(null);
  const [audio, setAudio] = useState<AudioSource | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryCategory, setLibraryCategory] = useState<"All" | AudioTrack["category"]>("All");
  const [style, setStyle] = useState<(typeof stylesList)[number]["key"]>("Natural");
  const [intensity, setIntensity] = useState<"Low" | "Balanced" | "High">("Balanced");
  const audioPlayer = useAudioPlayer(audio?.uri ?? null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
  }, []);

  const audioDurationLabel = useMemo(() => {
    const seconds = Math.max(0, Math.floor(audioStatus.duration || audio?.duration || 0));
    if (!seconds) return "Ready to sync";
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }, [audio?.duration, audioStatus.duration]);

  const visibleTracks = useMemo(
    () => libraryCategory === "All" ? BUILTIN_AUDIO_TRACKS : BUILTIN_AUDIO_TRACKS.filter((track) => track.category === libraryCategory),
    [libraryCategory],
  );

  const selectBuiltinTrack = (track: AudioTrack) => {
    const [minutes, seconds] = track.duration.split(":").map(Number);
    setAudio({ uri: track.previewUrl, name: track.title, duration: minutes * 60 + seconds });
    setLibraryOpen(false);
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 30,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "image",
        fileName: asset.fileName ?? undefined,
      });
    }
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAudio({ uri: asset.uri, name: asset.name, duration: asset.size ? Math.round(asset.size / 16000) : undefined });
    }
  };

  const toggleRecording = async () => {
    if (recorderState.isRecording) {
      await recorder.stop();
      if (recorder.uri) {
        setAudio({ uri: recorder.uri, name: "Voice recording.m4a" });
      }
      return;
    }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Microphone access needed", "Allow microphone access in Settings to record a voice track.");
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const startGeneration = () => {
    if (!media) {
      Alert.alert("Add a face source", "Choose a photo or video before starting the lip-sync.");
      return;
    }
    if (!audio) {
      Alert.alert("Add an audio track", "Upload an audio file or record a voice track before starting.");
      return;
    }
    router.push({
      pathname: "/processing",
      params: {
        sourceUri: media.uri,
        sourceType: media.type,
        audioUri: audio.uri,
        audioName: audio.name,
        style,
        intensity,
      },
    });
  };

  return (
    <ScreenContainer className="px-5 pt-3" containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.55 }]}>
            <IconSymbol name="chevron.right" size={21} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>NEW PROJECT</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Create a natural sync</Text>
          </View>
          <View style={[styles.stepBadge, { backgroundColor: colors.surface }]}><Text style={[styles.stepText, { color: colors.muted }]}>1 / 1</Text></View>
        </View>

        <View style={[styles.tip, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}35` }]}>
          <IconSymbol name="sparkles" size={19} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>Use a clear, front-facing face and clean speech for the most natural result.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>1. FACE SOURCE</Text>
        <Pressable onPress={pickMedia} style={({ pressed }) => [styles.mediaCard, { borderColor: media ? colors.primary : colors.border, backgroundColor: colors.surface }, pressed && { opacity: 0.78 }]}>
          {media?.type === "image" ? (
            <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
          ) : (
            <View style={[styles.mediaPlaceholder, { backgroundColor: `${colors.primary}16` }]}>
              <IconSymbol name="video.fill" size={29} color={colors.primary} />
              <Text style={[styles.mediaPlaceholderText, { color: colors.foreground }]}>Video selected</Text>
              <Text style={[styles.helper, { color: colors.muted }]}>Tap to replace</Text>
            </View>
          )}
          {!media ? (
            <View style={styles.mediaPlaceholder}>
              <View style={[styles.addCircle, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name="photo.fill" size={26} color={colors.primary} /></View>
              <Text style={[styles.mediaTitle, { color: colors.foreground }]}>Choose a photo or video</Text>
              <Text style={[styles.helper, { color: colors.muted }]}>Up to 30 seconds · portrait works best</Text>
            </View>
          ) : null}
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>2. AUDIO TRACK</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.audioHeader}>
            <View style={[styles.audioIcon, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="mic.fill" size={19} color={colors.primary} /></View>
            <View style={styles.flexOne}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{audio ? audio.name : "Give your face a voice"}</Text>
              <Text style={[styles.helper, { color: colors.muted }]}>{audio ? audioDurationLabel : "Upload a clean track or record one now"}</Text>
            </View>
            {audio ? <Pressable onPress={() => setAudio(null)} style={({ pressed }) => [pressed && { opacity: 0.55 }]}><Text style={[styles.removeText, { color: colors.error }]}>Remove</Text></Pressable> : null}
          </View>
          <View style={styles.audioActions}>
            <Pressable onPress={pickAudio} style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="paperplane.fill" size={17} color={colors.foreground} />
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Upload audio</Text>
            </Pressable>
            <Pressable onPress={toggleRecording} style={({ pressed }) => [styles.secondaryButton, { borderColor: recorderState.isRecording ? colors.error : colors.border }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="mic.fill" size={17} color={recorderState.isRecording ? colors.error : colors.foreground} />
              <Text style={[styles.secondaryButtonText, { color: recorderState.isRecording ? colors.error : colors.foreground }]}>{recorderState.isRecording ? "Stop" : "Record"}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setLibraryOpen(true)} style={({ pressed }) => [styles.libraryButton, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}35` }, pressed && { opacity: 0.72 }]}>
            <IconSymbol name="sparkles" size={17} color={colors.primary} />
            <View style={styles.flexOne}><Text style={[styles.libraryButtonTitle, { color: colors.primary }]}>Browse built-in sounds</Text><Text style={[styles.libraryButtonHint, { color: colors.muted }]}>Original demo clips for quick tests</Text></View>
            <IconSymbol name="chevron.right" size={16} color={colors.primary} />
          </Pressable>
          {audio ? (
            <Pressable onPress={() => (audioStatus.playing ? audioPlayer.pause() : audioPlayer.play())} style={({ pressed }) => [styles.audioPreview, { backgroundColor: `${colors.primary}10` }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name={audioStatus.playing ? "chevron.right" : "play.fill"} size={17} color={colors.primary} />
              <Text style={[styles.audioPreviewText, { color: colors.primary }]}>{audioStatus.playing ? "Playing audio preview" : "Preview audio"}</Text>
              <View style={[styles.wave, { backgroundColor: colors.primary }]} />
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>3. MOTION PROFILE</Text>
        <View style={styles.styleGrid}>
          {stylesList.map((item) => (
            <Pressable key={item.key} onPress={() => setStyle(item.key)} style={({ pressed }) => [styles.styleCard, { backgroundColor: colors.surface, borderColor: style === item.key ? colors.primary : colors.border }, pressed && { opacity: 0.72 }]}>
              <View style={[styles.styleDot, { backgroundColor: style === item.key ? colors.primary : colors.border }]} />
              <Text style={[styles.styleLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.styleDescription, { color: colors.muted }]}>{item.description}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.intensityRow}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Motion intensity</Text>
          <View style={styles.intensityOptions}>
            {(["Low", "Balanced", "High"] as const).map((item) => (
              <Pressable key={item} onPress={() => setIntensity(item)} style={({ pressed }) => [styles.intensityPill, { backgroundColor: intensity === item ? colors.primary : colors.surface, borderColor: intensity === item ? colors.primary : colors.border }, pressed && { opacity: 0.72 }]}>
                <Text style={[styles.intensityText, { color: intensity === item ? "#fff" : colors.muted }]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={startGeneration} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.88 }]}>
          <IconSymbol name="sparkles" size={19} color="#fff" />
          <Text style={styles.primaryButtonText}>Start natural sync</Text>
          <IconSymbol name="chevron.right" size={18} color="#fff" />
        </Pressable>
        <Text style={[styles.privacy, { color: colors.muted }]}>Your media stays on this device in this prototype.</Text>
      </ScrollView>
      <Modal visible={libraryOpen} transparent animationType="slide" onRequestClose={() => setLibraryOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.librarySheet, { backgroundColor: colors.background }]}>
            <View style={styles.libraryHeader}>
              <View style={styles.flexOne}><Text style={[styles.libraryEyebrow, { color: colors.primary }]}>BUILT-IN AUDIO</Text><Text style={[styles.libraryTitle, { color: colors.foreground }]}>Find your sound</Text></View>
              <Pressable onPress={() => setLibraryOpen(false)} style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.surface }, pressed && { opacity: 0.6 }]}><Text style={[styles.closeText, { color: colors.foreground }]}>×</Text></Pressable>
            </View>
            <Text style={[styles.librarySubtitle, { color: colors.muted }]}>Short, original demo clips inspired by social formats. Tap a track to use it.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {(["All", "Viral", "Comedy", "Cinematic", "Narration"] as const).map((category) => (
                <Pressable key={category} onPress={() => setLibraryCategory(category)} style={({ pressed }) => [styles.categoryPill, { backgroundColor: libraryCategory === category ? colors.primary : colors.surface, borderColor: libraryCategory === category ? colors.primary : colors.border }, pressed && { opacity: 0.72 }]}><Text style={[styles.categoryText, { color: libraryCategory === category ? "#fff" : colors.muted }]}>{category}</Text></Pressable>
              ))}
            </ScrollView>
            <FlatList
              data={visibleTracks}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.trackList}
              renderItem={({ item }) => {
                const selected = audio?.uri === item.previewUrl;
                return <Pressable onPress={() => selectBuiltinTrack(item)} style={({ pressed }) => [styles.trackRow, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }, pressed && { opacity: 0.72 }]}>
                  <View style={[styles.trackBadge, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name={selected && audioStatus.playing ? "pause.fill" : "play.fill"} size={17} color={colors.primary} /></View>
                  <View style={styles.flexOne}><Text style={[styles.trackTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text><Text style={[styles.trackMeta, { color: colors.muted }]}>{item.category} · {item.duration} · {item.author}</Text></View>
                  <Text style={[styles.useText, { color: colors.primary }]}>{selected ? "Selected" : "Use"}</Text>
                </Pressable>;
              }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 4 },
  backButton: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(127,127,127,0.12)" },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { fontSize: 27, lineHeight: 33, fontWeight: "800", marginTop: 3 },
  stepBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11 },
  stepText: { fontSize: 12, fontWeight: "800" },
  tip: { flexDirection: "row", gap: 10, alignItems: "center", padding: 13, borderRadius: 16, borderWidth: 1, marginTop: 7 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 18, marginLeft: 4 },
  mediaCard: { minHeight: 192, borderRadius: 22, borderWidth: 1.3, borderStyle: "dashed", overflow: "hidden" },
  mediaPreview: { width: "100%", height: 210, resizeMode: "cover" },
  mediaPlaceholder: { flex: 1, minHeight: 190, alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 20 },
  addCircle: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  mediaTitle: { fontSize: 16, fontWeight: "800" },
  mediaPlaceholderText: { fontSize: 16, fontWeight: "800" },
  helper: { fontSize: 12, lineHeight: 17 },
  card: { borderRadius: 22, borderWidth: 1, padding: 15, gap: 13 },
  audioHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  audioIcon: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  flexOne: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: "800" },
  removeText: { fontSize: 12, fontWeight: "800" },
  audioActions: { flexDirection: "row", gap: 9 },
  secondaryButton: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  libraryButton: { minHeight: 53, borderRadius: 15, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12 },
  libraryButtonTitle: { fontSize: 12, fontWeight: "800" },
  libraryButtonHint: { fontSize: 10, marginTop: 2 },
  secondaryButtonText: { fontSize: 12, fontWeight: "800" },
  audioPreview: { minHeight: 42, borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12 },
  audioPreviewText: { fontSize: 12, fontWeight: "800", flex: 1 },
  wave: { width: 30, height: 3, borderRadius: 2 },
  styleGrid: { flexDirection: "row", gap: 9 },
  styleCard: { flex: 1, minHeight: 87, borderRadius: 16, borderWidth: 1, padding: 11, gap: 4 },
  styleDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  styleLabel: { fontSize: 13, fontWeight: "800" },
  styleDescription: { fontSize: 10, lineHeight: 14 },
  intensityRow: { gap: 10, marginTop: 6 },
  intensityOptions: { flexDirection: "row", gap: 8 },
  intensityPill: { flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1, paddingVertical: 9 },
  intensityText: { fontSize: 11, fontWeight: "800" },
  primaryButton: { minHeight: 54, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "800", flex: 1 },
  privacy: { textAlign: "center", fontSize: 11, marginTop: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 27, 31, 0.46)", justifyContent: "flex-end" },
  librarySheet: { maxHeight: "86%", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30 },
  libraryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  libraryEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  libraryTitle: { fontSize: 25, lineHeight: 31, fontWeight: "800", marginTop: 3 },
  closeButton: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 26, lineHeight: 28, fontWeight: "400", marginTop: -2 },
  librarySubtitle: { fontSize: 12, lineHeight: 17, marginTop: 8, maxWidth: 330 },
  categoryRow: { gap: 8, paddingVertical: 15 },
  categoryPill: { borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  categoryText: { fontSize: 11, fontWeight: "800" },
  trackList: { gap: 9, paddingBottom: 10 },
  trackRow: { minHeight: 67, borderRadius: 17, borderWidth: 1, padding: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  trackBadge: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  trackTitle: { fontSize: 12, fontWeight: "800" },
  trackMeta: { fontSize: 10, marginTop: 3 },
  useText: { fontSize: 11, fontWeight: "800" },
});
