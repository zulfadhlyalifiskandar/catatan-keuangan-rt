// 1. Cek Sesi Login dari halaman index.html
var sesiUser = localStorage.getItem('sesi_login_rt');
if (sesiUser === null) {
    window.location.href = 'index.html';
}

var dataUserAktif = JSON.parse(sesiUser);
var infoUser = document.getElementById('info-user');
if (infoUser && dataUserAktif) {
    infoUser.innerText = '👤 Login sebagai: ' + dataUserAktif.nama;
}

var API_BASE = 'http://localhost:3000';

// 2. Mengambil elemen HTML di web.html
var balance = document.getElementById('balance');
var totalMasukEl = document.getElementById('total-masuk');
var totalKeluarEl = document.getElementById('total-keluar');
var rekapKategoriEl = document.getElementById('rekap-kategori');
var list = document.getElementById('list');
var form = document.getElementById('form');
var tanggal = document.getElementById('tanggal');
var jenis = document.getElementById('jenis');
var kategori = document.getElementById('kategori');
var text = document.getElementById('text');
var amount = document.getElementById('amount');
var filterKategori = document.getElementById('filter-kategori');

if (tanggal) {
    tanggal.valueAsDate = new Date();
}

var daftarTransaksi = [];

function formatRupiah(angka) {
    return Number(angka).toLocaleString('id-ID');
}

function ambilTransaksiLokal() {
    var simpanan = localStorage.getItem('db_transaksi_rt');
    var semuaData = simpanan ? JSON.parse(simpanan) : [];
    return semuaData.filter(function(item) {
        return item.pencatat === dataUserAktif.nama;
    });
}

function pindahHalaman(namaHalaman) {
    document.getElementById('halaman-dashboard').className = 'halaman sembunyi';
    document.getElementById('halaman-input').className = 'halaman sembunyi';
    document.getElementById('halaman-riwayat').className = 'halaman sembunyi';

    document.getElementById('btn-dashboard').className = 'nav-btn';
    document.getElementById('btn-input').className = 'nav-btn';
    document.getElementById('btn-riwayat').className = 'nav-btn';

    document.getElementById('halaman-' + namaHalaman).className = 'halaman';
    document.getElementById('btn-' + namaHalaman).className = 'nav-btn active';
}

// 3. Ambil Data Transaksi (MySQL atau Fallback Lokal di Vercel)
function muatDataDariDatabase() {
    fetch(API_BASE + '/api/transaksi?user=' + encodeURIComponent(dataUserAktif.nama))
        .then(function(res) {
            if (!res.ok) throw new Error('Server lokal tidak aktif');
            return res.json();
        })
        .then(function(data) {
            daftarTransaksi = data;
            tampilkanTampilan();
        })
        .catch(function() {
            // Gunakan penyimpanan lokal saat dijalankan di Vercel
            daftarTransaksi = ambilTransaksiLokal();
            tampilkanTampilan();
        });
}

// 4. Tambah Data Transaksi
form.addEventListener('submit', function(e) {
    e.preventDefault();

    var nilaiUang = Number(amount.value);
    if (jenis.value === 'pengeluaran') {
        nilaiUang = -Math.abs(nilaiUang);
    } else {
        nilaiUang = Math.abs(nilaiUang);
    }

    var dataBaru = {
        id: Date.now(),
        tanggal: tanggal.value,
        jenis: jenis.value,
        kategori: kategori.value,
        keterangan: text.value,
        jumlah: nilaiUang,
        pencatat: dataUserAktif.nama
    };

    fetch(API_BASE + '/api/tambah-transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataBaru)
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Server lokal tidak aktif');
        return res.json();
    })
    .then(function(hasil) {
        simpanKeLokal(dataBaru);
        alert(hasil.pesan);
        selesaiInput();
    })
    .catch(function() {
        simpanKeLokal(dataBaru);
        alert('Transaksi berhasil disimpan!');
        selesaiInput();
    });
});

