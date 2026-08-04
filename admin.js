// ======= GANTI DENGAN URL DEPLOY APPS SCRIPT ANDA =======
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxqHrGD78f0tsu13_i_di6rsTxy_HoOhPqfuphJufdCE7XRrkTec-Xen4BVvFKgnVMeaA/exec';

let globalData = []; 

// Proteksi PIN Sederhana
const pinAkses = prompt("Masukkan PIN Admin:");
if (pinAkses !== "123456") { 
    document.body.innerHTML = "<h2 class='text-center mt-20 text-red-600 font-bold'>Akses Ditolak.</h2>"; 
    throw new Error("Akses Ditolak"); 
}
let currentTab = 'baru'; // Tab default saat halaman dibuka

// 1. FUNGSI MEMUAT DATA DARI SERVER
async function loadData() {
    const tableBody = document.getElementById('adminTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="p-12 text-center text-gray-400 font-medium">Memuat data dari server...</td></tr>';
    
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${WEB_APP_URL}?action=getAllAdmin&nocache=${timestamp}`);
        globalData = await response.json();
        
        renderTable(); // Setelah data dimuat, panggil fungsi penyaring tabel
    } catch (error) { 
        tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Error: ${error.message}</td></tr>`; 
    }
}

// 1.A FUNGSI GANTI TAB
function switchTab(tabId) {
    currentTab = tabId;
    
    // Ubah garis bawah & transparansi warna Tab
    const btnBaru = document.getElementById('tabBaru');
    const btnArsip = document.getElementById('tabArsip');
    
    if (tabId === 'baru') {
        btnBaru.className = "text-white border-b-4 border-white pb-3 transition-all";
        btnArsip.className = "text-white/60 hover:text-white pb-3 transition-all cursor-pointer";
    } else {
        btnArsip.className = "text-white border-b-4 border-white pb-3 transition-all";
        btnBaru.className = "text-white/60 hover:text-white pb-3 transition-all cursor-pointer";
    }
    
    renderTable(); // Gambar ulang isi tabel
}

// 1.B FUNGSI RENDER (SARING & TAMPILKAN TABEL)
function renderTable() {
    const tableBody = document.getElementById('adminTableBody');
    tableBody.innerHTML = '';
    
    // Saring data berdasarkan status
    const dataTampil = globalData.filter(item => {
        if (currentTab === 'baru') {
            return item.status === "Menunggu Verifikasi" || item.status.includes("Disetujui");
        } else {
            return item.status.includes("Selesai") || item.status.includes("Ditolak");
        }
    });

    if (dataTampil.length === 0) { 
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-12 text-gray-400 font-medium">Tidak ada data di tab ${currentTab === 'baru' ? 'Permohonan Baru' : 'Arsip Terkirim'}.</td></tr>`; 
        return; 
    }

    dataTampil.forEach(item => {
        let statusWarna = "bg-yellow-100 text-yellow-800";
        if (item.status.includes("Selesai")) statusWarna = "bg-green-100 text-green-800";
        else if (item.status.includes("Disetujui")) statusWarna = "bg-blue-100 text-blue-800";
        else if (item.status.includes("Ditolak")) statusWarna = "bg-red-100 text-red-800";

        let berkasHTML = "";
        if(item.linkKTM) berkasHTML += `<a href="${item.linkKTM}" target="_blank" class="text-blue-500 hover:underline">KTM</a> `;
        if(item.linkBebas) berkasHTML += `| <a href="${item.linkBebas}" target="_blank" class="text-blue-500 hover:underline">Bebas Tangg.</a> `;
        if(item.linkIjazah) berkasHTML += `| <a href="${item.linkIjazah}" target="_blank" class="text-blue-500 hover:underline">Ijazah</a>`;
        
        if(item.linkPDF) {
            berkasHTML += `<div class="mt-1"><a href="${item.linkPDF}" target="_blank" class="text-[#15734b] font-bold text-xs hover:underline">📄 Lihat Arsip PDF</a></div>`;
        }

        let aksiHTML = "";
        if (item.status === "Menunggu Verifikasi") {
            aksiHTML = `<button onclick="openModal(${item.rowNumber})" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-xs font-bold w-full mb-1 transition-all">🔍 Tinjau & Validasi</button>
                        <button onclick="tolakSurat(${item.rowNumber})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold w-full transition-all">❌ Tolak</button>`;
        } else if (item.status.includes("Disetujui")) {
            aksiHTML = `<button onclick="kirimEmail(${item.rowNumber})" class="bg-[#15734b] hover:bg-[#0f5436] text-white px-3 py-2 rounded text-xs font-bold w-full transition-all flex items-center justify-center gap-1">✉️ Kirim ke Mahasiswa</button>`;
        } else if (item.status.includes("Selesai")) {
            aksiHTML = `<span class="text-[#15734b] font-bold text-xs flex items-center justify-center gap-1">✅ Terkirim</span>`;
        } else if (item.status.includes("Ditolak")) {
            aksiHTML = `<span class="text-red-600 font-bold text-xs">Ditolak</span>`;
        } else { aksiHTML = "-"; }

        const row = `
            <tr class="hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0">
                <td class="p-4 text-xs text-gray-500 font-medium whitespace-nowrap">${item.tanggal}</td>
                <td class="p-4">
                    <div class="font-bold text-gray-800">${item.nama}</div>
                    <div class="text-gray-500 text-[11px] uppercase tracking-wide mt-0.5">${item.nim}</div>
                </td>
                <td class="p-4">
                    <div class="font-bold text-gray-800">${item.jenisSurat}</div>
                    <div class="text-xs mt-1 font-medium">${berkasHTML || "-"}</div>
                </td>
                <td class="p-4">
                    <span class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${statusWarna}">
                        ${item.status}
                    </span>
                </td>
                <td class="p-4 align-middle w-36">${aksiHTML}</td>
            </tr>`;
        tableBody.innerHTML += row;
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
