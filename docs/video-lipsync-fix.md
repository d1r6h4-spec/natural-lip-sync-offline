# Video-to-Lipsync Fix Notes

- **Payload Update**: Updated `buildSadTalkerInput` in `server/lipsync.ts` so that when `sourceType === 'video'`, the video URL is passed to `driven_video` instead of `source_image`.
- **Media Preview**: `ResultScreen` handles video inputs (whether source video or AI-rendered `outputUrl`) through `expo-video` with loop playback.
- **Audio Synchronization**: Preserves the reference audio track, trim range, and sync status for both image-to-lipsync and video-to-lipsync.

## Provider Notes

Wav2Lip menerima video dan audio sebagai input terpisah, tetapi dokumentasi model tidak menunjukkan parameter trim bawaan; pemotongan perlu dilakukan sebelum inference atau ditangani oleh provider lain [1]. Model Replicate VideoReTalking menerima `face` sebagai video talking-head dan `input_audio` sebagai file audio, sehingga lebih cocok untuk input video daripada SadTalker yang berfokus pada foto [2].

[1]: https://github.com/Rudrabha/Wav2Lip/blob/master/README.md "Wav2Lip README"
[2]: https://replicate.com/chenxwh/video-retalking "Replicate VideoReTalking"


## Video trimming provider note

Pemeriksaan halaman API `chenxwh/video-retalking` menunjukkan model video lipsync menerima dua input utama: `face` berupa video talking-head dan `input_audio` berupa audio. Halaman API tidak menunjukkan parameter `start`/`end` untuk trimming. Karena itu, aplikasi menyimpan rentang video sebagai metadata dan meneruskannya ke job; penerapan trim fisik sebelum inference memerlukan tahap preprocessing video yang kompatibel (misalnya service ffmpeg/worker) atau provider yang secara eksplisit mendukung start/end.
