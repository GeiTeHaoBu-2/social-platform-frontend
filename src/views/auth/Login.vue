<!--
  ============================================
  用户登录页面 (Login.vue) - 科技感深色主题
  ============================================
  
  功能：
  1. 账号密码登录 / 验证码登录 双模式切换
  2. Element Plus 表单校验
  3. 记住密码功能
  4. 流光按钮、信号波纹背景等视觉效果
  
  路由路径: /auth/login
-->

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user.js'
import { 
  Monitor, 
  User, 
  Lock, 
  Message,
  View, 
  Hide 
} from '@element-plus/icons-vue'

// ============================================
// 路由和 Store
// ============================================
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ============================================
// 登录模式切换
// ============================================
const loginMode = ref('password') // 'password' | 'code'

// ============================================
// 账号密码登录表单
// ============================================
const passwordFormRef = ref(null)
const passwordVisible = ref(false)
const passwordLoading = ref(false)

const passwordForm = reactive({
  account: '',
  password: '',
  remember: false
})

const passwordRules = {
  account: [
    { required: true, message: '请输入账号或邮箱', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// ============================================
// 验证码登录表单
// ============================================
const codeFormRef = ref(null)
const codeLoading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)

const codeForm = reactive({
  email: '',
  code: ''
})

const codeRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
}

// ============================================
// 信号波纹动画控制
// ============================================
const rippleActive = ref(false)
const rippleSpeed = ref(3) // 波纹动画周期(秒)

function activateRipple() {
  rippleActive.value = true
  rippleSpeed.value = 1.5
}

function deactivateRipple() {
  rippleActive.value = false
  rippleSpeed.value = 3
}

// ============================================
// 生命周期
// ============================================
onMounted(() => {
  if (userStore.isLoggedIn) {
    router.replace('/')
    return
  }

  // 读取记住的账号
  const savedAccount = localStorage.getItem('login_account')
  const savedPassword = localStorage.getItem('login_password')
  if (savedAccount && savedPassword) {
    passwordForm.account = savedAccount
    passwordForm.password = savedPassword
    passwordForm.remember = true
  }
})

// ============================================
// 账号密码登录
// ============================================
async function handlePasswordLogin() {
  try {
    await passwordFormRef.value.validate()
  } catch (error) {
    return
  }

  passwordLoading.value = true

  try {
    const success = await userStore.loginAction(
      passwordForm.account,
      passwordForm.password
    )

    if (success) {
      ElMessage.success('登录成功')
      
      if (passwordForm.remember) {
        localStorage.setItem('login_account', passwordForm.account)
        localStorage.setItem('login_password', passwordForm.password)
      } else {
        localStorage.removeItem('login_account')
        localStorage.removeItem('login_password')
      }

      const redirect = route.query.redirect || '/'
      router.replace(redirect)
    } else {
      ElMessage.error('登录失败，请检查账号密码')
    }
  } catch (error) {
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    passwordLoading.value = false
  }
}

// ============================================
// 验证码登录
// ============================================
async function handleSendCode() {
  // 验证邮箱格式
  const emailValid = await codeFormRef.value.validateField('email').catch(() => false)
  if (!emailValid) return

  sendingCode.value = true
  countdown.value = 60

  // 模拟发送验证码
  ElMessage.success(`验证码已发送至 ${codeForm.email}`)

  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      sendingCode.value = false
    }
  }, 1000)
}

async function handleCodeLogin() {
  try {
    await codeFormRef.value.validate()
  } catch (error) {
    return
  }

  codeLoading.value = true

  try {
    // 模拟验证码登录
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('登录成功')
    
    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  } catch (error) {
    ElMessage.error('登录失败')
  } finally {
    codeLoading.value = false
  }
}

// ============================================
// 切换登录模式
// ============================================
function switchMode(mode) {
  loginMode.value = mode
}
</script>

