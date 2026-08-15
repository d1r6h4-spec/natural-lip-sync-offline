# Audio trimming notes

The trimmer uses `expo-audio` player status for the available duration and playback position. The selected range is represented as normalized start and end ratios, which keeps the waveform responsive across portrait widths. Preview seeks to the selected start and pauses automatically when the selected end is reached.

The current app is a local preview pipeline. The chosen `trimStart` and `trimEnd` values are passed through Create → Processing → Result and shown in project details. A production render service still needs to apply the selected range to the actual encoded audio/video file before social export.

Expo Audio does not automatically reset playback at the end of a sound, so preview explicitly seeks to the selected start before playing again. The component uses the hook-managed player lifecycle rather than creating unmanaged players.
