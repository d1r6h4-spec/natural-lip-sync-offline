import { useCallback, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
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
  status: "Completed" | "Processing" | "Draft";
};

const demoProjects: Project[] = [];

export default function HomeScreen() {
  const colors = useColors();
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = useCallback(async () => {
    const stored = await AsyncStorage.getItem("natural-lipsync-projects");
    if (!stored) {
      setProjects([]);
      return;
    }
    try {
      setProjects(JSON.parse(stored));
    } catch {
      setProjects([]);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadProjects();
  }, [loadProjects]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const renderProject = ({ item }: { item: Project }) => (
    <Pressable onPress={() => router.push({ pathname: "/result", params: { sourceUri: item.sourceUri, sourceType: item.sourceType, audioName: item.audioName, style: item.style, intensity: item.intensity } })} style={({ pressed }) => [styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.72 }]}>
      {item.sourceType === "image" && item.sourceUri ? <Image source={{ uri: item.sourceUri }} style={styles.projectThumb} /> : <View style={[styles.projectThumb, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="video.fill" size={23} color={colors.primary} /></View>}
      <View style={styles.projectCopy}>
        <View style={styles.projectTitleRow}><Text style={[styles.projectTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text><View style={[styles.statusDot, { backgroundColor: colors.success }]} /></View>
        <Text style={[styles.projectAudio, { color: colors.muted }]} numberOfLines={1}>{item.audioName}</Text>
        <Text style={[styles.projectMeta, { color: colors.muted }]}>{item.style} · {item.intensity}</Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={colors.muted} />
    </Pressable>
  );

  return (
    <ScreenContainer className="px-5 pt-4" containerClassName="bg-background">
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>NATURAL LIP-SYNC</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Make faces speak.</Text>
              </View>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}><IconSymbol name="sparkles" size={19} color="#fff" /></View>
            </View>

            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
              <View style={styles.heroGlow} />
              <View style={styles.heroContent}>
                <View style={styles.heroPill}><View style={styles.liveDot} /><Text style={styles.heroPillText}>AUDIO READY</Text></View>
                <Text style={styles.heroTitle}>Give your voice a face.</Text>
                <Text style={styles.heroSubtitle}>Turn a portrait and any voice track into a soft, natural performance.</Text>
                <Pressable onPress={() => router.push("/create")} style={({ pressed }) => [styles.heroButton, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}>
                  <IconSymbol name="plus.circle.fill" size={18} color={colors.primary} />
                  <Text style={[styles.heroButtonText, { color: colors.primary }]}>Create new</Text>
                </Pressable>
              </View>
              <View style={styles.heroOrb}><IconSymbol name="mic.fill" size={32} color="#fff" /></View>
            </View>

            <View style={styles.quickRow}>
              <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="mic.fill" size={19} color={colors.primary} /><Text style={[styles.quickTitle, { color: colors.foreground }]}>Audio support</Text><Text style={[styles.quickCaption, { color: colors.muted }]}>Upload or record</Text></View>
              <View style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="sparkles" size={19} color={colors.primary} /><Text style={[styles.quickTitle, { color: colors.foreground }]}>Natural motion</Text><Text style={[styles.quickCaption, { color: colors.muted }]}>3 expression profiles</Text></View>
            </View>

            <View style={styles.historyHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your projects</Text><Text style={[styles.historyCount, { color: colors.muted }]}>{projects.length} saved</Text></View>
          </View>
        }
        ListEmptyComponent={<View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}16` }]}><IconSymbol name="video.fill" size={23} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No syncs yet</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Your finished lip-sync projects will appear here.</Text><Pressable onPress={() => router.push("/create")} style={({ pressed }) => [styles.emptyButton, { borderColor: colors.primary }, pressed && { opacity: 0.7 }]}><Text style={[styles.emptyButtonText, { color: colors.primary }]}>Start your first one</Text></Pressable></View>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 28 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: "800", marginTop: 5 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  hero: { minHeight: 220, borderRadius: 27, padding: 21, overflow: "hidden", position: "relative" },
  heroGlow: { width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(255,255,255,0.14)", position: "absolute", right: -50, top: -48 },
  heroContent: { maxWidth: 240, zIndex: 1 },
  heroPill: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 9, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#BFF7D1" },
  heroPillText: { color: "#E9FFEF", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  heroTitle: { color: "#fff", fontSize: 27, lineHeight: 31, fontWeight: "800", marginTop: 16 },
  heroSubtitle: { color: "rgba(255,255,255,0.78)", fontSize: 12, lineHeight: 18, marginTop: 8 },
  heroButton: { alignSelf: "flex-start", backgroundColor: "#fff", minHeight: 41, borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, marginTop: 18 },
  heroButtonText: { fontSize: 13, fontWeight: "800" },
  heroOrb: { position: "absolute", right: 23, bottom: 27, width: 67, height: 67, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-12deg" }] },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  quickCard: { flex: 1, borderRadius: 17, borderWidth: 1, padding: 13, gap: 5 },
  quickTitle: { fontSize: 12, fontWeight: "800" },
  quickCaption: { fontSize: 10, lineHeight: 14 },
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 27, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  historyCount: { fontSize: 11, fontWeight: "700" },
  projectCard: { minHeight: 78, borderRadius: 18, borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 10, gap: 11, marginBottom: 9 },
  projectThumb: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", resizeMode: "cover" },
  projectCopy: { flex: 1, gap: 3 },
  projectTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  projectTitle: { flex: 1, fontSize: 13, fontWeight: "800" },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  projectAudio: { fontSize: 11 },
  projectMeta: { fontSize: 10 },
  emptyCard: { borderRadius: 20, borderWidth: 1, alignItems: "center", padding: 24, gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptyText: { fontSize: 12, lineHeight: 17, textAlign: "center" },
  emptyButton: { marginTop: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  emptyButtonText: { fontSize: 12, fontWeight: "800" },
});
