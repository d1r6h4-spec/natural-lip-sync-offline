# Provider research for v1.1.0

## Sync Labs API

Source: https://sync.so/docs/api-reference/api-overview

The Sync Labs REST API base is `https://api.sync.so/v2`. Requests authenticate with the `x-api-key` header. `POST /v2/generate` creates a generation and `GET /v2/generate/{id}` returns status and output. Normal requests require one visual input (video or image) and one audio/text input. The documented model IDs include `sync-3`, `lipsync-2`, `lipsync-2-pro`, `lipsync-1.9.0-beta`, and `react-1`.

Source: https://sync.so/docs/api-reference/api/generate-api/create

The create request uses JSON with a `model` and `input` list. Video input is `{ type: "video", url }`, image input is `{ type: "image", url }`, and audio input is `{ type: "audio", url }`. Image inputs are supported by `sync-3`. Duration handling is controlled with `options.sync_mode` such as `loop`, `cut_off`, `silence`, or `remap`.

## Fal.ai alternative

Source: https://fal.ai/models/fal-ai/sync-lipsync

Fal.ai's `fal-ai/sync-lipsync` endpoint accepts video and audio URLs and returns an MP4 result. The page documents video formats including MP4/MOV/WebM/M4V/GIF and audio formats including MP3/OGG/WAV/M4A/AAC. It also documents sync modes and API documentation links.

## Implementation decision

Use Sync Labs as the only production provider because its official REST contract supports both image-to-lipsync with `sync-3` and video-to-lipsync with a single normalized create/status API. The backend reads `SYNC_API_KEY` exclusively from project secrets; the mobile client does not transmit or persist provider credentials.

## Expo media references

Source: https://docs.expo.dev/versions/latest/sdk/media-library/

`expo-media-library` provides access to device media and saving new assets. It requires permission checks before media methods. Its config plugin supports permission text and granular permissions. On Android, the library uses the platform media store implementation and supports creating assets and albums.

Source: https://docs.expo.dev/versions/latest/sdk/sharing/

`expo-sharing` shares local file URLs through the native share sheet and supports `mimeType: "video/mp4"`. Local file sharing is supported on Android/iOS but not web. The implementation will first download remote render URLs to a local cache file before calling `Sharing.shareAsync`, which allows the native provider URI flow to work reliably.

Saved for implementation traceability; not user-facing documentation.

## References

[1]: https://sync.so/docs/api-reference/api-overview
[2]: https://sync.so/docs/api-reference/api/generate-api/create
[3]: https://fal.ai/models/fal-ai/sync-lipsync
[4]: https://docs.expo.dev/versions/latest/sdk/media-library/
[5]: https://docs.expo.dev/versions/latest/sdk/sharing/

## Verified status response

Source: https://sync.so/docs/api-reference/api/generate-api/get

Sync Labs generation status values are `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, and `REJECTED`. Successful responses expose `outputUrl` and `outputDuration`; failures expose `error` and `errorCode`. The endpoint is `GET https://api.sync.so/v2/generate/{id}` with `x-api-key`. The implementation should map `COMPLETED` to the app's `succeeded`, `PENDING` to `queued`, `PROCESSING` to `processing`, and `FAILED`/`REJECTED` to `failed`.

Source: https://sync.so/docs/api-reference/api/webhooks-payload-reference/webhooks/generation-status-update

Terminal webhook payloads use `COMPLETED` or `FAILED`, and include `outputUrl`/`outputDuration` or error information.
