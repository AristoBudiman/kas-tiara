<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const router = useRouter()

// --- STATE SAKLAR KAS ---
const role = ref(localStorage.getItem('admin_role') || '')
const isKasActive = ref(false)

const fetchStatusKas = async () => {
  const token = localStorage.getItem('admin_token')
  if (!token) return
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pengaturan/kas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      isKasActive.value = data.is_active
    }
  } catch (err) {
    console.error(err)
  }
}

const toggleKas = async () => {
  if (!confirm(`Yakin ingin ${isKasActive.value ? 'MEMATIKAN' : 'MENYALAKAN'} sinkronisasi Kas Otomatis dari Nota/Inventory?`)) return

  const token = localStorage.getItem('admin_token')
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pengaturan/kas`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ is_active: !isKasActive.value })
    })
    
    if (res.ok) {
      const data = await res.json()
      isKasActive.value = data.is_active
    }
  } catch (err) {
    console.error(err)
  }
}

// --- PENGATURAN TANGGAL & FILTER ---
const getLocalDateString = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
const today = new Date()

// Set default ke tanggal 1 bulan berjalan
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const startDate = ref(getLocalDateString(firstDayOfMonth))
const endDate = ref(getLocalDateString(today))

// --- STATE ---
const totalKasFisik = ref(0) 
const listKasAll = ref([]) 
const showForm = ref(false)

const form = ref({
  tanggal: getLocalDateString(today),
  jam: '',
  kategori: 'RUMAH_TANGGA',
  jenis: 'MASUK',
  nominal: 0,
  keterangan: '',
  no_nota_ref: '',
  toko_ref: ''
})

const getWIBTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })

// --- LOGIKA DATA ---
const filteredKas = computed(() => {
  return listKasAll.value.filter(k => {
    if (!k.tanggal) return false
    const tgl = k.tanggal.split('T')[0]
    const start = startDate.value || '1970-01-01'
    const end = endDate.value || '9999-12-31'
    return tgl >= start && tgl <= end
  })
})

const chartPemasukan = computed(() => {
  const data = filteredKas.value.filter(d => d.jenis === 'MASUK')
  const reguler = data.filter(d => d.kategori === 'REGULER').reduce((s, i) => s + i.nominal, 0)
  const pesanan = data.filter(d => d.kategori === 'PESANAN').reduce((s, i) => s + i.nominal, 0)
  const lainnya = data.filter(d => d.kategori !== 'REGULER' && d.kategori !== 'PESANAN').reduce((s, i) => s + i.nominal, 0)
  return { 
    labels: ['Reguler', 'Pesanan', 'Lainnya'], 
    datasets: [{ 
      data: [reguler, pesanan, lainnya], 
      backgroundColor: ['#2563eb', '#0ea5e9', '#10b981'], 
      borderWidth: 0
    }] 
  }
})

const chartPengeluaran = computed(() => {
  const data = filteredKas.value.filter(d => d.jenis === 'KELUAR')
  const bahan = data.filter(d => d.kategori === 'BAHAN').reduce((s, i) => s + i.nominal, 0)
  const rt = data.filter(d => d.kategori === 'RUMAH_TANGGA').reduce((s, i) => s + i.nominal, 0)
  const gaji = data.filter(d => d.kategori === 'GAJIAN').reduce((s, i) => s + i.nominal, 0)
  const kasbon = data.filter(d => d.kategori === 'KASBON').reduce((s, i) => s + i.nominal, 0)
  const lainnya = data.filter(d => !['BAHAN', 'RUMAH_TANGGA', 'GAJIAN', 'KASBON'].includes(d.kategori)).reduce((s, i) => s + i.nominal, 0)
  
  return { 
    labels: ['Bahan Baku', 'Rumah Tangga', 'Gaji', 'Kasbon', 'Lainnya'], 
    datasets: [{ 
      data: [bahan, rt, gaji, kasbon, lainnya], 
      backgroundColor: ['#e11d48', '#f59e0b', '#8b5cf6', '#eab308', '#94a3b8'],
      borderWidth: 0
    }] 
  }
})

const chartOptions = { 
  responsive: true, 
  maintainAspectRatio: false, 
  plugins: { 
    legend: { 
      position: 'bottom', 
      labels: { color: '#475569', usePointStyle: true, boxWidth: 8 } 
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return ` ${label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
        }
      }
    }
  },
  cutout: '70%'
}

