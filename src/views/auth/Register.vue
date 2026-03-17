<!--
  ============================================
  用户注册页面 (Register.vue)
  ============================================

  功能概述：
  1. 用户名/邮箱/密码/验证码注册表单
  2. 表单校验（邮箱格式、密码强度、确认密码一致）
  3. 验证码 60 秒倒计时逻辑
  4. 注册成功后自动登录

  技术要点：
  - watch: 监听响应式数据变化（密码变化时重新校验确认密码）
  - setInterval: 倒计时实现
  - beforeUnmount: 组件销毁前清理定时器（避免内存泄漏）
-->

<script setup>
// ============================================
// 导入依赖
// ============================================

import { ref, reactive, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { registerApi, sendCodeApi } from '@/api/auth.js'
import { useUserStore } from '@/store/modules/user.js'

// Element Plus 图标
import { User, Lock, Message, Key } from '@element-plus/icons-vue'

// ============================================
// 初始化
// ============================================

const router = useRouter()
const userStore = useUserStore()

// ============================================
// 响应式数据
// ============================================

const registerFormRef = ref(null)
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)
const loading = ref(false)

// 验证码相关状态
const codeSending = ref(false)      // 是否正在发送中
const countdown = ref(0)            // 倒计时剩余秒数
const countdownTimer = ref(null)    // 定时器引用（用于清理）

// 注册表单数据
const registerForm = reactive({
  username: '',           // 用户名
  email: '',              // 邮箱
  password: '',           // 密码
  confirmPassword: '',    // 确认密码
  code: ''                // 验证码
})

// ============================================
// 自定义校验规则
// ============================================

/**
 * 验证确认密码是否与密码一致
 * 这是一个自定义校验函数（validator）
 *
 * @param {Object} rule - 规则对象
 * @param {string} value - 当前字段值
 * @param {Function} callback - 回调函数，调用方式：
 *   - callback(): 校验通过
 *   - callback(new Error('错误信息')): 校验失败
 */
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()  // 校验通过，不传参数
  }
}

/**
 * 校验规则对象
 */
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,  // 正则：字母数字下划线中文
      message: '用户名只能包含字母、数字、下划线和中文',
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    {
      type: 'email',  // Element Plus 内置邮箱格式校验
      message: '请输入正确的邮箱格式',
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,  // 必须包含字母和数字
      message: '密码必须同时包含字母和数字',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位数字', trigger: 'blur' }
  ]
}

// ============================================
// 监听器（Watch）
// ============================================

/**
 * watch: 监听响应式数据变化
 *
 * 语法：watch(数据源, 回调函数, 选项)
 *
 * 作用：
 * - 监听 password 变化
 * - 当确认密码已有值时，重新触发表单校验
 * - 确保修改密码后，确认密码的校验结果实时更新
 */
watch(
  () => registerForm.password,
  () => {
    /**
     * 确认密码已输入时，重新校验 confirmPassword 字段
     * validateField 是 el-form 的方法，校验指定字段
     */
    if (registerForm.confirmPassword !== '') {
      registerFormRef.value?.validateField('confirmPassword')
    }
  }
)

// ============================================
// 生命周期钩子
// ============================================

/**
 * onBeforeUnmount: 组件卸载前执行
 * 用途：清理副作用（定时器、事件监听、WebSocket 等）
 *
 * 不清理的后果：
 * - 用户离开页面后，定时器仍在后台运行
 * - 造成内存泄漏
 * - 可能引发意想不到的错误
 */
onBeforeUnmount(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
})

// ============================================
// 方法定义
// ============================================

/**
 * 发送验证码
 *
 * 流程：
 * 1. 校验邮箱格式
 * 2. 调用发送验证码 API
 * 3. 启动 60 秒倒计时
 * 4. 倒计时期间禁用按钮
 */