<template>
  <div class="login-page min-h-screen flex items-center justify-center relative overflow-hidden">
    <!-- 背景网格 -->
    <div class="grid-bg absolute inset-0 pointer-events-none"></div>

    <!-- 登录框 -->
    <div class="login-modal relative z-10">
      <!-- 顶部装饰条 -->
      <div class="modal-top-bar"></div>

      <!-- 信号波纹背景 -->
      <div class="signal-bg">
        <div 
          v-for="i in 3" 
          :key="i"
          class="ring"
          :style="{ 
            animationDuration: rippleSpeed + 's',
            animationDelay: (i - 1) + 's'
          }"
        ></div>
      </div>

      <!-- 头部 -->
      <div class="modal-header">
        <div class="system-logo">
          <el-icon :size="28" class="text-purple-500 mr-2">
            <Monitor />
          </el-icon>
          舆情监控系统
        </div>
        <div class="system-subtitle">INTELLIGENCE MONITORING SYSTEM</div>
      </div>

      <!-- Tab 切换 -->
      <div class="login-tabs">
        <button 
          class="tab-btn"
          :class="{ active: loginMode === 'password' }"
          @click="switchMode('password')"
        >
          账号登录
        </button>
        <button 
          class="tab-btn"
          :class="{ active: loginMode === 'code' }"
          @click="switchMode('code')"
        >
          验证码登录
        </button>
      </div>

      <!-- 表单区域 -->
      <div class="form-content">
        <!-- 账号密码登录 -->
        <transition name="fade-transform" mode="out-in">
          <el-form
            v-if="loginMode === 'password'"
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            class="login-form"
          >
            <el-form-item prop="account">
              <div class="input-group">
                <el-input
                  v-model="passwordForm.account"
                  placeholder=" "
                  @focus="activateRipple"
                  @blur="deactivateRipple"
                  class="custom-input"
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
                <label class="input-label">账号 / 邮箱</label>
              </div>
            </el-form-item>

            <el-form-item prop="password">
              <div class="input-group">
                <el-input
                  v-model="passwordForm.password"
                  :type="passwordVisible ? 'text' : 'password'"
                  placeholder=" "
                  @focus="activateRipple"
                  @blur="deactivateRipple"
                  class="custom-input"
                  @keyup.enter="handlePasswordLogin"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                  <template #suffix>
                    <el-icon 
                      class="cursor-pointer hover:text-purple-400 transition-colors"
                      @click="passwordVisible = !passwordVisible"
                    >
                      <View v-if="passwordVisible" />
                      <Hide v-else />
                    </el-icon>
                  </template>
                </el-input>
                <label class="input-label">密码</label>
              </div>
            </el-form-item>

            <div class="form-footer">
              <el-checkbox v-model="passwordForm.remember" class="remember-checkbox">
                <span class="text-gray-400 text-sm">记住密码</span>
              </el-checkbox>
              <router-link to="/auth/forgot" class="link-text">
                忘记密码？
              </router-link>
            </div>

            <button 
              type="button"
              class="btn-submit"
              :disabled="passwordLoading"
              @click="handlePasswordLogin"
            >
              <span v-if="passwordLoading">登录中...</span>
              <span v-else>立即登录</span>
            </button>

            <div class="text-center mt-4">
              <span class="text-gray-500 text-sm">还没有账号？</span>
              <router-link to="/auth/register" class="link-text ml-1">
                立即注册
              </router-link>
            </div>
          </el-form>

          <!-- 验证码登录 -->
          <el-form
            v-else
            ref="codeFormRef"
            :model="codeForm"
            :rules="codeRules"
            class="login-form"
          >
            <el-form-item prop="email">
              <div class="input-group">
                <el-input
                  v-model="codeForm.email"
                  placeholder=" "
                  @focus="activateRipple"
                  @blur="deactivateRipple"
                  class="custom-input"
                >
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
                <label class="input-label">绑定邮箱</label>
              </div>
            </el-form-item>

            <el-form-item prop="code">
              <div class="input-group code-row">
                <el-input
                  v-model="codeForm.code"
                  placeholder=" "
                  maxlength="6"
                  @focus="activateRipple"
                  @blur="deactivateRipple"
                  class="custom-input flex-1"
                  @keyup.enter="handleCodeLogin"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
                <label class="input-label">验证码</label>
                <button
                  type="button"
                  class="btn-code"
                  :disabled="sendingCode || countdown > 0"
                  @click="handleSendCode"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </button>
              </div>
            </el-form-item>

            <div class="form-footer justify-end">
              <router-link to="/auth/register" class="link-text">
                没有账号？去注册
              </router-link>
            </div>

            <button 
              type="button"
              class="btn-submit"
              :disabled="codeLoading"
              @click="handleCodeLogin"
            >
              <span v-if="codeLoading">验证中...</span>
              <span v-else>验证登录</span>
            </button>
          </el-form>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   页面背景
   ============================================ */
.login-page {
  background-color: #050505;
  background-image: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #000000 100%);
}

