<script setup>
import { ref, computed, onMounted } from 'vue'

const liveData = ref({ total_kas: 0, total_piutang: 0, total_persediaan: 0, total_hutang: 0, aset_bersih: 0 })
const prive = ref(0)
const bulanLalu = ref(null)
const riwayat = ref([])
const isLoading = ref(false)

const selectedDate = ref(new Date().toISOString().split('T')[0])
const startPriveDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])

const fetchAset = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('admin_token') || ''
    const resLive = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/live?date=${selectedDate.value}&start_date=${startPriveDate.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (resLive.ok) {
      const data = await resLive.json()
      liveData.value = data.live || liveData.value
      prive.value = data.prive_bulan_ini || 0
      bulanLalu.value = data.bulan_lalu && data.bulan_lalu.id ? data.bulan_lalu : null
    }

    const resRiwayat = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/riwayat`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (resRiwayat.ok) {
      riwayat.value = await resRiwayat.json() || []
    }
  } catch (e) {
    console.error("Gagal menarik data aset:", e)
  } finally {
    isLoading.value = false
  }
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

const asetBulanLalu = computed(() => bulanLalu.value ? bulanLalu.value.aset_bersih : 0)
const pertumbuhanAset = computed(() => {
  if (!bulanLalu.value) return 0
  return liveData.value.aset_bersih - asetBulanLalu.value
})
const labaRugiRiil = computed(() => {
  if (!bulanLalu.value) return 0
  return pertumbuhanAset.value + prive.value
})

const simpanSnapshot = async () => {
  if (!confirm(`Konfirmasi Tutup Buku: Simpan snapshot kekayaan per tanggal ${selectedDate.value}?`)) return
  try {
    const token = localStorage.getItem('admin_token') || ''
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bulan: selectedDate.value })
    })
    if (res.ok) {
      alert("Snapshot kekayaan berhasil disimpan.")
      fetchAset()
    }
  } catch(e) { console.error(e) }
}

onMounted(fetchAset)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Kinerja & Ekuitas</h1>
        <p class="text-sm text-slate-500">Analisis pertumbuhan modal dan profitabilitas riil</p>
      </div>
      
      <div class="flex flex-wrap gap-3 items-center">
        <div class="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm">
          <span class="text-[10px] font-bold text-slate-400 uppercase mr-2">Posisi:</span>
          <input type="date" v-model="selectedDate" @change="fetchAset" class="text-xs font-semibold outline-none bg-transparent">
        </div>
        <div class="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm">
          <span class="text-[10px] font-bold text-slate-400 uppercase mr-2">Prive Dari:</span>
          <input type="date" v-model="startPriveDate" @change="fetchAset" class="text-xs font-semibold outline-none bg-transparent">
        </div>
        <button @click="prosesTutupBuku" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Tutup Buku
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <p class="text-slate-500 font-medium">Mengkonsolidasi data keuangan...</p>
    </div>

    <div v-else class="space-y-8">
      
      <section>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-1 h-4 bg-blue-600 rounded-full"></div>
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Posisi Keuangan (Neraca)</h2>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-[10px] font-bold text-slate-400 uppercase">Kas Tunai</p>
            <p class="text-lg font-bold text-slate-800 mt-1">Rp {{ formatRp(liveData.total_kas) }}</p>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-[10px] font-bold text-slate-400 uppercase">Piutang Dagang</p>
            <p class="text-lg font-bold text-slate-800 mt-1">Rp {{ formatRp(liveData.total_piutang) }}</p>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-[10px] font-bold text-slate-400 uppercase">Persediaan Barang</p>
            <p class="text-lg font-bold text-slate-800 mt-1">Rp {{ formatRp(liveData.total_persediaan) }}</p>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-[10px] font-bold text-rose-500 uppercase">Hutang Dagang (-)</p>
            <p class="text-lg font-bold text-rose-700 mt-1">Rp {{ formatRp(liveData.total_hutang) }}</p>
          </div>
          <div class="bg-slate-800 p-4 rounded-xl shadow-md border border-slate-700 md:col-span-2 lg:col-span-1">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ekuitas Bersih</p>
            <p class="text-xl font-bold text-white mt-1">Rp {{ formatRp(liveData.aset_bersih) }}</p>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-1 h-4 bg-emerald-600 rounded-full"></div>
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Analisis Performa Riil</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-[10px] font-bold text-slate-400 uppercase">Penarikan (Prive)</p>
            <p class="text-xl font-bold text-slate-800 mt-1">Rp {{ formatRp(prive) }}</p>
            <p class="text-[10px] text-slate-500 mt-2 leading-relaxed">Dana kas yang ditarik untuk keperluan pribadi/pemilik usaha.</p>
          </div>

          <template v-if="bulanLalu">
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p class="text-[10px] font-bold text-slate-400 uppercase">Pertumbuhan Ekuitas</p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="pertumbuhanAset >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="pertumbuhanAset >= 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7 7 7M12 3v18" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7-7-7M12 21V3" />
                  </svg>
                </span>
                <p class="text-xl font-bold text-slate-800">
                   Rp {{ formatRp(Math.abs(pertumbuhanAset)) }}
                </p>
              </div>
              <p class="text-[10px] text-slate-500 mt-2 italic">Vs. Tutup Buku {{ bulanLalu.bulan.split('T')[0] }}</p>
            </div>

            <div class="bg-blue-600 p-5 rounded-xl shadow-lg border border-blue-500 md:col-span-1 lg:col-span-2 relative overflow-hidden">
              <div class="relative z-10">
                <p class="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Estimasi Laba Bersih Riil</p>
                <p class="text-3xl font-bold text-white mt-2">Rp {{ formatRp(labaRugiRiil) }}</p>
                <div class="mt-4 flex items-center gap-2">
                  <span class="bg-blue-500 text-[9px] text-white px-2 py-0.5 rounded font-bold uppercase">Formula Akuntansi</span>
                  <p class="text-[10px] text-blue-100 font-medium">Pertumbuhan Ekuitas + Total Prive</p>
                </div>
              </div>
              <svg class="absolute right-0 bottom-0 h-24 w-24 text-blue-500 translate-x-4 translate-y-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
            </div>
          </template>

          <div v-else class="md:col-span-2 lg:col-span-3 bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-center">
            <p class="text-xs font-medium text-slate-500 leading-relaxed">
              Data pembanding bulan lalu belum tersedia.<br>Silakan tekan tombol <span class="font-bold text-blue-600">"Tutup Buku"</span> untuk mengunci posisi neraca saat ini sebagai basis perhitungan bulan depan.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div class="px-6 py-4 border-b border-slate-200 bg-white">
            <h3 class="text-sm font-bold text-slate-700">Riwayat Tutup Buku</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Kas Tunai</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Piutang</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Persediaan</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-rose-500 uppercase tracking-wider">Hutang</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-blue-600 uppercase tracking-wider">Ekuitas</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-slate-100">
                <tr v-if="riwayat.length === 0">
                  <td colspan="6" class="px-6 py-10 text-center text-slate-400 italic">Belum ada riwayat tutup buku yang tersimpan.</td>
                </tr>
                <tr v-for="r in riwayat" :key="r.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap font-semibold text-slate-700">{{ r.bulan.split('T')[0] }}</td>
                  <td class="px-6 py-4 text-right text-slate-600">Rp {{ formatRp(r.total_kas) }}</td>
                  <td class="px-6 py-4 text-right text-slate-600">Rp {{ formatRp(r.total_piutang) }}</td>
                  <td class="px-6 py-4 text-right text-slate-600">Rp {{ formatRp(r.total_persediaan) }}</td>
                  <td class="px-6 py-4 text-right text-rose-600 font-medium">Rp {{ formatRp(r.total_hutang) }}</td>
                  <td class="px-6 py-4 text-right font-bold text-slate-900">Rp {{ formatRp(r.aset_bersih) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<!-- <script setup>
import { ref, computed, onMounted } from 'vue'

const liveData = ref({ total_kas: 0, total_piutang: 0, total_persediaan: 0, total_hutang: 0, aset_bersih: 0 })
const prive = ref(0)
const bulanLalu = ref(null)
const riwayat = ref([])
const isLoading = ref(false)

const selectedDate = ref(new Date().toISOString().split('T')[0])
// Default start date prive: tanggal 1 bulan berjalan
const startPriveDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])

const fetchAset = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('admin_token') || ''
    
    // 1. Tarik Data Live & Perbandingan
    const resLive = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/live?date=${selectedDate.value}&start_date=${startPriveDate.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (resLive.ok) {
      const data = await resLive.json()
      liveData.value = data.live || liveData.value
      prive.value = data.prive_bulan_ini || 0
      bulanLalu.value = data.bulan_lalu && data.bulan_lalu.id ? data.bulan_lalu : null
    }

    // 2. Tarik Riwayat Snapshot
    const resRiwayat = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/riwayat`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (resRiwayat.ok) {
      riwayat.value = await resRiwayat.json() || []
    }
  } catch (e) {
    console.error("Gagal menarik data aset:", e)
  } finally {
    isLoading.value = false
  }
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

