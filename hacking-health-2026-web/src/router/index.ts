import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CompatibilityView from '../views/CompatibilityView.vue'
import TeamView from '../views/TeamView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      name: 'team',
      component: TeamView,
    },
  ],
})

export default router
