# Image-to-lip-sync diagnosis

## Root cause

The image branch of the Result screen previously rendered only the original `<Image>` source. There was no encoded video or face-warping renderer for an image plus audio, so the image could not visibly move with the reference audio. A second issue affected saved history: Home reopened Result without passing `audioUri`, `trimStart`, or `trimEnd`, so the Result screen could not initialize the audio player for previously saved image projects.

## Fix applied

Result now initializes `expo-audio` from `audioUri`, plays from `trimStart`, pauses at `trimEnd`, and exposes a play/pause control. Image previews show a sync status overlay while the reference audio is playing. Saved project metadata now persists `audioUri`, `trimStart`, and `trimEnd`, and Home forwards those values when reopening a project.

## Limitation

The current mobile app still uses a local preview pipeline. It can play the reference audio and demonstrate timing, but it does not yet generate a true MP4 with per-face mouth deformation. A production renderer or a dedicated lip-sync service is required for final image-to-video warping and social export.
