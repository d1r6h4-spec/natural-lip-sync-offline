# Video-to-Lipsync Fix Notes

- **Payload**: The backend sends the selected source video and reference audio to Sync Labs `sync-3` through `POST https://api.sync.so/v2/generate`.
- **Media preview**: `ResultScreen` handles source videos and generated output through `expo-video` with loop playback.
- **Audio synchronization**: The reference audio, selected trim range, and asynchronous job status are preserved for both image-to-lipsync and video-to-lipsync.
- **Authentication**: Sync Labs is called server-side with `x-api-key: SYNC_API_KEY`; no provider credential is sent from the mobile client.

## Video trimming

The application keeps the selected video and audio trim values in the render input. Server preprocessing applies the selected ranges before the provider request when required, and the normalized result is polled until the output URL is available.

## Error handling

The provider response is read safely as text, parsed as JSON only when valid, and converted into the app's structured JSON error contract. This prevents the frontend from attempting to parse an HTML error page as JSON.
