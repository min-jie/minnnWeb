import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import AboutMe from '../components/AboutMe.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: 'Moriii Minnn - 歡迎來到我的網站' }
  },
  {
    path: '/about',
    name: 'About',
    component: AboutMe,
    meta: { title: 'Moriii Minnn - 關於我' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 設定動態 title
router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
