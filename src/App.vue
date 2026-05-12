<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const logout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
    <nav v-if="route.path !== '/login'" class="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          
          <div class="flex items-center">
            <div class="shrink-0 flex items-center gap-3">
              <div class="bg-blue-600 p-2 rounded-lg shadow-sm">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div class="flex flex-col justify-center">
                <h1 class="text-lg font-bold text-slate-800 leading-tight">Tiara Bakery</h1>
                <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Financial Portal</span>
              </div>
            </div>
            
            <div class="hidden md:ml-10 md:flex md:space-x-8 h-full">
              <router-link to="/" 
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-full"
                :class="route.path === '/' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Kas Harian
              </router-link>

              <router-link to="/aset" 
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-full"
                :class="route.path === '/aset' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Kinerja & Aset
              </router-link>
            </div>
          </div>

          <div class="flex items-center">
            <button @click="logout" class="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
              Sign Out
            </button>
          </div>

        </div>
        
        <div class="flex md:hidden overflow-x-auto py-3 space-x-4 border-t border-slate-100">
           <router-link to="/" class="whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium" :class="route.path === '/' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'">
             Kas Harian
           </router-link>
           <router-link to="/aset" class="whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium" :class="route.path === '/aset' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'">
             Kinerja & Aset
           </router-link>
        </div>

      </div>
    </nav>

    <main class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[75vh] p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>