# Motion-transfer provider notes

Natural Lip-Sync v1.1.2 does not contain a separate motion-transfer provider. The active render path is Sync Labs `sync-3`, used for lip-sync generation through the backend endpoint `https://api.sync.so/v2/generate`.

The backend accepts the supported source and audio media inputs, preserves the selected trim values, and returns the normalized asynchronous job contract used by the processing screen. Any future motion-transfer provider must be introduced as a separate reviewed integration and must not bypass the server-side `SYNC_API_KEY` boundary.
