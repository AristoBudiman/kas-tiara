<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Menu, X, Crown, LayoutDashboard, PieChart, LogOut, ShoppingCart, Users, UserCog, Key
} from 'lucide-vue-next'
import { hasPermission } from './utils/permission'
import GlobalDialog from './components/GlobalDialog.vue'

const route = useRoute()
const router = useRouter()

const isMenuOpen = ref(false)
const isSidebarMinimized = ref(false)

const isLoginPage = computed(() => route.path === '/login')
const role = ref(localStorage.getItem('admin_role') || 'superadmin')

watch(() => route.path, () => {
  role.value = localStorage.getItem('admin_role') || 'superadmin'
  isMenuOpen.value = false
})

const logout = async () => {
  if (await window.$dialog.confirm('Yakin ingin keluar?')) {
    localStorage.clear()
    router.push('/login')
  }
}

// PROFILE LOGIC
const showProfileModal = ref(false)
const formProfile = ref({ username: '', password: '', email: '' })

const openProfileModal = async () => {
  const t = localStorage.getItem('admin_token')
  if (!t) return
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
    headers: { 'Authorization': `Bearer ${t}` }
  })
  if (res.ok) {
    const data = await res.json()
    formProfile.value.username = data.username
    formProfile.value.email = data.email
    formProfile.value.password = ''
    showProfileModal.value = true
  }
}

const saveProfile = async () => {
  if (!formProfile.value.username) return window.$dialog.alert('Username wajib diisi!')
  
  const t = localStorage.getItem('admin_token')
  const payload = { username: formProfile.value.username }
  if (formProfile.value.password) payload.password = formProfile.value.password

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
    body: JSON.stringify(payload)
  })
  
  const data = await res.json()
  if (res.ok) {
    await window.$dialog.alert(data.message)
    showProfileModal.value = false
  } else {
    await window.$dialog.alert(data.error || 'Gagal menyimpan profil')
  }
}
</script>

