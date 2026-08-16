import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

const VIDEO_MIME_TYPE = "video/mp4";
const VIDEO_EXTENSION = ".mp4";

function createVideoFileName() {
  return `lipsync_${Date.now()}${VIDEO_EXTENSION}`;
}

/**
 * Requests Android video read/write access and the equivalent media-library
 * access on iOS. The Android build declares READ_MEDIA_VIDEO and the legacy
 * WRITE_EXTERNAL_STORAGE permission through app.config.ts.
 */
export async function requestVideoMediaPermissions() {
  if (Platform.OS === "web") {
    return { granted: false, canAskAgain: false, status: "denied" as const };
  }

  return MediaLibrary.requestPermissionsAsync(false, ["video"]);
}

/**
 * Converts a provider URL into a local file:// URI. MediaLibrary.saveToLibraryAsync
 * uses Android's MediaStore implementation and requires a local URI with an
 * extension, so remote render output is downloaded before saving.
 */
export async function ensureLocalVideoUri(videoUri: string) {
  if (!videoUri) {
    throw new Error("Video output URL is missing");
  }

  if (videoUri.startsWith("file://")) {
    return videoUri;
  }

  if (Platform.OS === "web") {
    return videoUri;
  }

  const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDirectory) {
    throw new Error("Local cache directory is unavailable");
  }

  const destination = `${baseDirectory}${createVideoFileName()}`;
  const download = await FileSystem.downloadAsync(videoUri, destination);
  if (!download.uri) {
    throw new Error("The rendered video could not be downloaded to the device");
  }
  return download.uri;
}

/**
 * Saves an MP4 into the device gallery. On Android, expo-media-library writes
 * through MediaStore/scoped storage; the resulting asset is placed in the
 * device's video library and is compatible with DCIM/NaturalLipSync gallery
 * organization on modern Android builds.
 */
export async function saveVideoToGallery(videoUri: string) {
  if (Platform.OS === "web") {
    throw new Error("Gallery export is available in the Android and iOS app");
  }

  const permission = await requestVideoMediaPermissions();
  if (!permission.granted) {
    throw new Error("Video permission was denied. Allow media access in Android Settings.");
  }

  const localUri = await ensureLocalVideoUri(videoUri);
  const asset = await MediaLibrary.createAssetAsync(localUri);
  const album = await MediaLibrary.getAlbumAsync("NaturalLipSync");
  if (album) {
    await MediaLibrary.addAssetsToAlbumAsync(asset, album, false);
  } else {
    await MediaLibrary.createAlbumAsync("NaturalLipSync", asset, false);
  }
  return { localUri, fileName: asset.filename || localUri.split("/").pop() || createVideoFileName() };
}

/**
 * Opens the native ACTION_SEND share sheet through expo-sharing. Expo's Android
 * implementation supplies a FileProvider content:// URI and grants temporary
 * read permission to compatible apps, avoiding file:// URI exposure errors.
 */
export async function shareVideo(videoUri: string) {
  if (Platform.OS === "web") {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error("The browser share sheet is unavailable");
    }
    await Sharing.shareAsync(videoUri, {
      mimeType: VIDEO_MIME_TYPE,
      dialogTitle: "Share video",
    });
    return { localUri: videoUri };
  }

  const localUri = await ensureLocalVideoUri(videoUri);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("The Android share sheet is unavailable");
  }

  await Sharing.shareAsync(localUri, {
    mimeType: VIDEO_MIME_TYPE,
    dialogTitle: "Share video",
  });
  return { localUri };
}
