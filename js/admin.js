// ======= GANTI DENGAN URL DEPLOY APPS SCRIPT ANDA =======
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzowQaUWWhMgiLoQl6VTAjJERKos1YKzjk_VCU4ih2H69G_YAfktf5P-KWJrvymmkXeQQ/exec';

let globalData = []; 

// 1. KEAMANAN SISI SERVER
let adminPin = sessionStorage.getItem('adminPin') || prompt("Masukkan PIN Admin:");
if (!adminPin) {
    document.body.innerHTML = "<h2 style='text-align:center; margin-top:50px; color:#dc2626; font-family:sans-serif;'>Akses Dibatalkan.</h2>";
    throw new Error("Akses Dibatalkan");
}
sessionStorage.setItem('adminPin', adminPin);

let currentTab = 'baru'; 
let sortAscending = false;

// GANTI FUNGSI FETCH LAMA ANDA DENGAN INI
async function secureFetch(url, payload) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            // 🛡️ KUNCI PENTING: Gunakan text/plain agar lolos dari blokir Browser (CORS)
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' 
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });
        
        // Ambil balasan dari server
        const textData = await response.text();
        
        try {
            // Coba ubah menjadi format JSON
            const jsonData = JSON.parse(textData);
            
            // Jika Apps Script menolak dan mengirim pesan error resmi
            if (jsonData.status === "error") {
                throw new Error(jsonData.message); 
            }
            return jsonData;
            
        } catch (e) {
            // Jika balasan 404/405 (Masalah Multi-Akun), abaikan dan anggap sukses
            if (response.status === 404 || response.status === 405) {
                return { status: "success" }; 
            }
            throw new Error("Gagal membaca balasan dari server Google.");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        // Error ini yang muncul di layar Anda sebelumnya!
        throw new Error(error.message || "Koneksi digagalkan oleh browser. Periksa pengaturan.");
    }
}

// Navigasi Filter & Sort
function toggleFilterMenu() { document.getElementById('filterMenu').classList.toggle('show'); }
function resetFilter() {
    document.getElementById('filterJenis').value = '';
    document.getElementById('filterTA').value = '';
    renderTable();
    document.getElementById('filterMenu').classList.remove('show');
}
function toggleSortOrder() { sortAscending = !sortAscending; renderTable(); }

// Memuat Data Tabel
async function loadData() {
    const tableBody = document.getElementById('adminTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#6b7280;">Memuat data dari server...</td></tr>';
    
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${WEB_APP_URL}?action=getAllAdmin&pin=${encodeURIComponent(adminPin)}&nocache=${timestamp}`);
        let rawData = await response.json();

        if (rawData.status === "error") {
            localStorage.removeItem('adminPin');
            alert("PIN Salah atau Sesi Berakhir.");
            location.reload();
            return;
        }
        
        globalData = rawData.map(item => {
            // 1. SISTEM KEAMANAN: Cegah "NaN/NaN" jika tanggal di Spreadsheet kosong
            let d = new Date(item.tanggalPengajuanRaw);
            if (item.tanggalPengajuanRaw && !isNaN(d.getTime())) {
                let m = d.getMonth() + 1;
                let y = d.getFullYear();
                let startYear = (m >= 9) ? y : y - 1;
                item.tahunAkademik = `${startYear}/${startYear + 1}`;
            } else {
                item.tahunAkademik = "-"; // Menampilkan garis strip jika error
            }
            
            // 2. SISTEM KEAMANAN: Cegah tahun "1970" muncul
            if (!item.tanggalPengajuanRaw || item.tanggal.includes("1970")) {
                item.dateStr = "-";
                item.timeStr = "-";
            } else {
                let dateParts = item.tanggal.split(" ");
                item.dateStr = dateParts[0] || "-";
                item.timeStr = dateParts[1] || "-";
            }

            // 3. SISTEM KEAMANAN: Jika kolom jenis surat kosong
            if (!item.jenisSurat) item.jenisSurat = "Tidak Diketahui";
            
            return item;
        });
        
        populateFilterOptions();
        renderTable();
        updateStatistik();
    } catch (error) { 
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#ef4444; font-weight:bold;">Gagal memuat: ${error.message}</td></tr>`; 
    }
}

