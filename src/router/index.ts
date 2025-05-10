import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AnalysisView from '@/views/AnalysisView.vue'
import Analysis2View from '@/views/Analysis2View.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '目标监控管理',
      component: HomeView,
    },
    {
      path:'/analysis',
      name:'监控分析',
      component:AnalysisView
    },{
      path:'/analysis2',
      name:'监控分析2',
      component:Analysis2View
    }
  ],
})

export default router
