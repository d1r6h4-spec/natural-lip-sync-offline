# Backend AI architecture notes

The mobile template already exposes a TypeScript/Express backend through tRPC in `server/routers.ts`, and public procedures can be used when login is not required. Server-side integrations must keep credentials off the mobile client. The template also provides S3-compatible storage helpers for user-uploaded media.

The managed web runtime is Node-only with a low memory/CPU ceiling and is not suitable for bundling a Python/PyTorch Wav2Lip runtime or GPU inference. The app should therefore use a job contract (`create`, `status`, `result`) and delegate actual inference to a dedicated external render worker/service. The mobile client can submit media URLs and poll the job status; the backend should validate inputs, keep provider credentials server-side, and return a final MP4 URL.

Sources consulted: `/home/ubuntu/skills/webdev-readme-mobile-backend/SKILL.md` (backend, tRPC, storage, server-side credential guidance); `/home/ubuntu/skills/persistent-computing/SKILL.md` (WebDev runtime limits and when custom runtimes/GPU workloads need a separate worker); `/home/ubuntu/skills/automation-and-scheduling/SKILL.md` (event-triggered job handling and polling architecture).

## Provider research

Replicate's lip-sync collection currently lists hosted models that can turn an image or video plus new audio into a talking video, including `sync/lipsync-2`, `sync/lipsync-2-pro`, and image-oriented options such as SadTalker. The collection positions the hosted models as asynchronous API workflows and includes a photo-to-talking-character use case. Source: https://replicate.com/collections/lipsync

fal's Sync Lipsync v2 Pro API documentation specifies required `video_url` and `audio_url` inputs, supports a `sync_mode` such as `cut_off`, and returns a generated `video.url`. Its documentation exposes queue submission, status, result, webhook, and file-upload sections, which fits the mobile app's create-job/poll-result contract. Source: https://fal.ai/models/fal-ai/sync-lipsync/v2/pro/api

Implementation implication: use a server-side provider adapter with `FAL_KEY` or `REPLICATE_API_TOKEN`, keep the token out of Expo, upload media to a public temporary URL first, and normalize provider responses into `{ jobId, status, progress, outputUrl, error }`. A provider may require a video input even for image workflows; if so, the backend must first create a short video from the image or use an image-capable model such as SadTalker/another image-to-video provider.

## Image input provider selection

Replicate's `cjwbw/sadtalker` model explicitly accepts `source_image` (a picture or video) and `driven_audio` (`.wav` or `.mp4`), then produces a talking-head video. Its exposed controls include `still_mode`, `use_eyeblink`, `expression_scale`, preprocessing mode, face-renderer, and output resolution. The public model page reports GPU-backed inference and roughly one-minute typical generation, so the mobile flow must be asynchronous and show a waiting state. Source: https://replicate.com/cjwbw/sadtalker

The first provider adapter should target SadTalker because it matches the requested image + reference audio input directly. The adapter can later support Wav2Lip for video input as a second provider.