function populateFilterOptions() {
    const jenisSet = new Set();
    const taSet = new Set();
    globalData.forEach(item => {
        if(item.jenisSurat) jenisSet.add(item.jenisSurat);
        if(item.tahunAkademik) taSet.add(item.tahunAkademik);
    });

    const filterJenis = document.getElementById('filterJenis');
    filterJenis.innerHTML = '<option value="">Semua Jenis</option>';
    jenisSet.forEach(j => filterJenis.innerHTML += `<option value="${j}">${j}</option>`);

    const filterTA = document.getElementById('filterTA');
    filterTA.innerHTML = '<option value="">Semua Tahun</option>';
    taSet.forEach(ta => filterTA.innerHTML += `<option value="${ta}">${ta}</option>`);
}

function switchTab(tabId) {
    currentTab = tabId;
    if (tabId === 'baru') {
        document.getElementById('tabBaru').classList.add('active');
        document.getElementById('tabArsip').classList.remove('active');
        document.getElementById('toolbarArsip').style.display = 'none';
    } else {
        document.getElementById('tabArsip').classList.add('active');
        document.getElementById('tabBaru').classList.remove('active');
        document.getElementById('toolbarArsip').style.display = 'flex';
    }
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('adminTableBody');

    let dataTampil = globalData.filter(item => {
        if (currentTab === 'baru') return item.status === "Menunggu Verifikasi";
        else return item.status.includes("Disetujui") || item.status.includes("Selesai") || item.status.includes("Ditolak");
    });

    let searchQ = document.getElementById('searchInput').value.toLowerCase();
    if (searchQ) {
        dataTampil = dataTampil.filter(item =>
            item.nama.toLowerCase().includes(searchQ) ||
            item.nim.toLowerCase().includes(searchQ) ||
            item.jenisSurat.toLowerCase().includes(searchQ)
        );
    }

    if (currentTab === 'arsip') {
        let fJen = document.getElementById('filterJenis').value;
        let fTa = document.getElementById('filterTA').value;
        if (fJen) dataTampil = dataTampil.filter(i => i.jenisSurat === fJen);
        if (fTa) dataTampil = dataTampil.filter(i => i.tahunAkademik === fTa);

        dataTampil.sort((a, b) => {
            let tA = new Date(a.tanggalPengajuanRaw).getTime();
            let tB = new Date(b.tanggalPengajuanRaw).getTime();
            return sortAscending ? tA - tB : tB - tA;
        });
    }

    tbody.innerHTML = '';
    if (dataTampil.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-12 text-gray-400 font-medium">Tidak ada data di tab ${currentTab === 'baru' ? 'Permohonan Baru' : 'Arsip Terkirim'}.</td></tr>`; 
        return; 
    }

    dataTampil.forEach(item => {
        // --- 1. STATUS: Dibuat lebih pasif/lembut seperti label pemberitahuan ---
        let statusBadge = "";
        let statusText = item.status.toLowerCase();

        if (statusText.includes("sudah dikirim") || statusText.includes("selesai")) {
            statusBadge = `<span class="inline-flex flex-col items-center justify-center px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 leading-tight min-w-[95px]">SELESAI<span class="text-[8.5px] font-normal text-emerald-600 normal-case mt-0.5">(Email Terkirim)</span></span>`;
        } else if (statusText.includes("menunggu dikirim") || statusText.includes("disetujui")) {
            statusBadge = `<span class="inline-flex flex-col items-center justify-center px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100 leading-tight min-w-[95px]">DISETUJUI<span class="text-[8.5px] font-normal text-sky-600 normal-case mt-0.5">(Menunggu Kirim)</span></span>`;
        } else if (statusText.includes("tolak")) {
            statusBadge = `<span class="inline-flex items-center justify-center px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100 min-w-[95px]">DITOLAK</span>`;
        } else {
            statusBadge = `<span class="inline-flex flex-col items-center justify-center px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 leading-tight min-w-[95px]">PENDING<span class="text-[8.5px] font-normal text-amber-600 normal-case mt-0.5">Verifikasi</span></span>`;
        }

        // --- BERKAS ---
        let iconFile = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`;
        let linkClass = "inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-2 py-1 rounded transition-colors whitespace-nowrap";
        
        let arrBerkas = [];
        if(item.linkKTM) arrBerkas.push(`<a href="${item.linkKTM}" target="_blank" class="${linkClass}">${iconFile} KTM</a>`);
        if(item.linkBebas) arrBerkas.push(`<a href="${item.linkBebas}" target="_blank" class="${linkClass}">${iconFile} Bebas</a>`);
        if(item.linkIjazah) arrBerkas.push(`<a href="${item.linkIjazah}" target="_blank" class="${linkClass}">${iconFile} Ijazah</a>`);
        
        let htmlBerkas = arrBerkas.length > 0 ? `<div class="flex flex-col gap-1.5 items-center justify-center">${arrBerkas.join("")}</div>` : `<span class="text-gray-400 font-medium">-</span>`;

        // --- 2. AKSI: Dibuat lebih kontras, tegas, dengan efek tombol nyata (shadow & hover menonjol) ---
        let iconSearch = `<svg class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        let iconCross = `<svg class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        let iconEye = `<svg class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        let iconSend = `<svg class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
        let iconDoc = `<svg class="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

        let aksiHTML = "";
        if (item.status === "Menunggu Verifikasi") {
            aksiHTML = `
                <div class="flex justify-center gap-2">
                    <button onclick="openModal(${item.rowNumber})" class="flex items-center gap-1 bg-primary hover:bg-primary-light text-white px-3 py-2 rounded-lg transition-all shadow-sm font-semibold text-xs" title="Tinjau Permohonan">
                        ${iconSearch} Tinjau
                    </button>
                    <button onclick="bukaConfirmModal('tolak', ${item.rowNumber}, 'Tolak Permohonan?', 'Surat ini akan ditolak secara permanen.', 'Tolak Surat', '#ef4444')" class="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg transition-all shadow-sm font-semibold text-xs" title="Tolak Permohonan">
                        ${iconCross} Tolak
                    </button>
                </div>`;
        } else if (item.status.includes("Disetujui")) {
            aksiHTML = `
                <div class="flex justify-center gap-2">
                    <a href="${item.linkPDF}" target="_blank" class="flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-lg transition-all shadow-sm font-semibold text-xs" title="Preview PDF">
                        ${iconEye} Lihat
                    </a>
                    <button onclick="bukaConfirmModal('kirim', ${item.rowNumber}, 'Kirim Dokumen?', 'Dokumen PDF ini akan dikirim ke email mahasiswa.', 'Kirim Sekarang', '#0f5132')" class="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-all shadow-sm font-semibold text-xs" title="Kirim ke Mahasiswa">
                        ${iconSend} Kirim
                    </button>
                </div>`;
        } else if (item.status.includes("Selesai")) {
            aksiHTML = `
                <div class="flex justify-center">
                    <a href="${item.linkPDF}" target="_blank" class="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3.5 py-2 rounded-lg transition-all text-xs font-bold shadow-sm" title="Buka Dokumen PDF">
                        ${iconDoc} Buka PDF
                    </a>
                </div>`;
        } else if (item.status.includes("Ditolak")) {
            let alasan = item.alasanPenolakan ? item.alasanPenolakan : "Tidak memenuhi syarat administrasi.";
            aksiHTML = `
                <div class="text-[10px] text-gray-500 max-w-[160px] mx-auto text-center leading-tight bg-gray-50/80 p-2 rounded border border-gray-200">
                    <strong class="block text-rose-600 mb-0.5">Catatan Admin:</strong>
                    <span class="italic">"${alasan}"</span>
                </div>`;
        } else { 
            aksiHTML = "-"; 
        }

        let row = `
            <tr class="hover:bg-gray-50/80 transition-colors group">
                <td class="px-4 py-4 whitespace-nowrap text-center border-b border-gray-100">
                    <div class="font-bold text-gray-800 text-[11px] md:text-xs">${item.dateStr}</div>
                    <div class="text-[10px] text-gray-400 mt-1">${item.timeStr} WIB</div>
                </td>
                <td class="px-4 py-4 border-b border-gray-100">
                    <div class="font-bold text-gray-900 text-xs md:text-sm whitespace-nowrap">${item.nama}</div>
                    <div class="text-[10px] md:text-xs font-medium text-gray-500 mt-1 whitespace-nowrap">NIM: ${item.nim}</div>
                </td>
                <td class="px-4 py-4 text-center border-b border-gray-100 whitespace-nowrap">
                    <span class="text-[11px] font-semibold text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded">${item.tahunAkademik}</span>
                </td>
                <td class="px-4 py-4 text-center border-b border-gray-100">
                    <span class="text-[11px] md:text-xs font-semibold text-gray-700 whitespace-nowrap">${item.jenisSurat}</span>
                </td>
                <td class="px-4 py-4 border-b border-gray-100 align-middle">
                    ${htmlBerkas}
                </td>
                <td class="px-4 py-4 border-b border-gray-100 align-middle text-center">
                    ${statusBadge}
                </td>
                <td class="px-4 py-4 border-b border-gray-100 align-middle">
                    ${aksiHTML}
                </td>
            </tr>`;
        
        tbody.innerHTML += row;
    });
}
function openModal(rowNum) {
    const data = globalData.find(d => d.rowNumber === rowNum);
    if(!data) return;

    document.getElementById('editRowNumber').value = data.rowNumber;
    document.getElementById('editJenisSurat').value = data.jenisSurat;
    document.getElementById('labelJenisSurat').innerText = data.jenisSurat;
    
    document.getElementById('editNama').value = data.nama;
    document.getElementById('editNim').value = data.nim;
    document.getElementById('editEmail').value = data.email;
    document.getElementById('editTempatLahir').value = data.tempatLahir;
    document.getElementById('editTanggalLahir').value = data.tanggalLahirRaw ? data.tanggalLahirRaw.split('T')[0] : ''; 
    document.getElementById('editProdi').value = data.prodi;

    // Sembunyikan semua blok
    document.getElementById('blokBebas').style.display = 'none';
    document.getElementById('blokMutasi').style.display = 'none';
    document.getElementById('blokLulus').style.display = 'none';
    document.getElementById('blokRekomendasi').style.display = 'none';

    // PERBAIKAN: Menggunakan .includes() untuk mencocokkan string dengan aman
    const js = data.jenisSurat.toLowerCase();
    
    if(js.includes("bebas tanggungan")) {
        document.getElementById('blokBebas').style.display = 'flex';
        document.getElementById('editTujuanBebas').value = data.tujuanBebas || '';
    } else if(js.includes("mutasi")) {
        document.getElementById('blokMutasi').style.display = 'grid';
        document.getElementById('editKampusTujuan').value = data.kampusTujuan || '';
        document.getElementById('editProdiTujuan').value = data.prodiTujuan || '';
        document.getElementById('editAlamatTujuan').value = data.alamatTujuan || '';
    } else if(js.includes("lulus")) {
        document.getElementById('blokLulus').style.display = 'flex';
        document.getElementById('editTglMunaqosyah').value = data.tanggalMunaqosyahRaw ? data.tanggalMunaqosyahRaw.split('T')[0] : '';
    } else if(js.includes("rekomendasi")) {
        document.getElementById('blokRekomendasi').style.display = 'grid';
        document.getElementById('editNamaKegiatan').value = data.namaKegiatan || '';
        document.getElementById('editLokasiKegiatan').value = data.lokasiKegiatan || '';
        document.getElementById('editTglMulai').value = data.tglMulaiRaw ? data.tglMulaiRaw.split('T')[0] : '';
        document.getElementById('editTglSelesai').value = data.tglSelesaiRaw ? data.tglSelesaiRaw.split('T')[0] : '';
    }
    
    document.getElementById('modalTinjau').style.display = 'flex';
}

