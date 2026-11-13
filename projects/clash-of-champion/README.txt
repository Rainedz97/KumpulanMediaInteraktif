CLASH OF CHAMPIONS: CIPHER VAULT ARENA
========================================
Game edukasi offline berbasis HTML/CSS/JS — tanpa internet, tanpa install.

CARA MENJALANKAN
-----------------
1. Ekstrak seluruh folder ini (jangan pisahkan file-filenya).
2. Buka file "index.html" dengan double-click — akan terbuka di browser
   (disarankan Chrome / Edge / Firefox versi terbaru).
3. Untuk ditampilkan ke proyektor / IFP, cukup buka index.html di layar itu.

STRUKTUR FOLDER
----------------
coc-vault-arena/
├─ index.html              -> Kerangka utama aplikasi (semua "layar")
├─ css/
│  └─ style.css             -> Semua tampilan visual & responsif (HP/Laptop/IFP)
├─ data/
│  └─ default-questions.js  -> 30 soal & kunci jawaban bawaan (bisa diedit
│                               langsung dari sini ATAU lebih mudah lewat
│                               menu "Edit Soal & Kunci Jawaban" di aplikasi)
└─ js/
   ├─ state.js              -> Model data & penyimpanan (localStorage)
   ├─ ui-common.js          -> Navigasi antar layar & modal PIN
   ├─ audio.js               -> Musik latar & efek suara (Web Audio API)
   ├─ setup.js               -> Layar pengaturan tim (jumlah tim, durasi)
   ├─ arena.js               -> Timer, grid vault, jawaban, hasil, game over
   ├─ teacher.js              -> Dashboard guru: edit soal, PIN, mata pelajaran
   ├─ print-export.js         -> Lembar cetak A4 & export gambar PNG
   └─ main.js                 -> Titik masuk aplikasi (memuat semuanya)

ALUR PENGGUNAAN
----------------
1. Menu Utama -> pilih "EDIT SOAL & KUNCI JAWABAN" (PIN default: 1234)
   untuk mengatur mata pelajaran, 30 soal, kunci jawaban, dan PIN baru.
2. Menu Utama -> pilih "MULAI PERTANDINGAN" -> atur jumlah tim, nama tim,
   durasi waktu -> klik "MASUK ARENA PERTANDINGAN".
3. Siswa mengerjakan soal di Lembar Cetak (menu Edit > Preview Cetak > Print),
   lalu memasukkan password ke Vault di layar Arena.

CATATAN KEAMANAN
-----------------
PIN Guru mencegah siswa iseng membuka kunci jawaban, namun ini BUKAN
enkripsi tingkat tinggi karena aplikasi berjalan 100% di sisi browser
(tanpa server). Hindari membuka menu Edit di depan siswa.

BACKUP SOAL
-----------
Gunakan tombol "Export Bank Soal (.json)" di menu Edit > Data & Backup
untuk menyimpan cadangan soal, dan "Import Bank Soal (.json)" untuk
memuatnya kembali di perangkat lain.
