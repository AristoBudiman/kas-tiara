<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { 
  Receipt, ClipboardList, Trash2, Calendar, Flag, Inbox, 
  Sparkles, Coins, ShoppingCart, Plus, X, ChevronDown 
} from 'lucide-vue-next'

const today = new Date()
const year = today.getFullYear()
const month = String(today.getMonth() + 1).padStart(2, '0')
const day = String(today.getDate()).padStart(2, '0')

const defaultStart = `${year}-${month}-01`
const defaultEnd = `${year}-${month}-${day}`

const startDate = ref(defaultStart)
const endDate = ref(defaultEnd)

const listBelanja = ref([])
const listBahan = ref([])
const isFetching = ref(false)

const viewMode = ref('aktif') 

const showLunasModal = ref(false)
const notaToLunas = ref(null)
const tanggalLunas = ref(defaultEnd)

// ==========================================
// MENGAMBIL DATA RIWAYAT BELANJA
// ==========================================
const fetchBelanja = async () => {
  isFetching.value = true
  const token = localStorage.getItem('admin_token')
  
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian?start=${startDate.value}&end=${endDate.value}&status=${viewMode.value}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  if (res.ok) listBelanja.value = await res.json() || []
  isFetching.value = false
}

// ==========================================
// MENGAMBIL DATA KATALOG BAHAN UNTUK KERANJANG
// ==========================================
const fetchBahan = async () => {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bahan`, { headers: { 'Authorization': `Bearer ${token}` } })
  if (res.ok) listBahan.value = await res.json()
}

// ==========================================
// AKSI RIWAYAT BELANJA (LUNAS, HAPUS, PULIHKAN)
// ==========================================
const pulihkanPembelian = async (id) => {
  if(await window.$dialog.confirm('♻️ PULIHKAN NOTA INI?\n\n- Stok bahan akan DITAMBAHKAN kembali ke gudang.\n- Saldo Kas akan DIPOTONG kembali (jika nota ini Lunas).')) {
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian/${id}/pulihkan`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if(res.ok) {
        await window.$dialog.alert('Data berhasil dipulihkan dan masuk ke laporan aktif!')
        fetchBelanja() 
      } else {
        await window.$dialog.alert('Gagal memulihkan nota.')
      }
    } catch (err) {
      await window.$dialog.alert('Error server.')
    }
  }
}

const toggleStatusBayar = async (b) => {
  if (b.is_lunas) {
    if (await window.$dialog.confirm('Membatalkan lunas (mengubah jadi HUTANG)? Uang akan ditarik kembali ke Kas.')) {
      eksekusiStatusBayar(b, false, null)
    }
  } else {
    notaToLunas.value = b
    tanggalLunas.value = defaultEnd
    showLunasModal.value = true
  }
}

