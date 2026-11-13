// Cek jika pengguna sudah login, langsung arahkan ke web.html
if (localStorage.getItem('sesi_login_rt') !== null) {
    window.location.href = 'web.html';
}

var formLogin = document.getElementById('form-login');
var formDaftar = document.getElementById('form-daftar');

// Menentukan URL API otomatis (mendukung localhost)
var API_BASE = 'http://localhost:3000';

// Daftar akun bawaan agar tetap bisa login di Vercel walau tanpa XAMPP
function ambilDaftarAkunLokal() {
    var data = localStorage.getItem('db_pengguna_rt');
    if (!data) {
        var akunDefault = [
            { id: 1, nama: 'Keluarga Iskandar', username: 'admin', password: '123' }
        ];
        localStorage.setItem('db_pengguna_rt', JSON.stringify(akunDefault));
        return akunDefault;
    }
    return JSON.parse(data);
}

function tampilkanFormDaftar(modeDaftar) {
    if (modeDaftar === true) {
        formLogin.className = 'sembunyi';
        formDaftar.className = '';
        document.getElementById('judul-auth').innerText = 'Daftar Akun Keluarga Baru';
    } else {
        formLogin.className = '';
        formDaftar.className = 'sembunyi';
        document.getElementById('judul-auth').innerText = 'Login Anggota Keluarga';
    }
}

// 1. PROSES LOGIN (Coba ke MySQL dulu, jika di Vercel/Offline otomatis pakai Database Browser)
formLogin.addEventListener('submit', function(e) {
    e.preventDefault();
    var inputUser = document.getElementById('login-user').value.trim();
    var inputPass = document.getElementById('login-pass').value.trim();

    fetch(API_BASE + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputUser, password: inputPass })
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Respon server gagal');
        return res.json();
    })
    .then(function(hasil) {
        if (hasil.status === 'Sukses') {
            localStorage.setItem('sesi_login_rt', JSON.stringify(hasil.user));
            alert('Login Berhasil! Selamat datang, ' + hasil.user.nama);
            window.location.href = 'web.html';
        } else {
            alert(hasil.pesan);
        }
    })
    .catch(function() {
        // Fallback Otomatis untuk Vercel / Saat XAMPP tidak aktif
        var daftarAkun = ambilDaftarAkunLokal();
        var userKetemu = daftarAkun.find(function(u) {
            return u.username.toLowerCase() === inputUser.toLowerCase() && u.password === inputPass;
        });

        if (userKetemu) {
            localStorage.setItem('sesi_login_rt', JSON.stringify(userKetemu));
            alert('Login Berhasil! Selamat datang, ' + userKetemu.nama);
            window.location.href = 'web.html';
        } else {
            alert('Username atau Password salah! Silakan cek kembali atau Daftar Akun Baru.');
        }
    });
});

// 2. PROSES DAFTAR AKUN BARU
formDaftar.addEventListener('submit', function(e) {
    e.preventDefault();
    var namaInput = document.getElementById('daftar-nama').value.trim();
    var userInput = document.getElementById('daftar-user').value.trim();
    var passInput = document.getElementById('daftar-pass').value.trim();

    var dataAkunBaru = {
        id: Date.now(),
        nama: namaInput,
        username: userInput,
        password: passInput
    };

    // Simpan juga di penyimpanan browser agar di Vercel langsung berfungsi
    var daftarAkun = ambilDaftarAkunLokal();
    var sudahAda = daftarAkun.some(function(u) {
        return u.username.toLowerCase() === userInput.toLowerCase();
    });

    if (sudahAda) {
        alert('Username sudah dipakai! Gunakan username lain.');
        return;
    }

    fetch(API_BASE + '/api/daftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAkunBaru)
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Server offline');
        return res.json();
    })
    .then(function(hasil) {
        daftarAkun.push(dataAkunBaru);
        localStorage.setItem('db_pengguna_rt', JSON.stringify(daftarAkun));
        alert(hasil.pesan);
        resetFormDaftar();
    })
    .catch(function() {
        // Jika dibuka di Vercel, tetap simpan akun baru dengan aman
        daftarAkun.push(dataAkunBaru);
        localStorage.setItem('db_pengguna_rt', JSON.stringify(daftarAkun));
        alert('Akun berhasil dibuat! Silakan login dengan username dan password Anda.');
        resetFormDaftar();
    });
});

function resetFormDaftar() {
    document.getElementById('daftar-nama').value = '';
    document.getElementById('daftar-user').value = '';
    document.getElementById('daftar-pass').value = '';
    tampilkanFormDaftar(false);
}