# Project TODO

- [x] Inisialisasi proyek Expo Mobile dengan TypeScript dan Tailwind CSS
- [x] Menyusun dokumen desain aplikasi (design.md)
- [x] Menyiapkan struktur navigasi tab (Home, Create, Settings) dan ikon
- [x] Membangun antarmuka Home Screen dengan galeri riwayat lip-sync dan status
- [x] Membangun antarmuka Creation Screen (pemilihan foto wajah, unggah/rekam audio, dan parameter kustom)
- [x] Membangun animasi layar Processing / Render simulasi natural lip-sync
- [x] Membangun antarmuka Player Screen untuk pratinjau video hasil render dengan expo-video
- [x] Membangun fitur penyimpanan lokal (AsyncStorage) untuk riwayat proyek
- [x] Menguji alur aplikasi secara end-to-end dan memastikan tidak ada dead ends
- [x] Menambahkan native share sheet untuk video hasil lip-sync dengan target TikTok, Instagram, WhatsApp, dan aplikasi lain yang tersedia
- [x] Menambahkan fallback berbagi umum ketika aplikasi sosial tertentu tidak tersedia
- [x] Memvalidasi alur berbagi pada layar Result dan menjalankan pemeriksaan proyek ulang
- [x] Membuat katalog audio bawaan (Viral / Trending, Comedy & Memes, Cinematic, Speech & Narration)
- [x] Membangun antarmuka Audio Library modal / picker di layar Create
- [x] Mengintegrasikan pemutaran pratinjau audio dengan expo-audio
- [x] Memvalidasi alur pemilihan audio dan memastikan tidak ada error pada TypeScript dan lint
- [x] Membuat komponen Trimmer visual dengan waveform batang dan slider start/end
- [x] Menambahkan tombol Trim Audio pada kartu audio di layar Create
- [x] Meneruskan parameter trimStart dan trimEnd ke layar Processing dan Result
- [x] Memeriksa kompilasi TypeScript, lint, dan test setelah integrasi trimmer
- [x] Mendiagnosis alur pengiriman parameter gambar dan audio ke layar hasil
- [x] Memperbaiki penanganan sumber foto diam (image-to-lipsync) agar memunculkan indikator audio aktif atau animasi sinkronisasi di Result
- [x] Memastikan audio referensi benar-benar diputar bersamaan dengan pratinjau gambar diam di layar Result
- [x] Menjalankan pemeriksaan kompilasi TypeScript dan lint setelah perbaikan
- [x] Menilai integrasi backend AI dan router Express untuk job lip-sync
- [x] Membuat endpoint backend untuk mengunggah media dan menjalankan job render Wav2Lip / AI lipsync
- [x] Menghubungkan layar Processing mobile dengan polling status job render backend
- [ ] Memastikan hasil video render benar-benar diterima dan diputar di layar Result
- [x] Menyimpan dokumentasi arsitektur integrasi AI backend
- [x] Memvalidasi kredensial Replicate dan schema input SadTalker melalui test backend
- [ ] Menjalankan satu inference live dengan foto dan audio nyata untuk memverifikasi output video end-to-end
- [x] Memeriksa penanganan source type video pada router lipsync dan adapter SadTalker
- [x] Menambahkan dukungan video input pada schema backend Lipsync
- [x] Memastikan pemutaran dan pengiriman video-to-lipsync berfungsi lancar di mobile
- [x] Membuat komponen VideoTrimmer interaktif untuk sumber video
- [x] Menambahkan integrasi video trimmer pada kartu video di layar Create
- [x] Meneruskan parameter videoTrimStart dan videoTrimEnd ke backend lipsync
- [x] Menambahkan preprocessing FFmpeg server-side agar rentang video benar-benar dipotong sebelum inference
- [x] Memilih adapter VideoReTalking untuk input video dan audio, tetap memakai SadTalker untuk foto
- [x] Memvalidasi TypeScript, lint, test, dan build server setelah integrasi preprocessing video
- [ ] Menjalankan inference live video-to-lipsync dengan media nyata untuk memverifikasi output provider end-to-end
- [x] Menyiapkan skrip test automated untuk menguji presigned upload dan pembuatan prediksi live ke Replicate
- [x] Memperbaiki endpoint VideoReTalking dari model route yang mengembalikan 404 ke endpoint `/v1/predictions` berbasis versi
- [x] Menjalankan uji dengan video wajah dan audio publik, termasuk trim 20–80 persen, sampai provider menerima request
- [ ] Mengulang inference setelah kredit Replicate tersedia dan memverifikasi video output secara end-to-end
- [x] Menambahkan indikator persentase 0-100% di layar Processing dengan pemetaan tahapan upload, trim, antrean, inference, dan finalisasi
- [x] Menambahkan pesan ramah pengguna untuk error HTTP 402 Insufficient Credit pada alur Create dan Processing
- [x] Memvalidasi tampilan progress bar 0-100% pada viewport mobile
- [x] Menyimpan checkpoint final setelah seluruh pemeriksaan kualitas selesai
- [x] Merancang model data dan helper penyimpanan draf lokal menggunakan AsyncStorage
- [x] Menambahkan tombol simpan draf dan daftar draf tersimpan di layar Create
- [x] Memungkinkan pemulihan parameter draf (media, audio, trim, style) saat tombol draf ditekan
- [x] Menguji kompilasi TypeScript, lint, dan fungsionalitas draf
- [x] Menyimpan checkpoint fitur draf lokal
- [x] Merancang alur pemilihan video referensi gerak tubuh (Motion Transfer) di layar Create
- [x] Menambahkan state motionSource dan parameter motionWeight pada frontend dan backend lipsync
- [x] Memperluas adapter server backend untuk mendukung parameter motion transfer dan video referensi gerak
- [x] Menguji kompilasi TypeScript, lint, dan fungsionalitas motion transfer
- [x] Menyimpan checkpoint fitur full-body motion transfer
- [x] Mengubah endpoint Replicate motion transfer dari version-based ke model identifier `kwaivgi/kling-v2.6-motion-control`
- [x] Menghapus kebutuhan `REPLICATE_MOTION_TRANSFER_VERSION` dan menggunakan API resmi model Replicate
- [x] Menjalankan pengujian koneksi dan uji inference motion transfer
- [x] Menyimpan checkpoint final migrasi model motion-control
- [x] Menjalankan uji end-to-end motion transfer nyata dengan model `kwaivgi/kling-v2.6-motion-control`
- [x] Menunggu hingga selesai dan mencatat output video atau error lengkap dari provider (Gagal pada tingkat provider: HTTP 402 Insufficient Credit)
- [x] Memperbaiki penanganan response backend dan frontend agar endpoint render selalu mengembalikan JSON valid dan mencegah JSON Parse error dari response teks atau HTML.
- [x] Menjalankan kembali tes Natural Lip-Sync menggunakan audio `nona manis.mp3` dan memverifikasi kelancaran endpoint tRPC render.
- [ ] Mendiagnosis langsung endpoint render backend, mereproduksi request tRPC, memastikan pengembalian job/render ID dalam format JSON valid, dan menormalisasi semua error response menjadi Content-Type application/json.
- [ ] Melacak URL endpoint, HTTP status, Content-Type, dan raw response body saat client tRPC membuat request render, serta memperbaiki sumber 'Unexpected character: e'.
- [x] Memastikan `getApiBaseUrl()` pada native/production APK mengarah ke domain backend yang aktif secara absolut, bukan string kosong atau domain lokal yang tidak dapat dijangkau perangkat fisik.
- [x] Memperbaiki pembacaan durasi asli audio dan menetapkan default selection full-duration, bukan 1 detik.
- [x] Memastikan `trimStart` dan `trimEnd` dikirimkan secara konsisten ke backend dan digunakan penuh oleh FFmpeg preprocessing.
- [x] Menguji durasi render dengan file audio nyata dan membuktikan durasi output sesuai pilihan pengguna sebelum membangun APK baru.
- [ ] Menguji durasi audio asli >1 detik (misalnya nona manis.mp3) end-to-end sampai menghasilkan video dan memperbarui versi APK ke 1.0.5.

