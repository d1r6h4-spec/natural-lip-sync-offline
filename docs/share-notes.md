# Social Sharing Notes

The Result screen uses `expo-sharing` to open the native share sheet for a local video file on iOS and Android. When users tap Instagram, TikTok, WhatsApp, or More apps, the operating system presents compatible installed apps; the app does not claim to authenticate or post through private social APIs.

On web, local file sharing is not supported by `expo-sharing`, so the implementation falls back to `Share.share` with a descriptive message. A production renderer should provide a real rendered video URI before the social share action is used. This keeps the current prototype honest while preserving the intended native flow.
