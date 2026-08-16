import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export type RenderProvider = "sync";

const PROVIDER_KEY = "natural-lipsync-render-provider";

export async function getProviderSettings(): Promise<{ provider: RenderProvider }> {
  const storedProvider = Platform.OS === "web"
    ? await AsyncStorage.getItem(PROVIDER_KEY)
    : await SecureStore.getItemAsync(PROVIDER_KEY);

  // Sync Labs is the only supported production provider in v1.1.0.
  if (storedProvider !== "sync") {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(PROVIDER_KEY, "sync");
    } else {
      await SecureStore.setItemAsync(PROVIDER_KEY, "sync");
    }
  }

  return { provider: "sync" };
}

export async function saveProviderSettings() {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(PROVIDER_KEY, "sync");
    return;
  }
  await SecureStore.setItemAsync(PROVIDER_KEY, "sync");
}