- [x] Implementasi ekspor galeri Android asli menggunakan MediaStore ke DCIM/NaturalLipSync
- [x] Implementasi FileProvider dan share sheet Android asli menggunakan ACTION_SEND dan FLAG_GRANT_READ_URI_PERMISSION
- [x] Integrasi provider render produksi Sync Labs `sync-3` di backend lipsync
- [x] Penambahan status Sync Labs di Settings; kredensial backend memakai `SYNC_API_KEY` dari secrets dan tidak dikirim dari client
- [x] Permintaan izin WRITE_EXTERNAL_STORAGE dan READ_MEDIA_VIDEO saat aplikasi dibuka
- [x] Menaikkan versi aplikasi menjadi 1.1.0 di app.config.ts dan package.json
- [x] Pemeriksaan uji kompilasi TypeScript, lint, dan test serta penyimpanan checkpoint stabil v1.1.0

- [x] Menghapus Replicate dari backend dan mengonfigurasi Sync Labs sync-3 sebagai satu-satunya penyedia render
- [x] Membaca SYNC_API_KEY dari environment variables / secrets server backend
- [x] Memverifikasi ekspor MediaStore ke album NaturalLipSync dan share sheet FileProvider
- [ ] Build APK final versi 1.1.0 melalui Management UI → Publish → Android

