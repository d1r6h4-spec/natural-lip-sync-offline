# Video-to-Lipsync Fix Notes

- **Payload Update**: Updated `buildSadTalkerInput` in `server/lipsync.ts` so that when `sourceType === 'video'`, the video URL is passed to `driven_video` instead of `source_image`.
- **Media Preview**: `ResultScreen` handles video inputs (whether source video or AI-rendered `outputUrl`) through `expo-video` with loop playback.
- **Audio Synchronization**: Preserves the reference audio track, trim range, and sync status for both image-to-lipsync and video-to-lipsync.
