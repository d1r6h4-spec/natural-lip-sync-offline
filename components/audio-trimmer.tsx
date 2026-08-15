import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

type AudioTrimmerColors = {
  primary: string;
  foreground: string;
  muted: string;
  surface: string;
  border: string;
};

type AudioTrimmerProps = {
  duration: number;
  startRatio: number;
  endRatio: number;
  isPlaying: boolean;
  colors: AudioTrimmerColors;
  onStartChange: (value: number) => void;
  onEndChange: (value: number) => void;
  onPreview: () => void;
};

const WAVEFORM = [0.24, 0.48, 0.34, 0.7, 0.44, 0.86, 0.58, 0.38, 0.66, 0.92, 0.52, 0.32, 0.76, 0.46, 0.88, 0.56, 0.3, 0.64, 0.82, 0.4, 0.68, 0.5, 0.94, 0.36, 0.58, 0.78, 0.44, 0.7, 0.52, 0.84, 0.34, 0.62, 0.9, 0.48, 0.72, 0.4, 0.56, 0.8, 0.3, 0.64] as const;
const MIN_RANGE = 0.04;

function formatTime(value: number) {
  const seconds = Math.max(0, Math.round(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function AudioTrimmer({ duration, startRatio, endRatio, isPlaying, colors, onStartChange, onEndChange, onPreview }: AudioTrimmerProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const startOrigin = useRef(startRatio);
  const endOrigin = useRef(endRatio);

  useEffect(() => {
    startOrigin.current = startRatio;
    endOrigin.current = endRatio;
  }, [endRatio, startRatio]);

  const safeDuration = Math.max(duration, 1);
  const startSeconds = startRatio * safeDuration;
  const endSeconds = endRatio * safeDuration;

  const onWaveformLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const startPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      startOrigin.current = startRatio;
    },
    onPanResponderMove: (_, gesture) => {
      if (!trackWidth) return;
      const next = startOrigin.current + gesture.dx / trackWidth;
      onStartChange(Math.max(0, Math.min(next, endRatio - MIN_RANGE)));
    },
  }), [endRatio, onStartChange, startRatio, trackWidth]);

  const endPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      endOrigin.current = endRatio;
    },
    onPanResponderMove: (_, gesture) => {
      if (!trackWidth) return;
      const next = endOrigin.current + gesture.dx / trackWidth;
      onEndChange(Math.min(1, Math.max(next, startRatio + MIN_RANGE)));
    },
  }), [endRatio, onEndChange, startRatio, trackWidth]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>Trim audio</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Drag the handles to choose the exact section.</Text>
        </View>
        <Pressable onPress={onPreview} style={({ pressed }) => [styles.previewButton, { backgroundColor: `${colors.primary}14` }, pressed && { opacity: 0.65 }]}>
          <IconSymbol name={isPlaying ? "pause.fill" : "play.fill"} size={15} color={colors.primary} />
          <Text style={[styles.previewText, { color: colors.primary }]}>{isPlaying ? "Stop" : "Preview"}</Text>
        </Pressable>
      </View>

      <View style={styles.timeRow}>
        <Text style={[styles.timeLabel, { color: colors.primary }]}>{formatTime(startSeconds)}</Text>
        <Text style={[styles.rangeText, { color: colors.muted }]}>{formatTime(Math.max(0, endSeconds - startSeconds))} selected</Text>
        <Text style={[styles.timeLabel, { color: colors.primary }]}>{formatTime(endSeconds)}</Text>
      </View>

      <View onLayout={onWaveformLayout} style={[styles.waveform, { borderColor: `${colors.primary}42`, backgroundColor: `${colors.primary}08` }]}>
        <View pointerEvents="none" style={[styles.dimOverlay, { width: `${startRatio * 100}%`, backgroundColor: `${colors.foreground}12` }]} />
        <View pointerEvents="none" style={[styles.dimOverlayRight, { width: `${(1 - endRatio) * 100}%`, backgroundColor: `${colors.foreground}12` }]} />
        <View pointerEvents="none" style={styles.barRow}>
          {WAVEFORM.map((height, index) => <View key={`${index}-${height}`} style={[styles.bar, { height: `${Math.max(22, height * 86)}%`, backgroundColor: index / WAVEFORM.length >= startRatio && index / WAVEFORM.length <= endRatio ? colors.primary : `${colors.primary}42` }]} />)}
        </View>
        <View {...startPanResponder.panHandlers} style={[styles.handleHitArea, { left: `${startRatio * 100}%` }]}><View style={[styles.handleLine, { backgroundColor: colors.primary }]} /></View>
        <View {...endPanResponder.panHandlers} style={[styles.handleHitArea, { left: `${endRatio * 100}%` }]}><View style={[styles.handleLine, { backgroundColor: colors.primary }]} /></View>
      </View>

      <View style={styles.hintRow}>
        <Text style={[styles.hint, { color: colors.muted }]}>START</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>END</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headingCopy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: "800" },
  subtitle: { fontSize: 11, lineHeight: 16 },
  previewButton: { minHeight: 34, borderRadius: 11, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 5 },
  previewText: { fontSize: 11, fontWeight: "800" },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeLabel: { fontSize: 11, fontWeight: "800", minWidth: 35 },
  rangeText: { fontSize: 10, fontWeight: "700" },
  waveform: { height: 92, borderRadius: 14, borderWidth: 1, overflow: "hidden", position: "relative", justifyContent: "center" },
  barRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", height: "100%", paddingHorizontal: 9, gap: 3 },
  bar: { flex: 1, minWidth: 2, maxWidth: 6, borderRadius: 6 },
  dimOverlay: { position: "absolute", left: 0, top: 0, bottom: 0 },
  dimOverlayRight: { position: "absolute", right: 0, top: 0, bottom: 0 },
  handleHitArea: { position: "absolute", top: 0, bottom: 0, width: 28, marginLeft: -14, alignItems: "center", justifyContent: "center" },
  handleLine: { width: 4, height: "82%", borderRadius: 3, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 3, elevation: 2 },
  hintRow: { flexDirection: "row", justifyContent: "space-between" },
  hint: { fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
});
