/**
 * ============================================
 * Vue Router 路由配置模块
 * ============================================
 * 
 * 设计思路：
 * 1. 本文件只负责定义路由表 (Route Records)，保持单一职责
 * 2. 路由守卫逻辑拆分到独立的 guards.js 文件，实现物理解耦
 * 3. 使用路由元信息 (meta) 标记需要鉴权的路由
 * 
 * 底层原理：
 * - Vue Router 4 采用组合式 API 设计，与 Vue 3 风格一致
 * - createRouter 创建路由实例，createWebHistory 使用 HTML5 History 模式
 * - 路由匹配采用深度优先搜索算法
 */

import { createRouter, createWebHistory } from 'vue-router'

// ============================================
// 路由表定义
// ============================================
// 每个路由记录 (Route Record) 包含以下核心字段：
// - path: URL 路径（支持动态参数，如 /user/:id）
// - name: 路由名称，用于编程式导航（推荐做法，比 path 更稳定）
// - component: 路由对应的页面组件
// - meta: 路由元信息，可自定义任意字段，常用于权限控制、页面标题等
// - children: 嵌套路由，用于布局嵌套场景

const routes = [
  /**
   * 舆情大屏首页
   * 
   * 访问路径：/
   * 特点：公开访问，不需要登录
   * 用途：系统的核心展示页面，展示实时热搜榜单、词云、趋势图等
   */
  {
    path: '/',
    name: 'Dashboard',
    // 动态导入 (Lazy Loading)：用户访问时才加载组件，减少首屏包体积
    // () => import() 返回一个 Promise，Vue Router 会自动处理加载状态
    component: () => import('@/views/dashboard/index.vue'),
    meta: {
      // title: 页面标题，可用于浏览器标签页或导航栏显示
      title: '舆情大屏',
      // requiresAuth: 是否需要登录才能访问，false 表示公开页面
      requiresAuth: false
    }
  },
  
  /**
   * 登录页
   *
   * 访问路径：/auth/login
   * 特点：公开访问，已登录用户通常不需要再访问
   * 用途：用户输入账号密码，获取 JWT Token
   *
   * 为什么路径是 /auth/login 而不是 /login？
   * - /auth 作为前缀，便于统一管理认证相关路由
   * - 后续可扩展 /auth/register、/auth/forgot-password 等
   */
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/views/auth/login.vue'),
    meta: {
      title: '用户登录',
      requiresAuth: false
    }
  },

  /**
   * 注册页
   *
   * 访问路径：/auth/register
   * 特点：公开访问，与登录页同级
   * 用途：新用户注册账号
   */
  {
    path: '/auth/register',
    name: 'Register',
    component: () => import('@/views/auth/register.vue'),
    meta: {
      title: '用户注册',
      requiresAuth: false
    }
  },
  
  /**
   * 个人中心页
   * 
   * 访问路径：/profile/index
   * 特点：需要登录才能访问（requiresAuth: true）
   * 用途：展示用户信息、收藏记录、个人设置等
   * 
   * 路由守卫会检查 meta.requiresAuth，如果没有 Token 会拦截并重定向到登录页
   */
  {
    path: '/profile/index',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: {
      title: '个人中心',
      // requiresAuth: true 表示需要登录才能访问
      // 路由守卫会读取这个标记进行权限校验
      requiresAuth: true
    }
  },
  
  /**
   * 404 页面 - 捕获所有未匹配的路由
   * 
   * 访问路径：任意未定义的路径
   * pathMatch(.*)* 是 Vue Router 4 的通配符语法，匹配所有路径
   */
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面未找到',
      requiresAuth: false
    }
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