/* 网格背景 */
.grid-bg {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ============================================
   登录框
   ============================================ */
.login-modal {
  width: 420px;
  background: rgba(22, 27, 34, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.5), 
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  animation: modalEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalEnter {
  from { 
    opacity: 0; 
    transform: translateY(20px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

/* 顶部装饰条 */
.modal-top-bar {
  height: 2px;
  background: linear-gradient(90deg, transparent, #9d4edd, transparent);
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* 头部 */
.modal-header {
  padding: 2rem 2rem 1rem;
  text-align: center;
}

.system-logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
  display: inline-flex;
  align-items: center;
}

.system-subtitle {
  font-size: 0.8rem;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

/* ============================================
   Tab 切换
   ============================================ */
.login-tabs {
  display: flex;
  padding: 0 2rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tab-btn {
  flex: 1;
  background: none;
  border: none;
  color: #94a3b8;
  padding: 1rem 0;
  cursor: pointer;
  font-size: 0.9rem;
  position: relative;
  transition: color 0.3s;
}

.tab-btn:hover {
  color: #fff;
}

.tab-btn.active {
  color: #fff;
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #9d4edd;
  box-shadow: 0 -2px 10px #9d4edd;
}

/* ============================================
   表单区域
   ============================================ */
.form-content {
  padding: 0 2rem 2rem;
  position: relative;
  z-index: 2;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 1.2rem;
}

.input-group {
  position: relative;
}

/* 自定义输入框样式 */
:deep(.custom-input .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
  padding: 0.8rem 1rem;
  border-radius: 4px;
  transition: all 0.3s;
}

:deep(.custom-input .el-input__inner) {
  color: #fff;
  font-size: 0.9rem;
  background: transparent;
  border: none;
  padding: 0;
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  border-color: #9d4edd;
  box-shadow: 0 0 15px rgba(157, 78, 221, 0.15);
  background: rgba(0, 0, 0, 0.4);
}

:deep(.custom-input .el-input__prefix) {
  color: #94a3b8;
  margin-right: 8px;
}

/* 浮动标签 */
.input-label {
  position: absolute;
  left: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.9rem;
  pointer-events: none;
  transition: all 0.3s;
  background: transparent;
  padding: 0 4px;
  z-index: 1;
}

:deep(.custom-input .el-input__inner:focus + .input-label),
:deep(.custom-input .el-input__inner:not(:placeholder-shown) + .input-label),
.input-group:focus-within .input-label,
.input-label.active {
  top: 0;
  left: 0.8rem;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #9d4edd;
  background: rgba(22, 27, 34, 0.95);
}

/* 验证码行 */
.code-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.code-row .input-label {
  left: 2.5rem;
}

.btn-code {
  padding: 0 1rem;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #9d4edd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: all 0.3s;
}

.btn-code:hover:not(:disabled) {
  background: rgba(157, 78, 221, 0.1);
  border-color: #9d4edd;
}

.btn-code:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   登录按钮
   ============================================ */
.btn-submit {
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(135deg, #3a0ca3, #9d4edd);
  border: none;
  color: #fff;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 0.95rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(157, 78, 221, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 流光效果 */
.btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.btn-submit:hover::before {
  left: 100%;
}

/* ============================================
   表单底部
   ============================================ */
.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.form-footer.justify-end {
  justify-content: flex-end;
}

.link-text {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.3s;
}

.link-text:hover {
  color: #9d4edd;
  text-decoration: underline;
}

/* 记住密码复选框 */
:deep(.remember-checkbox .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #9d4edd;
  border-color: #9d4edd;
}

:deep(.remember-checkbox .el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #9d4edd;
}

/* ============================================
   信号波纹背景
   ============================================ */
.signal-bg {
  position: absolute;
  right: -50px;
  bottom: -50px;
  width: 200px;
  height: 200px;
  pointer-events: none;
  z-index: 1;
  opacity: 0.3;
}

.ring {
  position: absolute;
  border: 1px solid #9d4edd;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ripple 3s infinite linear;
}

.ring:nth-child(1) { width: 100px; height: 100px; }
.ring:nth-child(2) { width: 150px; height: 150px; }
.ring:nth-child(3) { width: 200px; height: 200px; }

@keyframes ripple {
  0% { 
    width: 0; 
    height: 0; 
    opacity: 0.8; 
    border-width: 2px; 
  }
  100% { 
    width: 300px; 
    height: 300px; 
    opacity: 0; 
    border-width: 0px; 
  }
}

/* ============================================
   切换动画
   ============================================ */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