// --- ACTIONS ---
const fetchKas = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/kas`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    })
    
    if (res.status === 401) {
      localStorage.clear()
      router.push('/login')
      return
    }
    
    const data = await res.json()
    listKasAll.value = Array.isArray(data) ? data : []
    
    const masuk = listKasAll.value.filter(d => d.jenis === 'MASUK').reduce((s, i) => s + i.nominal, 0)
    const keluar = listKasAll.value.filter(d => d.jenis === 'KELUAR').reduce((s, i) => s + i.nominal, 0)
    totalKasFisik.value = masuk - keluar
  } catch (err) { 
    console.error(err) 
  }
}

const simpanTransaksi = async () => {
  const ketLengkap = form.value.toko_ref ? `Toko: ${form.value.toko_ref} - ${form.value.keterangan}` : form.value.keterangan
  const ketAkhir = `[${form.value.jam} WIB] ${ketLengkap}`
  const payload = { ...form.value, keterangan: ketAkhir }
  
  try {
    const token = localStorage.getItem('admin_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/kas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      showForm.value = false
      fetchKas()
      form.value = { 
        tanggal: getLocalDateString(new Date()), 
        jam: '', 
        kategori: 'RUMAH_TANGGA', 
        jenis: 'MASUK', 
        nominal: 0, 
        keterangan: '', 
        no_nota_ref: '', 
        toko_ref: '' 
      }
    }
  } catch (err) { 
    console.error(err) 
  }
}

const hapusKas = async (id) => {
  if(confirm("Apakah Anda yakin ingin menghapus catatan kas ini? Saldo akan disesuaikan secara otomatis.")) {
    const token = localStorage.getItem('admin_token')
    await fetch(`${import.meta.env.VITE_API_URL}/api/kas/${id}`, { 
      method: 'DELETE', 
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchKas()
  }
}

const openForm = (jenis) => { 
  form.value.jenis = jenis; 
  form.value.jam = getWIBTime(); 
  showForm.value = true 
}

const cetakRiwayat = () => {
  window.print()
}

onMounted(() => {
  fetchKas()
  if (role.value === 'superadmin') {
    fetchStatusKas()
  }
})
</script>

<template>
  <div class="space-y-6">
    
    <div v-if="role === 'superadmin'" class="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 no-print">
      <div class="flex flex-col">
        <span class="text-sm font-semibold text-slate-800">Automasi Brankas</span>
        <span class="text-xs text-slate-500">Sinkronisasi mutasi kas otomatis dari nota/inventory</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium" :class="isKasActive ? 'text-emerald-600' : 'text-slate-500'">
          {{ isKasActive ? 'Aktif' : 'Nonaktif' }}
        </span>
        <button @click="toggleKas" 
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                :class="isKasActive ? 'bg-emerald-500' : 'bg-slate-300'">
          <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="isKasActive ? 'translate-x-5' : 'translate-x-0'"></span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
      <div class="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-center relative overflow-hidden">
        <div class="relative z-10">
          <p class="text-sm font-medium text-slate-500 uppercase tracking-wide">Saldo Kas Berjalan</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-2xl font-semibold text-slate-400">Rp</span>
            <span class="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              {{ totalKasFisik.toLocaleString('id-ID') }}
            </span>
          </div>
        </div>
        <svg class="absolute right-0 top-0 h-full w-48 text-slate-50 translate-x-10 transform" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.64-2.25 1.64-1.74 0-2.26-.95-2.32-1.81H7.84c.04 1.52 1.05 2.81 2.7 3.11V19h2.36v-1.64c1.65-.37 2.86-1.38 2.86-2.98 0-2.16-1.78-2.74-3.45-3.24z"/>
        </svg>
      </div>

      <div class="flex flex-col gap-3">
        <button @click="openForm('MASUK')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm shadow-sm flex items-center justify-center gap-2 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Catat Penerimaan
        </button>
        <button @click="openForm('KELUAR')" class="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl font-medium text-sm shadow-sm flex items-center justify-center gap-2 transition-colors">
          <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
          Catat Pengeluaran
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 no-print">
      <div class="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 rounded-t-xl">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analisis Dari:</span>
            <input type="date" v-model="startDate" class="text-sm border border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-3 font-bold text-slate-700 outline-none">
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sampai:</span>
            <input type="date" v-model="endDate" class="text-sm border border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-3 font-bold text-slate-700 outline-none">
          </div>
        </div>
        <button @click="cetakRiwayat" class="bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm">
          🖨️ Cetak Laporan
        </button>
      </div>
      
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div class="pt-4 md:pt-0">
          <h4 class="text-center text-slate-700 font-semibold mb-4 text-sm">Distribusi Pemasukan</h4>
          <div class="h-64">
            <Doughnut :data="chartPemasukan" :options="chartOptions" />
          </div>
        </div>
        <div class="pt-8 md:pt-0 pl-0 md:pl-8">
          <h4 class="text-center text-slate-700 font-semibold mb-4 text-sm">Distribusi Pengeluaran</h4>
          <div class="h-64">
            <Doughnut :data="chartPengeluaran" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden print-area">
      <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white no-print">
        <h3 class="text-base font-semibold text-slate-800">Riwayat Mutasi Brankas</h3>
      </div>
      
      <div class="hidden print:block p-6 text-center border-b-2 border-slate-800 mb-4">
        <h1 class="text-2xl font-black uppercase tracking-widest text-slate-900">Laporan Mutasi Brankas</h1>
        <p class="font-bold text-slate-600 mt-1">Periode: {{ startDate }} s/d {{ endDate }}</p>
      </div>

      <div class="print:overflow-visible overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Waktu</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Referensi</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rincian</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Nominal</th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider no-print">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-if="filteredKas.length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-slate-500 text-sm italic">Tidak ada transaksi ditemukan pada periode ini.</td>
            </tr>
            <tr v-for="k in filteredKas" :key="k.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                {{ k.tanggal ? k.tanggal.split('T')[0] : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                {{ k.no_nota_ref || '-' }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mr-2 border" 
                        :class="k.jenis === 'MASUK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                    {{ k.kategori.replace('_', ' ') }}
                  </span>
                  <span class="text-slate-600 truncate max-w-xs print:whitespace-normal print:max-w-none">{{ k.keterangan }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right font-semibold" :class="k.jenis === 'MASUK' ? 'text-emerald-600' : 'text-slate-900'">
                {{ k.jenis === 'MASUK' ? '+' : '-' }} Rp {{ k.nominal.toLocaleString('id-ID') }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium no-print">
                <button @click="hapusKas(k.id)" class="text-slate-400 hover:text-rose-600 transition-colors" title="Hapus Data">
                  <svg class="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-100 overflow-y-auto no-print" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-slate-900/60 transition-opacity backdrop-blur-sm" @click="showForm = false" aria-hidden="true"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-slate-200">
          <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center" :class="form.jenis === 'MASUK' ? 'bg-emerald-50' : 'bg-rose-50'">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg" :class="form.jenis === 'MASUK' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'">
                <svg v-if="form.jenis === 'MASUK'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 leading-none" id="modal-title">
                  Catat {{ form.jenis === 'MASUK' ? 'Penerimaan' : 'Pengeluaran' }}
                </h3>
                <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Kas Internal Tiara Bakery</p>
              </div>
            </div>
            <button @click="showForm = false" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="px-6 py-6 space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tanggal Transaksi</label>
                <input type="date" v-model="form.tanggal" class="w-full border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-900">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Jam (Sesuai WIB)</label>
                <input type="text" v-model="form.jam" readonly class="w-full border border-slate-200 bg-slate-50 rounded-lg py-2 px-3 text-slate-500 text-sm cursor-not-allowed">
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Kategori Kas</label>
              <select v-model="form.kategori" class="w-full border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-900 bg-white">
                <option value="REGULER">Kas Reguler</option>
                <option value="PESANAN">Kas Pesanan</option>
                <option value="BAHAN">Pengeluaran Bahan</option>
                <option value="RUMAH_TANGGA">Rumah Tangga (Prive)</option>
                <option value="GAJIAN">Gaji Karyawan</option>
                <option value="KASBON">Kasbon / Pinjaman</option>
                <option value="SALDO_AWAL">Saldo Awal / Opname</option>
              </select>
            </div>
            
            <div v-if="form.kategori === 'PESANAN' || form.kategori === 'REGULER'" class="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div>
                <label class="block text-[10px] font-bold text-blue-700 uppercase mb-1">No. Referensi</label>
                <input type="text" v-model="form.no_nota_ref" class="w-full border border-blue-200 rounded-md py-1.5 px-3 text-xs focus:border-blue-500 outline-none" placeholder="NT/..">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-blue-700 uppercase mb-1">Nama Relasi</label>
                <input type="text" v-model="form.toko_ref" class="w-full border border-blue-200 rounded-md py-1.5 px-3 text-xs focus:border-blue-500 outline-none" placeholder="Contoh: Toko Maju">
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nominal Transaksi (Rp)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-slate-400 font-bold sm:text-sm">Rp</span>
                </div>
                <input type="number" v-model.number="form.nominal" class="w-full border border-slate-300 rounded-lg py-3 pl-10 pr-3 focus:ring-2 focus:ring-blue-600 outline-none text-xl font-bold text-slate-900" placeholder="0">
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Keterangan Tambahan</label>
              <textarea v-model="form.keterangan" rows="2" class="w-full border border-slate-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900" placeholder="Contoh: Pembelian tepung terigu 10 sak..."></textarea>
            </div>
          </div>
          
          <div class="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <button @click="showForm = false" type="button" class="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
              Batal
            </button>
            <button @click="simpanTransaksi" type="button" 
                    class="px-6 py-2.5 rounded-lg shadow-sm text-sm font-bold text-white transition-all transform active:scale-95 focus:ring-2 focus:ring-offset-2" 
                    :class="form.jenis === 'MASUK' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'">
              Simpan Transaksi
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
@media print {

  /* 1. Basmi elemen header/navigasi yang bukan milik komponen ini */
  header, nav, .flex.justify-between.items-center.border-b { 
    display: none !important; 
  }
  
  /* 2. Paksa tabel agar muat di mode Portrait */
  .print-area table {
    width: 100% !important;
    table-layout: fixed !important;
  }

  .print-area th, .print-area td {
    white-space: normal !important;
    word-wrap: break-word !important;
    font-size: 11px !important; /* Perkecil font sedikit agar lega */
    padding-left: 6px !important;
    padding-right: 6px !important;
  }

  /* Sembunyikan semua elemen yang memiliki class no-print */
  .no-print, nav {
    display: none !important;
  }

  /* Rapikan layout untuk kertas PDF */
  body {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important; 
    print-color-adjust: exact !important;
  }

  .min-h-screen {
    background: white !important;
  }

  .space-y-6 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0 !important;
  }

  /* Area tabel riwayat mengambil full width dan hapus border kotak luar */
  .print-area {
    border: none !important;
    box-shadow: none !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Pastikan warna teks tabel tetap jelas */
  .bg-slate-50 { background-color: #f8fafc !important; }
  .text-emerald-600 { color: #059669 !important; }
  .text-rose-600 { color: #e11d48 !important; }

  /* 3. Atur proporsi lebar kolom secara matematis untuk kertas A4 */
  .print-area th:nth-child(1) { width: 15% !important; } /* Waktu */
  .print-area th:nth-child(2) { width: 22% !important; } /* Referensi */
  .print-area th:nth-child(3) { width: 45% !important; } /* Rincian (Paling Lebar) */
  .print-area th:nth-child(4) { width: 18% !important; } /* Nominal */
  
  @page {
    margin: 1cm;
  }
}
</style>