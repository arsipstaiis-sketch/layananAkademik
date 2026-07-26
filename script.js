document.addEventListener('DOMContentLoaded', function() {
    const jenisSurat = document.getElementById('jenisSurat');
    const fieldBebasTanggungan = document.getElementById('fieldBebasTanggungan');
    const fieldMutasi = document.getElementById('fieldMutasi');
    const form = document.getElementById('suratForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const successMessage = document.getElementById('successMessage');
    const btnReset = document.getElementById('btnReset');

    jenisSurat.addEventListener('change', function() {
        fieldBebasTanggungan.classList.add('hidden');
        fieldMutasi.classList.add('hidden');

        if (this.value === 'Bebas Tanggungan') {
            fieldBebasTanggungan.classList.remove('hidden');
        } else if (this.value === 'Mutasi') {
            fieldMutasi.classList.remove('hidden');
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault(); 

        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
        btnText.innerText = 'Mengirim...';
        btnSpinner.classList.remove('hidden');

        // Mapping Data: Key di sisi kiri harus sama dengan yang dipanggil di Apps Script
        const formData = {
            nama: document.getElementById('nama').value,
            nim: document.getElementById('nim').value,
            email: document.getElementById('email').value,
            tempat_lahir: document.getElementById('tempatLahir').value,
            tanggal_lahir: document.getElementById('tanggalLahir').value,
            prodi: document.getElementById('prodi').value,
            jenis_surat: jenisSurat.value,
            
            // Kolom Dinamis (Opsional tergantung jenis surat)
            tujuan_bebas: document.getElementById('tujuanBebas').value,
            kampus_tujuan: document.getElementById('kampusTujuan').value,
            alasan_mutasi: document.getElementById('alasanMutasi').value
        };

        // GANTI DENGAN URL API ANDA YANG BARU SETELAH DEPLOY NEW VERSION
        const API_URL = 'https://script.google.com/macros/s/GANTI_DENGAN_URL_ANDA/exec';

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
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
            btnText.innerText = 'Kirim Permohonan';
            btnSpinner.classList.add('hidden');
        });
    });

    btnReset.addEventListener('click', function() {
        form.reset(); 
        fieldBebasTanggungan.classList.add('hidden'); 
        fieldMutasi.classList.add('hidden');
        successMessage.classList.add('hidden'); 
        form.classList.remove('hidden'); 
    });
});
