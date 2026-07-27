// script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Fungsi untuk mengubah UPPERCASE menjadi Proper Case (Contoh: JAWA TENGAH -> Jawa Tengah)
    function toProperCase(str) {
        return str.replace(
            /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }

    const jenisSurat = document.getElementById('jenisSurat');
    const fieldBebasTanggungan = document.getElementById('fieldBebasTanggungan');
    const fieldMutasi = document.getElementById('fieldMutasi');
    const form = document.getElementById('suratForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const successMessage = document.getElementById('successMessage');
    const btnReset = document.getElementById('btnReset');
    const selectProvinsi = document.getElementById('provinsiTujuan');
    const selectKabupaten = document.getElementById('kabupatenTujuan');
    const selectKecamatan = document.getElementById('kecamatanTujuan');
    const fileKTM = document.getElementById('fileKTM');
    const fileBebas = document.getElementById('fileBebas');

    // Fungsi konversi file ke Base64
    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    // 1. Muat Provinsi (API Wilayah)
    if (selectProvinsi) {
        fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
            .then(response => response.json())
            .then(provinces => {
                provinces.forEach(province => {
                    const option = document.createElement('option');
                    option.value = province.id; // ID untuk pemanggilan kabupaten
                    option.dataset.name = toProperCase(province.name); 
                    option.textContent = toProperCase(province.name);
                    selectProvinsi.appendChild(option);
                });
            })
            .catch(error => console.error('Gagal memuat provinsi:', error));
    }

    // 2. Muat Kabupaten saat Provinsi dipilih
    if (selectProvinsi && selectKabupaten) {
        selectProvinsi.addEventListener('change', function() {
            selectKabupaten.innerHTML = '<option value="" disabled selected>Loading...</option>';
            selectKabupaten.disabled = true;
            
            // Reset Kecamatan juga
            if(selectKecamatan) {
                selectKecamatan.innerHTML = '<option value="" disabled selected>-- Kecamatan --</option>';
                selectKecamatan.disabled = true;
                selectKecamatan.classList.add('bg-gray-100', 'cursor-not-allowed');
                selectKecamatan.classList.remove('bg-white');
            }
            
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${this.value}.json`)
                .then(response => response.json())
                .then(regencies => {
                    selectKabupaten.innerHTML = '<option value="" disabled selected>-- Kab/Kota --</option>';
                    regencies.forEach(regency => {
                        const option = document.createElement('option');
                        option.value = regency.id; // ID untuk pemanggilan kecamatan
                        option.dataset.name = toProperCase(regency.name);
                        option.textContent = toProperCase(regency.name);
                        selectKabupaten.appendChild(option);
                    });
                    selectKabupaten.disabled = false;
                    selectKabupaten.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    selectKabupaten.classList.add('bg-white');
                })
                .catch(error => console.error('Gagal memuat kabupaten:', error));
        });
    }

    // 3. Muat Kecamatan saat Kabupaten dipilih
    if (selectKabupaten && selectKecamatan) {
        selectKabupaten.addEventListener('change', function() {
            selectKecamatan.innerHTML = '<option value="" disabled selected>Loading...</option>';
            selectKecamatan.disabled = true;
            
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${this.value}.json`)
                .then(response => response.json())
                .then(districts => {
                    selectKecamatan.innerHTML = '<option value="" disabled selected>-- Kecamatan --</option>';
                    districts.forEach(district => {
                        const option = document.createElement('option');
                        // Pada tahap kecamatan, kita jadikan nama sebagai value akhir
                        option.value = toProperCase(district.name); 
                        option.textContent = toProperCase(district.name);
                        selectKecamatan.appendChild(option);
                    });
                    selectKecamatan.disabled = false;
                    selectKecamatan.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    selectKecamatan.classList.add('bg-white');
                })
                .catch(error => console.error('Gagal memuat kecamatan:', error));
        });
    }

    jenisSurat.addEventListener('change', function() {
        fieldBebasTanggungan.classList.add('hidden');
        fieldMutasi.classList.add('hidden');
        if (fileBebas) fileBebas.required = false; // Reset required

        if (this.value === 'Bebas Tanggungan') {
            fieldBebasTanggungan.classList.remove('hidden');
        } else if (this.value === 'Mutasi') {
            fieldMutasi.classList.remove('hidden');
            if (fileBebas) fileBebas.required = true; // Wajib upload jika mutasi
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        
        // Ubah tombol jadi loading
        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
        btnText.innerText = 'Mengirim... (Proses Upload)';
        btnSpinner.classList.remove('hidden');

        try {
            // 1. Merakit Alamat Lengkap (Khusus Mutasi)
            let alamatLengkap = "";
            if (jenisSurat.value === 'Mutasi') {
                const namaProvinsi = selectProvinsi.options[selectProvinsi.selectedIndex]?.dataset?.name || "";
                const namaKabupaten = selectKabupaten.options[selectKabupaten.selectedIndex]?.dataset?.name || "";
                const namaKecamatan = selectKecamatan.value || "";
                const detailAlamat = document.getElementById('detailAlamat') ? document.getElementById('detailAlamat').value : "";
                
                alamatLengkap = `${detailAlamat}, Kec. ${namaKecamatan}, ${namaKabupaten}, ${namaProvinsi}`;
            }

            // 2. Mengubah File Fisik menjadi Base64 (Teks)
            let ktmObj = { base64: "", name: "", mime: "" };
            let bebasObj = { base64: "", name: "", mime: "" };

            if (fileKTM && fileKTM.files[0]) {
                ktmObj.base64 = await getBase64(fileKTM.files[0]);
                ktmObj.name = fileKTM.files[0].name;
                ktmObj.mime = fileKTM.files[0].type;
            }

            if (fileBebas && fileBebas.files[0] && jenisSurat.value === 'Mutasi') {
                bebasObj.base64 = await getBase64(fileBebas.files[0]);
                bebasObj.name = fileBebas.files[0].name;
                bebasObj.mime = fileBebas.files[0].type;
            }

            // 3. Menyatukan Semua Data Form
            const formData = {
                nama: document.getElementById('nama').value,
                nim: document.getElementById('nim').value,
                email: document.getElementById('email').value,
                tempat_lahir: document.getElementById('tempatLahir').value,
                tanggal_lahir: document.getElementById('tanggalLahir').value,
                prodi: document.getElementById('prodi').value,
                jenis_surat: jenisSurat.value,
                
                tujuan_bebas: document.getElementById('tujuanBebas') ? document.getElementById('tujuanBebas').value : "",
                kampus_tujuan: document.getElementById('kampusTujuan') ? document.getElementById('kampusTujuan').value : "",
                prodi_tujuan: document.getElementById('prodiTujuan') ? document.getElementById('prodiTujuan').value : "",
                alasan_mutasi: document.getElementById('alasanMutasi') ? document.getElementById('alasanMutasi').value : "",
                
                tahun_masuk: "", 
                alamat_tujuan: alamatLengkap,
                
                file_ktm: ktmObj,
                file_bebas: bebasObj
            };

            // PASTIKAN MENGGANTI URL API INI
            const API_URL = 'https://script.google.com/macros/s/AKfycbwDh5GKLgWZl6Re5fDaWkyz3BJW-KQtvRh0QD3iRsk_J2yVxZRwAaOHpXpJi3ZbLBDmlg/exec';

            // 4. Mengirim Data ke Google Apps Script
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(formData)
            });

            // 5. Menerima Jawaban dari Server
            const data = await response.json();

            if (data.status === 'success') {
                form.classList.add('hidden'); 
                successMessage.classList.remove('hidden'); 
            } else {
                alert('Terjadi kesalahan sistem: ' + data.message);
            }

        } catch (error) {
            // BLOK CATCH DITEMPATKAN DI SINI: Akan menangkap error jika file gagal dibaca atau internet terputus
            alert('Gagal mengirim data. Pastikan koneksi internet stabil atau ukuran file tidak terlalu besar.');
            console.error('Error lengkap:', error);
            
        } finally {
            // BLOK FINALLY: Akan selalu dijalankan di akhir untuk mereset tampilan tombol
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
            btnText.innerText = 'Kirim Permohonan';
            btnSpinner.classList.add('hidden');
        }
    });

    btnReset.addEventListener('click', function() {
        form.reset(); 
        fieldBebasTanggungan.classList.add('hidden'); 
        fieldMutasi.classList.add('hidden');
        successMessage.classList.add('hidden'); 
        form.classList.remove('hidden'); 
        
        // Reset wilayah bertingkat
        if (selectKabupaten) {
            selectKabupaten.innerHTML = '<option value="" disabled selected>-- Kab/Kota --</option>';
            selectKabupaten.disabled = true;
            selectKabupaten.classList.add('bg-gray-100', 'cursor-not-allowed');
            selectKabupaten.classList.remove('bg-white');
        }
        if (selectKecamatan) {
            selectKecamatan.innerHTML = '<option value="" disabled selected>-- Kecamatan --</option>';
            selectKecamatan.disabled = true;
            selectKecamatan.classList.add('bg-gray-100', 'cursor-not-allowed');
            selectKecamatan.classList.remove('bg-white');
        }
    });
});
