/**
 * ============================================
 * Pinia Store 入口文件
 * ============================================
 *
 * 设计思路：
 * 1. 集中创建 Pinia 实例并导出
 * 2. 在 main.js 中通过 app.use() 全局注册
 * 3. 各模块 Store 独立定义，按需导入使用
 *
 * 扩展建议：
 * - 可在此处配置 Pinia 插件（如持久化插件 pinia-plugin-persistedstate）
 * - 可添加全局 $subscribe 监听状态变化（用于调试或埋点）
 */

import { createPinia } from 'pinia'

/**
 * 创建 Pinia 实例
 *
 * createPinia() 返回一个 Pinia 实例，包含：
 * - use(plugin): 注册插件
 * - state: 全局 state 引用
 * - _s: 所有已注册的 store Map
 */
const pinia = createPinia()

/**
 * 可选：注册 Pinia 插件
 *
 * 示例：持久化插件（需要安装 pinia-plugin-persistedstate）
 * import persistedState from 'pinia-plugin-persistedstate'
 * pinia.use(persistedState({
 *   storage: localStorage,  // 使用 localStorage 持久化
 *   paths: ['user.token', 'user.userInfo']  // 指定持久化的 state 路径
 * }))
 *
 * 使用插件后，不需要手动操作 localStorage，Pinia 自动同步
 */

/**
 * 可选：全局状态订阅（用于调试）
 *
 * $subscribe 监听所有 state 变化
 * 参数：mutation（变化信息）, state（当前状态）
pinia.$subscribe((mutation, state) => {
  console.log('【Pinia】State 变化:', mutation)
  // 可在此处接入 Vue DevTools 或发送埋点数据
})
 */

// 导出 Pinia 实例，供 main.js 注册
export default pinia

/**
 * ============================================
 * 模块 Store 导出（可选便利写法）
 * ============================================
 * 在这里集中导出所有模块，业务组件只需导入当前文件
 *
 * 业务组件使用方式：
 * import { useUserStore } from '@/store/index.js'
 * const userStore = useUserStore()
 *
 * 如果不在这里导出，需要单独导入：
 * import { useUserStore } from '@/store/modules/user.js'
 */
export { useUserStore } from './modules/user.js'
// 后续可添加：
// export { useHotSearchStore } from './modules/hotsearch.js'
// export { useDashboardStore } from './modules/dashboard.js'
