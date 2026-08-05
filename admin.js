// ======= GANTI DENGAN URL DEPLOY APPS SCRIPT ANDA =======
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxqHrGD78f0tsu13_i_di6rsTxy_HoOhPqfuphJufdCE7XRrkTec-Xen4BVvFKgnVMeaA/exec';

let globalData = []; 

// Proteksi PIN Sederhana
const pinAkses = prompt("Masukkan PIN Admin:");
if (pinAkses !== "123456") { 
    document.body.innerHTML = "<h2 class='text-center mt-20 text-red-600 font-bold'>Akses Ditolak.</h2>"; 
    throw new Error("Akses Ditolak"); 
}
let currentTab = 'baru'; 
let sortAscending = false;

// Tampilkan/Sembunyikan Menu Filter (Ubah class bawaan CSS Anda)
function toggleFilterMenu() {
    document.getElementById('filterMenu').classList.toggle('show');
}

function resetFilter() {
    document.getElementById('filterJenis').value = '';
    document.getElementById('filterTA').value = '';
    document.getElementById('filterBerkas').value = '';
    renderTable();
    document.getElementById('filterMenu').classList.remove('show');
}

function toggleSortOrder() {
    sortAscending = !sortAscending;
    renderTable();
}

async function loadData() {
    const tableBody = document.getElementById('adminTableBody');
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#6b7280;">Memuat data dari server...</td></tr>';
    
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${WEB_APP_URL}?action=getAllAdmin&nocache=${timestamp}`);
        let rawData = await response.json();
        
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
    } catch (error) { 
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#ef4444; font-weight:bold;">Gagal memuat: ${error.message}</td></tr>`; 
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
    
    // Ganti class 'active' standar CSS Anda
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
    const thead = document.getElementById('adminTableHeader');
    const tbody = document.getElementById('adminTableBody');

    if (currentTab === 'baru') {
        thead.innerHTML = `
            <tr>
                <th class="col-tanggal">Tanggal</th>
                <th>Pemohon</th>
                <th class="col-ta">Thn. Akd</th>
                <th class="col-jenis">Jenis Surat</th>
                <th class="col-berkas">Berkas</th>
                <th>Status</th>
                <th class="col-aksi">Aksi</th>
            </tr>`;
    } else {
        thead.innerHTML = `
            <tr>
                <th class="col-tanggal">Tanggal</th>
                <th>Pemohon</th>
                <th class="col-ta">Thn. Akd</th>
                <th class="col-jenis">Jenis Surat</th>
                <th class="col-berkas">Berkas</th>
                <th>Status</th>
                <th class="col-aksi">Dokumen & Aksi</th>
            </tr>`;
    }

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
        let fBerkas = document.getElementById('filterBerkas').value;

        if (fJen) dataTampil = dataTampil.filter(i => i.jenisSurat === fJen);
        if (fTa) dataTampil = dataTampil.filter(i => i.tahunAkademik === fTa);
        if (fBerkas === 'ada') dataTampil = dataTampil.filter(i => i.linkPDF);
        if (fBerkas === 'belum') dataTampil = dataTampil.filter(i => !i.linkPDF);

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
        // --- 1. WARNA STATUS ---
        let statusWarna = "background: #fef3c7; color: #92400e; border: 1px solid #fde68a;";
        if (item.status.includes("Selesai")) statusWarna = "background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;";
        else if (item.status.includes("Disetujui")) statusWarna = "background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;";
        else if (item.status.includes("Ditolak")) statusWarna = "background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;";

        // --- 2. TEKS STATUS DIPAKSA MENJADI 2 BARIS ---
        let statusTextTampil = item.status;
        let matchKurung = statusTextTampil.match(/\(([^)]+)\)/);
        if (matchKurung) {
            statusTextTampil = matchKurung[1];
        }
        // Mencari spasi pertama dan menggantinya dengan <br> agar turun baris
        let firstSpace = statusTextTampil.indexOf(" ");
        if (firstSpace !== -1) {
            statusTextTampil = statusTextTampil.substring(0, firstSpace) + "<br>" + statusTextTampil.substring(firstSpace + 1);
        }

        // --- 3. TOMBOL BERKAS BIRU SOLID (OCEAN BLUE) ---
        let btnBerkasStyle = "display: block; width: 100%; padding: 6px 0; border-radius: 6px; font-size: 10.5px; font-weight: 600; background: #0284c7; color: #ffffff; border: 1px solid #0284c7; text-decoration: none; text-align: center; transition: all 0.2s; box-sizing: border-box; letter-spacing: 0.3px;";
        let hoverBerkasIn = "this.style.background='#0369a1'; this.style.borderColor='#0369a1'; this.style.transform='translateY(-1.5px)'; this.style.boxShadow='0 3px 6px rgba(2, 132, 199, 0.2)'";
        let hoverBerkasOut = "this.style.background='#0284c7'; this.style.borderColor='#0284c7'; this.style.transform='translateY(0)'; this.style.boxShadow='none'";
        
        let arrBerkas = [];
        if(item.linkKTM) arrBerkas.push(`<a href="${item.linkKTM}" target="_blank" style="${btnBerkasStyle}" onmouseover="${hoverBerkasIn}" onmouseout="${hoverBerkasOut}">KTM</a>`);
        if(item.linkBebas) arrBerkas.push(`<a href="${item.linkBebas}" target="_blank" style="${btnBerkasStyle}" onmouseover="${hoverBerkasIn}" onmouseout="${hoverBerkasOut}">Bebas</a>`);
        if(item.linkIjazah) arrBerkas.push(`<a href="${item.linkIjazah}" target="_blank" style="${btnBerkasStyle}" onmouseover="${hoverBerkasIn}" onmouseout="${hoverBerkasOut}">Ijazah</a>`);
        
        let htmlBerkas = arrBerkas.length > 0 ? `<div style="display:flex; flex-direction:column; gap:5px; min-width:65px;">${arrBerkas.join("")}</div>` : "-";
        // --- 4. KOLEKSI IKON SVG MINIMALIS MODERN ---
        let iconSearch = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:middle; margin-top:-2px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        let iconCross = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:middle; margin-top:-2px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        let iconEye = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:middle; margin-top:-2px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        let iconSend = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:middle; margin-top:-2px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
        let iconDoc = `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:middle; margin-top:-2px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

        // --- 5. TOMBOL AKSI DENGAN IKON ---
        let aksiHTML = "";
        if (item.status === "Menunggu Verifikasi") {
            aksiHTML = `
                <div style="display:flex; flex-direction:column; gap:6px; min-width:90px;">
                    <button onclick="openModal(${item.rowNumber})" class="btn-action-tinjau">${iconSearch} Tinjau</button>
                    <button onclick="bukaConfirmModal('tolak', ${item.rowNumber}, 'Tolak Permohonan?', 'Surat ini akan ditolak secara permanen.', 'Tolak Surat', '#ef4444')" class="btn-action-tolak">${iconCross} Tolak</button>
                </div>`;
        } else if (item.status.includes("Disetujui")) {
            aksiHTML = `
                <div style="display:flex; flex-direction:column; gap:6px; min-width:90px;">
                    <a href="${item.linkPDF}" target="_blank" class="btn-action-preview">${iconEye} Preview</a>
                    <button onclick="bukaConfirmModal('kirim', ${item.rowNumber}, 'Kirim Dokumen?', 'Dokumen PDF ini akan dikirim langsung ke email mahasiswa.', 'Kirim Sekarang', '#15734b')" class="btn-action-kirim">${iconSend} Kirim</button>
                </div>`;
        } else if (item.status.includes("Selesai")) {
            aksiHTML = `
                <div style="display:flex; flex-direction:column; gap:6px; min-width:90px;">
                    <a href="${item.linkPDF}" target="_blank" style="display: block; width: 100%; padding: 8px 0; border-radius: 6px; font-size: 11px; font-weight: bold; background: var(--staiis-green); color: #fff; border: 1px solid var(--staiis-green); text-decoration: none; text-align: center; box-sizing: border-box; transition: all 0.2s; box-shadow: 0 2px 4px rgba(18, 130, 70, 0.1);" onmouseover="this.style.background='var(--staiis-green-hover)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='var(--staiis-green)'; this.style.transform='translateY(0)'">
                        ${iconDoc} Lihat PDF
                    </a>
                </div>`;
        } else if (item.status.includes("Ditolak")) {
            aksiHTML = `<span style="color: #dc2626; font-weight: bold; font-size: 11px;">${iconCross} Ditolak</span>`;
        } else { aksiHTML = "-"; }

        // --- 6. CETAK BARIS TABEL (Tanggal lebih kecil) ---
        let row = `
            <tr>
                <td class="col-tanggal">
                    <!-- Ukuran font tanggal diperkecil dan ketebalan dikurangi -->
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
                <td style="text-align:center;">
                    <!-- 'display: inline-block' menjaga agar text 2 baris terpusat dengan rapi -->
                    <span style="display: inline-block; min-width: 90px; padding: 4px 8px; border-radius: 6px; font-size: 9.5px; line-height: 1.35; font-weight: 700; text-transform: uppercase; text-align: center; ${statusWarna}">
                        ${statusTextTampil}
                    </span>
                </td>
                <td class="col-aksi">${aksiHTML}</td>
            </tr>`;
        
        tbody.innerHTML += row;
    });
}
// 2. FUNGSI KONTROL MODAL (Disesuaikan untuk CSS Murni)
function openModal(rowNum) {
    const data = globalData.find(d => d.rowNumber === rowNum);
    if(!data) return;

    // Isi data umum
    document.getElementById('editRowNumber').value = data.rowNumber;
    document.getElementById('editJenisSurat').value = data.jenisSurat;
    document.getElementById('labelJenisSurat').innerText = data.jenisSurat;
    
    document.getElementById('editNama').value = data.nama;
    document.getElementById('editNim').value = data.nim;
    document.getElementById('editEmail').value = data.email;
    document.getElementById('editTempatLahir').value = data.tempatLahir;
    document.getElementById('editTanggalLahir').value = data.tanggalLahirRaw ? data.tanggalLahirRaw.split('T')[0] : ''; 
    document.getElementById('editProdi').value = data.prodi;

    // Sembunyikan semua blok khusus terlebih dahulu
    document.getElementById('blokBebas').style.display = 'none';
    document.getElementById('blokMutasi').style.display = 'none';
    document.getElementById('blokLulus').style.display = 'none';
    document.getElementById('blokRekomendasi').style.display = 'none';

    // Munculkan blok khusus sesuai jenis surat
    if(data.jenisSurat === "Bebas Tanggungan") {
        document.getElementById('blokBebas').style.display = 'flex'; // form-group menggunakan flex
        document.getElementById('editTujuanBebas').value = data.tujuanBebas || '';
    } else if(data.jenisSurat === "Mutasi") {
        document.getElementById('blokMutasi').style.display = 'grid'; // mutasi menggunakan grid 2 kolom
        document.getElementById('editKampusTujuan').value = data.kampusTujuan || '';
        document.getElementById('editProdiTujuan').value = data.prodiTujuan || '';
        document.getElementById('editAlamatTujuan').value = data.alamatTujuan || '';
    } else if(data.jenisSurat === "Lulus") {
        document.getElementById('blokLulus').style.display = 'flex';
        document.getElementById('editTglMunaqosyah').value = data.tanggalMunaqosyahRaw ? data.tanggalMunaqosyahRaw.split('T')[0] : '';
    } else if(data.jenisSurat === "Rekomendasi") {
        document.getElementById('blokRekomendasi').style.display = 'grid';
        document.getElementById('editNamaKegiatan').value = data.namaKegiatan || '';
        document.getElementById('editLokasiKegiatan').value = data.lokasiKegiatan || '';
        document.getElementById('editTglMulai').value = data.tglMulaiRaw ? data.tglMulaiRaw.split('T')[0] : '';
        document.getElementById('editTglSelesai').value = data.tglSelesaiRaw ? data.tglSelesaiRaw.split('T')[0] : '';
    }
    
    // Tampilkan pop-up modal ke layar
    document.getElementById('modalTinjau').style.display = 'flex';
}

function closeModal() { 
    // Sembunyikan pop-up modal
    document.getElementById('modalTinjau').style.display = 'none'; 
}
// 3. FUNGSI LOGIKA PERHITUNGAN DAN KIRIM (FRONTEND CERDAS)
async function saveAndApprove() {
    const btn = document.getElementById('btnSetujui');
    btn.innerText = "Menyiapkan berkas PDF..."; btn.disabled = true;

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
    
    // Vercel hanya menyusun bagian belakangnya saja (Contoh: /Ket-SKet/STAIIS/VIII/26)
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
        const response = await fetch(WEB_APP_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: "updateAndApprove", rowNumber: rNum, rowData: rowDataMatang })
        });
        const res = await response.json();
        if(res.status === 'success') { 
            showToast('Selesai! PDF berhasil dibuat dan disetujui.'); 
            closeModal(); 
            loadData(); 
        }
    } catch(e) { alert('Error: ' + e); }
    finally { btn.innerText = "Simpan"; btn.disabled = false; }
}

async function kirimEmail(rowNum) {
    if(!confirm("Kirim dokumen ini ke email mahasiswa sekarang?")) return;
    document.body.style.cursor = 'wait';
    try {
        await fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "sendToStudent", rowNumber: rowNum }) });
        alert("Surat berhasil dikirim!"); loadData();
    } catch(e) { alert('Error: ' + e); }
    finally { document.body.style.cursor = 'default'; }
}

async function tolakSurat(rowNum) {
    if(!confirm("Anda yakin ingin menolak permohonan ini?")) return;
    await fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: "reject", rowNumber: rowNum }) });
    loadData();
}
// --- SISTEM MODAL KONFIRMASI (Ganti bawaan browser) ---
let pendingAction = null;
let pendingRowNum = null;

function bukaConfirmModal(action, rowNum, title, desc, btnText, btnColor) {
    pendingAction = action;
    pendingRowNum = rowNum;
    
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmDesc').innerText = desc;
    
    const btnConfirm = document.getElementById('btnConfirmAction');
    btnConfirm.innerText = btnText;
    btnConfirm.style.background = btnColor;
    
    document.getElementById('confirmActionModal').classList.add('show');
}

function tutupConfirmModal() {
    document.getElementById('confirmActionModal').classList.remove('show');
    pendingAction = null;
    pendingRowNum = null;
}

// Menjalankan fungsi setelah konfirmasi "Ya" ditekan
document.getElementById('btnConfirmAction').addEventListener('click', async function() {
    const action = pendingAction;
    const rowNum = pendingRowNum;
    tutupConfirmModal(); // Langsung tutup modal
    document.body.style.cursor = 'wait';
    
    try {
        if(action === 'kirim') {
            await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: "sendToStudent", rowNumber: rowNum }) });
            showToast("Sukses! Surat berhasil dikirim ke mahasiswa.");
        } else if (action === 'tolak') {
            await fetch(WEB_APP_URL, { method: 'POST', body: JSON.stringify({ action: "reject", rowNumber: rowNum }) });
            showToast("Permohonan telah ditolak.");
        }
        loadData(); // Segarkan tabel
    } catch(e) { 
        showToast('Error: ' + e, true); 
    } finally { 
        document.body.style.cursor = 'default'; 
    }
});
// Panggil data saat halaman pertama kali dibuka
window.onload = loadData;
// --- SISTEM NOTIFIKASI TOAST ---
function showToast(message, isError = false) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toastMsg.innerText = message;
    
    if (isError) {
        toast.style.backgroundColor = "#ef4444"; // Merah Error
        toastIcon.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`;
    } else {
        toast.style.backgroundColor = "#10b981"; // Hijau Sukses
        toastIcon.innerHTML = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`;
    }
    
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3500);
}

// --- SISTEM LOGOUT ---
function logoutSistem() { document.getElementById('logoutModal').classList.add('show'); }
function tutupLogoutModal() { document.getElementById('logoutModal').classList.remove('show'); }
function prosesLogout() {
    sessionStorage.removeItem('userRole'); // Hapus sesi admin
    window.location.replace('index.html'); // Lempar ke halaman permohonan
}
