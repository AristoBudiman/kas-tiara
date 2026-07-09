<script setup>
import { ref, computed, onMounted } from 'vue'
import { Lock, TrendingUp, ExternalLink } from 'lucide-vue-next'

const liveData = ref({ total_kas: 0, total_piutang: 0, piutang_reguler: 0, piutang_pesanan: 0, total_persediaan: 0, total_hutang: 0, aset_bersih: 0 })
const prive = ref(0)
const bulanLalu = ref(null)
const riwayat = ref([])
const isLoading = ref(false)

const showModalRincian = ref(false)
const rincianType = ref('') // 'piutang' or 'hutang'
const rincianData = ref([])
const rincianSortBy = ref('tanggal')
const sortedRincianData = computed(() => {
  const data = [...rincianData.value]
  if (rincianSortBy.value === 'toko') {
    return data.sort((a, b) => {
      const mitraA = a.mitra || ''
      const mitraB = b.mitra || ''
      if (mitraA < mitraB) return -1
      if (mitraA > mitraB) return 1
      return new Date(b.tanggal) - new Date(a.tanggal)
    })
  }
  return data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
})
const isLoadingRincian = ref(false)

const showModalKas = ref(false)
const rincianKas = ref({ saldo_awal: 0, mutasi: [], saldo_akhir: 0 })
const isLoadingKas = ref(false)

import { getWIBDateString } from '../utils/date'

const today = new Date();
const localTodayStr = getWIBDateString(today);
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const localFirstDayStr = getWIBDateString(firstDay);

const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
const localLastYearStr = getWIBDateString(lastYear);

const selectedDate = ref(localTodayStr)
const startPriveDate = ref(localFirstDayStr)