<template>
  <GlobalDialog />
  <div class="h-screen w-full bg-slate-50 flex font-sans selection:bg-sky-200 overflow-hidden">
    
    <!-- Sidebar -->
    <aside v-if="!isLoginPage" 
           :class="[
             isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
             isSidebarMinimized ? 'md:w-20' : 'md:w-64'
           ]"
           class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col md:static shadow-xl overflow-hidden shrink-0">
        
        <div class="h-16 flex items-center px-4 border-b border-slate-800 shrink-0 transition-all duration-300" :class="isSidebarMinimized ? 'justify-center' : 'gap-3'">
            
            <!-- Brand Icon / Toggle Button -->
            <button @click="isSidebarMinimized = !isSidebarMinimized" class="bg-linear-to-br from-sky-400 to-sky-600 p-2 rounded-lg shadow-lg flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform" title="Toggle Menu">
                <Crown :size="20" class="text-white" />
            </button>

            <!-- Brand Text -->
            <router-link to="/" v-if="!isSidebarMinimized" class="whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100 flex flex-col justify-center hover:opacity-80">
                <h1 class="font-black text-lg tracking-[0.2em] text-white leading-tight">
                    TIARA
                </h1>
                <p class="text-[10px] font-black tracking-[0.3em] text-transparent bg-clip-text bg-linear-to-r from-sky-400 to-sky-200 uppercase">
                    Financial
                </p>
            </router-link>

            <!-- Close button for mobile -->
            <button @click="isMenuOpen = false" class="md:hidden ml-auto text-slate-400 hover:text-white p-2">
                <X :size="24" />
            </button>
        </div>

        <div class="flex-1 overflow-y-auto overflow-x-hidden py-5 space-y-8 custom-scrollbar transition-all duration-300" :class="isSidebarMinimized ? 'px-2' : 'px-3'">
            
            <div class="space-y-1.5">
                <span v-if="!isSidebarMinimized" class="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 mb-2 block whitespace-nowrap overflow-hidden">Menu Finansial</span>
                
                <router-link v-if="hasPermission('app_kas')" to="/" title="Kas Harian" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-sky-600 !text-white shadow-md">
                    <LayoutDashboard :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Kas Harian</span>
                </router-link>
                
                <router-link v-if="hasPermission('manage_kas')" to="/aset" title="Kinerja & Aset" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-sky-600 !text-white shadow-md">
                    <PieChart :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Kinerja & Aset</span>
                </router-link>

                <router-link v-if="hasPermission('manage_kas')" to="/belanja" title="Belanja Bahan" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-sky-600 !text-white shadow-md">
                    <ShoppingCart :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Belanja Bahan</span>
                </router-link>
            </div>

            <div v-if="hasPermission('manage_admin')" class="space-y-1.5 pt-4">
                <span v-if="!isSidebarMinimized" class="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 mb-2 block whitespace-nowrap overflow-hidden">Menu User</span>

                <router-link to="/pengguna" title="Manajemen Pengguna" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-sky-600 !text-white shadow-md">
                    <Users :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Pengguna</span>
                </router-link>

                <router-link to="/roles" title="Hak Akses (Role)" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-sky-600 !text-white shadow-md">
                    <Key :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Hak Akses</span>
                </router-link>
            </div>
        </div>

        <div class="p-4 border-t border-slate-800 shrink-0 transition-all duration-300 flex flex-col gap-3" :class="isSidebarMinimized ? 'p-2' : 'p-4'">
            <div v-if="!isSidebarMinimized" class="px-2 flex items-center gap-3">
               <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sky-500 font-bold shadow-inner shrink-0">
                 {{ role ? role.charAt(0).toUpperCase() : '?' }}
               </div>
               <div class="overflow-hidden">
                 <p class="text-xs font-bold text-slate-200 capitalize truncate">{{ role }}</p>
                 <p class="text-[10px] text-slate-500 font-medium">Logged In</p>
               </div>
            </div>
            <button @click="openProfileModal" title="Pengaturan Profil" class="w-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm group" :class="isSidebarMinimized ? 'py-3 px-0' : 'py-3 px-4 gap-2'">
                <UserCog :size="20" class="shrink-0" />
                <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Profil Saya</span>
            </button>
            <button @click="logout" title="Keluar Sistem" class="w-full flex items-center justify-center bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm group" :class="isSidebarMinimized ? 'py-3 px-0' : 'py-3 px-4 gap-2'">
                <LogOut :size="20" class="group-hover:-translate-x-1 transition-transform shrink-0" />
                <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Keluar Sistem</span>
            </button>
        </div>
    </aside>

    <!-- Overlay for mobile when sidebar is open -->
    <div v-if="!isLoginPage && isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"></div>

    <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative transition-all duration-300">
        
        <!-- Mobile Top Header (only visible on mobile) -->
        <header v-if="!isLoginPage" class="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 shadow-sm shrink-0 sticky top-0 z-30">
            <div class="flex items-center gap-3">
                <button @click="isMenuOpen = true" class="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                    <Menu :size="24" />
                </button>
                <div class="flex items-center gap-2">
                    <Crown :size="20" class="text-sky-500" />
                    <span class="font-black text-lg tracking-tight text-slate-800">TIARA <span class="text-xs text-sky-600 bg-sky-100 px-2 py-0.5 rounded uppercase font-bold ml-1">{{ role }}</span></span>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto w-full relative">
            <div class="p-4 md:p-8 w-full max-w-7xl mx-auto">
              <router-view />
            </div>
        </main>
    </div>

  </div>

  <!-- Modal Profile -->
  <div v-if="showProfileModal" class="fixed inset-0 backdrop-blur-sm bg-slate-900/40 flex justify-center items-center z-100 p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-gray-200">
      <div class="bg-sky-50 px-6 py-5 flex justify-between items-center border-b border-sky-100">
        <h2 class="text-xl font-bold text-sky-900">Pengaturan Profil</h2>
        <button @click="showProfileModal = false" class="p-2 text-sky-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
          <X :size="20" />
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div v-if="formProfile.email" class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
          <p class="text-[11px] text-indigo-500 font-bold uppercase tracking-wider mb-1">Metode Login Saat Ini</p>
          <p class="font-bold text-indigo-900 mb-0.5">Akun Google</p>
          <p class="text-sm font-medium text-indigo-700">{{ formProfile.email }}</p>
        </div>
        <template v-else>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Username Baru</label>
            <input type="text" v-model="formProfile.username" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none font-medium text-gray-700">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password Baru <span class="text-[9px] text-red-400 normal-case">(Kosongkan jika tak diubah)</span></label>
            <input type="password" v-model="formProfile.password" class="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 outline-none font-medium text-gray-700" placeholder="Minimal 6 karakter">
          </div>
        </template>
      </div>
      <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button @click="showProfileModal = false" class="px-5 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">{{ formProfile.email ? 'Tutup' : 'Batal' }}</button>
        <button v-if="!formProfile.email" @click="saveProfile" class="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-colors active:scale-95">Simpan Profil</button>
      </div>
    </div>
  </div>
</template>

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155; /* slate-700 */
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #475569; /* slate-600 */
}
</style>