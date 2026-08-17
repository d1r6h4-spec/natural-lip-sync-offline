import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const SETTINGS_KEY = "natural-lipsync-settings";

type Settings = {
  quality: "720p" | "1080p";
  defaultStyle: "Natural" | "Expressive" | "Calm";
  autoSave: boolean;
};

const defaultSettings: Settings = {
  quality: "1080p",
  defaultStyle: "Natural",
  autoSave: true,
};

export default function SettingsScreen() {
  const colors = useColors();
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    void AsyncStorage.getItem(SETTINGS_KEY).then((stored) => {
      let general = {};
      if (stored) {
        try {
          general = JSON.parse(stored) as Record<string, unknown>;
        } catch {
          general = {};
        }
      }
      setSettings({ ...defaultSettings, ...general });
    });
  }, []);

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ quality: next.quality, defaultStyle: next.defaultStyle, autoSave: next.autoSave }));
  };

  const clearHistory = () => {
    Alert.alert("Clear history?", "All saved local projects will be removed from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("natural-lipsync-projects");
          Alert.alert("History cleared", "Your local lip-sync projects have been removed.");
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-5 pt-4" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>WORKSPACE</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colors.surface }]}>
            <IconSymbol name="gearshape.fill" size={22} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>RENDER QUALITY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>Export resolution</Text>
          <View style={styles.segmented}>
            {(["720p", "1080p"] as const).map((quality) => (
              <Pressable
                key={quality}
                onPress={() => updateSettings({ quality })}
                style={({ pressed }) => [
                  styles.segment,
                  { backgroundColor: settings.quality === quality ? colors.primary : "transparent" },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <Text style={[styles.segmentText, { color: settings.quality === quality ? "#fff" : colors.muted }]}>{quality}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.helper, { color: colors.muted }]}>1080p gives a sharper result; 720p renders faster.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>DEFAULT STYLE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>Expression preset</Text>
          {(["Natural", "Expressive", "Calm"] as const).map((style) => (
            <Pressable
              key={style}
              onPress={() => updateSettings({ defaultStyle: style })}
              style={({ pressed }) => [styles.optionRow, pressed && { opacity: 0.65 }]}
            >
              <Text style={[styles.optionText, { color: colors.foreground }]}>{style}</Text>
              <View style={[styles.radio, { borderColor: settings.defaultStyle === style ? colors.primary : colors.border }]}>
                {settings.defaultStyle === style ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>RENDER ENGINE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>Free Offline Edition</Text>
          <Text style={[styles.helper, { color: colors.muted }]}>Wav2Lip, face detection, audio processing, and MP4 export run locally on this device. No internet connection or account is required.</Text>
          <View style={[styles.statusPill, { backgroundColor: `${colors.success}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.statusText, { color: colors.success }]}>OFFLINE READY</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>STORAGE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.optionRow}>
            <View style={styles.flexOne}>
              <Text style={[styles.optionText, { color: colors.foreground }]}>Save completed renders</Text>
              <Text style={[styles.helper, { color: colors.muted }]}>Keep projects in your local history.</Text>
            </View>
            <Switch value={settings.autoSave} onValueChange={(autoSave) => updateSettings({ autoSave })} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>
          <Pressable onPress={clearHistory} style={({ pressed }) => [styles.dangerRow, pressed && { opacity: 0.65 }]}>
            <IconSymbol name="trash.fill" size={18} color={colors.error} />
            <Text style={[styles.dangerText, { color: colors.error }]}>Clear local history</Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.muted }]}>Natural Lip-Sync · v2.0.0 FREE · Offline Edition</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: "800", marginTop: 4 },
  headerIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 12 },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  segmented: { flexDirection: "row", padding: 4, borderRadius: 14, backgroundColor: "rgba(127,127,127,0.12)" },
  segment: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  segmentText: { fontSize: 13, fontWeight: "800" },
  helper: { fontSize: 12, lineHeight: 17 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 34 },
  optionText: { fontSize: 15, fontWeight: "600" },
  flexOne: { flex: 1, gap: 2 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  dangerRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(127,127,127,0.22)" },
  dangerText: { fontSize: 14, fontWeight: "700" },
  footer: { textAlign: "center", fontSize: 12, marginTop: 24 },
});
