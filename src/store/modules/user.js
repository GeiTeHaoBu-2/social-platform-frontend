/**
 * ============================================
 * Pinia User Store 模块
 * ============================================
 *
 * 设计思路：
 * 1. Pinia 是 Vue 官方推荐的状态管理库，替代 Vuex，API 更简洁
 * 2. Store 按功能模块拆分（user、hotsearch、dashboard 等）
 * 3. 用户状态（token + userInfo）需要持久化，防止刷新丢失
 *
 * 核心概念：
 * - State:   响应式数据（类似组件中的 data）
 * - Getters: 计算属性（类似组件中的 computed）
 * - Actions: 方法（类似组件中的 methods，支持异步）
 *
 * 持久化方案：
 * - 方案1（当前）: 手动操作 localStorage，简单直观
 * - 方案2（推荐）: 使用 pinia-plugin-persistedstate 插件自动持久化
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 导入 API 模块
import { loginApi } from '@/api/auth.js'
import { getUserInfoApi } from '@/api/user.js'

// 导入 router 用于跳转（注意：避免循环导入）
import router from '@/router/index.js'

/**
 * ============================================
 * 定义 User Store
 * ============================================
 *
 * defineStore 参数说明：
 * - 第一个参数：store 的唯一 ID，用于 DevTools 调试和区分不同 store
 * - 第二个参数：setup 函数（Vue3 Composition API 风格）
 *
 * 为什么用 setup 风格而不是 Options 风格？
 * - 与 Vue3 Composition API 风格一致
 * - 更好的 TypeScript 类型推导
 * - 更灵活的逻辑复用（可提取 composable）
 */
