<script setup>
import { ref, onMounted } from 'vue'
import { ShieldCheck, Plus, Pencil, Trash2, X, Key, CheckSquare } from 'lucide-vue-next'

const listRoles = ref([])
const listPermissions = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const formRole = ref({
  id: '',
  nama_role: '',
  deskripsi: '',
  permission_ids: []
})

const fetchRoles = async () => {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/roles`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) {
    listRoles.value = await res.json()
  }
}

const fetchPermissions = async () => {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/permissions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) {
    listPermissions.value = await res.json()
  }
}

const openAddModal = () => {
  isEdit.value = false
  formRole.value = { id: '', nama_role: '', deskripsi: '', permission_ids: [] }
  showModal.value = true
}

const openEditModal = (r) => {
  isEdit.value = true
  formRole.value = { 
    id: r.id, 
    nama_role: r.nama_role, 
    deskripsi: r.deskripsi, 
    permission_ids: (r.permissions || []).map(p => p.id) 
  }
  showModal.value = true
}

const togglePermission = (permId) => {
  const idx = formRole.value.permission_ids.indexOf(permId)
  if (idx > -1) {
    formRole.value.permission_ids.splice(idx, 1)
  } else {
    formRole.value.permission_ids.push(permId)
  }
}

const saveRole = async () => {
  if (!formRole.value.nama_role) {
    return window.$dialog?.alert('Nama Role wajib diisi!')
  }

  const token = localStorage.getItem('admin_token')
  const url = isEdit.value 
    ? `${import.meta.env.VITE_API_URL}/api/roles/${formRole.value.id}`
    : `${import.meta.env.VITE_API_URL}/api/roles`
  
  const method = isEdit.value ? 'PUT' : 'POST'
  
  const payload = {
    nama_role: formRole.value.nama_role,
    deskripsi: formRole.value.deskripsi,
    permission_ids: formRole.value.permission_ids
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      await window.$dialog?.alert(isEdit.value ? 'Role berhasil diupdate!' : 'Role berhasil ditambahkan!')
      showModal.value = false
      fetchRoles()
    } else {
      const err = await res.json()
      await window.$dialog?.alert(err.error || 'Gagal menyimpan role.')
    }
  } catch(e) {
    await window.$dialog?.alert('Koneksi terputus dari server.')
  }
}

const deleteRole = async (id) => {
  if (await window.$dialog?.confirm('Yakin ingin menghapus role ini? (Role yang masih dipakai admin tidak bisa dihapus)')) {
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/roles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        await window.$dialog?.alert('Role berhasil dihapus!')
        fetchRoles()
      } else {
        const err = await res.json()
        await window.$dialog?.alert(err.error || 'Gagal menghapus role.')
      }
    } catch(e) {
      await window.$dialog?.alert('Koneksi terputus dari server.')
    }
  }
}

onMounted(async () => {
  await fetchPermissions()
  await fetchRoles()
})
</script>

<template>
  <div class="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 gap-6">
      <div class="flex items-center gap-5">
        <div class="bg-linear-to-br from-indigo-400 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0 text-white">
          <ShieldCheck :size="32" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">Manajemen Hak Akses</h1>
          <p class="text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            Buat dan atur jabatan (Role) beserta izinnya
          </p>
        </div>
      </div>
      
      <button @click="openAddModal" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95">
        <Plus :size="20" /> Tambah Role
      </button>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-max text-left border-collapse">
          <thead class="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">ID</th>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Nama Role</th>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Deskripsi</th>
              <th class="py-5 px-6 text-center font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Hak Izin</th>
              <th class="py-5 px-6 text-center font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in listRoles" :key="r.id" class="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
              <td class="py-4 px-6 text-sm font-bold text-slate-500">#{{ r.id }}</td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                    <Key :size="16" />
                  </div>
                  <span class="font-bold text-slate-700">{{ r.nama_role }}</span>
                </div>
              </td>
              <td class="py-4 px-6 text-sm text-slate-600 font-medium">
                {{ r.deskripsi || '-' }}
              </td>
              <td class="py-4 px-6 text-center">
                <span class="inline-flex items-center gap-1.5 bg-sky-50 text-sky-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-sky-200">
                  <CheckSquare :size="14" /> {{ r.permissions ? r.permissions.length : 0 }} Izin
                </span>
              </td>
              <td class="py-4 px-6 text-center">
                <div class="flex justify-center gap-2">
                  <button @click="openEditModal(r)" class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors" title="Edit">
                    <Pencil :size="18" />
                  </button>
                  <button v-if="r.nama_role !== 'Superadmin' && r.nama_role !== 'superadmin'" @click="deleteRole(r.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Hapus">
                    <Trash2 :size="18" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="listRoles.length === 0">
              <td colspan="5" class="py-10 text-center text-slate-400 font-medium">Memuat data...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div v-if="showModal" class="fixed inset-0 backdrop-blur-sm bg-slate-900/40 flex justify-center items-center z-50 p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in ring-1 ring-gray-200 flex flex-col max-h-[90vh]">
      <div class="bg-indigo-50 px-6 py-5 flex justify-between items-center border-b border-indigo-100 shrink-0">
        <h2 class="text-xl font-bold text-indigo-900">{{ isEdit ? 'Edit Role & Izin' : 'Buat Role Baru' }}</h2>
        <button @click="showModal = false" class="p-2 text-indigo-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
          <X :size="20" />
        </button>
      </div>
      
      <div class="p-6 space-y-5 overflow-y-auto grow">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Role</label>
            <input type="text" v-model="formRole.nama_role" placeholder="Contoh: Manajer" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Deskripsi</label>
            <input type="text" v-model="formRole.deskripsi" placeholder="Tugas utama role ini" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700">
          </div>
        </div>

        <div>
           <div class="flex justify-between items-center mb-3">
             <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tetapkan Hak Akses (Permissions)</label>
             <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{{ formRole.permission_ids.length }} Dipilih</span>
           </div>
           
           <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-72 overflow-y-auto">
              <label v-for="p in listPermissions" :key="p.id" 
                     class="flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none"
                     :class="formRole.permission_ids.includes(p.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-100/50'">
                <div class="pt-0.5">
                  <input type="checkbox" :checked="formRole.permission_ids.includes(p.id)" @change="togglePermission(p.id)" class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-800">{{ p.nama_izin }}</p>
                  <p class="text-[10px] font-mono text-slate-400 mt-0.5">{{ p.kode }}</p>
                </div>
              </label>
           </div>
        </div>
      </div>
      
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
        <button @click="showModal = false" class="px-5 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Batal</button>
        <button @click="saveRole" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-colors active:scale-95">Simpan Role</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { 
  from { opacity: 0; transform: scale(0.95); } 
  to { opacity: 1; transform: scale(1); } 
}
</style>