function closeModal() { 
    document.getElementById('modalTinjau').style.display = 'none'; 
}

async function saveAndApprove() {
    const btn = document.getElementById('btnSetujui');
    btn.innerHTML = '<span class="spinner"></span> Menyiapkan PDF...'; 
    btn.disabled = true;
    const rNum = document.getElementById('editRowNumber').value;
    const originalData = globalData.find(d => d.rowNumber == rNum);
    const jnsSurat = document.getElementById('editJenisSurat').value;
    const prodi = document.getElementById('editProdi').value;
    const nim = document.getElementById('editNim').value;

    const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const romawiBulan = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    
    const formatTgl = (tglMentah) => {
        if (!tglMentah) return "-";
        const d = new Date(tglMentah);
        if (isNaN(d.getTime())) return tglMentah;
        return `${d.getDate()} ${bulanIndo[d.getMonth()]} ${d.getFullYear()}`;
    };

    const waktuSekarang = new Date();
    const datePengajuan = new Date(originalData.tanggalPengajuanRaw);
    
    const tahunAwal = 2000 + parseInt(nim.substring(0, 2), 10);
    const blnPengajuan = datePengajuan.getMonth() + 1;
    const tahunMulaiAkad = (blnPengajuan >= 9) ? datePengajuan.getFullYear() : datePengajuan.getFullYear() - 1;
    
    let jmlSemester = ((tahunMulaiAkad - tahunAwal) * 2) + ((blnPengajuan >= 9 || blnPengajuan === 1) ? 1 : 2);
    if (jmlSemester < 1) jmlSemester = 1;
    if (jmlSemester > 20) jmlSemester = 20;

    const arrayRomawi = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
    const arrayTerbilang = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas", "Dua Belas", "Tiga Belas", "Empat Belas", "Lima Belas", "Enam Belas", "Tujuh Belas", "Delapan Belas", "Sembilan Belas", "Dua Puluh"];
    
    const formatBelakangSurat = `/Ket-SKet/STAIIS/${romawiBulan[waktuSekarang.getMonth() + 1]}/${String(waktuSekarang.getFullYear()).substring(2)}`;
    
    const strMulai = formatTgl(document.getElementById('editTglMulai').value);
    const strSelesai = formatTgl(document.getElementById('editTglSelesai').value);
    let tglKegiatanFinal = strMulai;
    if (strSelesai !== "-" && strSelesai !== strMulai) tglKegiatanFinal += ` sampai ${strSelesai}`;

    const rowDataMatang = {
        nama: document.getElementById('editNama').value, 
        nim: nim, 
        email: document.getElementById('editEmail').value, 
        prodi: prodi,
        tempatLahir: document.getElementById('editTempatLahir').value, 
        tanggalLahirRaw: document.getElementById('editTanggalLahir').value,
        jenisSurat: jnsSurat,
        
        formatBelakangSurat: formatBelakangSurat,
        strTglSurat: formatTgl(waktuSekarang),
        strTglLahir: formatTgl(document.getElementById('editTanggalLahir').value),
        strTglPengajuan: formatTgl(datePengajuan),
        semester: `${arrayRomawi[jmlSemester]} (${arrayTerbilang[jmlSemester]})`,
        tahunAkademik: `${tahunMulaiAkad}/${tahunMulaiAkad + 1}`,
        tahunMasuk: `${tahunAwal}/${tahunAwal + 1}`,
        gelar: prodi === "Pendidikan Bahasa Arab" ? "Sarjana Pendidikan (S.Pd.)" : "Sarjana Hukum (S.H.)",
        
        tujuanBebas: document.getElementById('editTujuanBebas').value,
        kampusTujuan: document.getElementById('editKampusTujuan').value, 
        prodiTujuan: document.getElementById('editProdiTujuan').value, 
        alamatTujuan: document.getElementById('editAlamatTujuan').value,
        strTglMunaqosyah: formatTgl(document.getElementById('editTglMunaqosyah').value),
        namaKegiatan: document.getElementById('editNamaKegiatan').value, 
        lokasiKegiatan: document.getElementById('editLokasiKegiatan').value, 
        strTglKegiatanFinal: tglKegiatanFinal
    };

    try {
        // PERBAIKAN: Tambahkan WEB_APP_URL di depan, dan masukkan pin: adminPin
        const res = await secureFetch(WEB_APP_URL, {
            action: "updateAndApprove",
            pin: adminPin, // Kunci rahasia agar diizinkan oleh Code.gs
            rowNumber: rNum,
            rowData: rowDataMatang
        });

        if(res.status === 'success') { 
            showToast('Selesai! PDF berhasil dibuat dan disetujui.'); 
            closeModal(); 
            loadData(); 
        } else {
            // Jika sukses terhubung tapi ada pesan error dari dalam Apps Script (Alarm Merah)
            alert('Gagal memproses: ' + res.message);
            showToast('Gagal: ' + res.message, true);
        }
    } catch(e) { 
        // Tangkap error jika benar-benar gagal fetch (misal internet mati)
        alert('Error: ' + e.message); 
    }
    finally { 
        btn.innerText = "Simpan Data & Buat Surat"; 
        btn.disabled = false; 
    }
}