function simpanKeLokal(dataBaru) {
    var simpanan = localStorage.getItem('db_transaksi_rt');
    var semuaData = simpanan ? JSON.parse(simpanan) : [];
    semuaData.unshift(dataBaru);
    localStorage.setItem('db_transaksi_rt', JSON.stringify(semuaData));
}

function selesaiInput() {
    text.value = '';
    amount.value = '';
    muatDataDariDatabase();
    pindahHalaman('riwayat');
}

// 5. Hapus Data Transaksi
function removeTransaction(id) {
    if (!confirm('Yakin ingin menghapus catatan ini?')) return;

    fetch(API_BASE + '/api/transaksi/' + id, {
        method: 'DELETE'
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Server lokal tidak aktif');
        return res.json();
    })
    .then(function(hasil) {
        hapusDariLokal(id);
        alert(hasil.pesan);
        muatDataDariDatabase();
    })
    .catch(function() {
        hapusDariLokal(id);
        alert('Data berhasil dihapus!');
        muatDataDariDatabase();
    });
}

function hapusDariLokal(id) {
    var simpanan = localStorage.getItem('db_transaksi_rt');
    if (simpanan) {
        var semuaData = JSON.parse(simpanan).filter(function(item) {
            return Number(item.id) !== Number(id);
        });
        localStorage.setItem('db_transaksi_rt', JSON.stringify(semuaData));
    }
}

// 6. Tampilkan Data ke Layar Web
function tampilkanTampilan() {
    list.innerHTML = '';
    rekapKategoriEl.innerHTML = '';

    var totalSaldo = 0;
    var totalPemasukan = 0;
    var totalPengeluaran = 0;

    var hitungKategori = {
        'Belanja Dapur': 0,
        'Tagihan Listrik & Air': 0,
        'Pendidikan Anak': 0,
        'Kesehatan & Darurat': 0,
        'Lain-lain': 0
    };

    var pilihanFilter = filterKategori ? filterKategori.value : 'Semua';

    for (var i = 0; i < daftarTransaksi.length; i++) {
        var t = daftarTransaksi[i];
        var nominal = Number(t.jumlah);

        totalSaldo += nominal;
        if (nominal > 0) {
            totalPemasukan += nominal;
        } else {
            totalPengeluaran += Math.abs(nominal);
            if (hitungKategori[t.kategori] !== undefined) {
                hitungKategori[t.kategori] += Math.abs(nominal);
            }
        }

        if (pilihanFilter === 'Semua' || t.kategori === pilihanFilter) {
            var li = document.createElement('li');
            li.className = nominal < 0 ? 'minus' : 'plus';
            var tanda = nominal < 0 ? '- Rp ' : '+ Rp ';
            var tglRapi = String(t.tanggal).substring(0, 10);

            li.innerHTML = 
                '<div class="info-transaksi">' +
                    '<strong>' + t.keterangan + '</strong>' +
                    '<small>📅 ' + tglRapi + ' | 🏷️ ' + t.kategori + ' | 👤 ' + t.pencatat + '</small>' +
                '</div>' +
                '<div class="nominal-transaksi">' +
                    '<span>' + tanda + formatRupiah(Math.abs(nominal)) + '</span>' +
                    '<button class="delete-btn" onclick="removeTransaction(' + t.id + ')">Hapus</button>' +
                '</div>';

            list.appendChild(li);
        }
    }

    if (list.innerHTML === '') {
        list.innerHTML = '<p style="text-align:center; color:#777; padding:15px;">Belum ada data transaksi.</p>';
    }

    balance.innerText = 'Rp ' + formatRupiah(totalSaldo);
    totalMasukEl.innerText = 'Rp ' + formatRupiah(totalPemasukan);
    totalKeluarEl.innerText = 'Rp ' + formatRupiah(totalPengeluaran);

    for (var namaKat in hitungKategori) {
        var itemKat = document.createElement('li');
        itemKat.innerHTML = '<span>' + namaKat + '</span> <strong>Rp ' + formatRupiah(hitungKategori[namaKat]) + '</strong>';
        rekapKategoriEl.appendChild(itemKat);
    }
}

muatDataDariDatabase();