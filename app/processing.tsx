import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { setAudioModeAsync } from "expo-audio";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { friendlyLipSyncError, isProviderCreditError } from "@/lib/lipsync-error";

const stages = [
  { label: "Reading audio", detail: "Preparing the reference voice track" },
  { label: "Driving facial motion", detail: "Matching mouth and expression timing" },
  { label: "Smoothing expression", detail: "Balancing eye and head motion" },
  { label: "Preparing result", detail: "Packaging your generated video" },
];

type ProcessingParams = {
  jobId: string;
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

export default function ProcessingScreen() {
  const colors = useColors();
  const rawParams = useLocalSearchParams<ProcessingParams>();
  const params = useMemo(
    () => Object.fromEntries(Object.entries(rawParams).map(([key, value]) => [key, first(value)])) as ProcessingParams,
    [rawParams],
  );
  const jobId = params.jobId;
  const [canceling, setCanceling] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const statusQuery = trpc.lipsync.status.useQuery(
    { jobId: jobId ?? "" },
    {
      enabled: Boolean(jobId),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "succeeded" || status === "failed" || status === "canceled" ? false : 1800;
      },
    },
  );
  const cancelMutation = trpc.lipsync.cancel.useMutation();

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (!jobId) return;
    setElapsedSeconds(0);
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [jobId]);

  useEffect(() => {
    if (statusQuery.data?.status !== "succeeded" || !statusQuery.data.outputUrl) return;
    const timer = setTimeout(() => {
      router.replace({
        pathname: "/result",
        params: {
          ...params,
          outputUrl: statusQuery.data?.outputUrl ?? "",
          jobStatus: "succeeded",
        },
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [params, statusQuery.data?.outputUrl, statusQuery.data?.status]);

  const status = statusQuery.data?.status;
  const serverProgress = statusQuery.data?.progress ?? (statusQuery.isLoading ? 0.08 : 0);
  const estimatedProgress = status === "queued"
    ? Math.min(0.28, Math.max(serverProgress, 0.08 + elapsedSeconds * 0.018))
    : status === "processing"
      ? Math.min(0.94, Math.max(serverProgress, 0.56 + elapsedSeconds * 0.01))
      : serverProgress;
  const progress = jobId ? Math.round(estimatedProgress * 100) : 0;
  const rawError = statusQuery.data?.error ?? statusQuery.error ?? (!jobId ? "This project does not have a remote render job." : null);
  const providerCreditError = isProviderCreditError(rawError);
  const failedMessage = rawError ? friendlyLipSyncError(rawError) : null;
  const statusLabel = status === "queued" ? "queued" : status === "processing" ? "rendering" : status ?? "connecting";
  const stageIndex = Math.min(stages.length - 1, Math.floor(progress / 25));
  const hasMotionTransfer = Boolean(params.motionUri);
  const sourceLabel = params.sourceType === "video" ? "Video source" : hasMotionTransfer ? "Photo + motion video" : "Portrait source";
  const progressLabel = `${progress}%`;
  const isEstimated = status === "queued" || status === "processing";

  const handleCancel = async () => {
    if (!jobId) {
      router.back();
      return;
    }
    setCanceling(true);
    try {
      await cancelMutation.mutateAsync({ jobId });
      router.back();
    } catch (error) {
      Alert.alert("Could not cancel", error instanceof Error ? error.message : "Please try again.");
      setCanceling(false);
    }
  };

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={[styles.brandMark, { backgroundColor: `${colors.primary}18` }]}><IconSymbol name="sparkles" size={20} color={colors.primary} /></View>
          <Text style={[styles.topLabel, { color: colors.muted }]}>{hasMotionTransfer ? "MOTION CONTROL ENGINE" : params.sourceType === "video" ? "VIDEO RETALKING ENGINE" : "SADTALKER ENGINE"}</Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.topLabel, { color: colors.muted }]}>{statusLabel.toUpperCase()}</Text>
        </View>

        <View style={styles.centerBlock}>
          <View style={[styles.progressRing, { borderColor: `${colors.primary}25` }]}>
            <View style={[styles.progressRingInner, { borderColor: failedMessage ? colors.error : colors.primary }]}>
              {failedMessage ? <IconSymbol name="exclamationmark.triangle.fill" size={34} color={colors.error} /> : <Text style={[styles.progressText, { color: colors.foreground }]}>{progressLabel}</Text>}
              <Text style={[styles.progressCaption, { color: failedMessage ? colors.error : colors.muted }]}>{failedMessage ? "needs attention" : statusLabel}</Text>
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{failedMessage ? providerCreditError ? "Provider credit required" : "Render needs attention" : "Building your sync"}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{failedMessage ? failedMessage : hasMotionTransfer ? "The AI is transferring full-body movement from your reference video, then preparing the selected audio track. This may take several minutes." : params.sourceType === "video" ? "The AI is preserving your video motion while matching the reference audio. This can take about a minute." : "SadTalker is animating your image from the reference audio. This can take about a minute."}</Text>
        </View>

        <View style={styles.progressMeter}>
          <View style={styles.progressMetaRow}>
            <Text style={[styles.progressMetaLabel, { color: colors.muted }]}>{isEstimated ? "ESTIMATED PROGRESS" : "PROGRESS"}</Text>
            <Text style={[styles.progressMetaValue, { color: failedMessage ? colors.error : colors.foreground }]}>{progressLabel}</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: `${colors.primary}18` }]}>
            <View style={[styles.progressFill, { width: `${Math.min(100, progress)}%`, backgroundColor: failedMessage ? colors.error : colors.primary }]} />
          </View>
        </View>

        {!failedMessage ? (
          <View style={styles.stageList}>
            {stages.map((stage, index) => {
              const isDone = progress >= (index + 1) * 25;
              const isActive = index === stageIndex && progress < 100;
              return (
                <View key={stage.label} style={styles.stageRow}>
                  <View style={[styles.stageIcon, { backgroundColor: isDone ? colors.success : isActive ? `${colors.primary}18` : colors.surface, borderColor: isDone ? colors.success : isActive ? colors.primary : colors.border }]}> 
                    {isDone ? <IconSymbol name="checkmark" size={14} color="#fff" /> : isActive ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.stageNumber, { color: colors.muted }]}>{index + 1}</Text>}
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
        ) : (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}10`, borderColor: `${colors.error}35` }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.foreground }]}>{providerCreditError ? "Add Replicate credits, then start the sync again. Your selected media and trim settings are still safe." : "Check the server configuration and try starting the sync again."}</Text>
          </View>
        )}

        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>SOURCE</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{sourceLabel}</Text></View>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>PROFILE</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{params.style ?? "Natural"} · {params.intensity ?? "Balanced"}</Text></View>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>AUDIO</Text><Text style={[styles.metaValue, { color: colors.foreground }]} numberOfLines={1}>{params.audioName ?? "Voice track"}</Text></View>
          <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>AUDIO CLIP</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{(() => {
            const start = Number(params.trimStart ?? 0);
            const end = Number(params.trimEnd ?? 1);
            const dur = Number(params.audioDuration ?? 0);
            if (dur > 0) {
              const sSec = Math.round(start * dur);
              const eSec = Math.round(end * dur);
              return `${sSec}s – ${eSec}s (${Math.max(1, eSec - sSec)}s)`;
            }
            return `${Math.round(start * 100)}% – ${Math.round(end * 100)}%`;
          })()}</Text></View>
          {params.sourceType === "video" ? <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>VIDEO CLIP</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{params.videoTrimStart ?? "0"} – {params.videoTrimEnd ?? "1"}</Text></View> : null}
          {hasMotionTransfer ? <View style={styles.metaRow}><Text style={[styles.metaKey, { color: colors.muted }]}>MOTION</Text><Text style={[styles.metaValue, { color: colors.foreground }]}>{params.motionName ?? "Reference video"} · {params.motionWeight ?? "Balanced"}</Text></View> : null}
        </View>

        <Pressable onPress={handleCancel} disabled={canceling} style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.6 }, canceling && { opacity: 0.5 }]}>
          <Text style={[styles.cancelText, { color: colors.muted }]}>{canceling ? "Stopping render…" : failedMessage ? "Go back" : "Cancel render"}</Text>
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
