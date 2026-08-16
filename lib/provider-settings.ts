import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export type RenderProvider = "replicate" | "sync";

const PROVIDER_KEY = "natural-lipsync-render-provider";
const SYNC_API_KEY = "natural-lipsync-sync-api-key";

export async function getProviderSettings(): Promise<{ provider: RenderProvider; syncApiKey: string }> {
  const providerValue = Platform.OS === "web"
    ? await AsyncStorage.getItem(PROVIDER_KEY)
    : await SecureStore.getItemAsync(PROVIDER_KEY);
  const apiKey = Platform.OS === "web"
    ? await AsyncStorage.getItem(SYNC_API_KEY)
    : await SecureStore.getItemAsync(SYNC_API_KEY);

  return {
    provider: providerValue === "sync" ? "sync" : "replicate",
    syncApiKey: apiKey ?? "",
  };
}

export async function saveProviderSettings(settings: { provider: RenderProvider; syncApiKey: string }) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(PROVIDER_KEY, settings.provider);
    if (settings.syncApiKey.trim()) {
      await AsyncStorage.setItem(SYNC_API_KEY, settings.syncApiKey.trim());
    } else {
      await AsyncStorage.removeItem(SYNC_API_KEY);
    }
    return;
  }

  await SecureStore.setItemAsync(PROVIDER_KEY, settings.provider);
  if (settings.syncApiKey.trim()) {
    await SecureStore.setItemAsync(SYNC_API_KEY, settings.syncApiKey.trim());
  } else {
    await SecureStore.deleteItemAsync(SYNC_API_KEY);
  }
}
