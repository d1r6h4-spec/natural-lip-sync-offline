# Live Inference Test

## Tujuan
Memverifikasi video-to-lip-sync end-to-end dengan video wajah nyata, audio referensi nyata, dan rentang trim non-penuh.

## Provider
Provider video yang dipakai adapter adalah VideoReTalking melalui model Replicate `chenxwh/video-retalking`. Dokumentasi upstream VideoReTalking tersedia di https://github.com/OpenTalker/video-retalking dan menjelaskan bahwa sistem mengedit talking-head video berdasarkan audio input. Repo upstream berlisensi Apache-2.0, tetapi media uji tetap perlu dipilih dari sumber publik dengan izin penggunaan yang sesuai.

## Kontrak pengujian
1. Video input: MP4 dengan wajah yang terlihat dan audio referensi terpisah.
2. Audio input: WAV/MP3 yang dapat diakses provider melalui URL publik.
3. Trim: gunakan rentang sekitar 20% sampai 80% dari durasi video.
4. Lulus jika job dibuat, status selesai, output berupa video yang dapat diunduh, dan durasi output mendekati durasi klip terpotong.
5. Gagal jika provider menolak schema, URL media tidak dapat diakses, preprocessing FFmpeg gagal, atau output bukan video.

## Temuan uji pertama

Job pertama berhenti saat pembuatan prediction dengan HTTP 404 dari endpoint adapter video. Pemeriksaan metadata model Replicate berhasil dan mengonfirmasi model `chenxwh/video-retalking`, versi terbaru `db5a650c807b007dc5f9e5abe27c53e1b62880d1f94d218d27ce7fa802711d67`, serta schema input wajib `face` dan `input_audio` berupa URI. Dokumentasi model memperkirakan inference dapat berlangsung beberapa menit dan biaya per run sekitar USD 0,40, sehingga pengujian berikutnya harus dibatasi pada satu job.

Sumber: https://replicate.com/chenxwh/video-retalking/api

## Hasil uji kedua

Setelah adapter diperbaiki dari endpoint model ke `POST /v1/predictions` dengan versi VideoReTalking, endpoint berhasil dikenali oleh Replicate. Uji tidak membuat prediction karena provider mengembalikan HTTP 402 `Insufficient credit`: akun Replicate tidak memiliki kredit cukup untuk menjalankan model ini. Dengan demikian, error schema/endpoint 404 sudah teratasi, tetapi output video belum dapat diverifikasi sampai saldo provider tersedia.

Pesan provider: `You have insufficient credit to run this model. Go to https://replicate.com/account/billing#billing to purchase credit.`
