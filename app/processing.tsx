import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { setAudioModeAsync } from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const stages = [
  { label: "Analyzing audio", detail: "Finding syllables and natural pauses" },
  { label: "Mapping mouth movement", detail: "Matching phonemes to facial timing" },
  { label: "Smoothing expression", detail: "Balancing eye and head motion" },
  { label: "Preparing preview", detail: "Packaging your local result" },
];

export default function ProcessingScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ sourceUri?: string; sourceType?: string; audioUri?: string; audioName?: string; style?: string; intensity?: string }>();
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const next = Math.min(100, Math.round(((Date.now() - startedAt) / 7200) * 100));
      setProgress(next);
      if (next >= 100) {
        clearInterval(timer);
        if (!completedRef.current) {
          completedRef.current = true;
          router.replace({ pathname: "/result", params });
        }
      }
    }, 160);
    return () => clearInterval(timer);
  }, [params]);

  const stageIndex = Math.min(stages.length - 1, Math.floor(progress / 25));
  const sourceLabel = params.sourceType === "video" ? "Video source" : "Portrait source";
  const progressLabel = useMemo(() => `${progress}%`, [progress]);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={[styles.brandMark, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name="sparkles" size={20} color={colors.primary} /></View>
          <Text style={[styles.topLabel, { color: colors.muted }]}>NATURAL ENGINE</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.topLabel, { color: colors.muted }]}>LOCAL PREVIEW</Text>
        </View>

        <View style={styles.centerBlock}>
          <View style={[styles.progressRing, { borderColor: `${colors.primary}25` }]}>
            <View style={[styles.progressRingInner, { borderColor: colors.primary }]}>
              <Text style={[styles.progressText, { color: colors.foreground }]}>{progressLabel}</Text>
              <Text style={[styles.progressCaption, { color: colors.muted }]}>rendering</Text>
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Building your sync</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>We are shaping the timing around your voice so it feels less mechanical.</Text>
        </View>

        <View style={styles.stageList}>
          {stages.map((stage, index) => {
            const isDone = progress >= (index + 1) * 25;
            const isActive = index === stageIndex && progress < 100;
            return (
              <View key={stage.label} style={styles.stageRow}>
                <View style={[styles.stageIcon, { backgroundColor: isDone ? colors.success : isActive ? `${colors.primary}18` : colors.surface, borderColor: isDone ? colors.success : isActive ? colors.primary : colors.border }]}>
                  {isDone ? <IconSymbol name="chevron.right" size={14} color="#fff" /> : isActive ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.stageNumber, { color: colors.muted }]}>{index + 1}</Text>}
                </View>
                <View style={styles.stageCopy}>
                  <Text style={[styles.stageLabel, { color: isActive || isDone ? colors.foreground : colors.muted }]}>{stage.label}</Text>
                  <Text style={[styles.stageDetail, { color: colors.muted }]}>{stage.detail}</Text>
                </View>
                {isDone ? <Text style={[styles.doneText, { color: colors.success }]}>Done</Text> : null}
              </View>
            );
          })}
        </View>

        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>SOURCE</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{sourceLabel}</Text></View>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>PROFILE</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{params.style ?? "Natural"} · {params.intensity ?? "Balanced"}</Text></View>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>AUDIO</Text><Text style={[styles.metaValue, { color: colors.foreground }]} numberOfLines={1}>{params.audioName ?? "Voice track"}</Text></View>
        </View>

        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.cancelText, { color: colors.muted }]}>Keep this screen open</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 18, paddingBottom: 20 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  topLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  centerBlock: { alignItems: "center", marginTop: 48, paddingHorizontal: 24 },
  progressRing: { width: 190, height: 190, borderRadius: 95, borderWidth: 12, alignItems: "center", justifyContent: "center" },
  progressRingInner: { width: 154, height: 154, borderRadius: 77, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  progressText: { fontSize: 41, lineHeight: 47, fontWeight: "800" },
  progressCaption: { fontSize: 12, fontWeight: "700", marginTop: 1 },
  title: { fontSize: 25, lineHeight: 31, fontWeight: "800", marginTop: 27, textAlign: "center" },
  subtitle: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 7 },
  stageList: { marginTop: 35, gap: 15 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  stageIcon: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stageNumber: { fontSize: 12, fontWeight: "800" },
  stageCopy: { flex: 1, gap: 2 },
  stageLabel: { fontSize: 14, fontWeight: "800" },
  stageDetail: { fontSize: 11 },
  doneText: { fontSize: 11, fontWeight: "800" },
  metaCard: { marginTop: "auto", borderRadius: 17, borderWidth: 1, padding: 14, gap: 9 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaKey: { width: 58, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  metaValue: { flex: 1, fontSize: 12, fontWeight: "700", textAlign: "right" },
  cancelButton: { alignItems: "center", paddingVertical: 14 },
  cancelText: { fontSize: 12, fontWeight: "700" },
});