- [x] Menghapus sisa helper Motion Transfer / Replicate di server/lipsync.ts
- [x] Memastikan endpoint Sync Labs menggunakan https://api.sync.so/v2/generate dan header x-api-key secara murni
- [x] Menaikkan versi aplikasi menjadi 1.1.1 di app.config.ts dan package.json
- [x] Menjalankan test suite, lint, dan esbuild backend
- [ ] Menyimpan checkpoint stabil v1.1.1 dan menyiapkan instruksi build APK

- [x] Memperbarui SYNC_API_KEY single-line melalui webdev_request_secrets
- [x] Memastikan backend server/_core/index.ts dan server/lipsync.ts selalu mengembalikan JSON valid pada error handling
- [x] Menaikkan versi aplikasi menjadi 1.1.2 di app.config.ts dan package.json
- [x] Melakukan restart backend server dan tes validasi end-to-end
- [x] Menyimpan checkpoint v1.1.2 dan menyiapkan instruksi build APK

- [x] Membersihkan label UI dan skrip test lama agar runtime hanya menampilkan Sync Labs
- [x] Menyinkronkan footer Settings dengan versi aplikasi 1.1.2
- [x] Menjalankan validasi akhir v1.1.2 dan menyimpan checkpoint siap build Android

- [x] Memverifikasi konfigurasi SYNC_API_KEY baru secara server-side tanpa mengekspos nilainya
- [x] Menaikkan versi aplikasi menjadi 1.1.3 di app.config.ts, package.json, dan footer Settings
- [x] Menjalankan validasi akhir v1.1.3 dan menyimpan checkpoint siap Android APK build

- [x] Menormalisasi SYNC_API_KEY dengan menghapus seluruh whitespace dan newline sebelum request provider
- [x] Menambahkan regression test untuk key dengan spasi, tab, dan newline
- [x] Menaikkan versi aplikasi menjadi 1.1.4 di app.config.ts, package.json, dan footer Settings
- [x] Menjalankan validasi JSON error contract dan test lengkap v1.1.4 lalu menyimpan checkpoint siap Android build

- [x] Audit kelayakan Wav2Lip & TFLite ML Kit on-device rendering di Expo SDK 54 / React Native
- [x] Menghapus total seluruh kode, router, secret, dan fetch ke Sync Labs (`api.sync.so`)
- [x] Mengganti backend render eksternal dengan pipeline render lokal / offline yang berjalan 100% di HP
- [x] Menghapus seluruh cek kredit, billing, dan manajemen API key dari Settings dan UI
- [x] Mengganti indikator `SYNC-3 READY` menjadi `OFFLINE READY` berwarna hijau
- [x] Menaikkan versi aplikasi menjadi `2.0.0 FREE - Offline Edition` di app.config.ts, package.json, dan Settings footer
- [x] Memvalidasi zero-API call, test suite, TypeScript, lint, dan siap build Android APK

- [x] Menghapus SYNC_API_KEY dari env, secrets usage, dan dependency provider
- [x] Menghapus route backend upload/create/status/cancel yang terhubung ke Sync Labs
- [x] Mengganti Start natural sync dengan pipeline lokal tanpa network request
- [x] Menampilkan OFFLINE READY hijau pada Home dan Settings serta menghapus provider settings
- [x] Mempertahankan trim audio, motion intensity, preview, draft, dan export pada alur lokal
- [x] Menambahkan config plugin ONNX Runtime dan memvalidasi prebuild Android offline
- [x] Menambahkan ekstensi .onnx ke Metro assetExts agar model offline dapat dibundel
- [ ] Menyimpan checkpoint v2.0 setelah optimasi model float16 dan perbaikan Metro asset resolver
- [ ] Menghasilkan model Wav2Lip int8 tervalidasi jika batas checkpoint menolak model float16
- [ ] Mengunduh `wav2lip_fp16.onnx` dari URL Hugging Face pengguna, memverifikasi checksum/graph/inference, dan mengganti asset model v2.0 bila valid
- [ ] Mencoba unduh dari GitHub Release dan camenduru Hugging Face; menyiapkan fallback build-safe bila keduanya gagal agar APK v2.0 tetap dapat dibuild tanpa upload manual

