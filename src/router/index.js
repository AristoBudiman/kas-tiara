import { createRouter, createWebHistory } from 'vue-router'
import DashboardKas from '../pages/DashboardKas.vue'
import LoginKas from '../pages/LoginKas.vue'
import AsetPertumbuhan from '../pages/AsetPertumbuhan.vue'
import BelanjaKas from '../pages/BelanjaKas.vue'
import ManajemenPengguna from '../pages/ManajemenPengguna.vue'
import ManajemenRole from '../pages/ManajemenRole.vue'
import { hasPermission } from '../utils/permission'

const routes = [
  { path: '/login', component: LoginKas },
  { path: '/', component: DashboardKas, meta: { requiresAuth: true, requiredPermission: 'app_kas' } },
  { path: '/aset', component: AsetPertumbuhan, meta: { requiresAuth: true, requiredPermission: 'manage_kas' } },
  { path: '/belanja', component: BelanjaKas, meta: { requiresAuth: true, requiredPermission: 'manage_kas' } },
  { path: '/pengguna', component: ManajemenPengguna, meta: { requiresAuth: true, requiredPermission: 'manage_admin' } },
  { path: '/roles', component: ManajemenRole, meta: { requiresAuth: true, requiredPermission: 'manage_admin' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// SATPAM PENJAGA PINTU (Auth Guard)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')

  if (to.meta.requiresAuth) {
    if (!token) {
      return next('/login')
    }

    const required = to.meta.requiredPermission
    const hasAccess = required ? hasPermission(required) : true

    if (!hasAccess) {
      window.$dialog?.alert(`Akses Ditolak! Anda tidak diizinkan melihat halaman ini.`)
      return next('/login') // Atau bisa arahkan ke halaman error/dashboard jika user punya role lain
    }
    
    next()
  } else {
    // Kalau sudah login mau ke halaman login, kembalikan ke dashboard (jika punya akses app_kas)
    if (token && to.path === '/login') {
      if (hasPermission('app_kas')) return next('/')
      else return next() // Biarkan mereka login ganti akun
    }
    next()
  }
})

export default router