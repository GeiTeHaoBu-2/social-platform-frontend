<!--
  ============================================
  用户登录页面 (Login.vue)
  ============================================

  功能概述：
  1. 用户名/密码登录表单
  2. Element Plus 表单校验（邮箱格式、密码长度）
  3. 记住密码功能（localStorage 持久化）
  4. 登录成功后跳转（支持回调地址）

  技术要点：
  - el-form: Element Plus 表单组件，内置校验体系
  - el-form-item: 表单字段容器，可配置校验规则
  - ref: 获取组件实例，调用组件方法（如 validate）
  - reactive: 创建响应式对象（适合表单数据）
-->

<script setup>
// ============================================
// 导入依赖
// ============================================

import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user.js'

// Element Plus 图标
import { User, Lock, View, Hide } from '@element-plus/icons-vue'

// ============================================
// 路由和 Store 初始化
// ============================================

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ============================================
// 响应式数据定义
// ============================================

/**
 * ref: 创建独立的响应式数据
 * 特点：通过 .value 访问和修改
 * 用途：获取 DOM 引用、存储简单值
 */

// 表单引用，用于调用 el-form 的方法（如 validate、resetFields）
const loginFormRef = ref(null)

// 密码可见性控制
const passwordVisible = ref(false)

// 登录按钮加载状态
const loading = ref(false)

/**
 * reactive: 创建深层响应式对象
 * 特点：直接访问属性，无需 .value
 * 用途：表单数据、复杂状态对象
 *
 * 与 ref 的选择：
 * - 表单数据用 reactive（字段多，直接访问更简洁）
 * - DOM 引用用 ref
 */
const loginForm = reactive({
  username: '',      // 用户名/邮箱/手机号
  password: '',      // 密码
  remember: false    // 记住密码
})

// ============================================
// 表单校验规则
// ============================================

/**
 * Element Plus 表单校验规则详解：
 *
 * 每个字段可配置一个规则数组，支持以下属性：
 * - required: 是否必填
 * - message: 校验失败时的提示信息
 * - trigger: 触发时机（'blur'失焦、'change'变化）
 * - validator: 自定义校验函数（最灵活）
 * - pattern: 正则表达式校验
 * - min/max: 长度范围
 * - type: 类型校验（'email'、'number'等）
 */
const rules = {
  username: [
    {
      required: true,
      message: '请输入用户名或邮箱',
      trigger: 'blur'  // 输入框失焦时触发校验
    },
    {
      min: 3,
      max: 50,
      message: '长度在 3 到 50 个字符',
      trigger: 'blur'
    }
    /**
     * 可选：邮箱格式校验（如果只允许邮箱登录）
     * {
     *   type: 'email',
     *   message: '请输入正确的邮箱格式',
     *   trigger: 'blur'
     * }
     */
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: 'blur'
    },
    {
      min: 6,
      max: 20,
      message: '密码长度在 6 到 20 个字符',
      trigger: 'blur'
    }
  ]
}

// ============================================
// 生命周期钩子
// ============================================

/**
 * onMounted: 组件挂载完成后执行
 * 用途：
 * 1. 检查是否已登录（是则跳转首页）
 * 2. 读取"记住密码"存储的凭证
 */
onMounted(() => {
  // 如果已登录，直接跳首页
  if (userStore.isLoggedIn) {
    router.replace('/')
    return
  }

  // 读取记住的账号密码
  const savedUsername = localStorage.getItem('login_username')
  const savedPassword = localStorage.getItem('login_password')
  if (savedUsername && savedPassword) {
    loginForm.username = savedUsername
    loginForm.password = savedPassword
    loginForm.remember = true
  }
})

// ============================================
// 方法定义
// ============================================

/**
 * 处理登录提交
 *
 * 流程：
 * 1. 表单校验（validate）
 * 2. 显示加载状态
 * 3. 调用 Pinia store 的 loginAction
 * 4. 处理记住密码逻辑
 * 5. 跳转目标页面
 */
async function handleLogin() {
  /**
   * el-form.validate() 返回 Promise
   * - 校验通过：resolve(true)
   * - 校验失败：reject(错误信息)
   *
   * 注意：需要 await 等待异步校验完成
   */
  try {
    await loginFormRef.value.validate()
  } catch (error) {
    // 校验失败，不继续执行
    return
  }

  // 开始加载
  loading.value = true

  try {
    // 调用登录 action
    const success = await userStore.loginAction(
      loginForm.username,
      loginForm.password
    )

    if (success) {
      // 登录成功
      ElMessage.success('登录成功')

      // 处理"记住密码"
      if (loginForm.remember) {
        localStorage.setItem('login_username', loginForm.username)
        localStorage.setItem('login_password', loginForm.password)
      } else {
        localStorage.removeItem('login_username')
        localStorage.removeItem('login_password')
      }

      // 跳转到之前的页面或首页
      // route.query.redirect 由路由守卫设置
      const redirect = route.query.redirect || '/'
      router.replace(redirect)
    } else {
      // 登录失败（错误已在 store 中处理）
      ElMessage.error('登录失败，请检查账号密码')
    }
  } catch (error) {
    console.error('登录异常:', error)
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    // 无论成功失败，关闭加载状态
    loading.value = false
  }
}

/**
 * 切换密码可见性
 */
function togglePasswordVisible() {
  passwordVisible.value = !passwordVisible.value
}
</script>

<template>
  <!--
    ============================================
    页面布局
    ============================================
    - min-h-screen: 最小高度为视口高度，确保撑满屏幕
    - bg-gradient-to-br: 从左上到右下的渐变背景
    - flex items-center justify-center: 内容垂直水平居中
  -->
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <!--
      登录卡片
      - max-w-md: 最大宽度 448px
      - w-full: 宽度 100%（在移动端生效）
      - bg-white: 白色背景
      - rounded-2xl: 大圆角
      - shadow-xl: 大阴影，增加层次感
      - p-8: 内边距 32px
    -->
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">

      <!-- 标题区域 -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900">欢迎回来</h2>
        <p class="mt-2 text-sm text-gray-600">登录您的舆情监控账号</p>
      </div>

      <!--
        ============================================
        登录表单
        ============================================
        - ref="loginFormRef": 绑定 ref，用于获取组件实例
        - :model="loginForm": 绑定表单数据对象
        - :rules="rules": 绑定校验规则
        - @keyup.enter: 回车键提交表单
      -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        size="large"
        @keyup.enter="handleLogin"
      >
        <!--
          用户名输入框
          - prop="username": 对应 rules 中的校验规则 key
          - 必须设置 prop 才会触发该校验规则
        -->
        <el-form-item label="用户名/邮箱" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名或邮箱"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="请输入密码"
            :prefix-icon="Lock"
          >
            <!--
              密码可见性切换按钮（输入框后缀插槽）
              #suffix: 输入框右侧内容插槽
            -->
            <template #suffix>
              <el-icon
                class="cursor-pointer hover:text-blue-600"
                @click="togglePasswordVisible"
              >
                <View v-if="passwordVisible" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 记住密码 & 忘记密码 -->
        <div class="flex items-center justify-between mb-6">
          <el-checkbox v-model="loginForm.remember">
            记住密码
          </el-checkbox>
          <a
            href="#"
            class="text-sm text-blue-600 hover:text-blue-500"
            @click.prevent="$message.info('功能开发中')"
          >
            忘记密码？
          </a>
        </div>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            class="w-full"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部链接 -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          还没有账号？
          <router-link
            to="/auth/register"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            立即注册
          </router-link>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 可在此添加页面特定样式 */
</style>
