/**
 * ============================================
 * 认证相关 API 接口模块
 * ============================================
 * 
 * 设计思路：
 * 1. 按业务领域拆分 API 模块（认证、用户、大屏等）
 * 2. 每个函数对应一个后端接口，保持命名语义化
 * 3. 统一使用 request.js 封装的 axios 实例
 * 
 * 底层原理：
 * - 模块化的 API 层实现关注点分离，业务组件只关心"做什么"，不关心"怎么做"
 * - 便于统一处理接口变更、Mock 数据、请求缓存等
 */

// 导入封装好的 axios 实例
// @/utils/request.js 中的 @ 需要在 vite.config.js 中配置 alias
import request from '@/utils/request.js'

/**
 * ============================================
 * 用户登录
 * ============================================
 * 
 * 接口：POST /api/v1/auth/login
 * 用途：用户输入账号密码，换取 JWT Token
 * 
 * @param {Object} data - 登录参数
 * @param {string} data.username - 用户名/手机号/邮箱
 * @param {string} data.password - 密码（建议前端做基础加密或 HTTPS 传输）
 * @returns {Promise<Object>} 返回包含 token 和用户信息的对象
 * 
 * 预期响应：
 * {
 *   code: 200,
 *   message: "success",
 *   data: {
 *     token: "eyJhbGciOiJIUzI1NiIs...",
 *     expiresIn: 3600,
 *     userInfo: { id: 1, username: "xxx", ... }
 *   }
 * }
 */
export function loginApi(data) {
  // request 是 axios 实例，默认返回 Promise
  // 由于响应拦截器已剥离外层，这里直接得到 response.data.data
  return request({
    url: '/api/v1/auth/login',
    method: 'POST',
    data  // POST 请求参数放在 data 中，axios 会自动序列化为 JSON
  })
}

/**
 * ============================================
 * 用户注册
 * ============================================
 * 
 * 接口：POST /api/v1/auth/register
 * 用途：新用户注册账号
 * 
 * @param {Object} data - 注册参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.confirmPassword - 确认密码
 * @param {string} data.email - 邮箱（可选）
 * @param {string} data.phone - 手机号（可选）
 * @param {string} data.code - 短信/邮箱验证码
 * @returns {Promise<Object>} 返回注册结果
 */
export function registerApi(data) {
  return request({
    url: '/api/v1/auth/register',
    method: 'POST',
    data
  })
}

/**
 * ============================================
 * 发送验证码
 * ============================================
 * 
 * 接口：POST /api/v1/auth/send-code
 * 用途：发送短信验证码或邮箱验证码
 * 
 * @param {Object} params - 请求参数
 * @param {string} params.target - 手机号或邮箱地址
 * @param {string} params.type - 验证码类型：'sms'(短信) | 'email'(邮箱)
 * @param {string} params.scene - 使用场景：'register'(注册) | 'reset'(重置密码) | 'bind'(绑定)
 * @returns {Promise<Object>} 返回发送结果
 * 
 * 安全提示：
 * - 后端应限制同一目标的频繁发送（如 60 秒间隔）
 * - 前端按钮应做倒计时禁用，防止重复点击
 */
export function sendCodeApi(params) {
  return request({
    url: '/api/v1/auth/send-code',
    method: 'POST',
    // params 也可以用于 GET，但 POST 中 data 和 params 的区别：
    // - data: 放在请求体 (Request Body) 中，适合敏感数据、大数据量
    // - params: 放在 URL 查询字符串中，适合简单的筛选条件
    // 这里验证码接口用 POST 更安全，参数放 data
    data: params
  })
}

/**
 * ============================================
 * 刷新 Token（可选）
 * ============================================
 * 
 * 接口：POST /api/v1/auth/refresh
 * 用途：使用 Refresh Token 换取新的 Access Token
 * 
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise<Object>} 返回新的 Token 对
 * 
 * 使用场景：
 * - Access Token 过期（如 15 分钟），但 Refresh Token 未过期（如 7 天）
 * - 在 request.js 的响应拦截器中静默调用，用户无感知
 */
export function refreshTokenApi(refreshToken) {
  return request({
    url: '/api/v1/auth/refresh',
    method: 'POST',
    data: { refreshToken }
  })
}

/**
 * ============================================
 * 退出登录
 * ============================================
 * 
 * 接口：POST /api/v1/auth/logout
 * 用途：通知后端作废当前 Token（加入黑名单）
 * 
 * @returns {Promise<Object>} 返回登出结果
 * 
 * 注意：
 * - 即使后端返回失败，前端也应清除本地 Token
 * - 因为 Token 存在 localStorage，后端无法主动"删除"
 */
export function logoutApi() {
  return request({
    url: '/api/v1/auth/logout',
    method: 'POST'
  })
}
