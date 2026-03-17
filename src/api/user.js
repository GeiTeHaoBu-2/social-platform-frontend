/**
 * ============================================
 * 用户信息相关 API 接口模块
 * ============================================
 * 
 * 本模块职责：
 * - 封装与用户资料相关的所有接口调用
 * - 包括获取信息、修改信息、上传头像等
 * 
 * 路由规划：
 * - GET    /api/v1/user/info    获取当前登录用户信息
 * - PUT    /api/v1/user/info    修改用户信息
 * - POST   /api/v1/user/avatar  上传头像（可选）
 * - PUT    /api/v1/user/password 修改密码（可选）
 */

import request from '@/utils/request.js'

/**
 * ============================================
 * 获取用户信息
 * ============================================
 * 
 * 接口：GET /api/v1/user/info
 * 用途：获取当前登录用户的详细资料
 * 
 * @returns {Promise<Object>} 用户详细信息
 * 
 * 预期响应数据结构：
 * {
 *   code: 200,
 *   message: "success",
 *   data: {
 *     id: 1,
 *     username: "zhangsan",
 *     email: "zhangsan@example.com",
 *     nickname: "张三",
 *     avatar: "https://xxx.com/avatar.jpg",
 *     gender: 1,        // 0: 保密, 1: 男, 2: 女
 *     age: 25,
 *     phone: "138****8888",
 *     createTime: "2024-01-15T10:30:00",
 *     updateTime: "2024-03-17T08:20:00"
 *   }
 * }
 * 
 * 调用场景：
 * - 登录成功后获取用户资料展示在页面右上角
 * - 进入个人中心页面时加载详细信息
 * - 应用初始化时恢复用户登录状态
 */
export function getUserInfoApi() {
  return request({
    url: '/api/v1/user/info',
    method: 'GET'
    // GET 请求不需要 data 参数
    // 如需查询参数，使用 params: { key: value }
  })
}

/**
 * ============================================
 * 修改用户信息
 * ============================================
 * 
 * 接口：PUT /api/v1/user/info
 * 用途：更新当前登录用户的个人资料
 * 
 * @param {Object} data - 要更新的用户信息（支持部分更新）
 * @param {string} [data.nickname] - 昵称
 * @param {string} [data.email] - 邮箱
 * @param {string} [data.avatar] - 头像 URL
 * @param {number} [data.gender] - 性别：0保密, 1男, 2女
 * @param {number} [data.age] - 年龄
 * @returns {Promise<Object>} 更新后的用户信息
 * 
 * 设计说明：
 * - 使用 PUT 方法表示"全量更新"或"部分更新"（根据后端设计）
 * - 如果后端要求 PATCH 部分更新，可将 method 改为 'PATCH'
 * - 只传入需要修改的字段，未传入的字段保持原值
 * 
 * 示例调用：
 * updateUserInfoApi({ nickname: '新昵称', gender: 1 })
 */
export function updateUserInfoApi(data) {
  return request({
    url: '/api/v1/user/info',
    method: 'PUT',
    data
  })
}

/**
 * ============================================
 * 修改密码（可选扩展）
 * ============================================
 * 
 * 接口：PUT /api/v1/user/password
 * 用途：修改当前用户密码
 * 
 * @param {Object} data
 * @param {string} data.oldPassword - 原密码（用于验证身份）
 * @param {string} data.newPassword - 新密码
 * @returns {Promise<Object>}
 */
export function updatePasswordApi(data) {
  return request({
    url: '/api/v1/user/password',
    method: 'PUT',
    data
  })
}

/**
 * ============================================
 * 上传头像（可选扩展）
 * ============================================
 * 
 * 接口：POST /api/v1/user/avatar
 * 用途：上传用户头像图片
 * 
 * @param {FormData} formData - 包含图片文件的 FormData 对象
 * @returns {Promise<Object>} 返回头像 URL
 * 
 * 特殊说明：
 * - 文件上传需要设置 Content-Type: multipart/form-data
 * - axios 会自动识别 FormData 并设置正确的 headers
 * - 不需要手动设置 Content-Type
 */
export function uploadAvatarApi(formData) {
  return request({
    url: '/api/v1/user/avatar',
    method: 'POST',
    data: formData,
    // 上传文件时可能需要更长的超时时间
    timeout: 30000,
    // 上传进度监控（可选）
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      console.log(`上传进度: ${percentCompleted}%`)
    }
  })
}