const eksekusiStatusBayar = async (b, targetLunas, tglLunas) => {
  const token = localStorage.getItem('admin_token')
  const payload = { is_lunas: targetLunas }
  if (targetLunas && tglLunas) {
    payload.tanggal_lunas = tglLunas
  }
  
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian/${b.ID}/status`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(payload)
  })
  
  if(res.ok) {
    showLunasModal.value = false
    fetchBelanja() 
  }
}

const konfirmasiLunas = () => {
  if (notaToLunas.value) {
    eksekusiStatusBayar(notaToLunas.value, true, tanggalLunas.value)
  }
}

const hapusPembelian = async (id) => {
  if(await window.$dialog.confirm('HAPUS PERMANEN NOTA INI?\n\n- Stok bahan ini di gudang akan otomatis DIKURANGI.\n- Uang Kas akan DIKEMBALIKAN (Jika statusnya lunas).')) {
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if(res.ok) {
        await window.$dialog.alert('Nota pembelian berhasil dihapus & stok disesuaikan!')
        fetchBelanja()
      } else {
        await window.$dialog.alert('Gagal menghapus data pembelian.')
      }
    } catch (err) {
      await window.$dialog.alert('Error server.')
    }
  }
}

const formatRp = (val) => new Intl.NumberFormat('id-ID').format(val || 0)
const formatTanggal = (tgl) => new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
const grandTotal = computed(() => listBelanja.value.reduce((sum, item) => sum + item.total_biaya, 0))

// ==========================================
// STATE & LOGIKA KERANJANG BELANJA
// ==========================================
const showModalBeli = ref(false)
const formBeli = ref({ tanggal: new Date().toISOString().split('T')[0], tanggal_lunas: new Date().toISOString().split('T')[0], keterangan: '', is_lunas: true, details: [] })
const tempBeli = ref({ bahan_id: '', qty: '', subtotal: '' }) 
const tempSatuanPilihan = ref(null)

const searchBahan = ref('')
const isDropdownOpen = ref(false)

const filteredBahan = computed(() => {
  if (!searchBahan.value) return listBahan.value
  return listBahan.value.filter(b => b.nama_bahan.toLowerCase().includes(searchBahan.value.toLowerCase()))
})

const pilihBahan = (b) => {
  tempBeli.value.bahan_id = b.ID
  tempSatuanPilihan.value = { nama: b.satuan, nilai: 1, is_dasar: true }
  searchBahan.value = b.nama_bahan
  isDropdownOpen.value = false
}

const opsiSatuanAktif = computed(() => {
  if (!tempBeli.value.bahan_id) return []
  const bahan = listBahan.value.find(b => b.ID === tempBeli.value.bahan_id)
  if (!bahan) return []
  
  const opsi = [{ nama: bahan.satuan, nilai: 1, is_dasar: true }]
  if (bahan.konversi) {
    bahan.konversi.forEach(k => {
      opsi.push({ nama: k.nama_satuan, nilai: k.nilai_konversi, is_dasar: false })
    })
  }
  return opsi
})

const bukaModalBeli = () => { 
  formBeli.value = { tanggal: new Date().toISOString().split('T')[0], tanggal_lunas: new Date().toISOString().split('T')[0], keterangan: '', is_lunas: true, details: [] }
  tempBeli.value = { bahan_id: '', qty: '', subtotal: '' }
  searchBahan.value = ''
  showModalBeli.value = true 
}

const tambahKeKeranjang = () => {
  if (!tempBeli.value.bahan_id || !tempBeli.value.qty || !tempBeli.value.subtotal) {
    return window.$dialog.alert('Harap isi Bahan, Qty, dan Subtotal Biaya!')
  }
  const bahan = listBahan.value.find(x => x.ID === tempBeli.value.bahan_id)
  
  const qtyInput = parseFloat(tempBeli.value.qty)
  const nilaiKonversi = tempSatuanPilihan.value.nilai
  const qtyDasar = qtyInput * nilaiKonversi

  formBeli.value.details.push({
    bahan_id: tempBeli.value.bahan_id,
    nama_bahan: bahan.nama_bahan,
    satuan: bahan.satuan,
    qty: qtyDasar,
    subtotal: tempBeli.value.subtotal,
    harga_beli_satuan: tempBeli.value.subtotal / qtyDasar,
    qty_input: qtyInput,
    satuan_input: tempSatuanPilihan.value.nama
  })
  tempBeli.value = { bahan_id: '', qty: '', subtotal: '' }
  searchBahan.value = ''
}

const hapusDariKeranjang = (index) => {
  formBeli.value.details.splice(index, 1)
}

const tempHPP = computed(() => {
  if (tempBeli.value.qty > 0 && tempBeli.value.subtotal > 0) {
    const qtyDasar = tempBeli.value.qty * (tempSatuanPilihan.value?.nilai || 1)
    return tempBeli.value.subtotal / qtyDasar
  }
  return 0
})

const grandTotalBelanja = computed(() => {
  return formBeli.value.details.reduce((sum, item) => sum + item.subtotal, 0)
})

const simpanPembelian = async () => {
  if (formBeli.value.details.length === 0) return window.$dialog.alert('Keranjang belanja masih kosong!')
  
  const payload = {
    tanggal: formBeli.value.tanggal,
    tanggal_lunas: formBeli.value.tanggal_lunas,
    keterangan: formBeli.value.keterangan,
    is_lunas: formBeli.value.is_lunas,
    details: formBeli.value.details
  }

  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pembelian`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
      body: JSON.stringify(payload) 
  })
  
  if (res.ok) { 
    await window.$dialog.alert('Struk belanja berhasil dicatat!\n\nStok gudang telah terupdate & saldo kas telah dipotong.')
    showModalBeli.value = false
    fetchBelanja() 
  } else {
    await window.$dialog.alert('Gagal mencatat belanja ke database.')
  }
}

watch([showModalBeli], ([isOpenBeli]) => {
  if (isOpenBeli) {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }
})
onUnmounted(() => { 
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
})

onMounted(() => {
  fetchBelanja()
  fetchBahan()
})
</script>

