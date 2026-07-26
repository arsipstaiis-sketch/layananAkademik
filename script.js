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

        // Ambil data dari form untuk disiapkan ke Database (Google Sheets nantinya)
        const formData = {
            nama: document.getElementById('nama').value,
            nim: document.getElementById('nim').value,
            email: document.getElementById('email').value,
            jenis_surat: jenisSurat.value,
            tujuan_bebas: document.getElementById('tujuanBebas').value,
            kampus_tujuan: document.getElementById('kampusTujuan').value,
            alasan_mutasi: document.getElementById('alasanMutasi').value
        };

        // TODO: Di sinilah kita akan meletakkan kode fetch() ke URL API Google Apps Script.
        // Untuk sekarang, kita gunakan simulasi setTimeout 2 detik.
        
        setTimeout(() => {
            // Sembunyikan form dan tampilkan pesan sukses
            form.classList.add('hidden'); 
            successMessage.classList.remove('hidden'); 
            
            // Kembalikan state tombol ke semula (untuk persiapan jika form direset)
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
            btnText.innerText = 'Kirim Permohonan';
            btnSpinner.classList.add('hidden');
        }, 2000);
        
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
