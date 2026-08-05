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

// Tampilkan/Sembunyikan Menu Filter
function toggleFilterMenu() {
    document.getElementById('filterMenu').classList.toggle('hidden');
}

// Reset semua dropdown filter
function resetFilter() {
    document.getElementById('filterJenis').value = '';
    document.getElementById('filterTA').value = '';
    document.getElementById('filterBerkas').value = '';
    renderTable();
    toggleFilterMenu();
}

// Ubah urutan tanggal (Terbaru/Terlama)
function toggleSortOrder() {
    sortAscending = !sortAscending;
    renderTable();
}

async function loadData() {
    const tableBody = document.getElementById('adminTableBody');
    tableBody.innerHTML = '<tr><td colspan="8" class="p-12 text-center text-gray-400 font-medium">Memuat data dari server...</td></tr>';
    
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${WEB_APP_URL}?action=getAllAdmin&nocache=${timestamp}`);
        let rawData = await response.json();
        
        // Memproses Tahun Akademik & Format Tanggal ke dalam objek data
        globalData = rawData.map(item => {
            // Hitung Tahun Akademik
            let d = new Date(item.tanggalPengajuanRaw);
            let m = d.getMonth() + 1;
            let y = d.getFullYear();
            let startYear = (m >= 9) ? y : y - 1;
            item.tahunAkademik = `${startYear}/${startYear + 1}`;
            
            // Pecah Tanggal dan Jam
            let dateParts = item.tanggal.split(" ");
            item.dateStr = dateParts[0] || "-";
            item.timeStr = dateParts[1] || "-";
            return item;
        });
        
        populateFilterOptions();
        renderTable(); 
    } catch (error) { 
        tableBody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500 font-bold">Gagal memuat: ${error.message}</td></tr>`; 
    }
}

// Otomatis mengisi pilihan dropdown Jenis Surat & Tahun Akademik sesuai data yg ada
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
    const btnBaru = document.getElementById('tabBaru');
    const btnArsip = document.getElementById('tabArsip');
    const toolbarArsip = document.getElementById('toolbarArsip');

    if (tabId === 'baru') {
        btnBaru.className = "text-white border-b-[3px] border-white pb-3 px-1 transition-all";
        btnArsip.className = "text-white/60 hover:text-white border-b-[3px] border-transparent pb-3 px-1 transition-all cursor-pointer";
        toolbarArsip.classList.add('hidden'); // Sembunyikan Sort & Filter
    } else {
        btnArsip.className = "text-white border-b-[3px] border-white pb-3 px-1 transition-all";
        btnBaru.className = "text-white/60 hover:text-white border-b-[3px] border-transparent pb-3 px-1 transition-all cursor-pointer";
        toolbarArsip.classList.remove('hidden'); // Munculkan Sort & Filter
    }
    renderTable();
}

