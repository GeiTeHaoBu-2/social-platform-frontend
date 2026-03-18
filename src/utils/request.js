/**
 * ============================================
 * Axios 网络请求封装模块
 * ============================================
 * 
 * 设计思路：
 * 1. 创建单一 axios 实例，统一配置基础参数
 * 2. 请求拦截器：自动注入认证 Token
 * 3. 响应拦截器：统一处理成功/失败逻辑，剥离外层包装
 * 4. 导出 instance 供业务模块使用
 * 
 * 底层原理：
 * - Axios 拦截器采用职责链模式 (Chain of Responsibility)
 * - 请求拦截器按注册顺序执行，响应拦截器按注册逆序执行
 */

import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
  // 成功回调：可以对 config 进行修改，必须返回 config 才会继续发送请求
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
        return config
  },
  
  // 错误回调：请求发送前的预处理出错时触发（如请求配置错误）
  (error) => {
    console.error('【请求拦截器】请求配置错误：', error)
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  // 成功回调：HTTP 状态码为 2xx 时触发
  (response) => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    } else {
      /**
       * 业务逻辑错误（非 HTTP 错误）
       * 例如：code = 400 参数错误、code = 403 无权限、code = 500 服务端内部错误
       * 
       * 这里直接抛出错误，让调用方的 catch 块处理
       * 也可以在这里统一用 Element Plus / Ant Design Vue 的消息组件提示
       */
      console.warn(`【响应拦截器】业务错误 [code: ${res.code}]: ${res.message}`)
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  
  // 错误回调：HTTP 状态码非 2xx 时触发
  (error) => {

    if (error.response) {

      const status = error.response.status

      switch (status) {
        case 400:
          console.error('【响应拦截器】请求参数错误 (400)')
          break
          
        case 401:
          console.error('【响应拦截器】登录状态已过期 (401)，请重新登录')
          localStorage.removeItem('token')
          const currentPath = encodeURIComponent(window.location.pathname)
          window.location.href = `/auth/login?redirect=${currentPath}`
          break
          
        case 403:
          console.error('【响应拦截器】权限不足，禁止访问 (403)')
          break
          
        case 404:
          console.error('【响应拦截器】请求资源不存在 (404)')
          break
          
        case 500:
          console.error('【响应拦截器】服务器内部错误 (500)')
          break
          
        default:
          console.error(`【响应拦截器】请求失败 (${status})`)
      }
      
      // 从响应中提取错误信息，优先使用服务端返回的 message
      const message = error.response.data?.message || `请求失败 (${status})`
      return Promise.reject(new Error(message))
      
    } else if (error.request) {
      /**
       * 请求已发送，但没有收到响应
       * 常见原因：网络断开、服务器宕机、跨域被浏览器拦截
       */
      console.error('【响应拦截器】网络错误：服务器无响应')
      return Promise.reject(new Error('网络错误，请检查网络连接'))
      
    } else {
      /**
       * 请求配置阶段出错
       * 常见原因：代码逻辑错误、请求参数格式错误
       */
      console.error('【响应拦截器】请求配置错误：', error.message)
      return Promise.reject(error)
    }
  }
)

export default instance
