// Cek jika pengguna sudah login, langsung arahkan ke web.html
if (localStorage.getItem('sesi_login_rt') !== null) {
    window.location.href = 'web.html';
}

var formLogin = document.getElementById('form-login');
var formDaftar = document.getElementById('form-daftar');

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

// 1. PROSES LOGIN (Memeriksa akun langsung ke tabel pengguna di MySQL)
formLogin.addEventListener('submit', function(e) {
    e.preventDefault();
    var inputUser = document.getElementById('login-user').value;
    var inputPass = document.getElementById('login-pass').value;

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputUser, password: inputPass })
    })
    .then(function(res) { return res.json(); })
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
        alert('Gagal terhubung ke server MySQL! Pastikan node server.js masih menyala.');
    });
});

// 2. PROSES DAFTAR AKUN BARU (Menyimpan langsung ke tabel pengguna di MySQL)
formDaftar.addEventListener('submit', function(e) {
    e.preventDefault();
    var dataAkunBaru = {
        nama: document.getElementById('daftar-nama').value,
        username: document.getElementById('daftar-user').value,
        password: document.getElementById('daftar-pass').value
    };

    fetch('http://localhost:3000/api/daftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAkunBaru)
    })
    .then(function(res) { return res.json(); })
    .then(function(hasil) {
        alert(hasil.pesan);
        if (hasil.status === 'Sukses') {
            document.getElementById('daftar-nama').value = '';
            document.getElementById('daftar-user').value = '';
            document.getElementById('daftar-pass').value = '';
            tampilkanFormDaftar(false);
        }
    })
    .catch(function() {
        alert('Gagal menyimpan akun ke server MySQL!');
    });
});