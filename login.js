if (localStorage.getItem('sesi_login_rt') !== null) {
    window.location.href = 'web.html';
}

var formLogin = document.getElementById('form-login');
var formDaftar = document.getElementById('form-daftar');

// Siapkan akun bawaan untuk mode online (Vercel)
var dataUsersLokal = localStorage.getItem('db_users_rt');
var usersLokal = dataUsersLokal ? JSON.parse(dataUsersLokal) : [
    { nama: 'Keluarga Iskandar', username: 'keluarga', password: '123' }
];
localStorage.setItem('db_users_rt', JSON.stringify(usersLokal));

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

// 1. PROSES LOGIN
formLogin.addEventListener('submit', function(e) {
    e.preventDefault();
    var inputUser = document.getElementById('login-user').value;
    var inputPass = document.getElementById('login-pass').value;

    // Coba cek ke MySQL dulu (jika dijalankan di localhost laptop)
    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputUser, password: inputPass })
    })
    .then(function(res) { return res.json(); })
    .then(function(hasil) {
        if (hasil.status === 'Sukses') {
            localStorage.setItem('sesi_login_rt', JSON.stringify(hasil.user));
            alert('Login Berhasil (Database MySQL)! Selamat datang, ' + hasil.user.nama);
            window.location.href = 'web.html';
        } else {
            alert(hasil.pesan);
        }
    })
    .catch(function() {
        // Jika dibuka di Vercel (Online), otomatis periksa dari Database Browser
        var ditemukan = null;
        for (var i = 0; i < usersLokal.length; i++) {
            if (usersLokal[i].username.toLowerCase() === inputUser.toLowerCase() && usersLokal[i].password === inputPass) {
                ditemukan = usersLokal[i];
            }
        }
        if (ditemukan !== null) {
            localStorage.setItem('sesi_login_rt', JSON.stringify(ditemukan));
            alert('Login Berhasil! Selamat datang, ' + ditemukan.nama);
            window.location.href = 'web.html';
        } else {
            alert('Username atau Password salah!');
        }
    });
});

// 2. PROSES DAFTAR AKUN BARU
formDaftar.addEventListener('submit', function(e) {
    e.preventDefault();
    var dataAkunBaru = {
        nama: document.getElementById('daftar-nama').value,
        username: document.getElementById('daftar-user').value,
        password: document.getElementById('daftar-pass').value
    };

    // Simpan juga ke lokal untuk cadangan di Vercel
    usersLokal.push(dataAkunBaru);
    localStorage.setItem('db_users_rt', JSON.stringify(usersLokal));

    // Coba kirim ke MySQL (jika di laptop)
    fetch('http://localhost:3000/api/daftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataAkunBaru)
    })
    .then(function(res) { return res.json(); })
    .then(function(hasil) {
        alert(hasil.pesan);
        tampilkanFormDaftar(false);
    })
    .catch(function() {
        // Jika di Vercel
        alert('Akun berhasil didaftarkan ke Database! Silakan login.');
        tampilkanFormDaftar(false);
    });

    document.getElementById('daftar-nama').value = '';
    document.getElementById('daftar-user').value = '';
    document.getElementById('daftar-pass').value = '';
});
