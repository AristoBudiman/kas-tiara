import { createRouter, createWebHistory } from 'vue-router'
import DashboardKas from '../pages/DashboardKas.vue'
import LoginKas from '../pages/LoginKas.vue'
import AsetPertumbuhan from '../pages/AsetPertumbuhan.vue'
import BelanjaKas from '../pages/BelanjaKas.vue'
import ManajemenPengguna from '../pages/ManajemenPengguna.vue'

const routes = [
  { path: '/login', component: LoginKas },
  { path: '/', component: DashboardKas, meta: { requiresAuth: true } },
  { path: '/aset', component: AsetPertumbuhan, meta: { requiresAuth: true } },
  { path: '/belanja', component: BelanjaKas, meta: { requiresAuth: true } },
  { path: '/pengguna', component: ManajemenPengguna, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// SATPAM PENJAGA PINTU (Auth Guard)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  const role = localStorage.getItem('admin_role')

  if (to.meta.requiresAuth) {
    if (!token || role !== 'superadmin') next('/login')
    else next()
  } else {
    // Kalau sudah login mau ke halaman login, kembalikan ke dashboard
    if (token && role === 'superadmin' && to.path === '/login') next('/')
    else next()
  }
})

export default router