export const useUserStore = defineStore('user', () => {

  // ============================================
  // State: 定义响应式状态
  // ============================================
  // 使用 ref 创建响应式数据，修改时需要 .value

  /**
   * JWT Token
   * 用途：用户身份凭证，发送请求时通过 Authorization 头携带
   * 持久化：存入 localStorage，刷新页面不丢失
   */
  const token = ref(localStorage.getItem('token') || '')

  /**
   * 用户信息
   * 用途：展示在页面右上角、个人中心等位置
   * 注意：初始为空对象，登录后通过 getUserInfoAction 获取
   */
  const userInfo = ref({
    username: '',   // 用户名（登录账号）
    email: '',      // 邮箱
    nickname: '',   // 昵称（展示名称）
    avatar: '',     // 头像 URL
    gender: 0,      // 性别：0保密, 1男, 2女
    age: null       // 年龄
  })

  // ============================================
  // Getters: 计算属性
  // ============================================
  // 使用 computed 创建派生状态，依赖变化时自动更新

  /**
   * 是否已登录
   * 判断依据：存在有效的 token
   * 使用场景：控制导航栏显示、按钮权限、路由守卫辅助判断
   */
  const isLoggedIn = computed(() => !!token.value)

  /**
   * 显示名称
   * 优先级：nickname > username > '未命名用户'
   * 使用场景：页面右上角欢迎语、评论展示等
   */
  const displayName = computed(() => {
    return userInfo.value.nickname ||
           userInfo.value.username ||
           '未命名用户'
  })

  /**
   * 头像 URL（带默认值）
   * 如果用户未设置头像，返回默认头像
   */
  const avatarUrl = computed(() => {
    return userInfo.value.avatar ||
           'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  })

  // ============================================
  // Actions: 方法（支持异步）
  // ============================================
  // 使用普通函数定义，可包含异步操作

  /**
   * ============================================
   * Action: 用户登录
   * ============================================
   *
   * @param {string} username - 用户名/手机号/邮箱
   * @param {string} password - 密码
   * @returns {Promise<boolean>} 登录是否成功
   *
   * 执行流程：
   * 1. 调用 loginApi 发送登录请求
   * 2. 成功后保存 token 到 state 和 localStorage
   * 3. 获取用户详细信息
   * 4. 跳转到首页或之前的页面
   */
  async function loginAction(username, password) {
    try {
      // 显示加载状态（可由调用方控制 Loading 组件）
      console.log('【UserStore】开始登录...')

      // 调用登录 API
      const res = await loginApi({ username, password })

      /**
       * 假设后端返回结构：
       * {
       *   token: "eyJhbGciOiJIUzI1NiIs...",
       *   expiresIn: 3600,
       *   userInfo: { ... }
       * }
       */
      const { token: newToken, userInfo: newUserInfo } = res

      // 保存 token 到响应式 state
      token.value = newToken

      // 持久化到 localStorage，刷新页面不丢失
      localStorage.setItem('token', newToken)

      // 如果后端返回了用户信息，直接更新
      if (newUserInfo) {
        userInfo.value = { ...userInfo.value, ...newUserInfo }
      } else {
        // 否则主动获取用户信息
        await getUserInfoAction()
      }

      console.log('【UserStore】登录成功')
      return true

    } catch (error) {
      console.error('【UserStore】登录失败:', error)
      // 登录失败时清除残留状态
      logoutAction()
      return false
    }
  }

  /**
   * ============================================
   * Action: 获取用户信息
   * ============================================
   *
   * 使用场景：
   * - 登录成功后获取详细信息
   * - 页面刷新后恢复用户状态
   * - 个人中心页面加载
   *
   * @returns {Promise<boolean>} 获取是否成功
   */
  async function getUserInfoAction() {
    try {
      // 如果没有 token，不需要请求
      if (!token.value) {
        console.warn('【UserStore】无 Token，跳过获取用户信息')
        return false
      }

      const data = await getUserInfoApi()

      /**
       * 更新用户信息（保留原有字段的默认值）
       * 使用展开运算符合并，避免直接覆盖导致字段丢失
       */
      userInfo.value = {
        username: data.username || '',
        email: data.email || '',
        nickname: data.nickname || '',
        avatar: data.avatar || '',
        gender: data.gender ?? 0,    // ?? 处理 null/undefined，0 是有效值
        age: data.age ?? null
      }

      console.log('【UserStore】获取用户信息成功:', userInfo.value)
      return true

    } catch (error) {
      console.error('【UserStore】获取用户信息失败:', error)
      // 如果 401，说明 token 过期，执行登出
      if (error.message?.includes('401')) {
        logoutAction()
      }
      return false
    }
  }

  /**
   * ============================================
   * Action: 退出登录
   * ============================================
   *
   * 执行流程：
   * 1. 清除 state 中的 token 和 userInfo
   * 2. 清除 localStorage 中的持久化数据
   * 3. 重定向到登录页
   *
   * @param {boolean} redirect - 是否跳转到登录页，默认 true
   */
  async function logoutAction(redirect = true) {
    try {
      // 可选：通知后端登出（将 token 加入黑名单）
      // await logoutApi()
      console.log('【UserStore】执行登出...')
    } catch (error) {
      // 即使后端接口失败，也要清除前端状态
      console.warn('【UserStore】后端登出接口失败，继续清除本地状态')
    }

    // 清除响应式 state
    token.value = ''
    userInfo.value = {
      username: '',
      email: '',
      nickname: '',
      avatar: '',
      gender: 0,
      age: null
    }

    // 清除 localStorage 持久化数据
    localStorage.removeItem('token')

    // 跳转到登录页
    if (redirect) {
      await router.push('/auth/login')
    }

    console.log('【UserStore】登出完成')
  }

  /**
   * ============================================
   * Action: 初始化用户状态
   * ============================================
   *
   * 使用场景：应用启动时调用（main.js 或 App.vue）
   * 作用：检查 localStorage 中有无 token，有则获取用户信息
   *
   * 示例使用（main.js）：
   * import { useUserStore } from '@/store/modules/user.js'
   * const userStore = useUserStore()
   * await userStore.initUserState()
   */
  async function initUserState() {
    // 从 localStorage 恢复 token（虽然 ref 初始化时已读取，但这里确保同步）
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
      // 获取最新用户信息
      await getUserInfoAction()
    }
  }

  // ============================================
  // 导出（暴露给组件使用）
  // ============================================
  // 必须导出才能在组件中解构使用

  return {
    // State
    token,
    userInfo,

    // Getters
    isLoggedIn,
    displayName,
    avatarUrl,

    // Actions
    loginAction,
    getUserInfoAction,
    logoutAction,
    initUserState
  }
})
