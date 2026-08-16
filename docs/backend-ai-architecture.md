# Backend AI Architecture

Natural Lip-Sync v1.1.2 uses Sync Labs as its only render provider. The mobile client uploads media through the existing storage flow and starts an asynchronous render through the backend tRPC router.

## Provider contract

The backend sends requests to `https://api.sync.so/v2/generate` with the `x-api-key` header. The key is read server-side from `SYNC_API_KEY`; it is never sent by the Expo client and is never persisted in AsyncStorage.

The provider request uses `model: "sync-3"`, the public source media URL, and the selected audio URL. The backend normalizes provider states into the app contract `{ jobId, status, progress, outputUrl, error }` and polls the provider status until completion.

## Error contract

All `/api` routes return JSON for success, not-found, and error responses. Provider failures preserve the HTTP status and a bounded provider message, while the client displays a Sync Labs-specific explanation instead of attempting to parse an HTML error page.

## Media requirements

Uploaded source and audio URLs must be publicly reachable by Sync Labs. The server validates upload responses, preserves the selected trim range, and stores the completed output URL for the result screen.
