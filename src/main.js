/**
 * ============================================
 * Vue 3 应用入口文件
 * ============================================
 * 
 * 本文件职责：
 * 1. 创建 Vue 应用实例
 * 2. 挂载全局插件（Router、Pinia/Vuex、UI 库等）
 * 3. 注册路由守卫
 * 4. 挂载应用到 DOM
 * 
 * Vue 3 变化：
 * - 使用 createApp() 替代 new Vue()
 * - 支持多应用实例（微前端场景）
 * - 采用链式 API 风格，更灵活的插件系统
 */

import { createApp } from 'vue'
import App from './App.vue'

// ============================================
// 导入路由相关模块
// ============================================
// 路由配置与守卫分离，符合单一职责原则
import router from './router/index.js'
import { setupRouterGuards } from './router/guards.js'

// ============================================
// 导入 Pinia Store
// ============================================
// Pinia 是 Vue 官方状态管理库，替代 Vuex
import pinia from './store/index.js'

// ============================================
// 导入 Element Plus
// ============================================
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// ============================================
// 导入全局样式
// ============================================
// 这里可以导入 Tailwind、Element Plus 样式或自定义 CSS
import './style.css'

// ============================================
// 创建 Vue 应用实例
// ============================================
// createApp(App) 接收根组件作为参数，返回应用实例
// 应用实例用于配置全局属性、注册全局组件、挂载插件等

const app = createApp(App)

// ============================================
// 挂载 Vue Router
// ============================================
/**
 * app.use(router) 做了什么？
 * 1. 注册 router 实例到全局属性（通过 app.config.globalProperties）
 * 2. 注册 <router-view> 和 <router-link> 全局组件
 * 3. 添加 $router 和 $route 到组件实例（Options API 可用）
 * 4. 启用路由的响应式系统
 * 
 * 注意：路由守卫必须在 use(router) 之后注册
 * 因为守卫依赖 router 实例，而 use() 会初始化 router 的内部状态
 */
app.use(router)

// ============================================
// 挂载 Element Plus
// ============================================
/**
 * app.use(ElementPlus) 注册 Element Plus UI 库
 * 这会自动注册所有 Element Plus 组件（el-button, el-icon 等）
 */
app.use(ElementPlus)

// 注册所有 Element Plus 图标为全局组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ============================================
// 挂载 Pinia Store
// ============================================
/**
 * app.use(pinia) 注册 Pinia 状态管理
 *
 * 作用：
 * 1. 将 Pinia 实例绑定到 Vue 应用
 * 2. 使所有组件可以通过 useXxxStore() 访问状态
 * 3. 启用 Vue DevTools 对 Pinia 的支持
 *
 * 注意：Pinia 应该在 Router 之后挂载，确保导航守卫可以使用 Store
 */
app.use(pinia)

// ============================================
// 注册路由守卫
// ============================================
/**
 * setupRouterGuards(router) 执行全局导航守卫注册
 * 
 * 为什么要在这里调用，而不是在 router/index.js 中直接注册？
 * 1. 物理解耦：路由配置与守卫逻辑分离到不同文件
 * 2. 顺序控制：确保 router 完全初始化后再注册守卫
 * 3. 可维护性：守卫逻辑集中管理，便于后续扩展
 * 
 * 注册顺序：
 * - 先执行 router/index.js 的 createRouter() 创建实例
 * - 再执行 app.use(router) 挂载路由插件
 * - 最后调用 setupRouterGuards() 注册守卫
 * - 至此，路由系统完全就绪，可以处理导航
 */
setupRouterGuards(router)

// ============================================
// 挂载应用到 DOM
// ============================================
/**
 * app.mount('#app') 将 Vue 应用挂载到页面中的 DOM 元素
 * 
 * 挂载过程：
 * 1. 找到 id="app" 的元素（在 index.html 中定义）
 * 2. 将根组件 App.vue 渲染到这个元素内部
 * 3. 触发组件的生命周期钩子（setup -> onMounted 等）
 * 
 * 注意：mount() 应该放在最后，所有插件配置完成后
 */
app.mount('#app')

/**
 * ============================================
 * 可选：全局错误处理
 * ============================================
 * 捕获应用中未被处理的错误，防止白屏
 */
app.config.errorHandler = (err, vm, info) => {
  console.error('【全局错误】', err)
  console.error('【错误信息】', info)
}
