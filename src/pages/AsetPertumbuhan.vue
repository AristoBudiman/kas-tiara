<script setup>
import { ref, computed, onMounted } from 'vue'
import { Lock, TrendingUp } from 'lucide-vue-next'

const liveData = ref({ total_kas: 0, total_piutang: 0, piutang_reguler: 0, piutang_pesanan: 0, total_persediaan: 0, total_hutang: 0, aset_bersih: 0 })
const prive = ref(0)
const bulanLalu = ref(null)
const riwayat = ref([])
const isLoading = ref(false)

const today = new Date();
const offset = today.getTimezoneOffset() * 60000;
const localTodayStr = new Date(today - offset).toISOString().split('T')[0];
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const localFirstDayStr = new Date(firstDay - offset).toISOString().split('T')[0];

const selectedDate = ref(localTodayStr)
const startPriveDate = ref(localFirstDayStr)

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
  if (!(await window.$dialog.confirm(`Konfirmasi Tutup Buku: Simpan snapshot kekayaan per tanggal ${selectedDate.value}?`))) return
  try {
    const token = localStorage.getItem('admin_token') || ''
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bulan: selectedDate.value })
    })
    if (res.ok) {
      await window.$dialog.alert("Snapshot kekayaan berhasil disimpan.")
      fetchAset()
    }
  } catch(e) { console.error(e) }
}

onMounted(fetchAset)
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 gap-6">
      <div class="flex items-center gap-5">
        <div class="bg-linear-to-br from-indigo-500 to-indigo-700 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0 text-white">
          <TrendingUp :size="32" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">Kinerja & Ekuitas</h1>
          <p class="text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            Analisis pertumbuhan modal dan profitabilitas riil
          </p>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-3 items-center">
        <div class="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-inner focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 hidden sm:block">Posisi:</span>
          <input type="date" v-model="selectedDate" @change="fetchAset" class="text-xs font-bold text-slate-700 outline-none bg-transparent">
        </div>
        <div class="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-inner focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 hidden sm:block">Prive:</span>
          <input type="date" v-model="startPriveDate" @change="fetchAset" class="text-xs font-bold text-slate-700 outline-none bg-transparent">
        </div>
        <button @click="simpanSnapshot" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center gap-2">
          <Lock :size="18" /> Tutup Buku
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
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kas Tunai</p>
            <p class="text-xl font-black text-slate-800 mt-1">Rp {{ formatRp(liveData.total_kas) }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Piutang Dagang</p>
            <p class="text-xl font-black text-slate-800 mt-1">Rp {{ formatRp(liveData.total_piutang) }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Persediaan Barang</p>
            <p class="text-xl font-black text-slate-800 mt-1">Rp {{ formatRp(liveData.total_persediaan) }}</p>
          </div>
          <div class="bg-rose-50/30 p-5 rounded-2xl border border-rose-100 shadow-sm">
            <p class="text-[10px] font-black text-rose-500 uppercase tracking-wider">Hutang Dagang (-)</p>
            <p class="text-xl font-black text-rose-700 mt-1">Rp {{ formatRp(liveData.total_hutang) }}</p>
          </div>
          <div class="bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-800 md:col-span-2 lg:col-span-1 relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/30 rounded-full blur-xl"></div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Ekuitas Bersih</p>
            <p class="text-2xl font-black text-white mt-1 relative z-10">Rp {{ formatRp(liveData.aset_bersih) }}</p>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center gap-2 mb-4">
          <div class="w-1 h-4 bg-emerald-600 rounded-full"></div>
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Analisis Performa Riil</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penarikan (Prive)</p>
            <p class="text-2xl font-black text-slate-800 mt-1">Rp {{ formatRp(prive) }}</p>
            <p class="text-[10px] text-slate-500 mt-2 font-medium">Dana kas yang ditarik untuk keperluan pribadi/pemilik usaha.</p>
          </div>

          <template v-if="bulanLalu">
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pertumbuhan Ekuitas</p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="pertumbuhanAset >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="pertumbuhanAset >= 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7 7 7M12 3v18" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7-7-7M12 21V3" />
                  </svg>
                </span>
                <p class="text-2xl font-black text-slate-800">
                   Rp {{ formatRp(Math.abs(pertumbuhanAset)) }}
                </p>
              </div>
              <p class="text-[10px] text-slate-500 mt-2 font-medium">Vs. Tutup Buku {{ bulanLalu.bulan.split('T')[0] }}</p>
            </div>

            <div class="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 md:col-span-1 lg:col-span-2 relative overflow-hidden">
              <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"></div>
              <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div class="relative z-10">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Laba Bersih Riil</p>
                <p class="text-4xl font-black text-white mt-2 drop-shadow-md">Rp {{ formatRp(labaRugiRiil) }}</p>
                <div class="mt-4 flex items-center gap-2">
                  <span class="bg-slate-800 border border-slate-700 text-[9px] text-slate-300 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Formula Akuntansi</span>
                  <p class="text-[10px] text-slate-400 font-medium">Pertumbuhan Ekuitas + Total Prive</p>
                </div>
              </div>
              <svg class="absolute right-0 top-0 h-32 w-32 text-white/5 translate-x-4 translate-y-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
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
        <div class="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div class="px-6 py-5 border-b border-slate-100 bg-white">
            <h3 class="text-sm font-black uppercase tracking-wider text-slate-700">Riwayat Tutup Buku</h3>
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