import AsyncStorage from "@react-native-async-storage/async-storage";

export type LipSyncDraft = {
  id: string;
  title: string;
  sourceUri: string | null;
  sourceType: "image" | "video" | null;
  motionUri?: string | null;
  motionName?: string | null;
  audioUri: string | null;
  audioName: string | null;
  trimStart: number;
  trimEnd: number;
  videoTrimStart: number;
  videoTrimEnd: number;
  style: "Natural" | "Expressive" | "Calm";
  intensity: "Low" | "Balanced" | "High";
  motionWeight?: "Subtle" | "Balanced" | "Strong";
  updatedAt: string;
};

const STORAGE_KEY = "natural-lipsync-drafts-v1";

export async function getDrafts(): Promise<LipSyncDraft[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as LipSyncDraft[];
  } catch {
    return [];
  }
}

export async function saveDraft(draft: Omit<LipSyncDraft, "id" | "updatedAt"> & { id?: string }): Promise<LipSyncDraft[]> {
  const current = await getDrafts();
  const id = draft.id ?? `draft_${Date.now()}`;
  const newDraft: LipSyncDraft = {
    ...draft,
    id,
    updatedAt: new Date().toISOString(),
  };

  const filtered = current.filter((item) => item.id !== id);
  const updated = [newDraft, ...filtered].slice(0, 15); // limit to 15 drafts
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteDraft(id: string): Promise<LipSyncDraft[]> {
  const current = await getDrafts();
  const updated = current.filter((item) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