// RUMUS BISNIS
const asetBulanLalu = computed(() => bulanLalu.value ? bulanLalu.value.aset_bersih : 0)

const pertumbuhanAset = computed(() => {
  if (!bulanLalu.value) return 0
  return liveData.value.aset_bersih - asetBulanLalu.value
})

const labaRugiRiil = computed(() => {
  if (!bulanLalu.value) return 0
  // Laba Riil = Pertumbuhan Aset + Uang yang ditarik Owner (Prive)
  return pertumbuhanAset.value + prive.value
})

const simpanSnapshot = async () => {
  if (!confirm(`TUTUP BUKU ASET: Yakin ingin mengunci snapshot kekayaan per tanggal ${selectedDate.value}?`)) return

  try {
    const token = localStorage.getItem('admin_token') || ''
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bulan: selectedDate.value })
    })
    if (res.ok) {
      alert("✅ Snapshot Aset Berhasil Dikunci!")
      fetchAset()
    } else {
      alert("Gagal mengunci snapshot.")
    }
  } catch(e) { 
    console.error(e) 
  }
}

onMounted(fetchAset)
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b-2 border-gray-300 pb-6">
      <div>
        <h1 class="text-3xl font-black text-gray-800 tracking-tight">📈 Laporan Aset & Kinerja</h1>
        <p class="text-sm text-gray-500 font-bold mt-1 uppercase tracking-widest">Tiara Bakery Financial Dashboard</p>
      </div>
      
      <div class="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div class="flex flex-col">
          <span class="text-[10px] font-black text-gray-400 uppercase mb-1">Posisi Aset Per:</span>
          <input type="date" v-model="selectedDate" @change="fetchAset" 
                class="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-black text-orange-400 uppercase mb-1">Hitung Prive Dari:</span>
          <input type="date" v-model="startPriveDate" @change="fetchAset" 
                class="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500">
        </div>
        <div class="flex gap-2 self-end">
          <button @click="fetchAset" class="bg-gray-800 text-white p-2.5 rounded-lg hover:bg-black transition shadow-sm" title="Refresh Data">
            🔄
          </button>
          <button @click="simpanSnapshot" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-black text-xs shadow-md transition flex items-center gap-2">
            🔒 KUNCI SNAPSHOT
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center p-20 font-bold text-gray-500 animate-pulse">
      Menghitung seluruh kekayaan pabrik... ⏳
    </div>

    <div v-else class="space-y-8">
      
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        <h2 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          1. Posisi Aset Saat Ini (Snapshot)
        </h2>
        
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
          <div class="bg-green-50 p-4 rounded-2xl border border-green-100">
            <p class="text-[10px] font-bold text-green-700 uppercase">Uang Tunai (Kas)</p>
            <p class="text-lg font-black text-green-900 mt-1">Rp {{ formatRp(liveData.total_kas) }}</p>
          </div>
          
          <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p class="text-[10px] font-bold text-blue-700 uppercase">Piutang Nota & PO</p>
            <p class="text-lg font-black text-blue-900 mt-1">Rp {{ formatRp(liveData.total_piutang) }}</p>
          </div>
          
          <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100">
            <p class="text-[10px] font-bold text-purple-700 uppercase">Nilai Stok Gudang</p>
            <p class="text-lg font-black text-purple-900 mt-1">Rp {{ formatRp(liveData.total_persediaan) }}</p>
          </div>
          
          <div class="bg-red-50 p-4 rounded-2xl border border-red-100">
            <p class="text-[10px] font-bold text-red-700 uppercase">Hutang Pembelian</p>
            <p class="text-lg font-black text-red-900 mt-1">Rp {{ formatRp(liveData.total_hutang) }}</p>
          </div>

          <div class="bg-gray-900 p-4 rounded-2xl shadow-lg border border-gray-700 col-span-2 md:col-span-1">
            <p class="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Aset Bersih</p>
            <p class="text-xl font-black text-white mt-1">Rp {{ formatRp(liveData.aset_bersih) }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h2 class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">2. Analisis Kinerja & Aliran Dana (Flow)</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div class="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 text-6xl opacity-5 rotate-12">🏠</div>
            <p class="text-[10px] font-black text-orange-400 uppercase tracking-widest relative z-10">Prive / Rumah Tangga</p>
            <p class="text-2xl font-black text-orange-700 mt-2 relative z-10">Rp {{ formatRp(prive) }}</p>
            <p class="text-[9px] text-orange-400 mt-1 font-bold relative z-10">Uang keluar untuk owner</p>
          </div>

          <template v-if="bulanLalu">
            <div class="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <p class="text-[10px] font-bold text-gray-400 uppercase">Aset Awal (Pembanding)</p>
              <p class="text-xl font-black text-gray-700 mt-2">Rp {{ formatRp(asetBulanLalu) }}</p>
              <p class="text-[9px] text-gray-400 mt-1">Terkunci: {{ bulanLalu.bulan.split('T')[0] }}</p>
            </div>

            <div class="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <p class="text-[10px] font-bold text-gray-400 uppercase">Pertumbuhan Aset</p>
              <p class="text-2xl font-black mt-2" :class="pertumbuhanAset >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ pertumbuhanAset >= 0 ? '+' : '-' }} Rp {{ formatRp(Math.abs(pertumbuhanAset)) }}
              </p>
              <p class="text-[9px] text-gray-400 mt-1 italic">Selisih aset hari ini vs pembanding</p>
            </div>

            <div class="p-6 rounded-3xl shadow-xl border-2 relative overflow-hidden" 
                 :class="labaRugiRiil >= 0 ? 'bg-indigo-600 border-indigo-400' : 'bg-red-600 border-red-400'">
              <div class="absolute -right-4 -bottom-4 text-7xl opacity-10">
                {{ labaRugiRiil >= 0 ? '📈' : '📉' }}
              </div>
              <p class="text-[10px] font-black text-white/70 uppercase tracking-widest relative z-10">Laba / Rugi Riil</p>
              <p class="text-2xl font-black text-white mt-2 relative z-10">Rp {{ formatRp(labaRugiRiil) }}</p>
              <p class="text-[9px] text-white/60 mt-1 font-bold relative z-10">Rumus: Pertumbuhan + Prive</p>
            </div>
          </template>

          <div v-else class="md:col-span-3 bg-gray-100 p-6 rounded-3xl border border-dashed border-gray-300 flex items-center justify-center">
            <p class="text-sm font-bold text-gray-400 italic">
              Data perbandingan bulan lalu belum tersedia. Klik <span class="text-indigo-600">"Kunci Snapshot"</span> untuk mulai melacak laba/rugi bulan depan.
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-5 bg-gray-50 border-b">
          <h3 class="font-black text-gray-700 tracking-tight uppercase text-xs">Riwayat Tutup Buku & Snapshot Aset</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-800 text-white uppercase text-[10px] tracking-widest">
              <tr>
                <th class="p-4 text-left">Tanggal Snapshot</th>
                <th class="p-4 text-right">Uang Kas</th>
                <th class="p-4 text-right">Piutang</th>
                <th class="p-4 text-right">Stok Gudang</th>
                <th class="p-4 text-right text-red-300">Hutang</th>
                <th class="p-4 text-right text-yellow-300 font-black">Aset Bersih</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-if="riwayat.length === 0">
                <td colspan="6" class="p-8 text-center text-gray-400 font-bold italic">Belum ada riwayat kekayaan yang disimpan.</td>
              </tr>
              <tr v-for="r in riwayat" :key="r.id" class="hover:bg-gray-50 transition">
                <td class="p-4 font-black text-gray-800">{{ r.bulan.split('T')[0] }}</td>
                <td class="p-4 text-right text-gray-600 font-mono text-xs">Rp {{ formatRp(r.total_kas) }}</td>
                <td class="p-4 text-right text-gray-600 font-mono text-xs">Rp {{ formatRp(r.total_piutang) }}</td>
                <td class="p-4 text-right text-gray-600 font-mono text-xs">Rp {{ formatRp(r.total_persediaan) }}</td>
                <td class="p-4 text-right font-bold text-red-600 font-mono text-xs">Rp {{ formatRp(r.total_hutang) }}</td>
                <td class="p-4 text-right font-black text-indigo-700 font-mono">Rp {{ formatRp(r.aset_bersih) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template> -->