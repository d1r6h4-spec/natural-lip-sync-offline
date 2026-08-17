import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { setAudioModeAsync } from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { renderOffline, type OfflineRenderProgress } from "@/lib/offline-renderer";

const stages = [
  { key: "audio", label: "Reading audio", detail: "Preparing the reference voice track locally" },
  { key: "frames", label: "Preparing frames", detail: "Extracting media frames on this device" },
  { key: "face", label: "Detecting face", detail: "Finding the face with on-device ML Kit" },
  { key: "inference", label: "Driving facial motion", detail: "Running Wav2Lip ONNX on the device" },
  { key: "encode", label: "Preparing result", detail: "Packaging the MP4 locally" },
] as const;

type ProcessingParams = {
  sourceUri: string;
  sourceType: string;
  audioUri: string;
  audioName?: string;
  motionUri?: string;
  motionName?: string;
  style?: string;
  intensity?: string;
  trimStart?: string;
  trimEnd?: string;
  videoTrimStart?: string;
  videoTrimEnd?: string;
  motionWeight?: string;
  audioDuration?: string;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stageIndexFor(stage: OfflineRenderProgress["stage"]) {
  if (stage === "audio") return 0;
  if (stage === "frames") return 1;
  if (stage === "face") return 2;
  if (stage === "inference") return 3;
  return 4;
}

export default function ProcessingScreen() {
  const colors = useColors();
  const rawParams = useLocalSearchParams<ProcessingParams>();
  // Expo Router can return a new params object after each state update. Keep one
  // normalized snapshot for this render job so the effect cannot restart or
  // repeatedly clean up while progress updates are being reported.
  const paramsRef = useRef<ProcessingParams | null>(null);
  if (!paramsRef.current) {
    paramsRef.current = Object.fromEntries(
      Object.entries(rawParams).map(([key, value]) => [key, first(value)]),
    ) as ProcessingParams;
  }
  const params = paramsRef.current;
  const started = useRef(false);
  const [progress, setProgress] = useState(0.02);
  const [activeStage, setActiveStage] = useState<OfflineRenderProgress["stage"]>("audio");
  const [detail, setDetail] = useState("Starting local renderer");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let canceled = false;
    const run = async () => {
      if (!params.sourceUri || !params.audioUri) {
        setErrorMessage("A local face source and audio track are required.");
        return;
      }
      try {
        const result = await renderOffline(
          {
            sourceUri: params.sourceUri,
            sourceType: params.sourceType === "video" ? "video" : "image",
            audioUri: params.audioUri,
            trimStart: Number(params.trimStart ?? 0),
            trimEnd: Number(params.trimEnd ?? 1),
            audioDuration: Number(params.audioDuration ?? 0),
            videoTrimStart: Number(params.videoTrimStart ?? 0),
            videoTrimEnd: Number(params.videoTrimEnd ?? 1),
            style: params.style === "Expressive" || params.style === "Calm" ? params.style : "Natural",
            intensity: params.intensity === "Low" || params.intensity === "High" ? params.intensity : "Balanced",
          },
          (update) => {
            if (canceled) return;
            setProgress(update.progress);
            setActiveStage(update.stage);
            setDetail(update.detail);
          },
        );
        if (canceled) return;
        setProgress(1);
        setActiveStage("done");
        setDetail("Offline render complete");
        setTimeout(() => {
          if (canceled) return;
          router.replace({
            pathname: "/result",
            params: {
              ...params,
              outputUrl: result.outputUri,
              jobStatus: "succeeded",
              renderEngine: result.engine,
              renderDuration: String(result.duration),
            },
          });
        }, 700);
      } catch (error) {
        if (canceled) return;
        setErrorMessage(error instanceof Error ? error.message : "The offline render could not be completed.");
      }
    };
    void run();
    return () => {
      canceled = true;
    };
  }, [params]);

  const progressPercent = Math.round(progress * 100);
  const failed = Boolean(errorMessage);
  const stageIndex = activeStage === "done" ? stages.length : stageIndexFor(activeStage);
  const statusLabel = failed ? "FAILED" : progress >= 1 ? "COMPLETE" : "RENDERING";
  const hasMotionTransfer = Boolean(params.motionUri);
  const sourceLabel = params.sourceType === "video" ? "Video source" : hasMotionTransfer ? "Photo source" : "Portrait source";

  const handleCancel = () => {
    setCanceling(true);
    router.back();
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={[styles.brandMark, { backgroundColor: `${colors.success}18` }]}><IconSymbol name="sparkles" size={20} color={colors.success} /></View>
          <Text style={[styles.topLabel, { color: colors.success }]}>OFFLINE ENGINE</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.topLabel, { color: failed ? colors.error : colors.muted }]}>{statusLabel}</Text>
        </View>

        <View style={styles.centerBlock}>
          <View style={[styles.progressRing, { borderColor: `${colors.success}25` }]}>
            <View style={[styles.progressRingInner, { borderColor: failed ? colors.error : colors.success }]}>
              {failed ? <IconSymbol name="exclamationmark.triangle.fill" size={34} color={colors.error} /> : <Text style={[styles.progressText, { color: colors.foreground }]}>{progressPercent}%</Text>}
              <Text style={[styles.progressCaption, { color: failed ? colors.error : colors.muted }]}>{failed ? "needs attention" : statusLabel.toLowerCase()}</Text>
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{failed ? "Offline render needs attention" : progress >= 1 ? "Your sync is ready" : "Building your sync locally"}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{failed ? errorMessage : "Wav2Lip, face detection, audio processing, and MP4 encoding stay on this Android device. No API call is made."}</Text>
        </View>

        <View style={styles.progressMeter}>
          <View style={styles.progressMetaRow}><Text style={[styles.progressMetaLabel, { color: colors.muted }]}>{failed ? "LOCAL ERROR" : "OFFLINE PROGRESS"}</Text><Text style={[styles.progressMetaValue, { color: failed ? colors.error : colors.foreground }]}>{progressPercent}%</Text></View>
          <View style={[styles.progressTrack, { backgroundColor: `${colors.success}18` }]}><View style={[styles.progressFill, { width: `${Math.min(100, progressPercent)}%`, backgroundColor: failed ? colors.error : colors.success }]} /></View>
        </View>

        {!failed ? (
          <View style={styles.stageList}>
            {stages.map((stage, index) => {
              const isDone = progress >= 1 || index < stageIndex;
              const isActive = !isDone && index === stageIndex;
              return <View key={stage.key} style={styles.stageRow}>
                <View style={[styles.stageIcon, { backgroundColor: isDone ? colors.success : isActive ? `${colors.success}18` : colors.surface, borderColor: isDone ? colors.success : isActive ? colors.success : colors.border }]}>
                  {isDone ? <IconSymbol name="checkmark" size={14} color="#fff" /> : isActive ? <ActivityIndicator size="small" color={colors.success} /> : <Text style={[styles.stageNumber, { color: colors.muted }]}>{index + 1}</Text>}
                </View>
                <View style={styles.stageCopy}><Text style={[styles.stageLabel, { color: isActive || isDone ? colors.foreground : colors.muted }]}>{stage.label}</Text><Text style={[styles.stageDetail, { color: colors.muted }]}>{isActive ? detail : stage.detail}</Text></View>
                {isDone ? <Text style={[styles.doneText, { color: colors.success }]}>Done</Text> : null}
              </View>;
            })}
          </View>
        ) : (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}10`, borderColor: `${colors.error}35` }]}><IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} /><Text style={[styles.errorText, { color: colors.foreground }]}>{errorMessage}</Text></View>
        )}

        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>ENGINE</Text><Text style={[styles.metaValue, { color: colors.success }]}>WAV2LIP ON-DEVICE</Text></View>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>SOURCE</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{sourceLabel}</Text></View>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>PROFILE</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{params.style ?? "Natural"} · {params.intensity ?? "Balanced"}</Text></View>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>AUDIO</Text><Text style={[styles.metaValue, { color: colors.foreground }]} numberOfLines={1}>{params.audioName ?? "Voice track"}</Text></View>
        </View>

        <Pressable onPress={handleCancel} disabled={canceling} style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.6 }, canceling && { opacity: 0.5 }]}><Text style={[styles.cancelText, { color: colors.muted }]}>{canceling ? "Stopping local render…" : failed ? "Go back" : "Cancel render"}</Text></Pressable>
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
  progressText: { fontSize: 34, lineHeight: 41, fontWeight: "800" },
  progressCaption: { fontSize: 12, fontWeight: "700", marginTop: 1 },
  title: { fontSize: 25, lineHeight: 31, fontWeight: "800", marginTop: 27, textAlign: "center" },
  subtitle: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 7 },
  progressMeter: { marginTop: 28, gap: 8 },
  progressMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressMetaLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  progressMetaValue: { fontSize: 14, fontWeight: "800" },
  progressTrack: { height: 8, borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 8 },
  stageList: { marginTop: 26, gap: 15 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  stageIcon: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stageNumber: { fontSize: 12, fontWeight: "800" },
  stageCopy: { flex: 1, gap: 2 },
  stageLabel: { fontSize: 14, fontWeight: "800" },
  stageDetail: { fontSize: 11 },
  doneText: { fontSize: 11, fontWeight: "800" },
  errorCard: { marginTop: 32, borderRadius: 17, borderWidth: 1, padding: 16, flexDirection: "row", gap: 10, alignItems: "center" },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  metaCard: { marginTop: "auto", borderRadius: 17, borderWidth: 1, padding: 14, gap: 9 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaKey: { width: 58, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  metaValue: { flex: 1, fontSize: 12, fontWeight: "700", textAlign: "right" },
  cancelButton: { alignItems: "center", paddingVertical: 14 },
  cancelText: { fontSize: 12, fontWeight: "700" },
});