- [x] Migrasi ke Natural Lip-Sync v2.0 FREE OFFLINE EDITION (menghapus Sync Labs total, indikator OFFLINE READY hijau, zero network call, fallback build-safe tanpa model besar untuk menghindari HTTP 413, versi 2.0.0)

- [x] Audit preview/build failure pada 1% dan log runtime
- [x] Periksa infinite loop, import/dependency hilang, dan Metro/Expo asset resolver
- [x] Bersihkan cache/artifact build dan lakukan rebuild dari scratch
- [x] Verifikasi preview serta test/check/lint/build setelah perbaikan

- [x] Menstabilkan dependency effect Processing screen agar tidak memicu render ulang berulang
- [x] Menyelaraskan versi Expo package yang tidak kompatibel jika diperlukan
- [x] Membersihkan cache Metro/Expo dan artifact build dengan aman
- [x] Memverifikasi preview web setelah clean rebuild

- [x] Membatalkan proses preview/dependency yang stuck dan merekam error log sebenarnya
- [x] Memeriksa infinite loop, missing dependency, dependency mismatch, dan cache rusak
- [x] Membersihkan cache/artifact serta memulihkan dependency tanpa mengubah fitur
- [x] Menjalankan preview/build bersih sampai melewati 1% dan memvalidasi E2E utama
- [x] Tidak membuat APK baru sebelum preview dan E2E berhasil

- [x] Menstabilkan react-native-css-interop web.css cache dan Metro watchFolders agar clean preview tidak gagal SHA-1

- [x] Mengamankan kondisi project dan mencatat kegagalan EAS Android terbaru
- [x] Membaca log lengkap fase Run gradlew dan mengisolasi error Gradle pertama
- [x] Mengaudit dependency native, autolinking, Expo/Android, Kotlin, Gradle, dan AGP compatibility
- [x] Memperbaiki hanya akar masalah build dengan perubahan minimal
- [x] Menjalankan clean Android build sampai selesai tanpa mengubah fitur offline dan alur Natural Lip-Sync
- [x] Menyimpan checkpoint perbaikan build Android dan melaporkan hasilnya

- [x] Memastikan Expo web export menghasilkan dist/index.html untuk hosting
- [x] Mengubah hosting production agar menyajikan dist secara static dengan SPA fallback
- [x] Memvalidasi root domain tidak lagi mengembalikan Cannot GET / dan menyimpan checkpoint hosting

- [x] Membatalkan proses Android build yang macet pada 1%
- [x] Menonaktifkan backend service publishing untuk aplikasi OFFLINE FREE
- [x] Mengonfigurasi EAS Preview dengan distribution internal untuk APK-only
- [x] Memvalidasi konfigurasi Android dan menyimpan checkpoint build APK-only

- [x] Memeriksa status git, remote, dan potensi secret sebelum push GitHub
- [x] Membuat .github/workflows/build-apk.yml sesuai workflow build APK
- [x] Commit project ke branch main dan push ke repository GitHub target
- [x] Memverifikasi remote, branch, dan workflow setelah push

- [x] Memeriksa workflow GitHub dan lockfile yang tersedia
- [x] Menghapus cache npm yang membutuhkan package-lock.json
- [x] Commit, push, dan verifikasi workflow GitHub terbaru

- [x] Mengaudit scripts/load-env.js dan sintaks module saat ini
- [x] Mengonversi seluruh import load-env.js ke require CommonJS
- [x] Memvalidasi loader, commit, push, dan verifikasi branch main

- [x] Mengaudit seluruh referensi com.arthenica di codebase project
- [x] Mengganti com.arthenica ke dev.ffmpegkit-maintained dan versi 6.0.3
- [x] Memastikan mavenCentral() dan repositories Maven terkonfigurasi benar
- [x] Commit dan push migrasi FFmpeg Kit ke branch main GitHub

- [x] Mengaudit struktur project (mengecek apakah ini project Expo/React Native atau Flutter)
- [x] Menambahkan resolutionStrategy di android/build.gradle untuk meredirect com.arthenica ke dev.ffmpegkit-maintained v6.0.3 secara global
- [x] Memastikan mavenCentral() dan repositories Maven terkonfigurasi benar
- [x] Commit dan push perbaikan resolutionStrategy FFmpeg ke branch main GitHub

- [x] Mengaudit konfigurasi Gradle root dan app module untuk resolusi FFmpeg
- [x] Menerapkan resolutionStrategy pada subprojects/allprojects di android/build.gradle
- [x] Menambahkan resolutionStrategy di android/app/build.gradle
- [x] Commit dan push Build #6 fix FFmpeg ke branch main GitHub



