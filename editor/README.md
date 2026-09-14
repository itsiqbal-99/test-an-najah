# Editor konten Ma'had An-Najah

Alat ini hanya untuk memperbarui konten website statis di komputer pengelola. Editor tidak menjadi bagian dari halaman company profile dan tidak memerlukan akun, database, atau layanan luar.

## Menjalankan

1. Pastikan Node.js tersedia.
2. Dari folder `D:\apps\website_annajah`, jalankan `node editor/server.mjs`.
3. Buka `http://127.0.0.1:4174/` di browser pada komputer yang sama.
4. Pilih bagian halaman, ubah teks atau ganti/tambah foto, lalu klik **Pratinjau**.
5. Klik **Simpan ke HTML**. File `an-najah-4.html` langsung diperbarui; foto baru disalin ke `assets/uploads/`.

Editor menyimpan salinan HTML sebelum setiap perubahan di `editor/backups/`. Untuk menerbitkan hasil, unggah `an-najah-4.html` **bersama seluruh folder `assets`**, termasuk `assets/uploads`. File editor tidak perlu diunggah ke hosting.

Pada bagian **Fasilitas** dan **Galeri**, pilih kategori, lalu tambah beberapa foto sekaligus, klik **Ganti foto ini** untuk mengganti satu foto tanpa menghapusnya, ubah urutan, atau hapus foto. Isi **deskripsi alternatif** sesuai isi gambar dan **keterangan singkat** yang akan terlihat oleh pembaca. Foto pertama tampil saat kategori dipilih. Keterangan otomatis untuk foto baru atau pengganti hanya titik awal; sesuaikan sebelum menerbitkan. Pastikan izin publikasi foto telah diperoleh, terutama untuk foto santriwati.

Editor hanya mendengarkan koneksi lokal (`127.0.0.1`), bukan jaringan umum. Tutup proses Node.js setelah selesai mengedit.