const startHistoryDate = ref(localLastYearStr)
const endHistoryDate = ref(localTodayStr)

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

    let historyUrl = `${import.meta.env.VITE_API_URL}/api/aset/riwayat`
    if (startHistoryDate.value && endHistoryDate.value) {
      historyUrl += `?start_date=${startHistoryDate.value}&end_date=${endHistoryDate.value}`
    }
    const resRiwayat = await fetch(historyUrl, {
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

const openRincian = async (type) => {
  rincianType.value = type
  showModalRincian.value = true
  isLoadingRincian.value = true
  try {
    const token = localStorage.getItem('admin_token') || ''
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/rincian?date=${selectedDate.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      rincianData.value = type === 'piutang' ? data.piutang || [] : data.hutang || []
      rincianSortBy.value = 'tanggal' // Reset to default when opening
    }
  } catch (e) {
    console.error("Gagal menarik rincian aset:", e)
  } finally {
    isLoadingRincian.value = false
  }
}

const openRincianKas = async () => {
  showModalKas.value = true
  isLoadingKas.value = true
  try {
    const token = localStorage.getItem('admin_token') || ''
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/aset/rincian-kas?start_date=${startPriveDate.value}&end_date=${selectedDate.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      rincianKas.value = {
        saldo_awal: data.saldo_awal || 0,
        mutasi: data.mutasi || [],
        saldo_akhir: data.saldo_akhir || 0
      }
    }
  } catch (e) {
    console.error("Gagal menarik rincian kas:", e)
  } finally {
    isLoadingKas.value = false
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
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 hidden sm:block">Posisi Aset Per:</span>
          <input type="date" v-model="selectedDate" @change="fetchAset" class="text-xs font-bold text-slate-700 outline-none bg-transparent">
        </div>
        <div class="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-inner focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow" title="Tanggal mulai untuk menghitung total akumulasi Prive">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 hidden sm:block">Mulai Prive:</span>
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
          <div @click="openRincianKas" class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-all hover:-translate-y-1 group relative">
            <div class="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors flex items-center">Kas Tunai <ExternalLink :size="10" class="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" /></p>
            <p class="text-xl font-black text-slate-800 mt-1 relative">Rp {{ formatRp(liveData.total_kas) }}</p>
          </div>
          <div @click="openRincian('piutang')" class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-all hover:-translate-y-1 group relative">
            <div class="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors flex items-center">Piutang Dagang <ExternalLink :size="10" class="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" /></p>
            <p class="text-xl font-black text-slate-800 mt-1 relative">Rp {{ formatRp(liveData.total_piutang) }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Persediaan Barang</p>
            <p class="text-xl font-black text-slate-800 mt-1">Rp {{ formatRp(liveData.total_persediaan) }}</p>
          </div>
          <div @click="openRincian('hutang')" class="bg-rose-50/30 p-5 rounded-2xl border border-rose-100 shadow-sm cursor-pointer hover:bg-rose-50 transition-all hover:-translate-y-1 group relative">
            <div class="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
            <p class="text-[10px] font-black text-rose-500 uppercase tracking-wider group-hover:text-rose-600 transition-colors flex items-center">Hutang Dagang (-) <ExternalLink :size="10" class="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" /></p>
            <p class="text-xl font-black text-rose-700 mt-1 relative">Rp {{ formatRp(liveData.total_hutang) }}</p>
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
          <div class="px-6 py-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 class="text-sm font-black uppercase tracking-wider text-slate-700">Riwayat Tutup Buku</h3>
            <div class="flex flex-wrap gap-2">
              <input type="date" v-model="startHistoryDate" @change="fetchAset" class="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
              <span class="text-slate-400 font-bold self-center">-</span>
              <input type="date" v-model="endHistoryDate" @change="fetchAset" class="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
            </div>
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

    <!-- Modal Rincian -->
    <div v-if="showModalRincian" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]" @click.stop>
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="text-lg font-black text-slate-800">
              Rincian {{ rincianType === 'piutang' ? 'Piutang Dagang' : 'Hutang Dagang' }}
            </h3>
            <p class="text-xs font-medium text-slate-500 mt-0.5">Posisi Per Tanggal: <span class="font-bold text-slate-700">{{ selectedDate }}</span></p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1 border border-slate-200">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Urutkan:</span>
              <select v-model="rincianSortBy" class="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer">
                <option value="tanggal">Tanggal (Terbaru)</option>
                <option value="toko">Toko (A - Z)</option>
              </select>
            </div>
            <button @click="showModalRincian = false" class="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="isLoadingRincian" class="flex flex-col items-center justify-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-sm font-medium text-slate-500">Memuat rincian...</p>
          </div>
          
          <div v-else-if="sortedRincianData.length === 0" class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p class="text-slate-500 font-medium">Tidak ada rincian tagihan pada tanggal tersebut.</p>
          </div>
          
          <div v-else class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">No. Nota</th>
                  <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Jenis</th>
                  <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Mitra</th>
                  <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th class="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Nominal</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-slate-100">
                <tr v-for="(item, idx) in sortedRincianData" :key="idx" class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 whitespace-nowrap font-bold text-blue-600">{{ item.no_nota }}</td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span class="px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider" 
                          :class="item.jenis === 'REGULER' ? 'bg-indigo-100 text-indigo-700' : 
                                 (item.jenis === 'PESANAN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')">
                      {{ item.jenis }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-medium text-slate-700">{{ item.mitra || '-' }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-slate-600">{{ item.tanggal }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-800">Rp {{ formatRp(item.nominal) }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-slate-50 font-black border-t-2 border-slate-200">
                <tr>
                  <td colspan="4" class="px-4 py-3 text-right text-slate-600">Total Keseluruhan:</td>
                  <td class="px-4 py-3 text-right text-slate-900 text-base">
                    Rp {{ formatRp(sortedRincianData.reduce((acc, curr) => acc + curr.nominal, 0)) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Mutasi Kas -->
    <div v-if="showModalKas" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]" @click.stop>
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="text-lg font-black text-slate-800 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Buku Mutasi Kas Berjalan
            </h3>
            <p class="text-xs font-medium text-slate-500 mt-0.5">Rentang: <span class="font-bold text-slate-700">{{ startPriveDate }}</span> s/d <span class="font-bold text-slate-700">{{ selectedDate }}</span></p>
          </div>
          <button @click="showModalKas = false" class="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="isLoadingKas" class="flex flex-col items-center justify-center py-10">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
            <p class="text-sm font-medium text-slate-500">Menarik mutasi kas...</p>
          </div>
          
          <div v-else>
            <!-- Highlight Saldo Awal -->
            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex justify-between items-center shadow-sm">
              <span class="text-xs font-black text-indigo-700 uppercase tracking-widest">Saldo Awal (Tepat Sebelum {{ startPriveDate }})</span>
              <span class="text-xl font-black text-indigo-900">Rp {{ formatRp(rincianKas.saldo_awal) }}</span>
            </div>

            <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table class="min-w-full divide-y divide-slate-200 text-sm">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal</th>
                    <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th class="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Keterangan</th>
                    <th class="px-4 py-3 text-right text-xs font-black text-emerald-600 uppercase tracking-wider">Masuk</th>
                    <th class="px-4 py-3 text-right text-xs font-black text-rose-500 uppercase tracking-wider">Keluar</th>
                    <th class="px-4 py-3 text-right text-xs font-black text-blue-600 uppercase tracking-wider">Saldo</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-100">
                  <tr v-if="!rincianKas.mutasi || rincianKas.mutasi.length === 0">
                    <td colspan="6" class="px-4 py-10 text-center text-slate-400 font-medium">Tidak ada transaksi kas di rentang waktu ini.</td>
                  </tr>
                  <tr v-for="(item, idx) in rincianKas.mutasi" :key="idx" class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">{{ item.tanggal }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span class="px-2 py-1 text-[9px] font-bold rounded-md uppercase tracking-wider bg-slate-100 text-slate-600">{{ item.kategori }}</span>
                    </td>
                    <td class="px-4 py-3 font-medium text-slate-700 text-xs">{{ item.keterangan || '-' }}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-right font-bold text-emerald-600">
                      {{ item.jenis === 'MASUK' ? '+ Rp ' + formatRp(item.nominal) : '-' }}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right font-bold text-rose-500">
                      {{ item.jenis === 'KELUAR' ? '- Rp ' + formatRp(item.nominal) : '-' }}
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-right font-bold text-blue-700">Rp {{ formatRp(item.saldo_berjalan) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Highlight Saldo Akhir -->
            <div class="mt-4 bg-slate-900 rounded-xl p-4 flex justify-between items-center shadow-lg relative overflow-hidden">
              <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/30 rounded-full blur-xl"></div>
              <span class="text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Saldo Akhir (Per {{ selectedDate }})</span>
              <span class="text-2xl font-black text-white relative z-10">Rp {{ formatRp(rincianKas.saldo_akhir) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>