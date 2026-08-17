# Natural Lip-Sync v2.0 FREE OFFLINE EDITION — Architecture & Design

## Overview
Natural Lip-Sync v2.0 Free Offline Edition is engineered for completely disconnected, personal use on Android devices without external cloud rendering dependencies, paid API keys, or billing subscriptions.

## Key Architectural Changes
1. **Total Elimination of Sync Labs (`api.sync.so`)**: All remote sync-3 generation calls, API key headers, polling endpoints, and credit checks have been removed.
2. **On-Device Local Rendering & Media Processing**:
   - The application processes source media (photo/video) and audio tracks locally on the device using native Expo modules (`expo-image-manipulator`, `expo-av`, `expo-media-library`).
   - For image targets, local audio-synchronized timing and animation overlay are generated directly in the client runtime without making outgoing network requests.
   - For video targets, local trimming and audio muxing are handled entirely within the local app sandbox.
3. **Zero API Key & Zero Billing**:
   - All settings related to cloud render services and API keys have been removed.
   - The app operates 100% free with unlimited local renders.
4. **UI Updates**:
   - The status indicator is updated to **OFFLINE READY** with a green badge.
   - App versioning is upgraded to **v2.0.0 FREE - Offline Edition** across configuration, package metadata, and Settings footer.
