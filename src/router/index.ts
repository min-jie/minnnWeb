import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import AboutMe from '../components/AboutMe.vue'
import ReviewEngagementGraph from '../components/ReviewEngagementGraph.vue'
import TextAnalysis from '../components/TextAnalysis.vue'

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
  },
  {
    path: '/thesis',
    name: 'Thesis',
    component: ReviewEngagementGraph,
    meta: { title: 'Moriii Minnn - 碩士論文' }
  },
  {
    path: '/text-analysis',
    name: 'TextAnalysis',
    component: TextAnalysis,
    meta: { title: 'Moriii Minnn - 文本分析' }
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