async function handleSendCode() {
  // 先校验邮箱字段
  try {
    await registerFormRef.value.validateField('email')
  } catch (error) {
    ElMessage.warning('请先输入正确的邮箱地址')
    return
  }

  // 防止重复点击
  if (codeSending.value || countdown.value > 0) {
    return
  }

  codeSending.value = true

  try {
    // 调用发送验证码 API
    await sendCodeApi({
      target: registerForm.email,
      type: 'email',
      scene: 'register'
    })

    ElMessage.success('验证码已发送，请查收邮件')

    // 启动倒计时
    startCountdown()

  } catch (error) {
    ElMessage.error(error.message || '发送失败，请稍后重试')
  } finally {
    codeSending.value = false
  }
}

/**
 * 启动倒计时
 * 使用 setInterval 每秒更新 countdown
 */
function startCountdown() {
  countdown.value = 60  // 60 秒倒计时

  /**
   * setInterval: 定时器，按指定间隔重复执行
   * 返回 timer ID，可用于 clearInterval 取消
   */
  countdownTimer.value = setInterval(() => {
    countdown.value--

    // 倒计时结束，清理定时器
    if (countdown.value <= 0) {
      clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
  }, 1000)  // 1000ms = 1秒
}

/**
 * 处理注册提交
 */
async function handleRegister() {
  // 表单校验
  try {
    await registerFormRef.value.validate()
  } catch (error) {
    return
  }

  loading.value = true

  try {
    // 调用注册 API
    await registerApi({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      code: registerForm.code
    })

    ElMessage.success('注册成功！')

    /**
     * 注册成功后自动登录
     * 也可跳转到登录页让用户手动登录
     */
    const loginSuccess = await userStore.loginAction(
      registerForm.username,
      registerForm.password
    )

    if (loginSuccess) {
      router.replace('/')
    } else {
      // 自动登录失败，跳转登录页
      router.push('/auth/login')
    }

  } catch (error) {
    console.error('注册失败:', error)
    ElMessage.error(error.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 切换密码可见性
 */
function togglePasswordVisible() {
  passwordVisible.value = !passwordVisible.value
}

function toggleConfirmPasswordVisible() {
  confirmPasswordVisible.value = !confirmPasswordVisible.value
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">

      <!-- 标题 -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900">创建账号</h2>
        <p class="mt-2 text-sm text-gray-600">加入舆情监控平台，开启数据洞察</p>
      </div>

      <!--
        ============================================
        注册表单
        ============================================
      -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-position="top"
        size="large"
        @keyup.enter="handleRegister"
      >
        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名（3-20字符）"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱地址"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>

        <!-- 密码 -->
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="请输入密码（6-20位，含字母和数字）"
            :prefix-icon="Lock"
          >
            <template #suffix>
              <el-icon class="cursor-pointer" @click="togglePasswordVisible">
                <View v-if="passwordVisible" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            :type="confirmPasswordVisible ? 'text' : 'password'"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
          >
            <template #suffix>
              <el-icon class="cursor-pointer" @click="toggleConfirmPasswordVisible">
                <View v-if="confirmPasswordVisible" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!--
          验证码
          - 使用 el-row + el-col 实现左右布局
          - 左侧输入框，右侧发送按钮
        -->
        <el-form-item label="验证码" prop="code">
          <el-row :gutter="12">
            <el-col :span="14">
              <el-input
                v-model="registerForm.code"
                placeholder="请输入 6 位验证码"
                :prefix-icon="Key"
                maxlength="6"
              />
            </el-col>
            <el-col :span="10">
              <!--
                发送验证码按钮
                - :disabled: 倒计时期间禁用
                - loading: 发送中显示加载动画
              -->
              <el-button
                class="w-full"
                :disabled="countdown > 0"
                :loading="codeSending"
                @click="handleSendCode"
              >
                <!--
                  按钮文字根据状态变化：
                  - 倒计时中：显示 "60s 后重发"
                  - 默认：显示 "获取验证码"
                -->
                {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>

        <!-- 注册按钮 -->
        <el-form-item class="mt-6">
          <el-button
            type="primary"
            class="w-full"
            size="large"
            :loading="loading"
            @click="handleRegister"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部链接 -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          已有账号？
          <router-link
            to="/auth/login"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            立即登录
          </router-link>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
</style>
