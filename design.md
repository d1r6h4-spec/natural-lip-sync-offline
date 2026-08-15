# Design Document: Natural Lip-Sync App

## Overview
Natural Lip-Sync App adalah aplikasi mobile berbasis Expo (React Native) yang memungkinkan pengguna mengubah foto wajah atau avatar statis/video pendek menjadi video lip-sync yang selaras secara natural dengan file audio atau rekaman suara baru. Aplikasi ini dirancang untuk penggunaan satu tangan (one-handed usage) dengan orientasi portrait (9:16) mengikuti standar Apple Human Interface Guidelines (HIG).

---

## Screen List & Architecture

1. **Home / Dashboard Screen (`app/(tabs)/index.tsx`)**
   - **Primary Content:** Sambutan, galeri video lip-sync yang telah dibuat sebelumnya (History), dan tombol aksi cepat "Create New Lip-Sync".
   - **Functionality:** Menampilkan daftar proyek tersimpan, status render (Completed, Processing, Draft), dan navigasi ke halaman Editor atau Player.

2. **Creation & Setup Screen (`app/create.tsx` or modal)**
   - **Primary Content:** 
     - Langkah 1: Pilih Foto/Video Wajah (Source Media).
     - Langkah 2: Pilih/Rekam Audio (Voice Source - Upload MP3/WAV atau Rekam Langsung).
     - Langkah 3: Pengaturan Kustom (Emotion/Expression, Smoothing, Motion Intensity).
   - **Functionality:** Pemilihan file menggunakan media picker, preview audio dengan `expo-audio`, dan tombol "Generate Lip-Sync".

3. **Processing / Render Screen (`app/processing.tsx`)**
   - **Primary Content:** Indikator animasi progres (0-100%), status tahapan (Analisis Audio, Penjajaran Vokal, Sintesis Wajah, Render Akhir), dan estimasi waktu.
   - **Functionality:** Mencegah keluar tidak sengaja selama proses, menampilkan animasi real-time, dan mengalihkan otomatis ke layar Player saat selesai.

4. **Player & Result Screen (`app/result.tsx`)**
   - **Primary Content:** Pemutar video hasil lip-sync (`expo-video`), kontrol pemutaran (Play/Pause, Timeline, Volume), serta tombol aksi (Share, Download ke Gallery, Edit Ulang).
   - **Functionality:** Memutar video hasil, menyimpan ke galeri perangkat, dan membagikan video ke media sosial.

5. **Settings & Profile Screen (`app/(tabs)/settings.tsx`)**
   - **Primary Content:** Pengaturan kualitas render (720p/1080p), preferensi penyimpanan, informasi akun, dan panduan penggunaan.
   - **Functionality:** Mengubah konfigurasi aplikasi dan membersihkan cache lokal.

---

## Key User Flows

1. **Pembuatan Video Lip-Sync Baru:**
   - Pengguna membuka aplikasi di tab Home → Mengetuk tombol "Create New".
   - Memilih foto wajah dari galeri perangkat atau mengambil foto baru.
   - Mengunggah file audio atau merekam suara langsung melalui mikrofon.
   - Menyesuaikan parameter ekspresi (Natural, Expressive, Calm).
   - Mengetuk "Start Generation" → Masuk ke Layar Proses (Processing) dengan animasi progres.
   - Setelah selesai (100%), otomatis berpindah ke Layar Hasil (Player) untuk pratinjau dan ekspor/bagikan.

2. **Manajemen Riwayat & Pemutaran Ulang:**
   - Pengguna melihat daftar video tersimpan di tab Home.
   - Mengetuk salah satu item untuk langsung membuka pemutar video (Player).
   - Menghapus atau membagikan ulang video kapan saja.

---

## Color Choices & Brand Identity

Palet warna dirancang dengan nuansa modern, bersih, dan profesional (mengikuti estetika iOS Dark/Light mode):
- **Primary Accent (`primary`):** `#0a7ea4` (Teal / Ocean Blue) untuk tombol aksi utama dan indikator aktif.
- **Background (`background`):** `#ffffff` (Light) / `#151718` (Dark) untuk kenyamanan mata.
- **Surface (`surface`):** `#f5f5f5` (Light) / `#1e2022` (Dark) untuk kartu dan kontainer elemen.
- **Foreground (`foreground`):** `#11181C` (Light) / `#ECEDEE` (Dark) untuk teks utama berstandar kontras tinggi.
- **Muted (`muted`):** `#687076` (Light) / `#9BA1A6` (Dark) untuk teks sekunder.
- **Success (`success`):** `#22C55E` untuk status selesai / berhasil.
