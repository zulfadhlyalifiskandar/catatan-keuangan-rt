// 1. Cek Sesi Login dari halaman index.html
var sesiUser = localStorage.getItem('sesi_login_rt');
if (sesiUser === null) {
    window.location.href = 'index.html';
}

var dataUserAktif = JSON.parse(sesiUser);
var infoUser = document.getElementById('info-user');
if (infoUser) {
    infoUser.innerText = '👤 Login sebagai: ' + dataUserAktif.nama;
}

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

// 3. Ambil Data Transaksi dari MySQL
function muatDataDariDatabase() {
    fetch('http://localhost:3000/api/transaksi?user=' + encodeURIComponent(dataUserAktif.nama))
        .then(function(res) { return res.json(); })
        .then(function(data) {
            daftarTransaksi = data;
            tampilkanTampilan();
        })
        .catch(function(err) {
            console.log('Gagal memuat database:', err);
        });
}   

// 4. Tambah Data Transaksi ke MySQL
form.addEventListener('submit', function(e) {
    e.preventDefault();

    var nilaiUang = Number(amount.value);
    if (jenis.value === 'pengeluaran') {
        nilaiUang = -Math.abs(nilaiUang);
    } else {
        nilaiUang = Math.abs(nilaiUang);
    }

    var dataBaru = {
        tanggal: tanggal.value,
        jenis: jenis.value,
        kategori: kategori.value,
        keterangan: text.value,
        jumlah: nilaiUang,
        pencatat: dataUserAktif.nama
    };

    fetch('http://localhost:3000/api/tambah-transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataBaru)
    })
    .then(function(res) { return res.json(); })
    .then(function(hasil) {
        alert(hasil.pesan);
        text.value = '';
        amount.value = '';
        muatDataDariDatabase();
        pindahHalaman('riwayat');
    });
});

// 5. Hapus Data Transaksi dari MySQL
function removeTransaction(id) {
    if (!confirm('Yakin ingin menghapus catatan ini dari Database MySQL?')) return;

    fetch('http://localhost:3000/api/transaksi/' + id, {
        method: 'DELETE'
    })
    .then(function(res) { return res.json(); })
    .then(function(hasil) {
        alert(hasil.pesan);
        muatDataDariDatabase();
    });
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
        list.innerHTML = '<p style="text-align:center; color:#777; padding:15px;">Belum ada data transaksi di database MySQL.</p>';
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