let pendingAction = null;
let pendingRowNum = null;

function bukaConfirmModal(action, rowNum, title, desc, btnText, btnColor) {
    pendingAction = action;
    pendingRowNum = rowNum;
    
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmDesc').innerText = desc;
    
    const btnConfirm = document.getElementById('btnConfirmAction');
    const confirmIcon = document.getElementById('confirmIcon');
    btnConfirm.innerText = btnText;
    btnConfirm.style.background = btnColor;
    
    const rejectContainer = document.getElementById('rejectInputContainer');
    const rejectInput = document.getElementById('rejectReason');
    
    if (action === 'tolak') {
        rejectContainer.style.display = 'block';
        rejectInput.value = ''; 
        confirmIcon.style.background = '#fee2e2'; 
        confirmIcon.style.color = '#ef4444';
    } else {
        rejectContainer.style.display = 'none';
        confirmIcon.style.background = '#d1fae5'; 
        confirmIcon.style.color = '#10b981';
    }
    
    document.getElementById('confirmActionModal').style.display = 'flex';
}

function tutupConfirmModal() {
    document.getElementById('confirmActionModal').style.display = 'none';
    pendingAction = null;
    pendingRowNum = null;
}

async function prosesConfirmAction(event) {
    if (event) event.preventDefault(); 

    const action = pendingAction;
    const rowNum = pendingRowNum;
    let alasan = "";

    if (action === 'tolak') {
        alasan = document.getElementById('rejectReason').value.trim();
        if (!alasan) {
            showToast('Alasan penolakan wajib diisi!', true);
            return;
        }
    }

    const btnConfirm = document.getElementById('btnConfirmAction');
    const originalText = btnConfirm.innerText; 
    
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '<span class="spinner"></span> Memproses...'; 
    document.body.style.cursor = 'wait';
    
    try {
        let actionCode = action === 'kirim' ? 'sendToStudent' : action;
        let requestBody = { rowNumber: rowNum };
        if (action === 'tolak') requestBody.alasanPenolakan = alasan;

        let result = await secureFetch(WEB_APP_URL, Object.assign({ action: actionCode, pin: adminPin }, requestBody));
        tutupConfirmModal();

        if (result.status === "success") {
            if(action === 'kirim') {
                showToast("Sukses! Surat berhasil dikirim ke mahasiswa.");
            } else if (action === 'tolak') {
                showToast("Permohonan telah ditolak.");
            }
            loadData(); 
        } else {
            showToast("Gagal: " + result.message, true);
        }
        
    } catch(e) { 
        tutupConfirmModal();
        showToast('Error koneksi: ' + e.message, true); 
    } finally { 
        btnConfirm.disabled = false;
        btnConfirm.innerText = originalText;
        document.body.style.cursor = 'default'; 
    }
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toastMsg.innerText = message;
    
    if (isError) {
        toast.style.backgroundColor = "#ef4444"; 
        toastIcon.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`;
    } else {
        toast.style.backgroundColor = "#10b981"; 
        toastIcon.innerHTML = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`;
    }
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3500);
}

