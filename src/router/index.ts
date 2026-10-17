import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CompatibilityView from '../views/CompatibilityView.vue'
import GameView from '../views/GameView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0, left: 0 }
  },
  routes: [
    { path: '/jeu', name: 'jeu', component: GameView },
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/utilisation',
      name: 'utilisation',
      component: CompatibilityView,
    },
    {
      path: '/compatibility',
      redirect: (to) => ({ name: 'utilisation', query: to.query, hash: to.hash }),
    },
    {
      path: '/team',
      redirect: '/',
    },
  ],
})

export default router
