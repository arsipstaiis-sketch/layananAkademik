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

// Fungsi pembantu terpusat untuk fetch aman dengan retry
async function secureFetch(payload, retries = 3, delay = 1000) {
    payload.pin = adminPin;

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(WEB_APP_URL, options);
            const result = await response.json();

            if (result.status === "error" && result.message && result.message.includes("Akses Ditolak")) {
                sessionStorage.removeItem('adminPin');
                alert("PIN Admin Salah! Akses ditolak oleh server.");
                location.reload();
            }
            return result; 
        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`Koneksi gagal. Mencoba ulang... (${i + 1}/${retries})`);
        }
        await new Promise(res => setTimeout(res, delay));
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
            sessionStorage.removeItem('adminPin');
            alert("PIN Salah atau Sesi Berakhir.");
            location.reload();
            return;
        }
        
        globalData = rawData.map(item => {
            let d = new Date(item.tanggalPengajuanRaw);
            let m = d.getMonth() + 1;
            let y = d.getFullYear();
            let startYear = (m >= 9) ? y : y - 1;
            item.tahunAkademik = `${startYear}/${startYear + 1}`;
            
            let dateParts = item.tanggal.split(" ");
            item.dateStr = dateParts[0] || "-";
            item.timeStr = dateParts[1] || "-";
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
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:#6b7280;">Tidak ada data di tab ${currentTab === 'baru' ? 'Permohonan Baru' : 'Arsip Terkirim'}.</td></tr>`; 
        return; 
    }

    dataTampil.forEach(item => {
        // --- LOGIKA STATUS ---
        let badgeClass = "badge-verifikasi"; 
        let statusText = item.status.toLowerCase();
        let statusDisplay = "MENUNGGU<br>VERIFIKASI"; 

        if (statusText.includes("sudah dikirim") || statusText.includes("selesai")) {
            badgeClass = "badge-selesai"; 
            statusDisplay = "SELESAI<br><span style='font-size: 9px; font-weight: 500; text-transform: none; letter-spacing: 0;'>(Email Terkirim)</span>";
        } else if (statusText.includes("menunggu dikirim") || statusText.includes("disetujui")) {
            badgeClass = "badge-dikirim"; 
            statusDisplay = "DISETUJUI<br><span style='font-size: 9px; font-weight: 500; text-transform: none; letter-spacing: 0;'>(Menunggu Dikirim)</span>";
        } else if (statusText.includes("tolak")) {
            badgeClass = "badge-tolak";   
            statusDisplay = "DITOLAK";
        }

        let statusHTML = `<span class="badge ${badgeClass}" style="line-height: 1.4; padding: 5px 8px; display: inline-block; min-width: 85px;">${statusDisplay}</span>`;

        // --- LOGIKA BERKAS ---
        let linkStyle = "display: inline-flex; align-items: center; justify-content: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: #2563eb; text-decoration: none; transition: all 0.2s ease;";
        let iconFile = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`;
        
        let arrBerkas = [];
        if(item.linkKTM) arrBerkas.push(`<a href="${item.linkKTM}" target="_blank" style="${linkStyle}">${iconFile} KTM</a>`);
        if(item.linkBebas) arrBerkas.push(`<a href="${item.linkBebas}" target="_blank" style="${linkStyle}">${iconFile} Bebas</a>`);
        if(item.linkIjazah) arrBerkas.push(`<a href="${item.linkIjazah}" target="_blank" style="${linkStyle}">${iconFile} Ijazah</a>`);
        
        let htmlBerkas = arrBerkas.length > 0 ? `<div style="display:flex; flex-direction:column; gap:8px; align-items: center;">${arrBerkas.join("")}</div>` : "-";
        
        // --- IKON AKSI ---
        let iconSearch = `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        let iconCross = `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        let iconEye = `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        let iconSend = `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
        let iconDoc = `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

        let aksiHTML = "";
        if (item.status === "Menunggu Verifikasi") {
            aksiHTML = `
                <div class="action-group">
                    <button onclick="openModal(${item.rowNumber})" class="action-btn-icon btn-icon-tinjau" title="Tinjau Permohonan">
                        ${iconSearch}
                    </button>
                    <button onclick="bukaConfirmModal('tolak', ${item.rowNumber}, 'Tolak Permohonan?', 'Surat ini akan ditolak secara permanen.', 'Tolak Surat', '#991b1b')" class="action-btn-icon btn-icon-tolak" title="Tolak Permohonan">
                        ${iconCross}
                    </button>
                </div>`;
        } else if (item.status.includes("Disetujui")) {
            aksiHTML = `
                <div class="action-group">
                    <a href="${item.linkPDF}" target="_blank" class="action-btn-icon btn-icon-preview" title="Preview PDF">
                        ${iconEye}
                    </a>
                    <button onclick="bukaConfirmModal('kirim', ${item.rowNumber}, 'Kirim Dokumen?', 'Dokumen PDF ini akan dikirim ke email mahasiswa.', 'Kirim Sekarang', '#0f5132')" class="action-btn-icon btn-icon-kirim" title="Kirim ke Mahasiswa">
                        ${iconSend}
                    </button>
                </div>`;
        } else if (item.status.includes("Selesai")) {
            aksiHTML = `
                <div class="action-group">
                    <a href="${item.linkPDF}" target="_blank" class="action-btn-icon btn-icon-full" title="Buka Dokumen PDF">
                        ${iconDoc} Lihat PDF
                    </a>
                </div>`;
        } else if (item.status.includes("Ditolak")) {
            let alasan = item.alasanPenolakan ? item.alasanPenolakan : "Tidak memenuhi syarat administrasi.";
            aksiHTML = `
                <div class="alasan-tolak" style="margin-top:0;">
                    <strong style="display:block; margin-bottom:2px;">Catatan Admin:</strong>
                    <span style="font-style:italic">"${alasan}"</span>
                </div>`;
        } else { 
            aksiHTML = "-"; 
        }

        let row = `
            <tr>
                <td class="col-tanggal">
                    <div style="font-weight: 500; font-size: 11.5px; color: var(--text-dark);">${item.dateStr}</div>
                    <div style="font-size: 10px; color: var(--text-gray); margin-top: 4px;">${item.timeStr} WIB</div>
                </td>
                <td>
                    <div style="font-weight: 700; color: var(--text-dark);">${item.nama}</div>
                    <div style="font-size: 11px; color: var(--text-gray); margin-top: 4px; letter-spacing: 0.5px;">${item.nim}</div>
                </td>
                <td class="col-ta">${item.tahunAkademik}</td>
                <td class="col-jenis" style="font-weight: 600; color: var(--text-gray);">${item.jenisSurat}</td>
                <td style="text-align:center;">${htmlBerkas}</td>
                <td style="text-align:center;">${statusHTML}</td>
                <td class="col-aksi">${aksiHTML}</td>
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
        const res = await secureFetch({
            action: "updateAndApprove",
            rowNumber: rNum,
            rowData: rowDataMatang
        });

        if(res.status === 'success') { 
            showToast('Selesai! PDF berhasil dibuat dan disetujui.'); 
            closeModal(); 
            loadData(); 
        } else {
            showToast('Gagal: ' + res.message, true);
        }
    } catch(e) { alert('Error: ' + e); }
    finally { btn.innerText = "Simpan Data & Buat Surat"; btn.disabled = false; }
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
    
    document.getElementById('confirmActionModal').classList.add('show');
}

function tutupConfirmModal() {
    document.getElementById('confirmActionModal').classList.remove('show');
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

        let result = await secureFetch(Object.assign({ action: actionCode }, requestBody));
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

function logoutSistem() { document.getElementById('logoutModal').classList.add('show'); }
function tutupLogoutModal() { document.getElementById('logoutModal').classList.remove('show'); }
function prosesLogout() {
    sessionStorage.removeItem('userRole'); 
    sessionStorage.removeItem('adminPin'); 
    window.location.replace('index.html'); 
}

function updateStatistik() {
    if (!globalData || globalData.length === 0) return;

    let pending = 0, done = 0, reject = 0;
    
    globalData.forEach(item => {
        if (!item.status) return; 
        let status = item.status.toLowerCase();
        
        if (status.includes("menunggu verifikasi")) pending++;
        else if (status.includes("selesai") || status.includes("disetujui") || status.includes("dikirim")) done++;
        else if (status.includes("tolak")) reject++;
    });

    // 1. Update Angka di Mini Bar Atas
    if (document.getElementById("countPending")) document.getElementById("countPending").innerText = pending;
    if (document.getElementById("countDone")) document.getElementById("countDone").innerText = done;
    if (document.getElementById("countReject")) document.getElementById("countReject").innerText = reject;

    // 2. Update Badge Merah di dalam Tab "Permohonan Baru"
    const badgePending = document.getElementById("badgeTabPending");
    if (badgePending) {
        badgePending.innerText = pending;
        
        // Hanya tampilkan warna merah jika ada antrean (Lebih dari 0)
        if (pending > 0) {
            badgePending.style.display = 'inline-flex';
        } else {
            badgePending.style.display = 'none'; // Sembunyikan jika kosong
        }
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