function logoutSistem() { document.getElementById('logoutModal').style.display = 'flex'; }
function tutupLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }
function prosesLogout() {
    sessionStorage.removeItem('userRole'); 
    sessionStorage.removeItem('adminPin'); 
    window.location.replace('index.html'); 
}

function updateStatistik() {
    if (!globalData || globalData.length === 0) return;

    let pending = 0, perluKirim = 0, selesai = 0, reject = 0;
    
    globalData.forEach(item => {
        if (!item.status) return; 
        let status = item.status.toLowerCase();
        
        if (status.includes("menunggu verifikasi")) {
            pending++;
        } else if (status.includes("menunggu dikirim") || status.includes("disetujui")) {
            perluKirim++; // Status sudah disetujui tapi belum dikirim emailnya
        } else if (status.includes("selesai") || status.includes("sudah dikirim")) {
            selesai++;
        } else if (status.includes("tolak")) {
            reject++;
        }
    });

    // Update 4 poin angka di Banner Admin
    if (document.getElementById("countPending")) document.getElementById("countPending").innerText = pending;
    if (document.getElementById("countPerluKirim")) document.getElementById("countPerluKirim").innerText = perluKirim;
    if (document.getElementById("countDone")) document.getElementById("countDone").innerText = selesai;
    if (document.getElementById("countReject")) document.getElementById("countReject").innerText = reject;

    // Update badge merah di tab Permohonan Baru (hanya menghitung yang murni pending)
    const badgePending = document.getElementById("badgeTabPending");
    if (badgePending) {
        badgePending.innerText = pending;
        badgePending.style.display = pending > 0 ? 'inline-flex' : 'none';
    }
}

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

