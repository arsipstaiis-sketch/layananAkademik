// script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Deklarasi Elemen Utama
    const jenisSurat = document.getElementById('jenisSurat');
    const fieldBebasTanggungan = document.getElementById('fieldBebasTanggungan');
    const fieldMutasi = document.getElementById('fieldMutasi');
    const form = document.getElementById('suratForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const successMessage = document.getElementById('successMessage');
    const btnReset = document.getElementById('btnReset');

    // Deklarasi Elemen Alamat (API Wilayah)
    const selectProvinsi = document.getElementById('provinsiTujuan');
    const selectKabupaten = document.getElementById('kabupatenTujuan');

    // 2. Integrasi API Wilayah Indonesia (EMSIFA)
    // Muat daftar Provinsi saat website pertama kali dibuka
    if (selectProvinsi) {
        fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
            .then(response => response.json())
            .then(provinces => {
                provinces.forEach(province => {
                    const option = document.createElement('option');
                    option.value = province.id;          // Disimpan untuk memanggil API Kabupaten
                    option.dataset.name = province.name; // Nama asli disimpan di dataset
                    option.textContent = province.name;
                    selectProvinsi.appendChild(option);
                });
            })
            .catch(error => console.error('Gagal memuat provinsi:', error));
    }

    // Muat daftar Kabupaten/Kota saat Provinsi dipilih
    if (selectProvinsi && selectKabupaten) {
        selectProvinsi.addEventListener('change', function() {
            // Tampilkan status loading
            selectKabupaten.innerHTML = '<option value="" disabled selected>Loading...</option>';
            selectKabupaten.disabled = true;
            
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${this.value}.json`)
                .then(response => response.json())
                .then(regencies => {
                    selectKabupaten.innerHTML = '<option value="" disabled selected>-- Pilih Kab/Kota --</option>';
                    regencies.forEach(regency => {
                        const option = document.createElement('option');
                        option.value = regency.name; 
                        option.textContent = regency.name;
                        selectKabupaten.appendChild(option);
                    });
                    // Aktifkan kembali dropdown Kabupaten
                    selectKabupaten.disabled = false;
                    selectKabupaten.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    selectKabupaten.classList.add('bg-white');
                })
                .catch(error => console.error('Gagal memuat kabupaten:', error));
        });
    }

    // 3. Logika untuk menampilkan form dinamis berdasarkan jenis surat
    jenisSurat.addEventListener('change', function() {
        // Sembunyikan semua field tambahan dulu
        fieldBebasTanggungan.classList.add('hidden');
        fieldMutasi.classList.add('hidden');

        // Tampilkan field sesuai pilihan dropdown
        if (this.value === 'Bebas Tanggungan') {
            fieldBebasTanggungan.classList.remove('hidden');
        } else if (this.value === 'Mutasi') {
            fieldMutasi.classList.remove('hidden');
        }
    });

    // 4. Logika Pengiriman Form (Submit)
    form.addEventListener('submit', function(e) {
        e.preventDefault(); 

        // Ubah tampilan tombol menjadi state "Loading"
        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
        btnText.innerText = 'Mengirim...';
        btnSpinner.classList.remove('hidden');

        // Mengambil nama asli Provinsi & Kabupaten, lalu merakit alamat utuh
        let alamatLengkap = "";
        if (jenisSurat.value === 'Mutasi') {
            const namaProvinsi = selectProvinsi.options[selectProvinsi.selectedIndex]?.dataset?.name || "";
            const namaKabupaten = selectKabupaten.value || "";
            const detailAlamat = document.getElementById('detailAlamat') ? document.getElementById('detailAlamat').value : "";
            
            alamatLengkap = `${detailAlamat}, ${namaKabupaten}, ${namaProvinsi}`;
        }

        // Ambil data dari form untuk disiapkan ke Database
        const formData = {
            nama: document.getElementById('nama').value,
            nim: document.getElementById('nim').value,
            email: document.getElementById('email').value,
            tempat_lahir: document.getElementById('tempatLahir').value,
            tanggal_lahir: document.getElementById('tanggalLahir').value,
            prodi: document.getElementById('prodi').value,
            jenis_surat: jenisSurat.value,
            
            // Field Bebas Tanggungan
            tujuan_bebas: document.getElementById('tujuanBebas') ? document.getElementById('tujuanBebas').value : "",
            
            // Field Mutasi
            kampus_tujuan: document.getElementById('kampusTujuan') ? document.getElementById('kampusTujuan').value : "",
            prodi_tujuan: document.getElementById('prodiTujuan') ? document.getElementById('prodiTujuan').value : "",
            alasan_mutasi: document.getElementById('alasanMutasi') ? document.getElementById('alasanMutasi').value : "",
            
            // Tahun masuk otomatis diproses di Apps Script berdasarkan NIM, ini dikirim kosong agar urutan kolom tidak rusak
            tahun_masuk: "", 
            
            // Alamat hasil rakitan
            alamat_tujuan: alamatLengkap 
        };

        // PASTIKAN MENGGANTI URL INI DENGAN URL APPS SCRIPT ANDA
        const API_URL = 'https://script.google.com/macros/s/AKfycbwDh5GKLgWZl6Re5fDaWkyz3BJW-KQtvRh0QD3iRsk_J2yVxZRwAaOHpXpJi3ZbLBDmlg/exec';

        // Fetch / Kirim ke Google Apps Script
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === 'success') {
                form.classList.add('hidden'); 
                successMessage.classList.remove('hidden'); 
            } else {
                alert('Terjadi kesalahan sistem: ' + data.message);
            }
        })
        .catch(error => {
            alert('Gagal mengirim data. Pastikan koneksi internet Anda stabil.');
            console.error('Error:', error);
        })
        .finally(() => {
            // Kembalikan tombol ke state awal
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
            btnText.innerText = 'Kirim Permohonan';
            btnSpinner.classList.add('hidden');
        });
    });

    // 5. Logika untuk tombol "Ajukan surat lainnya"
    btnReset.addEventListener('click', function() {
        form.reset(); 
        fieldBebasTanggungan.classList.add('hidden'); 
        fieldMutasi.classList.add('hidden');
        successMessage.classList.add('hidden'); 
        form.classList.remove('hidden'); 
        
        // Reset dropdown kabupaten kembali ke state terkunci
        if (selectKabupaten) {
            selectKabupaten.innerHTML = '<option value="" disabled selected>-- Pilih Kab/Kota --</option>';
            selectKabupaten.disabled = true;
            selectKabupaten.classList.add('bg-gray-100', 'cursor-not-allowed');
            selectKabupaten.classList.remove('bg-white');
        }
    });
});