function renderTable() {
    const thead = document.getElementById('adminTableHeader');
    const tbody = document.getElementById('adminTableBody');

    // MENGATUR KOLOM DINAMIS BERDASARKAN TAB
    if (currentTab === 'baru') {
        thead.innerHTML = `
            <tr>
                <th class="py-3 px-4 w-[12%]">Tanggal</th>
                <th class="py-3 px-4 w-[20%]">Pemohon</th>
                <th class="py-3 px-4 w-[12%]">Thn. Akd</th>
                <th class="py-3 px-4 w-[18%]">Jenis Surat</th>
                <th class="py-3 px-4 w-[16%]">Berkas Upload</th>
                <th class="py-3 px-4 w-[10%]">Status</th>
                <th class="py-3 px-4 w-[12%] text-center">Aksi</th>
            </tr>`;
    } else {
        thead.innerHTML = `
            <tr>
                <th class="py-3 px-4 w-[10%]">Tanggal</th>
                <th class="py-3 px-4 w-[18%]">Pemohon</th>
                <th class="py-3 px-4 w-[12%]">Thn. Akd</th>
                <th class="py-3 px-4 w-[15%]">Jenis Surat</th>
                <th class="py-3 px-4 w-[12%]">Berkas</th>
                <th class="py-3 px-4 w-[11%]">Arsip PDF</th>
                <th class="py-3 px-4 w-[10%]">Status</th>
                <th class="py-3 px-4 w-[12%] text-center">Aksi</th>
            </tr>`;
    }

    // 1. FILTER BERDASARKAN TAB
    let dataTampil = globalData.filter(item => {
        if (currentTab === 'baru') {
            return item.status === "Menunggu Verifikasi"; // Baru hanya menampung yang belum ditinjau
        } else {
            return item.status.includes("Disetujui") || item.status.includes("Selesai") || item.status.includes("Ditolak");
        }
    });

    // 2. PENCARIAN TEKS (Live Search)
    let searchQ = document.getElementById('searchInput').value.toLowerCase();
    if (searchQ) {
        dataTampil = dataTampil.filter(item =>
            item.nama.toLowerCase().includes(searchQ) ||
            item.nim.toLowerCase().includes(searchQ) ||
            item.jenisSurat.toLowerCase().includes(searchQ)
        );
    }

    // 3. FILTER DROPDOWN & SORT (Hanya di Tab Arsip)
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
        tbody.innerHTML = `<tr><td colspan="8" class="text-center p-12 text-gray-400 font-medium">Tidak ada data di tab ${currentTab === 'baru' ? 'Permohonan Baru' : 'Arsip Terkirim'}.</td></tr>`; 
        return; 
    }

    // MENCETAK BARIS TABEL
    dataTampil.forEach(item => {
        let statusWarna = "bg-yellow-100 text-yellow-800";
        if (item.status.includes("Selesai")) statusWarna = "bg-green-100 text-green-800";
        else if (item.status.includes("Disetujui")) statusWarna = "bg-blue-100 text-blue-800";
        else if (item.status.includes("Ditolak")) statusWarna = "bg-red-100 text-red-800";

        // Memisahkan Berkas Upload
        let arrBerkas = [];
        if(item.linkKTM) arrBerkas.push(`<a href="${item.linkKTM}" target="_blank" class="text-blue-500 hover:underline">KTM</a>`);
        if(item.linkBebas) arrBerkas.push(`<a href="${item.linkBebas}" target="_blank" class="text-blue-500 hover:underline">Bebas</a>`);
        if(item.linkIjazah) arrBerkas.push(`<a href="${item.linkIjazah}" target="_blank" class="text-blue-500 hover:underline">Ijazah</a>`);
        let htmlBerkas = arrBerkas.join(" | ") || "-";

        // Kolom Arsip PDF
        let arsipPDF = "-";
        if(item.linkPDF) arsipPDF = `<a href="${item.linkPDF}" target="_blank" class="text-[#15734b] font-bold hover:underline flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> PDF</a>`;

        // Desain Tombol Aksi Modern & Clean
        let aksiHTML = "";
        if (item.status === "Menunggu Verifikasi") {
            aksiHTML = `
                <div class="flex flex-col gap-1.5 w-full">
                    <button onclick="openModal(${item.rowNumber})" class="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all text-center">Tinjau Data</button>
                    <button onclick="tolakSurat(${item.rowNumber})" class="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all text-center">Tolak</button>
                </div>`;
        } else if (item.status.includes("Disetujui")) {
            // Tombol Preview & Kirim dipindah ke Arsip Terkirim
            aksiHTML = `
                <div class="flex flex-col gap-1.5 w-full">
                    <a href="${item.linkPDF}" target="_blank" class="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all text-center">Preview</a>
                    <button onclick="kirimEmail(${item.rowNumber})" class="bg-[#15734b] text-white hover:bg-[#0f5436] px-3 py-1.5 rounded-md text-[11px] font-bold transition-all text-center shadow-sm">✉️ Kirim</button>
                </div>`;
        } else if (item.status.includes("Selesai")) {
            aksiHTML = `<span class="text-[#15734b] font-bold text-[11px] flex items-center justify-center gap-1">✅ Selesai</span>`;
        } else {
            aksiHTML = "-";
        }

        let row = "";
        if (currentTab === 'baru') {
            row = `
                <tr class="hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0">
                    <td class="p-4 align-middle"><div class="font-bold text-gray-800">${item.dateStr}</div><div class="text-gray-400 text-[11px] font-medium mt-0.5">${item.timeStr} WIB</div></td>
                    <td class="p-4 align-middle"><div class="font-bold text-gray-800 truncate">${item.nama}</div><div class="text-gray-500 text-[11px] tracking-wide mt-0.5">${item.nim}</div></td>
                    <td class="p-4 align-middle font-semibold text-gray-700">${item.tahunAkademik}</td>
                    <td class="p-4 align-middle font-bold text-[#15734b]">${item.jenisSurat}</td>
                    <td class="p-4 align-middle text-[11px] font-medium">${htmlBerkas}</td>
                    <td class="p-4 align-middle"><span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${statusWarna}">${item.status}</span></td>
                    <td class="p-4 align-middle w-28">${aksiHTML}</td>
                </tr>`;
        } else {
            row = `
                <tr class="hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0">
                    <td class="p-4 align-middle"><div class="font-bold text-gray-800">${item.dateStr}</div><div class="text-gray-400 text-[11px] font-medium mt-0.5">${item.timeStr} WIB</div></td>
                    <td class="p-4 align-middle"><div class="font-bold text-gray-800 truncate">${item.nama}</div><div class="text-gray-500 text-[11px] tracking-wide mt-0.5">${item.nim}</div></td>
                    <td class="p-4 align-middle font-semibold text-gray-700">${item.tahunAkademik}</td>
                    <td class="p-4 align-middle font-bold text-gray-700">${item.jenisSurat}</td>
                    <td class="p-4 align-middle text-[11px] font-medium">${htmlBerkas}</td>
                    <td class="p-4 align-middle text-[11px]">${arsipPDF}</td>
                    <td class="p-4 align-middle"><span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${statusWarna}">${item.status}</span></td>
                    <td class="p-4 align-middle w-28">${aksiHTML}</td>
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
