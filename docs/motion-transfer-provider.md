# Motion-transfer provider notes

Sumber yang ditinjau: [Replicate kwaivgi/kling-v2.6-motion-control](https://replicate.com/kwaivgi/kling-v2.6-motion-control), diakses pada 2026-08-15.

Model menerima `image` sebagai target karakter dan `video` sebagai video referensi gerakan. Parameter resmi yang terlihat pada halaman model adalah `character_orientation` (`image` atau `video`), `mode` (`std` atau `pro`), dan `keep_original_sound`. Video referensi mendukung MP4/MOV dengan batas 3–30 detik bergantung pada orientasi karakter. Untuk target image, halaman menjelaskan orientasi `image` membatasi output hingga 10 detik; orientasi `video` konsisten dengan orientasi karakter video dan dapat mencapai 30 detik. Model mentransfer aksi karakter dari video referensi ke target image.

Implementasi aplikasi akan menggunakan adapter provider yang dikonfigurasi melalui `REPLICATE_MOTION_TRANSFER_VERSION`, tanpa meng-hardcode version ID dari halaman. Jika variable versi tidak tersedia, backend harus mengembalikan error konfigurasi yang jelas, bukan berpura-pura menjalankan full-body motion transfer menggunakan SadTalker atau VideoReTalking.
Dokumentasi API model menunjukkan penggunaan model identifier langsung `kwaivgi/kling-v2.6-motion-control` melalui client Replicate dengan input `image`, `video`, dan opsional `mode`. Karena adapter proyek saat ini menggunakan endpoint `/v1/predictions` berbasis `version`, implementasi memilih version ID melalui environment agar dapat diubah tanpa mengubah kode; model identifier dapat dipakai pada pengujian atau adapter client di masa berikutnya.
