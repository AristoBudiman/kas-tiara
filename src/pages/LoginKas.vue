<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

onMounted(() => {
  fetch(`${import.meta.env.VITE_API_URL}/`).catch(() => {})
})

const handleLogin = async () => {
  isLoading.value = true // <--- Aktifkan animasi putar
  errorMsg.value = ''
  
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    
    const data = await res.json()
    
    if (res.ok && data.role === 'superadmin') {
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_role', data.role)
      router.push('/')
    } else {
      errorMsg.value = "Login gagal atau Anda bukan Super Admin!"
    }
  } catch (err) {
    errorMsg.value = "Gagal terhubung ke server."
  } finally {
    isLoading.value = false // <--- Matikan animasi putar
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center font-sans text-slate-900">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
      
      <div class="text-center mb-8">
        <div class="mx-auto bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">Tiara Bakery</h1>
        <p class="text-slate-500 text-sm mt-1">Financial Portal Access</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        
        <div v-if="errorMsg" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <svg class="w-5 h-5 text-red-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p class="text-sm text-red-700 font-medium">{{ errorMsg }}</p>
        </div>
        
        <div>
          <label class="block text-slate-700 text-sm font-medium mb-1.5">Username</label>
          <input 
            v-model="username" 
            type="text" 
            class="w-full bg-white text-slate-900 border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" 
            placeholder="Masukkan username"
            required
            :disabled="isLoading"
          >
        </div>
        
        <div>
          <label class="block text-slate-700 text-sm font-medium mb-1.5">Password</label>
          <input 
            v-model="password" 
            type="password" 
            class="w-full bg-white text-slate-900 border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" 
            placeholder="••••••••"
            required
            :disabled="isLoading"
          >
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-6"
        >
          <span v-if="isLoading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memverifikasi...
          </span>
          <span v-else>Sign In</span>
        </button>
      </form>
      
    </div>
  </div>
</template>