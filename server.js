const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// Koneksi ke Database MySQL XAMPP
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'keuangan_rt'
});

db.connect((err) => {
    if (err) {
        console.log('❌ Gagal konek ke MySQL:', err);
    } else {
        console.log('✅ Berhasil terhubung ke Database MySQL!');
    }
});

// ================= API PENGGUNA (TABEL PENGGUNA) =================

// 1. Simpan Akun Baru ke Tabel pengguna di MySQL
app.post('/api/daftar', (req, res) => {
    const { nama, username, password } = req.body;
    const sql = "INSERT INTO pengguna (nama, username, password) VALUES (?, ?, ?)";

    db.query(sql, [nama, username, password], (err, result) => {
        if (err) {
            res.status(500).json({ status: 'Gagal', pesan: 'Username sudah dipakai atau gagal menyimpan!' });
        } else {
            res.json({ status: 'Sukses', pesan: 'Akun berhasil masuk ke Database MySQL! Silakan login.' });
        }
    });
});

// 2. Periksa Login dari Tabel pengguna di MySQL
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM pengguna WHERE username = ? AND password = ?";

    db.query(sql, [username, password], (err, results) => {
        if (err) {
            res.status(500).json({ status: 'Gagal', pesan: 'Terjadi kesalahan database' });
        } else if (results.length > 0) {
            res.json({ status: 'Sukses', user: results[0] });
        } else {
            res.status(401).json({ status: 'Gagal', pesan: 'Username atau Password salah!' });
        }
    });
});

// ================= API TRANSAKSI (TABEL TRANSAKSI) =================

// 3. Ambil data transaksi dari MySQL sesuai nama pencatat (user yang login)
app.get('/api/transaksi', (req, res) => {
    const namaUser = req.query.user;
    
    // Jika ada nama user yang dikirim, tampilkan data milik user itu saja
    if (namaUser) {
        db.query("SELECT * FROM transaksi WHERE pencatat = ? ORDER BY id DESC", [namaUser], (err, results) => {
            if (err) res.status(500).json({ error: err });
            else res.json(results);
        });
    } else {
        db.query("SELECT * FROM transaksi ORDER BY id DESC", (err, results) => {
            if (err) res.status(500).json({ error: err });
            else res.json(results);
        });
    }
});

// 4. Simpan data transaksi ke MySQL
app.post('/api/tambah-transaksi', (req, res) => {
    const { tanggal, jenis, kategori, keterangan, jumlah, pencatat } = req.body;
    const sql = "INSERT INTO transaksi (id, tanggal, jenis, kategori, keterangan, jumlah, pencatat) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const idUnik = Date.now();

    db.query(sql, [idUnik, tanggal, jenis, kategori, keterangan, jumlah, pencatat], (err, result) => {
        if (err) res.status(500).json({ status: 'Gagal', error: err });
        else res.json({ status: 'Sukses', pesan: 'Transaksi berhasil masuk ke Database MySQL!' });
    });
});

// 5. Hapus data transaksi dari MySQL
app.delete('/api/transaksi/:id', (req, res) => {
    const idTransaksi = req.params.id;
    db.query("DELETE FROM transaksi WHERE id = ?", [idTransaksi], (err, result) => {
        if (err) res.status(500).json({ status: 'Gagal', error: err });
        else res.json({ status: 'Sukses', pesan: 'Data berhasil dihapus dari MySQL!' });
    });
});

app.listen(3000, () => {
    console.log('🚀 Server Backend berjalan di http://localhost:3000');
});