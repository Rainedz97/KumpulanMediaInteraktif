# BRIAN Learning & Media Studio

© 2026 I Gusti Agung Rian Gunawan, S.Kom. Lihat berkas `LICENSE`.

Katalog dan player proyek HTML edukasi (gim, media pembelajaran, simulasi). Situs statis: tanpa build, tanpa server.

## Struktur
- `index.html`, `koleksi.html`: halaman publik (katalog, favorit, riwayat)
- `koleksi-saya.html`: media HTML pribadi pengunjung, tersimpan di browser masing-masing (IndexedDB), berjalan di sandbox terisolasi
- `admin.html`: panel admin (tidak ditautkan dari halaman publik)
- `data/projects.json`: daftar proyek publik (dikelola otomatis oleh admin)
- `projects/<id>/`: file proyek yang diunggah, `thumbs/`: thumbnail

## Pasang
1. Buat repository GitHub dan unggah isi folder ini ke branch `main` (repo harus punya minimal satu commit).
2. Di Vercel: **Add New → Project**, impor repo, biarkan semua pengaturan bawaan (Framework: Other, tanpa build command), lalu **Deploy**.
3. Buat [fine-grained token](https://github.com/settings/personal-access-tokens/new): pilih hanya repo ini, izin **Contents: Read and write**.

## Pakai admin
Buka `/admin`, isi `username/nama-repo`, branch, dan token, lalu **Simpan & muat proyek**.

Dua jenis proyek:
- **Unggah file**: pilih **folder** yang langsung berisi `index.html`, atau unggah **berkas `.zip`** (boleh ada satu folder pembungkus di dalamnya, akan dilepas otomatis). Zip memakai pembaca ringan buatan sendiri (`js/miniunzip.js`), mendukung metode STORED dan DEFLATE. Setiap simpan menjadi satu commit; Vercel menerbitkan ulang otomatis (±1 menit).
- **Tautan web**: tempel alamat situs yang sudah dideploy di tempat lain (Netlify, GitHub Pages, dst). Gunakan tombol **Coba sematkan** untuk menguji apakah situsnya bisa ditampilkan di dalam player; jika gagal, centang mati opsi "Tampilkan di dalam player" agar dibuka di tab baru.

Token hanya disimpan di browser yang dipakai. Jangan membagikannya dan beri masa berlaku. Admin hanya bisa menulis jika token valid, sehingga pengunjung yang membuka `/admin` tidak bisa mengubah apa pun.

## Koleksi Saya
Pengunjung dapat menambahkan media HTML mereka sendiri (satu file, folder, `.zip`, atau tempel kode) tanpa perlu akun atau akses GitHub. Semuanya tersimpan di `IndexedDB` browser masing-masing, tidak terkirim ke server mana pun.

Setiap proyek dijalankan di `<iframe>` dengan `sandbox="allow-scripts …"` **tanpa** `allow-same-origin`, sehingga kode di dalamnya tidak bisa membaca data situs BRIAN Studio (termasuk token admin bila browser yang sama pernah dipakai di `/admin`). Pemanggilan `localStorage` di dalam proyek tetap berfungsi lewat lapisan kecil yang menyimpan datanya secara terpisah per proyek di `Koleksi Saya`.

Keterbatasan yang perlu diketahui:
- Semua berkas digabung menjadi satu dokumen saat disimpan. Proyek yang memuat berkas lain lewat `fetch()`, atau skrip bertipe `module`, mungkin tidak berjalan sempurna.
- Batas ±60 MB per proyek.
- Data hanya ada di browser itu. Pakai menu **Ekspor / Impor** di halaman Koleksi Saya sebagai cadangan sebelum membersihkan data browser atau pindah perangkat.
- Dukungan `.zip` memakai pembaca ZIP ringan buatan sendiri (`js/miniunzip.js`, metode STORED dan DEFLATE); format ZIP yang memakai metode kompresi lain tidak didukung.

## PWA & lainnya
- Situs ini bisa dipasang ke layar HP/laptop (PWA): `manifest.json` dan `sw.js` membuat halaman yang pernah dibuka tetap bisa diakses tanpa internet, dan `data/projects.json` selalu dicoba dari jaringan dulu supaya proyek baru langsung terlihat saat online. Tombol "Pasang ke Perangkat" muncul otomatis di beranda jika browser mendukungnya (Android/desktop Chrome, Edge; di iPhone pakai menu Bagikan → "Tambah ke Layar Utama").
- `404.html` otomatis ditampilkan Vercel untuk alamat yang salah atau proyek yang sudah dihapus.
- `assets/images/og-cover.png` tampil sebagai gambar pratinjau saat tautan situs dibagikan di WhatsApp/grup.

## Lainnya
- **Proyek unggulan**: centang "Jadikan proyek unggulan" di admin agar proyek itu selalu tampil paling atas katalog (ditandai ★ Unggulan).
- **Pratinjau**: tombol "👁 Lihat" di daftar admin membuka proyek apa adanya di tab baru — berguna untuk memeriksa proyek berstatus Draf sebelum diterbitkan (draf tetap bisa diakses lewat tautan langsungnya, hanya disembunyikan dari katalog).
- Setiap simpan/hapus di admin kini menampilkan tautan "Lihat commit ↗" ke riwayat perubahan di GitHub.
- `robots.txt` dan `sitemap.xml` sudah disiapkan untuk mesin pencari (ganti `GANTI-DENGAN-DOMAIN-ANDA` di kedua berkas dengan alamat situs Anda yang sebenarnya setelah dideploy). Halaman admin dan Koleksi Saya sengaja tidak diminta untuk diindeks.
- Ada tautan "Lewati ke konten" (muncul saat ditekan Tombol Tab) untuk pengguna keyboard/pembaca layar.

## Keamanan kode
Kode HTML/CSS/JS situs ini selalu bisa dilihat siapa pun lewat browser (ini berlaku untuk semua situs web, bukan keterbatasan khusus di sini). Perlindungan yang diterapkan bersifat legal dan administratif, bukan teknis: lihat `LICENSE`, watermark nama di footer dan console, serta riwayat commit GitHub sebagai bukti tanggal pembuatan.

## Catatan
- Buka lewat alamat hosting; klik-ganda `koleksi.html` dari folder tidak bisa memuat `data/projects.json`.
- Proyek publik (lewat admin) dibuka dari origin yang sama dengan situs, jadi hanya unggah karya sendiri atau yang sudah diperiksa.
