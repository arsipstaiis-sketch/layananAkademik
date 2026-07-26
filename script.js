// script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Deklarasi Elemen
    const jenisSurat = document.getElementById('jenisSurat');
    const fieldBebasTanggungan = document.getElementById('fieldBebasTanggungan');
    const fieldMutasi = document.getElementById('fieldMutasi');
    const form = document.getElementById('suratForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const successMessage = document.getElementById('successMessage');
    const btnReset = document.getElementById('btnReset');

    // 2. Logika untuk menampilkan form dinamis berdasarkan jenis surat
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

    // 3. Logika pengiriman form (Submit)
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Mencegah browser melakukan reload halaman

        // Ubah tampilan tombol menjadi state "Loading"
        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
        btnText.innerText = 'Mengirim...';
        btnSpinner.classList.remove('hidden');

        // Ambil data dari form untuk disiapkan ke Database (Google Sheets)
        const formData = {
            nama: document.getElementById('nama').value,
            nim: document.getElementById('nim').value,
            email: document.getElementById('email').value,
            tempat_lahir: document.getElementById('tempatLahir').value,
            tanggal_lahir: document.getElementById('tanggalLahir').value,
            prodi: document.getElementById('prodi').value,
            jenis_surat: jenisSurat.value,
            tujuan_bebas: document.getElementById('tujuanBebas').value,
            kampus_tujuan: document.getElementById('kampusTujuan').value,
            alasan_mutasi: document.getElementById('alasanMutasi').value
        };

        // GANTI BAGIAN INI DENGAN URL WEB APP DARI GOOGLE APPS SCRIPT ANDA
        const API_URL = 'https://script.google.com/macros/s/AKfycbwDh5GKLgWZl6Re5fDaWkyz3BJW-KQtvRh0QD3iRsk_J2yVxZRwAaOHpXpJi3ZbLBDmlg/exec';

        // Mengirim data ke Google Sheets menggunakan metode POST
        fetch(API_URL, {
            method: 'POST',
            // Menggunakan text/plain untuk menghindari error CORS preflight
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === 'success') {
                // Sembunyikan form dan tampilkan pesan sukses
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
            // Kembalikan state tombol ke semula (untuk persiapan jika form direset)
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
            btnText.innerText = 'Kirim Permohonan';
            btnSpinner.classList.add('hidden');
        });
        
    });

    // 4. Logika untuk tombol "Ajukan surat lainnya"
    btnReset.addEventListener('click', function() {
        form.reset(); // Kosongkan semua input
        fieldBebasTanggungan.classList.add('hidden'); // Sembunyikan form dinamis
        fieldMutasi.classList.add('hidden');
        successMessage.classList.add('hidden'); // Sembunyikan pesan sukses
        form.classList.remove('hidden'); // Tampilkan form kembali
    });

});
