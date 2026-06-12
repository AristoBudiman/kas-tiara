<script setup>
import { ref, onMounted } from 'vue'
import { Users, Plus, Pencil, Trash2, Shield, X, User } from 'lucide-vue-next'

const listUsers = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const listRoles = ref([])
const formUser = ref({
  id: '',
  username: '',
  email: '',
  password: '',
  role_id: ''
})

const fetchUsers = async () => {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admins`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) {
    listUsers.value = await res.json()
  }
}

const fetchRoles = async () => {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/roles`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.ok) {
    listRoles.value = await res.json()
  }
}

const openAddModal = () => {
  isEdit.value = false
  formUser.value = { id: '', username: '', email: '', password: '', role_id: '' }
  showModal.value = true
}

const openEditModal = (u) => {
  isEdit.value = true
  formUser.value = { id: u.id, username: u.username, email: u.email || '', password: '', role_id: u.role_id || (u.role && u.role.id) }
  showModal.value = true
}

const saveUser = async () => {
  if (!formUser.value.email && !formUser.value.username) {
    return window.$dialog.alert('Minimal Email ATAU Username wajib diisi!')
  }
  if (!formUser.value.role_id) {
    return window.$dialog.alert('Role wajib dipilih!')
  }

  const token = localStorage.getItem('admin_token')
  const url = isEdit.value 
    ? `${import.meta.env.VITE_API_URL}/api/admins/${formUser.value.id}`
    : `${import.meta.env.VITE_API_URL}/api/admins`
  
  const method = isEdit.value ? 'PUT' : 'POST'
  
  const payload = {
    username: formUser.value.username,
    email: formUser.value.email,
    role_id: Number(formUser.value.role_id),
  }
  if (formUser.value.password) {
    payload.password = formUser.value.password
  }

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  })

  if (res.ok) {
    await window.$dialog.alert(isEdit.value ? 'User berhasil diupdate!' : 'User berhasil ditambahkan!')
    showModal.value = false
    fetchUsers()
  } else {
    const err = await res.json()
    await window.$dialog.alert(err.error || 'Gagal menyimpan user.')
  }
}

const deleteUser = async (id) => {
  if (await window.$dialog.confirm('Yakin ingin menghapus user ini?')) {
    const token = localStorage.getItem('admin_token')
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admins/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (res.ok) {
      await window.$dialog.alert('User berhasil dihapus!')
      fetchUsers()
    } else {
      const err = await res.json()
      await window.$dialog.alert(err.error || 'Gagal menghapus user.')
    }
  }
}

onMounted(async () => {
  await fetchRoles()
  await fetchUsers()
})
</script>

<template>
  <div class="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 gap-6">
      <div class="flex items-center gap-5">
        <div class="bg-linear-to-br from-indigo-400 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0 text-white">
          <Users :size="32" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight">Manajemen Pengguna</h1>
          <p class="text-sm text-slate-500 font-medium mt-1.5 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            Kelola akun akses sistem TiaraApp
          </p>
        </div>
      </div>
      
      <button @click="openAddModal" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2 active:scale-95">
        <Plus :size="20" /> Tambah User
      </button>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-max text-left border-collapse">
          <thead class="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">ID</th>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Pengguna</th>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Role</th>
              <th class="py-5 px-6 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Status</th>
              <th class="py-5 px-6 text-center font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in listUsers" :key="u.id" class="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
              <td class="py-4 px-6 text-sm font-bold text-slate-500">#{{ u.id }}</td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                    <User :size="16" />
                  </div>
                  <div>
                    <div class="font-bold text-slate-700">{{ u.username }}</div>
                    <div class="text-xs text-slate-500">{{ u.email || 'Belum ada email' }}</div>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6">
                <span v-if="(u.role && u.role.nama_role === 'Superadmin') || u.legacy_role === 'superadmin'" class="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-rose-200">
                  <Shield :size="14" /> Superadmin
                </span>
                <span v-else class="inline-flex items-center gap-1.5 bg-sky-50 text-sky-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-sky-200">
                  <User :size="14" /> {{ u.role ? u.role.nama_role : (u.legacy_role || 'Unknown') }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span v-if="u.locked_until && new Date(u.locked_until) > new Date()" class="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-xs font-black tracking-wider border border-rose-200">
                  TERKUNCI
                </span>
                <span v-else class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-black tracking-wider border border-emerald-200">
                  AKTIF
                </span>
              </td>
              <td class="py-4 px-6 text-center">
                <div class="flex justify-center gap-2">
                  <button @click="openEditModal(u)" class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors" title="Edit">
                    <Pencil :size="18" />
                  </button>
                  <button v-if="!((u.role && u.role.nama_role === 'Superadmin') || u.legacy_role === 'superadmin')" @click="deleteUser(u.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Hapus">
                    <Trash2 :size="18" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="listUsers.length === 0">
              <td colspan="5" class="py-10 text-center text-slate-400 font-medium">Memuat data...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div v-if="showModal" class="fixed inset-0 backdrop-blur-sm bg-slate-900/40 flex justify-center items-center z-50 p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in ring-1 ring-gray-200">
      <div class="bg-indigo-50 px-6 py-5 flex justify-between items-center border-b border-indigo-100">
        <h2 class="text-xl font-bold text-indigo-900">{{ isEdit ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h2>
        <button @click="showModal = false" class="p-2 text-indigo-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
          <X :size="20" />
        </button>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Username <span class="text-[9px] normal-case">(Opsional)</span></label>
          <input type="text" v-model="formUser.username" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email (Google Login)</label>
          <input type="email" v-model="formUser.email" placeholder="budi@gmail.com" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
          <select v-model="formUser.role_id" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700">
            <option value="" disabled>Pilih Role</option>
            <option v-for="r in listRoles" :key="r.id" :value="r.id">{{ r.nama_role }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password <span class="text-[9px] normal-case">(Opsional)</span></label>
          <input type="password" v-model="formUser.password" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700">
        </div>
      </div>
      
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button @click="showModal = false" class="px-5 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Batal</button>
        <button @click="saveUser" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-colors active:scale-95">Simpan</button>
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
