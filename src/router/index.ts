import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CompatibilityView from '../views/CompatibilityView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/compatibility',
      name: 'compatibility',
      component: CompatibilityView,
    },
    {
      path: '/team',
      redirect: '/',
    },
  ],
})

export default router
