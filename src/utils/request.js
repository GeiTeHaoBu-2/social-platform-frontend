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

// ============================================
// 第一步：创建 Axios 实例
// ============================================
// 为什么要用 create 而不是直接用 axios？
// 答：create 创建的实例拥有独立的配置，不会影响全局 axios 对象
// 这样我们可以在不同模块创建不同配置的实例（如不同的 baseURL、超时时间）

const instance = axios.create({
  // baseURL: 所有请求 URL 的前缀
  // 开发环境通常指向本地或测试服务器，生产环境指向真实后端地址
  // Vite 环境变量使用 import.meta.env，Vue CLI 使用 process.env
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  
  // timeout: 请求超时时间（毫秒）
  // 超过这个时间未收到响应，请求会被自动取消，避免无限等待
  // 一般根据业务场景设置，3-10秒比较常见
  timeout: 10000,
  
  // headers: 默认请求头
  // Content-Type 声明请求体的格式为 JSON
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============================================
// 第二步：请求拦截器 (Request Interceptor)
// ============================================
// 作用：在请求发送到服务器之前，统一处理请求配置
// 常见用途：添加认证 Token、添加通用参数、显示 Loading 等

instance.interceptors.request.use(
  // 成功回调：可以对 config 进行修改，必须返回 config 才会继续发送请求
  (config) => {
    /**
     * localStorage 是浏览器提供的持久化存储 API
     * - setItem(key, value): 存储数据
     * - getItem(key): 读取数据
     * - removeItem(key): 删除数据
     * - clear(): 清空所有数据
     * 
     * 为什么选择 localStorage 而不是 sessionStorage？
     * - localStorage 数据永久保存（除非主动删除），刷新页面不会丢失
     * - sessionStorage 只在当前标签页会话期间有效，关闭标签页即失效
     * - Token 需要持久化保存，所以用 localStorage
     */
    const token = localStorage.getItem('token')
    
    /**
     * Authorization 是 HTTP 标准请求头，用于携带认证信息
     * Bearer 是一种认证方案 (Authentication Scheme)，RFC 6750 定义
     * 格式为：Authorization: Bearer <token>
     * 
     * 为什么用 Bearer 而不是其他方案？
     * - Bearer 专用于 JWT (JSON Web Token) 认证
     * - 简单、标准化、被大多数后端框架支持
     * - 与 Basic Auth、Digest Auth 等方案区分
     */
    if (token) {
      // config.headers 是请求头对象，动态添加 Authorization 字段
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 返回修改后的配置，请求才会继续发送
    return config
  },
  
  // 错误回调：请求发送前的预处理出错时触发（如请求配置错误）
  // 这种情况比较少见，但建议统一处理
  (error) => {
    console.error('【请求拦截器】请求配置错误：', error)
    return Promise.reject(error)
  }
)

// ============================================
// 第三步：响应拦截器 (Response Interceptor)
// ============================================
// 作用：在收到服务器响应后，统一处理响应数据
// 常见用途：剥离外层包装、统一错误处理、Token 失效处理等

instance.interceptors.response.use(
  // 成功回调：HTTP 状态码为 2xx 时触发
  // 注意：业务逻辑错误（如参数错误、权限不足）也可能返回 200，需要进一步判断
  (response) => {
    /**
     * response 结构说明：
     * {
     *   data: {},        // 服务器返回的数据体（我们最关心的内容）
     *   status: 200,     // HTTP 状态码
     *   statusText: 'OK', // HTTP 状态描述
     *   headers: {},     // 响应头
     *   config: {},      // 本次请求的配置
     *   request: {}      // 底层的 XMLHttpRequest 对象
     * }
     * 
     * 后端统一响应格式：{ code: 200, message: 'success', data: ... }
     */
    const res = response.data
    
    // 判断业务状态码
    // code === 200 表示业务逻辑处理成功，直接返回 data 给调用方
    if (res.code === 200) {
      /**
       * 为什么要剥离外层，只返回 res.data？
       * - 简化业务代码：调用方不需要再解构 response.data.data
       * - 统一封装：所有成功响应都拿到纯净的业务数据
       * - 符合关注点分离原则：业务代码只关心数据，不关心协议包装
       */
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
  // 常见错误：401 未认证、403 禁止访问、404 资源不存在、500 服务器错误等
  (error) => {
    /**
     * error 对象结构：
     * {
     *   message: 'timeout of 10000ms exceeded',  // 错误描述
     *   response: {                              // 存在时表示服务器返回了错误响应
     *     status: 401,
     *     data: { code: 401, message: '未认证' }
     *   },
     *   request: {},    // 底层的 XMLHttpRequest 对象
     *   config: {}      // 本次请求的配置
     * }
     * 
     * 注意：如果请求根本没发出去（如网络断开），error.response 为 undefined
     */
    
    if (error.response) {
      // 服务器返回了错误响应，根据状态码分类处理
      const status = error.response.status
      
      switch (status) {
        case 400:
          console.error('【响应拦截器】请求参数错误 (400)')
          break
          
        case 401:
          /**
           * 401 Unauthorized：未认证或 Token 过期
           * 处理逻辑：
           * 1. 清除本地过期的 Token
           * 2. 跳转登录页，让用户重新登录
           * 
           * 为什么不能直接用 router.push？
           * - request.js 是纯工具模块，不持有 router 实例
           * - 这里通过 window.location.href 进行硬跳转，确保彻底刷新状态
           * - 也可以将 router 作为参数传入，但会增加模块耦合度
           */
          console.error('【响应拦截器】登录状态已过期 (401)，请重新登录')
          localStorage.removeItem('token')
          
          // 使用 window.location 跳转到登录页
          // 使用 encodeURIComponent 保存当前路径，登录后可跳回原页面
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

// ============================================
// 第四步：导出实例
// ============================================
// 导出封装好的 axios 实例，供业务模块导入使用
// 业务代码使用：import request from '@/utils/request.js'

export default instance
