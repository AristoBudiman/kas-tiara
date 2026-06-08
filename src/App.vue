<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Menu, X, Crown, LayoutDashboard, PieChart, LogOut, ShoppingCart
} from 'lucide-vue-next'
import GlobalDialog from './components/GlobalDialog.vue'

const route = useRoute()
const router = useRouter()

const isMenuOpen = ref(false)
const isSidebarMinimized = ref(false)

const isLoginPage = computed(() => route.path === '/login')

watch(() => route.path, () => {
  isMenuOpen.value = false
})

const logout = async () => {
  if (await window.$dialog.confirm('Yakin ingin keluar?')) {
    localStorage.clear()
    router.push('/login')
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
           class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-all duration-300 ease-in-out md:static md:flex md:flex-col shadow-xl overflow-hidden shrink-0">
        
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
                <span v-if="!isSidebarMinimized" class="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3 mb-2 block whitespace-nowrap overflow-hidden">Menu Utama</span>
                
                <router-link to="/" title="Kas Harian" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-sky-600 !text-white shadow-md">
                    <LayoutDashboard :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Kas Harian</span>
                </router-link>
                
                <router-link to="/aset" title="Kinerja & Aset" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-sky-600 !text-white shadow-md">
                    <PieChart :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Kinerja & Aset</span>
                </router-link>

                <router-link to="/belanja" title="Belanja Bahan" class="py-2.5 rounded-xl text-sm font-bold flex items-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors" :class="isSidebarMinimized ? 'justify-center px-0' : 'px-3 gap-3'" exact-active-class="!bg-sky-600 !text-white shadow-md">
                    <ShoppingCart :size="20" class="shrink-0" />
                    <span v-if="!isSidebarMinimized" class="whitespace-nowrap">Belanja Bahan</span>
                </router-link>
            </div>
        </div>

        <div class="p-4 border-t border-slate-800 shrink-0 transition-all duration-300" :class="isSidebarMinimized ? 'p-2' : 'p-4'">
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
                <h1 class="font-black text-lg tracking-widest text-slate-800 leading-none">
                  TIARA <span class="text-transparent bg-clip-text bg-linear-to-r from-sky-500 to-sky-600">FINANCIAL</span>
                </h1>
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