<template>
  <div class="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 gap-6">
      <div class="flex items-center gap-5">
        <div class="bg-linear-to-br from-sky-400 to-sky-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-200 shrink-0 text-white">
          <ShoppingCart :size="32" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">Belanja Kas</h1>
          <p class="text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-sky-500"></span>
            Catat struk belanja bahan baku dari pos kas
          </p>
        </div>
      </div>

      <!-- Action & View Mode Tabs -->
      <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
        <button @click="bukaModalBeli()" class="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap active:scale-95">
          <Plus :size="20" /> Catat Struk Belanja
        </button>

        <div class="bg-slate-100 p-1.5 rounded-xl flex shadow-inner border border-slate-200/60">
          <button @click="viewMode = 'aktif'; fetchBelanja()" 
                  :class="viewMode === 'aktif' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-500 font-bold hover:text-slate-700'" 
                  class="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2">
            <ClipboardList :size="18" /> Aktif
          </button>
          <button @click="viewMode = 'sampah'; fetchBelanja()" 
                  :class="viewMode === 'sampah' ? 'bg-rose-500 text-white shadow-md font-black' : 'text-slate-500 font-bold hover:text-slate-700'" 
                  class="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2">
            <Trash2 :size="18" /> Terhapus
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="bg-white p-2 md:p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-3">
      <div class="w-full flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200/60 focus-within:ring-2 focus-within:ring-sky-500 transition-shadow">
        <Calendar :size="20" class="text-slate-400 mr-3" />
        <div class="flex-1 flex items-center">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 w-12 hidden sm:block">Mulai</span>
          <input type="date" v-model="startDate" @change="fetchBelanja" class="w-full bg-transparent border-none p-2 font-bold text-slate-700 outline-none cursor-pointer focus:ring-0">
        </div>
      </div>
      
      <div class="hidden md:flex items-center justify-center text-slate-300 px-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
      </div>

      <div class="w-full flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-200/60 focus-within:ring-2 focus-within:ring-sky-500 transition-shadow">
        <Flag :size="20" class="text-slate-400 mr-3" />
        <div class="flex-1 flex items-center">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-3 w-12 hidden sm:block">Sampai</span>
          <input type="date" v-model="endDate" @change="fetchBelanja" class="w-full bg-transparent border-none p-2 font-bold text-slate-700 outline-none cursor-pointer focus:ring-0">
        </div>
      </div>
    </div>

    <!-- Data Table Riwayat Belanja -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full min-w-max text-left border-collapse">
          <thead class="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Nota & Tanggal</th>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap text-center">Item Belanja</th>
              <th class="py-5 px-6 text-right font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Total Biaya</th>
              <th class="py-5 px-6 text-center font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Status</th>
              <th class="py-5 px-6 text-center font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          
          <tbody v-if="listBelanja.length > 0">
            <template v-for="nota in listBelanja" :key="nota.ID">
              <tr class="group hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                <td class="py-4 px-6 align-top">
                  <div class="flex items-start gap-3">
                    <div class="bg-sky-50 text-sky-600 p-2 rounded-lg mt-0.5"><Receipt :size="16" /></div>
                    <div>
                      <p class="font-black text-slate-800 text-sm">#BELI-{{ nota.ID }}</p>
                      <p class="text-xs font-bold text-slate-500 mt-1">{{ formatTanggal(nota.tanggal) }}</p>
                      <p class="text-[10px] font-bold text-slate-400 uppercase mt-2 bg-slate-100 inline-block px-2 py-0.5 rounded-md">{{ nota.keterangan || 'Tanpa catatan' }}</p>
                    </div>
                  </div>
                </td>
                
                <td class="py-4 px-6 align-top">
                  <div class="space-y-3">
                    <div v-for="d in nota.details" :key="d.ID" class="flex justify-between items-center text-sm bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <div class="flex items-center gap-3 pr-4">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <div>
                          <p class="font-bold text-slate-700">{{ d.bahan?.nama_bahan || 'Bahan Terhapus' }}</p>
                          <p class="text-xs text-slate-400 font-medium mt-0.5">{{ d.qty }} <span class="uppercase text-[10px] font-bold ml-0.5">{{ d.bahan?.satuan || '-' }}</span> &times; Rp {{ formatRp(d.harga_beli_satuan) }}</p>
                        </div>
                      </div>
                      <span class="font-black text-slate-700 text-right shrink-0">Rp {{ formatRp(d.subtotal) }}</span>
                    </div>
                  </div>
                </td>
                
                <td class="py-4 px-6 align-top text-right">
                  <div class="inline-flex flex-col items-end">
                    <span class="text-sm font-bold text-slate-400 mb-1">Grand Total</span>
                    <span class="font-black text-sky-600 text-lg bg-sky-50 px-3 py-1 rounded-lg border border-sky-100/50">Rp {{ formatRp(nota.total_biaya) }}</span>
                  </div>
                </td>
                
                <td class="py-4 px-6 align-top text-center">
                  <div v-if="nota.is_lunas" class="flex flex-col items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-200/50">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> LUNAS
                    </span>
                    <button v-if="viewMode === 'aktif'" @click="toggleStatusBayar(nota)" class="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-2 transition-colors">Batal Lunas</button>
                  </div>
                  <div v-else class="flex flex-col items-center gap-2">
                    <span class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-200/50">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> HUTANG
                    </span>
                    <button v-if="viewMode === 'aktif'" @click="toggleStatusBayar(nota)" class="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-transform active:scale-95 shadow-sm">Tandai Lunas</button>
                  </div>
                </td>

                <td class="py-4 px-6 align-top text-center">
                    <button v-if="viewMode === 'aktif'" @click="hapusPembelian(nota.ID)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors group" title="Hapus Permanen">
                      <Trash2 :size="20" class="group-hover:scale-110 transition-transform" />
                    </button>
                    <button v-if="viewMode === 'sampah'" @click="pulihkanPembelian(nota.ID)" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors group" title="Pulihkan Nota">
                      <Sparkles :size="20" class="group-hover:scale-110 transition-transform" />
                    </button>
                </td>
              </tr>
            </template>
          </tbody>
          
          <tbody v-else>
            <tr>
              <td colspan="5" class="py-16 text-center">
                <div class="flex flex-col items-center justify-center">
                  <div class="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <Inbox v-if="viewMode === 'aktif'" :size="40" />
                    <Sparkles v-else :size="40" />
                  </div>
                  <h3 class="text-lg font-black text-slate-700 mb-1">Data Kosong</h3>
                  <p class="text-sm text-slate-400 font-medium max-w-sm">
                    {{ viewMode === 'aktif' ? 'Tidak ada catatan belanja pada rentang tanggal yang dipilih.' : 'Tempat sampah bersih.' }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>

        </table>
      </div>

      <!-- Grand Total Footer -->
      <div class="bg-slate-900 border-t border-slate-800 p-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl"></div>
        <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
        
        <div class="flex items-center gap-3 relative z-10">
          <div class="bg-slate-800 p-2 rounded-lg text-slate-300"><Coins :size="24" /></div>
          <div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Akumulasi</p>
            <p class="text-sm font-bold text-slate-300">Pengeluaran Belanja</p>
          </div>
        </div>
        <div class="relative z-10 text-center sm:text-right">
          <p class="text-3xl font-black text-white drop-shadow-md">
            Rp {{ formatRp(grandTotal) }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL KERANJANG BELANJA -->
  <div v-if="showModalBeli" class="fixed inset-0 backdrop-blur-sm bg-slate-900/40 flex justify-center items-center z-999 p-4 transition-opacity">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in ring-1 ring-gray-200">
      
      <!-- Header -->
      <div class="bg-linear-to-r from-sky-50 to-blue-50 px-6 py-5 flex justify-between items-center border-b border-gray-100 shrink-0">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-sky-100 rounded-xl text-sky-600">
            <ShoppingCart :size="24" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800 tracking-tight">Catat Struk Belanja</h2>
            <p class="text-xs font-medium text-gray-500 mt-0.5">Stok bahan akan bertambah dan kas akan terpotong secara otomatis.</p>
          </div>
        </div>
        <button @click="showModalBeli = false" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
          <X :size="20" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 flex-1 space-y-6">
        
        <!-- Nota Info -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Nota</label>
            <input type="date" v-model="formBeli.tanggal" required class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-semibold text-gray-700 shadow-sm transition-all outline-none">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Keterangan / Supplier</label>
            <input type="text" v-model="formBeli.keterangan" placeholder="Contoh: Beli di Indomaret" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium text-gray-700 shadow-sm transition-all outline-none">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status Pembayaran</label>
            <div class="flex gap-2 h-10.5">
              <label class="flex-1 flex items-center justify-center gap-1.5 cursor-pointer bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors has-checked:border-sky-500 has-checked:bg-sky-50 has-checked:ring-1 has-checked:ring-sky-500">
                <input type="radio" v-model="formBeli.is_lunas" :value="true" class="sr-only">
                <span class="w-2.5 h-2.5 rounded-full border-2 border-gray-300" :class="{ 'border-sky-500 bg-sky-500': formBeli.is_lunas }"></span>
                <span class="text-[10px] font-bold" :class="formBeli.is_lunas ? 'text-sky-700' : 'text-gray-600'">Lunas</span>
              </label>
              <label class="flex-1 flex items-center justify-center gap-1.5 cursor-pointer bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors has-checked:border-red-500 has-checked:bg-red-50 has-checked:ring-1 has-checked:ring-red-500">
                <input type="radio" v-model="formBeli.is_lunas" :value="false" class="sr-only">
                <span class="w-2.5 h-2.5 rounded-full border-2 border-gray-300" :class="{ 'border-red-500 bg-red-500': !formBeli.is_lunas }"></span>
                <span class="text-[10px] font-bold" :class="!formBeli.is_lunas ? 'text-red-700' : 'text-gray-600'">Hutang</span>
              </label>
            </div>
          </div>
          <div v-if="formBeli.is_lunas">
            <label class="block text-[11px] font-bold text-sky-600 uppercase tracking-wider mb-1.5">Tgl Pelunasan</label>
            <input type="date" v-model="formBeli.tanggal_lunas" required class="w-full bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-semibold text-sky-700 shadow-sm transition-all outline-none">
          </div>
        </div>

        <!-- Add to Cart Form -->
        <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-visible">
          <div class="absolute top-0 left-0 w-1 h-full bg-sky-500 rounded-l-2xl"></div>
          <label class="block text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-3 ml-2">Tambah Item Baru</label>
          <div class="flex flex-col md:flex-row gap-4 items-end ml-2">
            
            <div class="flex-1 relative">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cari & Pilih Bahan</label>
              <div class="relative w-full">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown class="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  v-model="searchBahan" 
                  @focus="isDropdownOpen = true" 
                  placeholder="Ketik nama bahan..." 
                  class="relative z-50 w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-semibold text-gray-700 shadow-inner transition-all outline-none"
                >

                <div v-if="isDropdownOpen" @click="isDropdownOpen = false" class="fixed inset-0 z-40 cursor-default"></div>

                <ul v-if="isDropdownOpen" class="absolute z-50 w-full bg-white border border-gray-200 shadow-2xl max-h-56 overflow-y-auto rounded-xl mt-2 custom-scrollbar overflow-hidden divide-y divide-gray-100">
                  <li class="sticky top-0 bg-gray-50/95 backdrop-blur-sm p-2 flex justify-between items-center z-10">
                     <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-2">Daftar Bahan</span>
                     <button @click.prevent="isDropdownOpen = false" class="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm border border-gray-200 transition-colors">Tutup</button>
                  </li>
                  <li 
                    v-for="b in filteredBahan" 
                    :key="b.ID" 
                    @mousedown.prevent="pilihBahan(b)"
                    class="px-4 py-3 hover:bg-sky-50 cursor-pointer text-sm font-semibold text-gray-700 transition-colors flex items-center justify-between group"
                  >
                    {{ b.nama_bahan }} 
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors">{{ b.satuan }}</span>
                  </li>
                  <li v-if="filteredBahan.length === 0" class="p-4 text-sm text-gray-400 italic text-center bg-gray-50">
                    Bahan tidak ditemukan.
                  </li>
                </ul>
              </div>
            </div>

            <div class="w-full md:w-24">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Satuan</label>
              <select v-model="tempSatuanPilihan" :disabled="!tempBeli.bahan_id" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-bold text-gray-700 shadow-inner transition-all outline-none disabled:opacity-50 text-sm">
                <option v-for="o in opsiSatuanAktif" :key="o.nama" :value="o">{{ o.nama }}</option>
              </select>
            </div>

            <div class="w-full md:w-20">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Qty</label>
              <input type="number" v-model.number="tempBeli.qty" min="0" step="any" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-black text-center text-gray-700 shadow-inner transition-all outline-none text-sm">
            </div>

            <div class="w-full md:w-40 relative">
              <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total Harga (Rp)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <span class="text-xs font-bold text-gray-400">Rp</span>
                </div>
                <input type="number" v-model.number="tempBeli.subtotal" min="0" step="any" class="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-black text-rose-600 shadow-inner transition-all outline-none text-sm">
              </div>
              <div v-if="tempHPP > 0" class="absolute -bottom-6 left-0 w-full text-center">
                 <span class="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full inline-block mt-1">HPP: Rp {{ formatRp(tempHPP) }} / {{ listBahan.find(x => x.ID === tempBeli.bahan_id)?.satuan || 'satuan' }}</span>
              </div>
            </div>

            <button @click="tambahKeKeranjang" type="button" class="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 w-full md:w-auto h-10.5 flex items-center justify-center gap-2">
              <Plus :size="16" /> Tambah
            </button>
          </div>
        </div>

        <!-- Cart Table -->
        <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-4">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th class="px-5 py-3.5">Item Bahan</th>
                  <th class="px-5 py-3.5 text-center">Qty</th>
                  <th class="px-5 py-3.5 text-right">Harga Satuan Dasar</th>
                  <th class="px-5 py-3.5 text-right">Subtotal</th>
                  <th class="px-5 py-3.5 text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="(item, index) in formBeli.details" :key="index" class="hover:bg-gray-50/50 transition-colors group">
                  <td class="px-5 py-4 font-semibold text-gray-800">{{ item.nama_bahan }}</td>
                  <td class="px-5 py-4 text-center">
                    <span class="font-black text-gray-800 text-base">{{ item.qty_input }}</span> 
                    <span class="text-[10px] font-bold text-gray-400 ml-1">{{ item.satuan_input }}</span>
                    <div v-if="item.qty_input !== item.qty" class="text-[10px] text-gray-400 font-medium mt-0.5">
                      = {{ item.qty }} {{ item.satuan }}
                    </div>
                  </td>
                  <td class="px-5 py-4 text-right font-medium text-gray-500">Rp {{ formatRp(item.harga_beli_satuan) }} <span class="text-[10px]">/ {{ item.satuan }}</span></td>
                  <td class="px-5 py-4 text-right font-black text-rose-600 text-base">Rp {{ formatRp(item.subtotal) }}</td>
                  <td class="px-5 py-4 text-center">
                    <button @click="hapusDariKeranjang(index)" class="text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 :size="16" />
                    </button>
                  </td>
                </tr>
                <tr v-if="formBeli.details.length === 0">
                  <td colspan="5" class="px-5 py-10 text-center">
                    <div class="flex flex-col items-center justify-center text-gray-400">
                      <ShoppingCart class="w-10 h-10 mb-3 opacity-20" />
                      <span class="text-sm font-medium">Keranjang kosong, silakan tambah item</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Summary Footer -->
          <div class="bg-linear-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
            <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Grand Total</span>
            <span class="text-2xl font-black text-sky-400 tracking-tight">Rp {{ formatRp(grandTotalBelanja) }}</span>
          </div>
        </div>

      </div>

      <!-- Footer Actions -->
      <div class="bg-white px-6 py-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
        <button type="button" @click="showModalBeli = false" class="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm transition-colors">Batalkan</button>
        <button @click="simpanPembelian" type="button" class="bg-gray-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 shadow-md transition-all active:scale-95 flex items-center gap-2">
          <span>Simpan Pembelian</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL PELUNASAN -->
  <div v-if="showLunasModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
    <div class="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all">
      <div class="bg-slate-800 px-5 py-4 flex justify-between items-center">
        <h3 class="font-black text-white text-lg tracking-wide">Pilih Tanggal Lunas</h3>
        <button @click="showLunasModal = false" class="text-slate-400 hover:text-white transition-colors">
          <X :size="20" />
        </button>
      </div>
      <div class="p-5">
        <p class="text-sm text-slate-600 mb-4">Kas akan otomatis terpotong pada tanggal yang Anda pilih.</p>
        <div class="mb-5">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Lunas</label>
          <input type="date" v-model="tanggalLunas" class="w-full border border-slate-200 rounded-lg px-3 py-2.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 bg-slate-50" />
        </div>
        <div class="flex gap-3">
          <button @click="showLunasModal = false" class="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Batal</button>
          <button @click="konfirmasiLunas" class="flex-1 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-md shadow-sky-200 transition-colors">Tandai Lunas</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(10px); } 
  to { opacity: 1; transform: translateY(0); } 
}

.custom-scrollbar::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #94a3b8;
}
</style>
