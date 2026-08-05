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

    // MENGATUR HEADER DENGAN KELAS CSS NATIVE
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
                <th class="col-berkas">Arsip PDF</th>
                <th>Status</th>
                <th class="col-aksi">Aksi</th>
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
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px; color:#6b7280;">Tidak ada data di tab ${currentTab === 'baru' ? 'Permohonan Baru' : 'Arsip Terkirim'}.</td></tr>`; 
        return; 
    }

    dataTampil.forEach(item => {
        // Pemetaan warna status tanpa Tailwind
        let statusWarna = "background: #fef3c7; color: #92400e; border: 1px solid #fde68a;";
        if (item.status.includes("Selesai")) statusWarna = "background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;";
        else if (item.status.includes("Disetujui")) statusWarna = "background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;";
        else if (item.status.includes("Ditolak")) statusWarna = "background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;";

        let arrBerkas = [];
        if(item.linkKTM) arrBerkas.push(`<a href="${item.linkKTM}" target="_blank" style="color: #3b82f6; text-decoration: none;">KTM</a>`);
        if(item.linkBebas) arrBerkas.push(`<a href="${item.linkBebas}" target="_blank" style="color: #3b82f6; text-decoration: none;">Bebas</a>`);
        if(item.linkIjazah) arrBerkas.push(`<a href="${item.linkIjazah}" target="_blank" style="color: #3b82f6; text-decoration: none;">Ijazah</a>`);
        let htmlBerkas = arrBerkas.join(" | ") || "-";

        let arsipPDF = "-";
        if(item.linkPDF) arsipPDF = `<a href="${item.linkPDF}" target="_blank" style="color: var(--staiis-green); font-weight: bold; text-decoration: none;">📄 PDF</a>`;

        // Tombol Aksi menggunakan Style Murni
        let aksiHTML = "";
        let btnStyle = "width:100%; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; border: 1px solid;";
        
        if (item.status === "Menunggu Verifikasi") {
            aksiHTML = `
                <div style="display:flex; flex-direction:column; gap:6px; min-width:85px;">
                    <button onclick="openModal(${item.rowNumber})" style="${btnStyle} background:#eef2ff; color:#4338ca; border-color:#c7d2fe;">Tinjau Data</button>
                    <button onclick="tolakSurat(${item.rowNumber})" style="${btnStyle} background:#fef2f2; color:#dc2626; border-color:#fecaca;">Tolak</button>
                </div>`;
        } else if (item.status.includes("Disetujui")) {
            aksiHTML = `
                <div style="display:flex; flex-direction:column; gap:6px; min-width:85px;">
                    <a href="${item.linkPDF}" target="_blank" style="${btnStyle} background:#f9fafb; color:#374151; border-color:#e5e7eb; text-decoration:none; text-align:center; box-sizing:border-box; display:block;">Preview</a>
                    <button onclick="kirimEmail(${item.rowNumber})" style="${btnStyle} background:var(--staiis-green); color:#fff; border-color:var(--staiis-green);">✉️ Kirim</button>
                </div>`;
        } else if (item.status.includes("Selesai")) {
            aksiHTML = `<span style="color: var(--staiis-green); font-weight: bold; font-size: 12px;">✅ Selesai</span>`;
        } else { aksiHTML = "-"; }

        let row = "";
        if (currentTab === 'baru') {
            row = `
                <tr>
                    <td class="col-tanggal">
                        <div style="font-weight: 700; color: var(--text-dark);">${item.dateStr}</div>
                        <div style="font-size: 11px; color: var(--text-gray); margin-top: 4px;">${item.timeStr} WIB</div>
                    </td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-dark);">${item.nama}</div>
                        <div style="font-size: 11px; color: var(--text-gray); margin-top: 4px; letter-spacing: 0.5px;">${item.nim}</div>
                    </td>
                    <td class="col-ta">${item.tahunAkademik}</td>
                    <td class="col-jenis" style="font-weight: 600; color: var(--primary-dark);">${item.jenisSurat}</td>
                    <td style="font-size: 11px; text-align:center;">${htmlBerkas}</td>
                    <td style="text-align:center;">
                        <span style="padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; ${statusWarna}">
                            ${item.status}
                        </span>
                    </td>
                    <td class="col-aksi">${aksiHTML}</td>
                </tr>`;
        } else {
            row = `
                <tr>
                    <td class="col-tanggal">
                        <div style="font-weight: 700; color: var(--text-dark);">${item.dateStr}</div>
                        <div style="font-size: 11px; color: var(--text-gray); margin-top: 4px;">${item.timeStr} WIB</div>
                    </td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-dark);">${item.nama}</div>
                        <div style="font-size: 11px; color: var(--text-gray); margin-top: 4px; letter-spacing: 0.5px;">${item.nim}</div>
                    </td>
                    <td class="col-ta">${item.tahunAkademik}</td>
                    <td class="col-jenis" style="font-weight: 600; color: var(--text-gray);">${item.jenisSurat}</td>
                    <td style="font-size: 11px; text-align:center;">${htmlBerkas}</td>
                    <td style="font-size: 11px; text-align:center;">${arsipPDF}</td>
                    <td style="text-align:center;">
                        <span style="padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; ${statusWarna}">
                            ${item.status}
                        </span>
                    </td>
                    <td class="col-aksi">${aksiHTML}</td>
                </tr>`;
        }
        tbody.innerHTML += row;
    });
}
// 2. FUNGSI KONTROL MODAL
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
    document.getElementById('editTanggalLahir').value = data.tanggalLahirRaw.split('T')[0]; // Format penyesuaian kalender html
    document.getElementById('editProdi').value = data.prodi;

    document.getElementById('blokBebas').classList.add('hidden');
    document.getElementById('blokMutasi').classList.add('hidden');
    document.getElementById('blokLulus').classList.add('hidden');
    document.getElementById('blokRekomendasi').classList.add('hidden');

    if(data.jenisSurat === "Bebas Tanggungan") {
        document.getElementById('blokBebas').classList.remove('hidden');
        document.getElementById('editTujuanBebas').value = data.tujuanBebas;
    } else if(data.jenisSurat === "Mutasi") {
        document.getElementById('blokMutasi').classList.remove('hidden');
        document.getElementById('editKampusTujuan').value = data.kampusTujuan;
        document.getElementById('editProdiTujuan').value = data.prodiTujuan;
        document.getElementById('editAlamatTujuan').value = data.alamatTujuan;
    } else if(data.jenisSurat === "Lulus") {
        document.getElementById('blokLulus').classList.remove('hidden');
        document.getElementById('editTglMunaqosyah').value = data.tanggalMunaqosyahRaw ? data.tanggalMunaqosyahRaw.split('T')[0] : '';
    } else if(data.jenisSurat === "Rekomendasi") {
        document.getElementById('blokRekomendasi').classList.remove('hidden');
        document.getElementById('editNamaKegiatan').value = data.namaKegiatan;
        document.getElementById('editLokasiKegiatan').value = data.lokasiKegiatan;
        document.getElementById('editTglMulai').value = data.tglMulaiRaw ? data.tglMulaiRaw.split('T')[0] : '';
        document.getElementById('editTglSelesai').value = data.tglSelesaiRaw ? data.tglSelesaiRaw.split('T')[0] : '';
    }
    
    document.getElementById('modalTinjau').classList.remove('hidden');
}

function closeModal() { document.getElementById('modalTinjau').classList.add('hidden'); }

// 3. FUNGSI LOGIKA PERHITUNGAN DAN KIRIM (FRONTEND CERDAS)
async function saveAndApprove() {
    const btn = document.getElementById('btnSetujui');
    btn.innerText = "⏳ Memproses Logika & Merakit PDF..."; btn.disabled = true;

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
            alert('PDF Berhasil Dibuat dan Dirakit oleh Sistem Frontend!'); 
            closeModal(); 
            loadData(); 
        }
    } catch(e) { alert('Error: ' + e); }
    finally { btn.innerText = "✅ Simpan & Setujui (Buat PDF)"; btn.disabled = false; }
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

// Panggil data saat halaman pertama kali dibuka
window.onload = loadData;
