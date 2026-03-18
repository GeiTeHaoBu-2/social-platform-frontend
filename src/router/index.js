
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ================= 1. 独立页面 (不需要左侧菜单的页面) =================
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue')
  },

  // ================= 2. 核心业务模块 (基于 Layout 骨架) =================
  {
    path: '/',
    component: () => import('@/components/layout/Applayout.vue'), // 这是核心骨架组件！包含左侧导航和右侧插槽
    redirect: '/platform/weibo', // 默认打开平台栏目的微博页面
    children: [
      // 栏目 1：搜索
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/search/index.vue'),
        // 搜索参数通过 URL Query 传递，例如：/search?keyword=xxx&type=comment&category=finance
        meta: {
          title: '搜索',
          requiresAuth: true
        }
      },
      // 栏目 2：平台 (依然使用动态路由复用组件)
      {
        path: 'platform/:source', // source 可以是 weibo, zhihu, baidu
        name: 'PlatformDashboard',
        component: () => import('@/views/platform/index.vue'),
        meta: {
          title: '平台概览',
          requiresAuth: true
        }
      },

      // 栏目 3：对比 (展开项，拆分为两个独立视图)
      {
        path: 'compare/single',
        name: 'CompareSingle',
        component: () => import('@/views/compare/SinglePlatform.vue'), // 同平台对比
        meta: {
          title: '平台对比',
          requiresAuth: true
        }
      },
      {
        path: 'compare/multi',
        name: 'CompareMulti',
        component: () => import('@/views/compare/MultiPlatform.vue'), // 多平台对比
        meta: {
          title: '多平台对比',
          requiresAuth: true
        }
      },

      // 栏目 4：设置
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: {
          title: '设置',
          requiresAuth: true
        }
      },

      // 其他核心业务页面可以继续添加在这里，保持路由结构清晰
            {
        path: 'test',
        name: 'test',
        component: () => import('@/views/auth/Login.vue'),
        redirect: '/test',
        meta: {
          title: '测试页面',
          requiresAuth: true
        }
      }
    ]
  }
]

// ============================================
// 创建路由实例
// ============================================
// createWebHistory: 使用 HTML5 History 模式，URL 更美观（没有 #）
// 需要后端配合配置：所有路由都返回 index.html，由前端处理路由

const router = createRouter({
  // history: 路由模式
  // - createWebHistory(): HTML5 History 模式，URL 如 /login（推荐）
  // - createWebHashHistory(): Hash 模式，URL 如 /#/login（兼容性更好，不需要后端配置）
  history: createWebHistory(),
  
  // routes: 路由表数组
  routes,
  
  // scrollBehavior: 切换路由时的滚动行为
  // 返回顶部，提升用户体验
  scrollBehavior() {
    return { top: 0 }
  }
})

// ============================================
// 导出路由实例
// ============================================
// 注意：路由守卫不在这里注册，而是在 main.js 中引入 guards.js 统一挂载
// 这样实现配置与逻辑的物理分离，符合单一职责原则

export default router
