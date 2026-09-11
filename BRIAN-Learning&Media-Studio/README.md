# BRIAN Learning & Media Studio

Platform web offline-first untuk mengelola koleksi gim edukasi, media pembelajaran interaktif, VLab/simulasi, dan aplikasi HTML standalone.

## Struktur
- `index.html` — landing page
- `koleksi.html` — katalog/koleksi
- `css/` — style terpisah
- `js/` — logika aplikasi + IndexedDB
- `assets/` — gambar dan ikon
- `projects/` — folder kosong untuk dokumentasi proyek standalone (project yang diimpor disimpan di IndexedDB browser)

## Penggunaan
1. Buka `index.html` di browser modern.
2. Pilih **Buka Koleksi**.
3. Gunakan **Tambah Proyek** untuk mengimpor folder yang memiliki `index.html`/`index.htm`.
4. Thumbnail dapat dipilih manual atau otomatis dari `thumbnail/cover` yang ditemukan.
5. Klik **Buka** untuk menjalankan project melalui player.
6. Klik **Editor** untuk mengubah metadata dan thumbnail project.
7. Menu **Petunjuk**, **Syarat & Ketentuan**, dan **Kebijakan Privasi** membuka panel informasi offline.

## Catatan offline
Versi ini menyimpan project di IndexedDB browser. Tidak memerlukan server untuk fungsi inti setelah file platform tersedia di perangkat.