window.onload = function() {
    loadData(); // Memuat tabel admin
    aktifkanAutoFormat(); // Mengaktifkan auto-format saat edit data
};
// GANTI URL INI DENGAN URL GOOGLE APPS SCRIPT ANDA
const API_URL = 'https://script.google.com/macros/s/AKfycbzowQaUWWhMgiLoQl6VTAjJERKos1YKzjk_VCU4ih2H69G_YAfktf5P-KWJrvymmkXeQQ/exec';

async function prosesLogin() {
    const inputPin = document.getElementById('inputPin').value;
    const errorMsg = document.getElementById('loginErrorMsg');
    const btnSubmit = document.querySelector('#adminLoginForm button[type="submit"]');
    
    if (!inputPin) return;

    // Ubah teks tombol menjadi loading
    const originalBtnText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span class="spinner"></span> Memeriksa...`;
    btnSubmit.disabled = true;
    errorMsg.classList.add('hidden');

    try {
        // Kirim PIN ke server Google Apps Script
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'login',
                pin: inputPin
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // PIN Benar
            document.getElementById('loginOverlay').style.display = 'none';
            sessionStorage.setItem('adminLoggedIn', 'true');
            
            if (typeof loadData === "function") {
                loadData();
            }
        } else {
            // PIN Salah
            errorMsg.innerText = "PIN yang Anda masukkan salah!";
            errorMsg.classList.remove('hidden');
            document.getElementById('inputPin').value = '';
            document.getElementById('inputPin').focus();
        }
    } catch (error) {
        errorMsg.innerText = "Gagal terhubung ke server. Coba lagi.";
        errorMsg.classList.remove('hidden');
    } finally {
        // Kembalikan tombol ke semula
        btnSubmit.innerHTML = originalBtnText;
        btnSubmit.disabled = false;
    }
}
