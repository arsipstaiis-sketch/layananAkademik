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
    
    // Elemen Dinamis Baru
    const inputProdi = document.getElementById('prodi');
    const inputSanah = document.getElementById('sanah');
    const wrapperSanah = document.getElementById('wrapper_sanah');
    const inputSemester = document.getElementById('semester');
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


    // =======================================================
    // FITUR DINAMIS: PRODI -> SANAH -> JENIS SURAT & SEMESTER
    // =======================================================

    const semuaJenisSurat = [
        "Surat Keterangan Aktif",
        "Surat Keterangan Lulus",
        "Surat Bebas Tanggungan",
        "Surat Rekomendasi",
        "Surat Keterangan Mutasi"
    ];

    const suratTamhidi = [
        "Surat Keterangan Aktif",
        "Surat Bebas Tanggungan",
        "Surat Rekomendasi"
    ];

    function cekStatusSemesterWaktu() {
        const bulanSekarang = new Date().getMonth() + 1; // Januari = 1
        return (bulanSekarang >= 2 && bulanSekarang <= 7) ? "Genap" : "Ganjil";
    }

    function tanganiPerubahanProdi() {
        if (!inputProdi || !jenisSurat || !inputSemester) return;
        const prodiTerpilih = inputProdi.value;

        // --- A. Atur Jenis Surat ---
        const pilihanSuratSaatIni = jenisSurat.value;
        jenisSurat.innerHTML = '<option value="" disabled selected>-- Pilih Jenis Surat --</option>';
        
        let opsiSurat = (prodiTerpilih === "Program Tamhidi") ? suratTamhidi : semuaJenisSurat;
        opsiSurat.forEach(surat => {
            let opt = document.createElement('option');
            opt.value = surat; 
            opt.innerHTML = surat;
            jenisSurat.appendChild(opt);
        });
        
        if (opsiSurat.includes(pilihanSuratSaatIni)) {
            jenisSurat.value = pilihanSuratSaatIni;
        }
        
        // Pemicu event otomatis agar kolom dinamis menyesuaikan
        jenisSurat.dispatchEvent(new Event('change'));

        // --- B. Atur Visibilitas Kolom Sanah ---
        if (prodiTerpilih === "Program Tamhidi") {
            if (wrapperSanah) wrapperSanah.classList.add('hidden');
            if (inputSanah) {
                inputSanah.required = false;
                inputSanah.value = ""; 
            }
        } else {
            if (wrapperSanah) wrapperSanah.classList.remove('hidden');
            if (inputSanah) inputSanah.required = true;
        }

        // --- C. Hitung Ulang Semester ---
        hitungSemesterAkhir();
    }

    function hitungSemesterAkhir() {
        if (!inputSemester || !inputProdi) return;
        const prodiTerpilih = inputProdi.value;
        const waktuSemester = cekStatusSemesterWaktu(); 
        
        inputSemester.innerHTML = '<option value="" disabled selected>-</option>';
        let hasilSemester = "";

        if (prodiTerpilih === "Program Tamhidi") {
            hasilSemester = waktuSemester; 
        } 
        else if (prodiTerpilih === "Pendidikan Bahasa Arab" || prodiTerpilih === "Hukum Keluarga Islam") {
            const sanahTerpilih = inputSanah ? inputSanah.value : "";
            
            if (sanahTerpilih) {
                if (waktuSemester === "Ganjil") {
                    if (sanahTerpilih === "Sanah Ula") hasilSemester = "I (Satu)";
                    else if (sanahTerpilih === "Sanah Tsaniyah") hasilSemester = "III (Tiga)";
                    else if (sanahTerpilih === "Sanah Tsalisah") hasilSemester = "V (Lima)";
                    else if (sanahTerpilih === "Sanah Robiah") hasilSemester = "VII (Tujuh)";
                    else if (sanahTerpilih === "Menunggu Munaqosyah") hasilSemester = "IX (Sembilan)";
                } else { // Genap
                    if (sanahTerpilih === "Sanah Ula") hasilSemester = "II (Dua)";
                    else if (sanahTerpilih === "Sanah Tsaniyah") hasilSemester = "IV (Empat)";
                    else if (sanahTerpilih === "Sanah Tsalisah") hasilSemester = "VI (Enam)";
                    else if (sanahTerpilih === "Sanah Robiah") hasilSemester = "VIII (Delapan)";
                    else if (sanahTerpilih === "Menunggu Munaqosyah") hasilSemester = "X (Sepuluh)";
                }
            }
        }

        if (hasilSemester) {
            let opt = document.createElement('option');
            opt.value = hasilSemester;
            opt.innerHTML = hasilSemester;
            opt.selected = true;
            inputSemester.appendChild(opt);
        }
    }

    // Pasang Event Listener ke elemen Prodi dan Sanah
    if (inputProdi) inputProdi.addEventListener('change', tanganiPerubahanProdi);
    if (inputSanah) inputSanah.addEventListener('change', hitungSemesterAkhir);


    // --- LOGIKA TAB (FORM VS STATUS) ---
    // Diperbarui: Menggunakan CSS Native (.active dan .hidden)
    const tabFormBtn = document.getElementById('tabFormBtn');
    const tabStatusBtn = document.getElementById('tabStatusBtn');
    const sectionForm = document.getElementById('sectionForm');
    const sectionStatus = document.getElementById('sectionStatus');

    if (tabFormBtn && tabStatusBtn) {
        tabFormBtn.addEventListener('click', function() {
            sectionForm.classList.remove('hidden');
            sectionStatus.classList.add('hidden');
            tabFormBtn.classList.add('active');
            tabStatusBtn.classList.remove('active');
        });

        tabStatusBtn.addEventListener('click', function() {
            sectionStatus.classList.remove('hidden');
            sectionForm.classList.add('hidden');
            tabStatusBtn.classList.add('active');
            tabFormBtn.classList.remove('active');
        });
    }

    // --- LOGIKA API WILAYAH ---
    // Diperbarui: Hapus class Tailwind, serahkan styling ke CSS form-control:disabled
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

            if (this.value === 'Surat Bebas Tanggungan' || this.value === 'Bebas Tanggungan') {
                if (fieldBebasTanggungan) fieldBebasTanggungan.classList.remove('hidden');
            } else if (this.value === 'Surat Keterangan Mutasi' || this.value === 'Mutasi') {
                if (fieldMutasi) fieldMutasi.classList.remove('hidden');
                if (fileBebas) fileBebas.required = true; 
            } else if (this.value === 'Surat Keterangan Lulus' || this.value === 'Lulus') {
                if (fieldLulus) fieldLulus.classList.remove('hidden');
                if (fileIjazah) fileIjazah.required = true; 
            } else if (this.value === 'Surat Rekomendasi' || this.value === 'Rekomendasi') {
                if (fieldRekomendasi) fieldRekomendasi.classList.remove('hidden');
            }
        });
    }

    // --- LOGIKA PENGIRIMAN DATA FORM ---
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            
            btnSubmit.disabled = true;
            btnText.innerText = 'Mengirim... (Proses Upload)';
            btnSpinner.classList.remove('hidden');

            try {
                let alamatLengkap = "";
                if (jenisSurat.value === 'Surat Keterangan Mutasi' || jenisSurat.value === 'Mutasi') {
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

                if (fileBebas && fileBebas.files[0] && (jenisSurat.value === 'Surat Keterangan Mutasi' || jenisSurat.value === 'Mutasi')) {
                    bebasObj.base64 = await getBase64(fileBebas.files[0]);
                    bebasObj.name = fileBebas.files[0].name;
                    bebasObj.mime = fileBebas.files[0].type;
                }

                if (fileIjazah && fileIjazah.files[0] && (jenisSurat.value === 'Surat Keterangan Lulus' || jenisSurat.value === 'Lulus')) {
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
                    prodi: inputProdi ? inputProdi.value : "",
                    jenis_surat: jenisSurat.value,
                    
                    sanah: inputSanah ? inputSanah.value : "",
                    semester: inputSemester ? inputSemester.value : "",
                    
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

                const API_URL = 'https://script.google.com/macros/s/AKfycbzowQaUWWhMgiLoQl6VTAjJERKos1YKzjk_VCU4ih2H69G_YAfktf5P-KWJrvymmkXeQQ/exec';

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
                btnText.innerText = 'Kirim Permohonan Surat';
                btnSpinner.classList.add('hidden');
            }
        });
    }

    // --- LOGIKA TOMBOL RESET (AJUKAN SURAT LAINNYA) ---
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            if (form) form.reset(); 
            
            setTimeout(() => {
                if(inputProdi) tanganiPerubahanProdi();
            }, 10);

            if (fieldBebasTanggungan) fieldBebasTanggungan.classList.add('hidden'); 
            if (fieldMutasi) fieldMutasi.classList.add('hidden');
            if (fieldLulus) fieldLulus.classList.add('hidden');
            if (fieldRekomendasi) fieldRekomendasi.classList.add('hidden'); 
            
            if (successMessage) successMessage.classList.add('hidden'); 
            if (form) form.classList.remove('hidden'); 
            
            if (selectKabupaten) {
                selectKabupaten.innerHTML = '<option value="" disabled selected>-- Kab/Kota --</option>';
                selectKabupaten.disabled = true;
            }
            if (selectKecamatan) {
                selectKecamatan.innerHTML = '<option value="" disabled selected>-- Kecamatan --</option>';
                selectKecamatan.disabled = true;
            }
        });
    }

    // --- LOGIKA PENCARIAN STATUS ---
    // Diperbarui: Merakit HTML Tabel menggunakan struktur CSS Native
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

            const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzowQaUWWhMgiLoQl6VTAjJERKos1YKzjk_VCU4ih2H69G_YAfktf5P-KWJrvymmkXeQQ/exec';

            try {
                const response = await fetch(`${WEB_APP_URL}?nim=${nim}`);
                const data = await response.json();

                tabelBody.innerHTML = '';
                if (hasilContainer) hasilContainer.classList.add('hidden');
                if (pesanKosong) pesanKosong.classList.add('hidden');

                if (data.length > 0) {
                    if (hasilContainer) hasilContainer.classList.remove('hidden');
                    data.forEach(item => {
                        
                        // Menyesuaikan Badge Status ke Native CSS
                        let badgeClass = "badge-proses";
                        if (item.status.includes("Selesai")) badgeClass = "badge-selesai";
                        else if (item.status.includes("Ditolak")) badgeClass = "badge-tolak";

                        let statusHTML = `<span class="badge ${badgeClass}">${item.status}</span>`;

                        if (item.status.includes("Ditolak")) {
                            let alasan = item.alasanPenolakan ? item.alasanPenolakan : "Tidak memenuhi syarat administrasi.";
                            statusHTML += `
                                <div class="alasan-tolak">
                                    <strong style="display:block; margin-bottom:2px;">Catatan Admin:</strong>
                                    <span style="font-style:italic">"${alasan}"</span>
                                </div>
                            `;
                        }

                        // Merakit Row Tabel dengan Native CSS
                        const row = `
                            <tr>
                                <td>${item.tanggal}</td>
                                <td><b>Surat ${item.jenisSurat}</b><br><span style="font-size:11px;color:var(--text-muted);">${item.nomorSurat || '-'}</span></td>
                                <td>${statusHTML}</td>
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
                btnCariStatus.innerText = 'Cari Data';
                btnCariStatus.disabled = false;
            }
        });
    }
});
