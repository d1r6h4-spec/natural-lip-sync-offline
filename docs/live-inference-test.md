# Live Inference Test

## Tujuan

Memverifikasi video-to-lip-sync end-to-end dengan video wajah nyata, audio referensi nyata, dan rentang trim non-penuh.

## Provider

Provider yang dipakai adalah Sync Labs `sync-3` melalui `POST https://api.sync.so/v2/generate`. Backend mengirim autentikasi pada header `x-api-key` menggunakan `SYNC_API_KEY` server-side. Client tidak menerima atau mengirim secret.

## Kontrak pengujian

1. Video input: MP4 dengan wajah yang terlihat dan audio referensi terpisah.
2. Audio input: WAV/MP3 yang dapat diakses provider melalui URL publik.
3. Trim: gunakan rentang sekitar 20% sampai 80% dari durasi video/audio.
4. Lulus jika job dibuat, status selesai, output berupa video yang dapat diunduh, dan durasi output mendekati durasi klip terpilih.
5. Gagal jika provider menolak schema, URL media tidak dapat diakses, preprocessing FFmpeg gagal, atau output bukan video.

## Diagnosis error response

Backend harus membaca response body sebagai text terlebih dahulu, mengurai JSON hanya bila valid, dan mengubah setiap kegagalan provider menjadi response JSON terstruktur. Dengan demikian, frontend tidak melakukan `JSON.parse` terhadap HTML atau plain text yang diawali karakter `e`.
