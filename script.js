document.addEventListener('DOMContentLoaded', function() {
    
    // --- FUNGSI BANTUAN ---
    function toProperCase(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    // --- DEKLARASI ELEMEN FORM ---
    const form = document.getElementById('suratForm');
    const jenisSurat = document.getElementById('jenisSurat');
    
    const fieldBebasTanggungan = document.getElementById('fieldBebasTanggungan');
    const fieldMutasi = document.getElementById('fieldMutasi');
    const fieldLulus = document.getElementById('fieldLulus'); 
    const fieldRekomendasi = document.getElementById('fieldRekomendasi'); 
    
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
    const fileIjazah = document.getElementById('fileIjazah'); 
    const tanggalMunaqosyah = document.getElementById('tanggalMunaqosyah'); 

    // --- LOGIKA TAB (FORM VS STATUS) ---
    const tabFormBtn = document.getElementById('tabFormBtn');
    const tabStatusBtn = document.getElementById('tabStatusBtn');
    const sectionForm = document.getElementById('sectionForm');
    const sectionStatus = document.getElementById('sectionStatus');

    if (tabFormBtn && tabStatusBtn) {
        tabFormBtn.addEventListener('click', function() {
            sectionForm.classList.remove('hidden');
            sectionStatus.classList.add('hidden');
            
            tabFormBtn.classList.add('text-green-700', 'border-green-700');
            tabFormBtn.classList.remove('text-gray-500', 'border-transparent');
            
            tabStatusBtn.classList.add('text-gray-500', 'border-transparent');
            tabStatusBtn.classList.remove('text-green-700', 'border-green-700');
        });

        tabStatusBtn.addEventListener('click', function() {
            sectionStatus.classList.remove('hidden');
            sectionForm.classList.add('hidden');
            
            tabStatusBtn.classList.add('text-green-700', 'border-green-700');
            tabStatusBtn.classList.remove('text-gray-500', 'border-transparent');
            
            tabFormBtn.classList.add('text-gray-500', 'border-transparent');
            tabFormBtn.classList.remove('text-green-700', 'border-green-700');
        });
    }

    // --- LOGIKA API WILAYAH ---
    if (selectProvinsi) {
        fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
            .then(response => response.json())
            .then(provinces => {
                provinces.forEach(province => {
                    const option = document.createElement('option');
                    option.value = province.id; 
                    option.dataset.name = toProperCase(province.name); 
                    option.textContent = toProperCase(province.name);
                    selectProvinsi.appendChild(option);
                });
            })
            .catch(error => console.error('Gagal memuat provinsi:', error));
    }

    if (selectProvinsi && selectKabupaten) {
        selectProvinsi.addEventListener('change', function() {
            selectKabupaten.innerHTML = '<option value="" disabled selected>Loading...</option>';
            selectKabupaten.disabled = true;
            
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
                        option.value = regency.id; 
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

    // --- LOGIKA MENAMPILKAN FORM DINAMIS ---
    if (jenisSurat) {
        jenisSurat.addEventListener('change', function() {
            if (fieldBebasTanggungan) fieldBebasTanggungan.classList.add('hidden');
            if (fieldMutasi) fieldMutasi.classList.add('hidden');
            if (fieldLulus) fieldLulus.classList.add('hidden');
            if (fieldRekomendasi) fieldRekomendasi.classList.add('hidden'); 
            
            if (fileBebas) fileBebas.required = false;
            if (fileIjazah) fileIjazah.required = false;

            if (this.value === 'Bebas Tanggungan') {
                if (fieldBebasTanggungan) fieldBebasTanggungan.classList.remove('hidden');
            } else if (this.value === 'Mutasi') {
                if (fieldMutasi) fieldMutasi.classList.remove('hidden');
                if (fileBebas) fileBebas.required = true; 
            } else if (this.value === 'Lulus') {
                if (fieldLulus) fieldLulus.classList.remove('hidden');
                if (fileIjazah) fileIjazah.required = true; 
            } else if (this.value === 'Rekomendasi') {
                if (fieldRekomendasi) fieldRekomendasi.classList.remove('hidden');
            }
        });
    }

    // --- LOGIKA PENGIRIMAN DATA FORM ---
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            
            btnSubmit.disabled = true;
            btnSubmit.classList.add('opacity-75', 'cursor-not-allowed');
            btnText.innerText = 'Mengirim... (Proses Upload)';
            btnSpinner.classList.remove('hidden');

            try {
                let alamatLengkap = "";
                if (jenisSurat.value === 'Mutasi') {
                    const namaProvinsi = selectProvinsi.options[selectProvinsi.selectedIndex]?.dataset?.name || "";
                    const namaKabupaten = selectKabupaten.options[selectKabupaten.selectedIndex]?.dataset?.name || "";
                    const namaKecamatan = selectKecamatan ? selectKecamatan.value : "";
                    const detailAlamat = document.getElementById('detailAlamat') ? document.getElementById('detailAlamat').value : "";
                    
                    alamatLengkap = `${detailAlamat}, Kec. ${namaKecamatan}, ${namaKabupaten}, ${namaProvinsi}`;
                }

                let ktmObj = { base64: "", name: "", mime: "" };
                let bebasObj = { base64: "", name: "", mime: "" };
                let ijazahObj = { base64: "", name: "", mime: "" };

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

                if (fileIjazah && fileIjazah.files[0] && jenisSurat.value === 'Lulus') {
                    ijazahObj.base64 = await getBase64(fileIjazah.files[0]);
                    ijazahObj.name = fileIjazah.files[0].name;
                    ijazahObj.mime = fileIjazah.files[0].type;
                }

                const formData = {
                    nama: document.getElementById('nama') ? document.getElementById('nama').value : "",
                    nim: document.getElementById('nim') ? document.getElementById('nim').value : "",
                    email: document.getElementById('email') ? document.getElementById('email').value : "",
                    tempat_lahir: document.getElementById('tempatLahir') ? document.getElementById('tempatLahir').value : "",
                    tanggal_lahir: document.getElementById('tanggalLahir') ? document.getElementById('tanggalLahir').value : "",
                    prodi: document.getElementById('prodi') ? document.getElementById('prodi').value : "",
                    jenis_surat: jenisSurat.value,
                    
                    tujuan_bebas: document.getElementById('tujuanBebas') ? document.getElementById('tujuanBebas').value : "",
                    kampus_tujuan: document.getElementById('kampusTujuan') ? document.getElementById('kampusTujuan').value : "",
                    prodi_tujuan: document.getElementById('prodiTujuan') ? document.getElementById('prodiTujuan').value : "",
                    alasan_mutasi: document.getElementById('alasanMutasi') ? document.getElementById('alasanMutasi').value : "",
                    
                    tahun_masuk: "", 
                    alamat_tujuan: alamatLengkap,
                    tanggal_munaqosyah: document.getElementById('tanggalMunaqosyah') ? document.getElementById('tanggalMunaqosyah').value : "",
                    
                    nama_kegiatan: document.getElementById('namaKegiatan') ? document.getElementById('namaKegiatan').value : "",
                    lokasi_kegiatan: document.getElementById('lokasiKegiatan') ? document.getElementById('lokasiKegiatan').value : "",
                    tgl_mulai_kegiatan: document.getElementById('tglMulaiKegiatan') ? document.getElementById('tglMulaiKegiatan').value : "",
                    tgl_selesai_kegiatan: document.getElementById('tglSelesaiKegiatan') ? document.getElementById('tglSelesaiKegiatan').value : "",

                    file_ktm: ktmObj,
                    file_bebas: bebasObj,
                    file_ijazah: ijazahObj
                };

                // ===== GANTI DENGAN URL APPS SCRIPT ANDA =====
                const API_URL = 'https://script.google.com/macros/s/AKfycbwDh5GKLgWZl6Re5fDaWkyz3BJW-KQtvRh0QD3iRsk_J2yVxZRwAaOHpXpJi3ZbLBDmlg/exec';

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.status === 'success') {
                    form.classList.add('hidden'); 
                    if (successMessage) successMessage.classList.remove('hidden'); 
                } else {
                    alert('Terjadi kesalahan sistem di server: ' + data.message);
                }

            } catch (error) {
                alert('Gagal mengirim permohonan. Mohon periksa kembali koneksi internet Anda atau pastikan ukuran file tidak melebihi batas wajar.');
                console.error('Pesan Error:', error);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.classList.remove('opacity-75', 'cursor-not-allowed');
                btnText.innerText = 'Kirim Permohonan';
                btnSpinner.classList.add('hidden');
            }
        });
    }

    // --- LOGIKA TOMBOL RESET (AJUKAN SURAT LAINNYA) ---
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            if (form) form.reset(); 
            if (fieldBebasTanggungan) fieldBebasTanggungan.classList.add('hidden'); 
            if (fieldMutasi) fieldMutasi.classList.add('hidden');
            if (fieldLulus) fieldLulus.classList.add('hidden');
            if (fieldRekomendasi) fieldRekomendasi.classList.add('hidden'); 
            
            if (successMessage) successMessage.classList.add('hidden'); 
            if (form) form.classList.remove('hidden'); 
            
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
    }

    // --- LOGIKA PENCARIAN STATUS ---
    const btnCariStatus = document.getElementById('btnCariStatus');
    if (btnCariStatus) {
        btnCariStatus.addEventListener('click', async function() {
            const nim = document.getElementById('inputNIMStatus').value.trim();
            const tabelBody = document.getElementById('tabelBodyStatus');
            const hasilContainer = document.getElementById('hasilContainerStatus');
            const pesanKosong = document.getElementById('pesanKosongStatus');

            if (!nim) {
                alert('Silakan masukkan NIM terlebih dahulu!');
                return;
            }

            btnCariStatus.innerText = 'Mencari...';
            btnCariStatus.disabled = true;

            // ===== GANTI DENGAN URL APPS SCRIPT ANDA =====
            const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwDh5GKLgWZl6Re5fDaWkyz3BJW-KQtvRh0QD3iRsk_J2yVxZRwAaOHpXpJi3ZbLBDmlg/exec';

            try {
                const response = await fetch(`${WEB_APP_URL}?nim=${nim}`);
                const data = await response.json();

                tabelBody.innerHTML = '';
                if (hasilContainer) hasilContainer.classList.add('hidden');
                if (pesanKosong) pesanKosong.classList.add('hidden');

                if (data.length > 0) {
                    if (hasilContainer) hasilContainer.classList.remove('hidden');
                    data.forEach(item => {
                        let badgeColor = "bg-yellow-100 text-yellow-800";
                        if (item.status.includes("Selesai")) badgeColor = "bg-green-100 text-green-800";
                        else if (item.status.includes("Memproses")) badgeColor = "bg-blue-100 text-blue-800";

                        const row = `
                            <tr class="hover:bg-gray-50 border-b border-gray-100">
                                <td class="p-3 text-gray-600">${item.tanggal}</td>
                                <td class="p-3 font-medium text-gray-800">Surat ${item.jenisSurat}</td>
                                <td class="p-3 text-gray-600">${item.nomorSurat}</td>
                                <td class="p-3">
                                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}">
                                        ${item.status}
                                    </span>
                                </td>
                            </tr>
                        `;
                        tabelBody.innerHTML += row;
                    });
                } else {
                    if (pesanKosong) pesanKosong.classList.remove('hidden');
                }
            } catch (error) {
                alert('Gagal mengambil data dari server. Periksa koneksi internet Anda.');
                console.error(error);
            } finally {
                btnCariStatus.innerText = 'Cari';
                btnCariStatus.disabled = false;
            }
        });
    }

}); // <--- INI ADALAH PENUTUP DOMContentLoaded YANG SANGAT PENTING
