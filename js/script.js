document.addEventListener('DOMContentLoaded', async function() {
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzowQaUWWhMgiLoQl6VTAjJERKos1YKzjk_VCU4ih2H69G_YAfktf5P-KWJrvymmkXeQQ/exec';

    // --- CEK STATUS MAINTENANCE DARI GOOGLE SHEETS ---
    try {
        const response = await fetch(`${WEB_APP_URL}?action=cekMaintenance`);
        const data = await response.json();
        
        if (data.maintenance === "ON") {
            // Jika ON, tampilkan penutup layar penuh dan hentikan skrip lainnya
            document.getElementById('maintenanceOverlay').style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Kunci scroll layar
            return; // Hentikan eksekusi form
        }
    } catch (e) {
        console.error("Gagal mengecek status maintenance.");
    }
    // --- FUNGSI BANTUAN ---
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

    // --- FITUR AUTO-FILL NAMA BERDASARKAN NIM ---
    const inputNim = document.getElementById('nim');
    const inputNama = document.getElementById('nama');
    const nimLoading = document.getElementById('nimLoading');

    if (inputNim && inputNama) {
        // Event 'blur' mendeteksi ketika pengguna selesai mengetik NIM dan beralih ke kolom lain
        inputNim.addEventListener('blur', async function() {
            const nimVal = this.value.trim();
            
            if (!nimVal) {
                inputNama.value = "";
                inputNama.classList.remove('text-rose-600');
                return;
            }

            // Memunculkan status loading
            inputNama.value = "Mencari data mahasiswa...";
            inputNama.classList.remove('text-rose-600');
            if (nimLoading) nimLoading.classList.remove('hidden');

            try {
                // Ganti dengan URL eksekusi Apps Script Anda
                const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzowQaUWWhMgiLoQl6VTAjJERKos1YKzjk_VCU4ih2H69G_YAfktf5P-KWJrvymmkXeQQ/exec';
                const response = await fetch(`${WEB_APP_URL}?action=getNamaByNIM&nim=${encodeURIComponent(nimVal)}`);
                const data = await response.json();

                if (data.status === 'success') {
                    // Jika sukses, masukkan nama
                    inputNama.value = data.nama;
                    inputNama.classList.remove('text-rose-600');
                } else if (data.status === 'not_found') {
                    // Jika NIM tidak ada di DatabaseMahasiswa
                    inputNama.value = "NIM tidak ditemukan. Periksa kembali NIM Anda.";
                    inputNama.classList.add('text-rose-600');
                } else {
                    inputNama.value = "Gagal: " + (data.message || "Aksi tidak dikenali server.");
                    inputNama.classList.add('text-rose-600');
                }
            } catch (error) {
                inputNama.value = "Koneksi terputus. Pastikan internet Anda stabil.";
                inputNama.classList.add('text-rose-600');
            } finally {
                // Matikan animasi loading
                if (nimLoading) nimLoading.classList.add('hidden');
            }
        });
    }

    // --- FITUR DINAMIS: PRODI -> SANAH -> JENIS SURAT & SEMESTER ---
    const semuaJenisSurat = [
        "Keterangan Aktif Kuliah",
        "Keterangan Lulus",
        "Bebas Tanggungan",
        "Rekomendasi",
        "Keterangan Mutasi"
    ];

    const suratTamhidi = [
        "Keterangan Aktif Kuliah",
        "Bebas Tanggungan",
        "Rekomendasi"
    ];

    function cekStatusSemesterWaktu() {
        const bulanSekarang = new Date().getMonth() + 1;
        return (bulanSekarang >= 2 && bulanSekarang <= 8) ? "Genap" : "Ganjil";
    }

    function tanganiPerubahanProdi() {
        if (!inputProdi || !jenisSurat || !inputSemester) return;
        const prodiTerpilih = inputProdi.value;

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
        
        jenisSurat.dispatchEvent(new Event('change'));

        if (prodiTerpilih === "Program Tamhidi") {
            if (wrapperSanah) wrapperSanah.style.display = 'none';
            if (inputSanah) {
                inputSanah.required = false;
                inputSanah.value = ""; 
            }
        } else {
            if (wrapperSanah) wrapperSanah.style.display = 'block';
            if (inputSanah) inputSanah.required = true;
        }

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

    if (inputProdi) inputProdi.addEventListener('change', tanganiPerubahanProdi);
    if (inputSanah) inputSanah.addEventListener('change', hitungSemesterAkhir);

    // --- LOGIKA TAB (FORM VS STATUS) ---
    const tabFormBtn = document.getElementById('tabFormBtn');
    const tabStatusBtn = document.getElementById('tabStatusBtn');
    const sectionForm = document.getElementById('sectionForm');
    const sectionStatus = document.getElementById('sectionStatus');

    if (tabFormBtn && tabStatusBtn) {
        tabFormBtn.addEventListener('click', function() {
            sectionForm.style.display = 'block';
            sectionStatus.style.display = 'none';
            tabFormBtn.classList.add('active');
            tabStatusBtn.classList.remove('active');
        });

        tabStatusBtn.addEventListener('click', function() {
            sectionStatus.style.display = 'block';
            sectionForm.style.display = 'none';
            tabStatusBtn.classList.add('active');
            tabFormBtn.classList.remove('active');
        });
    }

    // --- LOGIKA API WILAYAH (EMSIFA) ---
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
                });
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
                });
        });
    }

    // --- LOGIKA MENAMPILKAN FORM DINAMIS ---
    if (jenisSurat) {
        jenisSurat.addEventListener('change', function() {
            if (fieldBebasTanggungan) fieldBebasTanggungan.style.display = 'none';
            if (fieldMutasi) fieldMutasi.style.display = 'none';
            if (fieldLulus) fieldLulus.style.display = 'none';
            if (fieldRekomendasi) fieldRekomendasi.style.display = 'none'; 
            
            if (fileBebas) fileBebas.required = false;
            if (fileIjazah) fileIjazah.required = false;

            const val = this.value;

            if (val.includes('Bebas Tanggungan')) {
                if (fieldBebasTanggungan) fieldBebasTanggungan.style.display = 'block';
            } else if (val.includes('Mutasi')) {
                if (fieldMutasi) fieldMutasi.style.display = 'grid';
                if (fileBebas) fileBebas.required = true; 
            } else if (val.includes('Lulus')) {
                if (fieldLulus) fieldLulus.style.display = 'grid';
                if (fileIjazah) fileIjazah.required = true; 
            } else if (val.includes('Rekomendasi')) {
                if (fieldRekomendasi) fieldRekomendasi.style.display = 'grid';
            }
        });
    }

    // --- LOGIKA PENGIRIMAN DATA FORM ---
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            
            btnSubmit.disabled = true;
            btnText.innerText = 'Mengirim... (Proses Upload)';
            if (btnSpinner) btnSpinner.style.display = 'inline-block';

            try {
                let alamatLengkap = "";
                if (jenisSurat.value.includes('Mutasi')) {
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

                if (fileBebas && fileBebas.files[0] && jenisSurat.value.includes('Mutasi')) {
                    bebasObj.base64 = await getBase64(fileBebas.files[0]);
                    bebasObj.name = fileBebas.files[0].name;
                    bebasObj.mime = fileBebas.files[0].type;
                }

                if (fileIjazah && fileIjazah.files[0] && jenisSurat.value.includes('Lulus')) {
                    ijazahObj.base64 = await getBase64(fileIjazah.files[0]);
                    ijazahObj.name = fileIjazah.files[0].name;
                    ijazahObj.mime = fileIjazah.files[0].type;
                }

                const nimValue = document.getElementById('nim') ? document.getElementById('nim').value : "";

                const formData = {
                    nama: document.getElementById('nama') ? document.getElementById('nama').value : "",
                    nim: nimValue,
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
                    alert("Permohonan Berhasil! Anda akan dialihkan ke halaman Cek Status.");
                    
                    form.reset();
                    if (typeof tanganiPerubahanProdi === 'function') tanganiPerubahanProdi();
                    
                    if (sectionForm && sectionStatus) {
                        sectionForm.style.display = 'none';
                        sectionStatus.style.display = 'block';
                    }
                    if (tabFormBtn && tabStatusBtn) {
                        tabFormBtn.classList.remove('active');
                        tabStatusBtn.classList.add('active');
                    }
                    
                    const inputNIMStatus = document.getElementById('inputNIMStatus');
                    const btnCariStatus = document.getElementById('btnCariStatus');
                    
                    if (inputNIMStatus && btnCariStatus && nimValue) {
                        inputNIMStatus.value = nimValue;
                        setTimeout(() => {
                            btnCariStatus.click();
                        }, 300);
                    }
                } else if (data.status === 'maintenance') {
                    // BLOK KHUSUS MAINTENANCE
                    alert("⚙️ PEMBERITAHUAN:\n" + data.message);
                } else {
                    alert('Terjadi kesalahan sistem di server: ' + data.message);
                }

            } catch (error) {
                alert('Gagal mengirim permohonan. Mohon periksa kembali koneksi internet Anda atau pastikan ukuran file tidak melebihi batas wajar.');
                console.error('Pesan Error:', error);
            } finally {
                btnSubmit.disabled = false;
                btnText.innerText = 'Kirim Permohonan';
                if (btnSpinner) btnSpinner.style.display = 'none';
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

            if (fieldBebasTanggungan) fieldBebasTanggungan.style.display = 'none'; 
            if (fieldMutasi) fieldMutasi.style.display = 'none';
            if (fieldLulus) fieldLulus.style.display = 'none';
            if (fieldRekomendasi) fieldRekomendasi.style.display = 'none'; 
            
            if (successMessage) successMessage.style.display = 'none'; 
            if (form) form.style.display = 'block'; 
            
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
                
                if (hasilContainer) { hasilContainer.classList.remove('hidden'); hasilContainer.style.display = 'none'; }
                if (pesanKosong) { pesanKosong.classList.remove('hidden'); pesanKosong.style.display = 'none'; }

                if (data.length > 0) {
                    if (hasilContainer) hasilContainer.style.display = 'block';
                    data.forEach(item => {
                        let statusBadge = "";
                        let statusText = item.status.toLowerCase();
                        let alasanHTML = "";

                        if (statusText.includes("sudah dikirim") || statusText.includes("selesai")) {
                            statusBadge = `<span class="inline-flex flex-col items-center justify-center px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 leading-tight min-w-[95px]">SELESAI<span class="text-[8.5px] font-normal text-emerald-600 normal-case mt-0.5">(Email Terkirim)</span></span>`;
                        } else if (statusText.includes("menunggu dikirim") || statusText.includes("disetujui")) {
                            statusBadge = `<span class="inline-flex flex-col items-center justify-center px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100 leading-tight min-w-[95px]">DISETUJUI<span class="text-[8.5px] font-normal text-sky-600 normal-case mt-0.5">(Menunggu Kirim)</span></span>`;
                        } else if (statusText.includes("tolak")) {
                            statusBadge = `<span class="inline-flex items-center justify-center px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100 min-w-[95px]">DITOLAK</span>`;
                            
                            let alasan = item.alasanPenolakan ? item.alasanPenolakan : "Tidak memenuhi syarat administrasi.";
                            alasanHTML = `
                                <div class="text-[10px] text-gray-500 max-w-[160px] mx-auto text-center leading-tight bg-gray-50/80 p-2 rounded border border-gray-200 mt-2">
                                    <strong class="block text-rose-600 mb-0.5">Catatan Admin:</strong>
                                    <span class="italic">"${alasan}"</span>
                                </div>`;
                        } else {
                            statusBadge = `<span class="inline-flex flex-col items-center justify-center px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 leading-tight min-w-[95px]">PENDING<span class="text-[8.5px] font-normal text-amber-600 normal-case mt-0.5">Verifikasi</span></span>`;
                        }

                        let tanggalString = item.tanggal ? item.tanggal.trim() : "";
                        let tglArr = tanggalString.split(' '); 
                        let teksTanggal = tglArr[0] || "-";
                        let teksJam = tglArr.length > 1 ? tglArr.slice(1).join(' ') : ""; 
                        
                        const row = `
                            <tr class="hover:bg-gray-50/80 transition-colors group">
                                <td class="px-5 py-4 whitespace-nowrap text-center border-b border-gray-100">
                                    <div class="font-bold text-gray-800 text-[11px] md:text-xs">${teksTanggal}</div>
                                    <div class="text-[10px] text-gray-400 mt-1 flex items-center justify-center gap-1">
                                        <svg class="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        ${teksJam ? teksJam + ' WIB' : '-'}
                                    </div>
                                </td>
                                <td class="px-5 py-4 border-b border-gray-100">
                                    <div class="font-bold text-gray-900 text-xs md:text-sm whitespace-nowrap">Surat ${item.jenisSurat}</div>
                                    <div class="text-[10px] md:text-xs font-medium text-gray-500 mt-1 whitespace-nowrap">No: ${item.nomorSurat || '-'}</div>
                                </td>
                                <td class="px-5 py-4 border-b border-gray-100 align-middle text-center">
                                    ${statusBadge}
                                    ${alasanHTML}
                                </td>
                            </tr>
                        `;
                        tabelBody.innerHTML += row;
                    });
                } else {
                    if (pesanKosong) pesanKosong.style.display = 'block';
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

    // --- PANGGIL AUTO FORMAT DI SINI (Dalam DOMContentLoaded) ---
    aktifkanAutoFormat();

}); // <--- PENUTUP DOMContentLoaded

// ==========================================
// AUTO-FORMAT TULISAN (PROPER CASE & UPPER CASE)
// ==========================================

function toProperCase(str) {
    return str.toLowerCase().replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

function aktifkanAutoFormat() {
    const properCaseIds = [
        'editNama', 'editTempatLahir', 'editNamaKegiatan', 'editLokasiKegiatan', 'editAlamatTujuan',
        'nama', 'tempatLahir', 'namaKegiatan', 'lokasiKegiatan', 'detailAlamat'
    ];

    const upperCaseIds = [
        'editKampusTujuan', 'editProdiTujuan',
        'kampusTujuan', 'prodiTujuan'
    ];

    properCaseIds.forEach(id => {
        const inputEl = document.getElementById(id);
        if (inputEl) {
            inputEl.addEventListener('input', function() {
                let kursorStart = this.selectionStart;
                let kursorEnd = this.selectionEnd;
                this.value = toProperCase(this.value);
                this.setSelectionRange(kursorStart, kursorEnd);
            });
        }
    });

    upperCaseIds.forEach(id => {
        const inputEl = document.getElementById(id);
        if (inputEl) {
            inputEl.addEventListener('input', function() {
                let kursorStart = this.selectionStart;
                let kursorEnd = this.selectionEnd;
                this.value = this.value.toUpperCase();
                this.setSelectionRange(kursorStart, kursorEnd);
            });
        }
    });
}
