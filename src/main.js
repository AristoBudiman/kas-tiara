import { createApp } from 'vue'
import './style.css' // Pastikan ini file tempat import Tailwind kamu
import App from './App.vue'
import router from './router' // <-- Panggil router

createApp(App).use(router).mount('#app')