/**
 * ============================================
 * Vue Router 路由守卫模块
 * ============================================
 * 
 * 设计思路：
 * 1. 本文件独立实现路由守卫逻辑，与路由表配置物理解耦
 * 2. 单一职责：只负责权限校验和导航控制
 * 3. 导出 setupRouterGuards 函数，由 main.js 调用并传入 router 实例
 * 
 * 底层原理：
 * - 路由守卫是导航钩子 (Navigation Guards)，在路由切换的不同阶段执行
 * - beforeEach: 全局前置守卫，导航开始时执行
 * - 支持异步操作（如 Token 校验），通过 next() 或 return 控制导航流程
 */

// ============================================
// 白名单配置
// ============================================
// 定义不需要登录就能访问的路由路径列表
// 通常包括：首页、登录页、注册页、404页等
// 优点：集中管理，避免在守卫逻辑中硬编码路径

const WHITE_LIST = [
  '/auth/login',      // 登录页
  '/auth/register',   // 注册页（预留）
  '/404'              // 404页面
]

// ============================================
// 路由守卫设置函数
// ============================================
/**
 * 设置全局路由守卫
 * @param {Object} router - Vue Router 实例
 * 
 * 为什么用函数形式而不是直接操作？
 * - 延迟绑定：等 router 实例创建完成后再注册守卫
 * - 便于测试：可以传入 mock 的 router 进行单元测试
 * - 解耦：guards.js 不直接依赖 index.js 的 router 实例
 */
export function setupRouterGuards(router) {
  
  /**
   * ============================================
   * 全局前置守卫 (Global Before Guard)
   * ============================================
   * 
   * 触发时机：导航开始时，在所有组件内守卫和异步路由组件解析之前
   * 用途：权限校验、登录状态检查、页面标题设置等
   * 
   * @param to - 即将要进入的目标路由对象
   * @param from - 当前正要离开的路由对象
   * @param next - 必须调用该方法才能 resolve 这个钩子，控制导航方向
   * 
   * Vue Router 4 变化：可以不调用 next()，直接 return 导航结果
   * - return true / undefined: 继续导航
   * - return false: 取消导航
   * - return { path: '...' }: 重定向到指定路径
   */
  router.beforeEach((to, from) => {
    
    // ============================================
    // 第一步：设置页面标题
    // ============================================
    // 如果路由配置了 meta.title，则更新浏览器标签页标题
    // 增强用户体验，便于区分多标签页
    if (to.meta && to.meta.title) {
      document.title = `${to.meta.title} - 微博舆情系统`
    }
    
    // ============================================
    // 第二步：检查是否需要登录
    // ============================================
    // 从路由元信息中读取 requiresAuth 标记
    // 注意：to.matched 是匹配到的所有路由记录（包含父路由）
    // some() 方法检查数组中是否有至少一个元素满足条件
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    
    /**
     * 白名单检查逻辑：
     * - 如果目标路径在白名单中，直接放行，不需要检查 Token
     * - 用于避免登录页本身被拦截导致死循环
     */
    const isWhiteListed = WHITE_LIST.includes(to.path)
    if (isWhiteListed) {
      // 白名单路由，直接放行
      return true
    }
    
    // ============================================
    // 第三步：获取本地 Token 进行认证检查
    // ============================================
    // localStorage 是浏览器提供的同步 API，读取速度快
    // Token 通常在登录成功后由后端返回，前端存储在 localStorage
    const token = localStorage.getItem('token')
    
    /**
     * 认证状态判断逻辑：
     * 
     * 场景 1：需要登录 (requiresAuth = true) 且没有 Token
     * - 拦截导航，重定向到登录页
     * - 携带 redirect 参数，登录成功后可以跳回原页面
     * 
     * 场景 2：不需要登录 (requiresAuth = false) 或已有 Token
     * - 正常放行
     */
    if (requiresAuth && !token) {
      /**
       * 重定向到登录页并携带回调地址
       * 
       * encodeURIComponent: 对 URL 参数进行编码，处理特殊字符
       * 例如：原路径 /profile/index?tab=setting 编码后不会破坏 URL 结构
       * 
       * 登录页读取 redirect 参数，登录成功后跳回：
       * const redirect = route.query.redirect || '/'
       * router.push(redirect)
       */
      const redirect = encodeURIComponent(to.fullPath)
      
      console.warn(`【路由守卫】访问 ${to.path} 需要登录，已拦截并跳转登录页`)
      
      // Vue Router 4 推荐写法：直接返回导航目标对象
      return {
        path: '/auth/login',
        query: { redirect }
      }
    }
    
    /**
     * 可选增强：Token 有效性校验
     * 
     * 当前实现只检查 Token 是否存在（前端无法验证签名有效性）
     * 如果需要更严格的校验，可以：
     * 1. 解析 JWT 的 payload 检查是否过期
     * 2. 发送轻量请求到后端验证 Token 有效性
     * 
     * 注意：过度校验会增加每个路由切换的开销，建议只在关键操作校验
     */
    
    // ============================================
    // 第四步：正常放行
    // ============================================
    // 通过所有检查，允许导航继续
    // 不返回或返回 true / undefined 都表示放行
    return true
  })
  
  /**
   * ============================================
   * 全局后置钩子 (Global After Hook)
   * ============================================
   * 
   * 触发时机：导航完成后（所有导航守卫和异步组件解析完毕）
   * 特点：不会接受 next 函数，也不会改变导航本身
   * 用途：页面访问统计、结束 Loading 动画等
   */
  router.afterEach((to, from) => {
    // 示例：简单的页面访问日志
    console.log(`【路由导航】${from.path} -> ${to.path}`)
  })
  
  /**
   * ============================================
   * 全局错误处理
   * ============================================
   * 
   * 触发时机：导航过程中发生错误时
   * 常见错误：异步组件加载失败、导航被中断等
   */
  router.onError((error) => {
    console.error('【路由错误】导航失败:', error)
  })
}
