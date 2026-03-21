<!--
  ============================================
  应用主布局组件 (AppLayout.vue)
  ============================================
  
  布局结构（参考飞书风格）：
  ┌─────────────────────────────────────────┐
  │  Header (顶部栏)                         │
  │  [菜单图标] [Logo]              [头像]   │
  ├──────────┬──────────────────────────────┤
  │          │                              │
  │ Sidebar  │      Main Content           │
  │ (侧边栏)  │      (主内容区)              │
  │          │                              │
  │  [导航]   │     <router-view />         │
  │  [导航]   │      动态路由出口            │
  │  [导航]   │                              │
  │          │                              │
  └──────────┴──────────────────────────────┘
  
  功能：
  - 侧边栏可折叠/展开
  - 深色主题（参考图片风格）
  - 响应式布局
  - 支持 Vue Router 嵌套路由
  - 平台数据菜单支持展开/收起子菜单
  - 右上角登录/头像切换（支持两种登录方式）
-->

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Fold,
  Expand,
  HomeFilled,
  Grid,
  Setting,
  UserFilled,
  Bell,
  QuestionFilled,
  Search,
  SwitchButton,
  TrendCharts,
  DataAnalysis,
  ArrowRight,
  Message,
  Lock
} from '@element-plus/icons-vue'

// 导入真实 API
import { loginApi } from '@/api/auth.js'
import request from '@/utils/request.js'

const router = useRouter()

// ============================================
// 侧边栏折叠状态
// ============================================
const isSidebarCollapsed = ref(false)

// 切换侧边栏状态
function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// ============================================
// 登录状态管理（使用真实 API）
// ============================================
const isLoggedIn = ref(false)
const userInfo = ref(null)
const loginDialogVisible = ref(false)
const loginType = ref('code') // 'code' 邮箱验证码登录, 'password' 密码登录

// 验证码登录表单
const codeLoginForm = ref({
  email: '',
  code: ''
})

// 密码登录表单
const passwordLoginForm = ref({
  account: '',
  password: ''
})

const loginLoading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)

/**
 * 页面加载时检查登录状态
 */
onMounted(() => {
  const token = localStorage.getItem('token')
  const savedUserInfo = localStorage.getItem('userInfo')
  if (token && savedUserInfo) {
    isLoggedIn.value = true
    userInfo.value = JSON.parse(savedUserInfo)
    request.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
})

/**
 * 打开登录弹窗
 */
function openLoginDialog() {
  loginDialogVisible.value = true
  loginType.value = 'code'
  // 重置表单
  codeLoginForm.value = { email: '', code: '' }
  passwordLoginForm.value = { account: '', password: '' }
  countdown.value = 0
}

/**
 * 切换登录方式
 */
function switchLoginType(type) {
  loginType.value = type
}

/**
 * 发送验证码
 * 调用后端 GET /api/v1/auth/send-code 接口
 */
async function handleSendCode() {
  // 校验邮箱格式
  if (!codeLoginForm.value.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(codeLoginForm.value.email)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }

  sendingCode.value = true

  try {
    // 直接使用 axios 发送请求，不经过拦截器处理（发送验证码返回的是 null）
    const response = await request({
      url: '/api/v1/auth/send-code',
      method: 'GET',
      params: { email: codeLoginForm.value.email }
    })

    // 请求成功（拦截器已经把外层包装剥离了）
    ElMessage.success('验证码已发送至您的邮箱，请注意查收')

    // 开始倒计时 60 秒
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    // 请求失败（拦截器已经把错误信息处理了）
    ElMessage.error(error.message || '发送验证码失败，请稍后重试')
    console.error('发送验证码失败:', error)
  } finally {
    sendingCode.value = false
  }
}

/**
 * 处理验证码登录
 * 调用后端 POST /api/v1/auth/login 接口
 */
async function handleCodeLogin() {
  // 表单校验
  if (!codeLoginForm.value.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  if (!codeLoginForm.value.code) {
    ElMessage.warning('请输入验证码')
    return
  }

  loginLoading.value = true

  try {
    // 调用登录 API
    const data = await loginApi({
      email: codeLoginForm.value.email,
      code: codeLoginForm.value.code
    })

    // 登录成功（拦截器返回的是 data 字段）
    if (data && data.token) {
      const { token, userInfo: user } = data

      // 保存到 localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(user))

      // 设置 axios 默认请求头
      request.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // 更新状态
      isLoggedIn.value = true
      userInfo.value = user

      // 关闭弹窗
      loginDialogVisible.value = false

      ElMessage.success(`欢迎回来，${user.nickname || user.username}`)
    } else {
      ElMessage.error('登录失败，响应数据异常')
    }
  } catch (error) {
    // 错误已被拦截器处理
    ElMessage.error(error.message || '登录失败，请检查邮箱和验证码')
    console.error('登录失败:', error)
  } finally {
    loginLoading.value = false
  }
}

/**
 * 处理密码登录
 * 调用后端 POST /api/v1/auth/login/password 接口
 */
async function handlePasswordLogin() {
  // 表单校验
  if (!passwordLoginForm.value.account) {
    ElMessage.warning('请输入账号或邮箱')
    return
  }
  if (!passwordLoginForm.value.password) {
    ElMessage.warning('请输入密码')
    return
  }

  loginLoading.value = true

  try {
    // 调用密码登录 API
    const data = await request({
      url: '/api/v1/auth/login/password',
      method: 'POST',
      data: {
        account: passwordLoginForm.value.account,
        password: passwordLoginForm.value.password
      }
    })

    // 登录成功
    if (data && data.token) {
      const { token, userInfo: user } = data

      // 保存到 localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(user))

      // 设置 axios 默认请求头
      request.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // 更新状态
      isLoggedIn.value = true
      userInfo.value = user

      // 关闭弹窗
      loginDialogVisible.value = false

      ElMessage.success(`欢迎回来，${user.nickname || user.username}`)
    } else {
      ElMessage.error('登录失败，响应数据异常')
    }
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请检查账号和密码')
    console.error('密码登录失败:', error)
  } finally {
    loginLoading.value = false
  }
}

/**
 * 处理登录（根据当前登录类型）
 */
function handleLogin() {
  if (loginType.value === 'code') {
    handleCodeLogin()
  } else {
    handlePasswordLogin()
  }
}

/**
 * 处理退出登录
 */
async function handleLogout() {
  try {
    // 调用退出登录接口
    await request({
      url: '/api/v1/auth/logout',
      method: 'POST'
    })
  } catch (error) {
    console.error('退出登录请求失败:', error)
  } finally {
    // 无论后端是否成功，都清除本地状态
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    isLoggedIn.value = false
    userInfo.value = null
    delete request.defaults.headers.common['Authorization']
    ElMessage.success('已退出登录')
  }
}

// ============================================
// 导航菜单数据
// ============================================
const platformSubMenus = [
  { label: '微博', path: '/platform/weibo', icon: 'weibo' },
  { label: '知乎', path: '/platform/zhihu', icon: 'zhihu' },
  { label: '百度', path: '/platform/baidu', icon: 'baidu' },
  { label: '今日头条', path: '/platform/toutiao', icon: 'toutiao' }
]

const menuItems = ref([
  {
    icon: HomeFilled,
    label: '首页',
    path: '/dashboard',
    active: true,
    type: 'single'
  },
  {
    icon: TrendCharts,
    label: '平台数据',
    type: 'submenu',
    expanded: false,
    children: platformSubMenus
  },
  {
    icon: DataAnalysis,
    label: '对比分析',
    path: '/compare/single',
    active: false,
    type: 'single'
  },
  {
    icon: Setting,
    label: '系统设置',
    path: '/settings',
    active: false,
    type: 'single'
  },
])

// ============================================
// 菜单交互逻辑
// ============================================
function handleMenuClick(item, index) {
  menuItems.value.forEach((menu, i) => {
    if (menu.type === 'single') {
      menu.active = (i === index)
    }
  })
  router.push(item.path)
}

function handleSubMenuClick(subItem, parentItem) {
  console.log('跳转到平台:', subItem.label)
  router.push(subItem.path)
}

function toggleSubMenu(item) {
  item.expanded = !item.expanded
}
</script>

<template>
  <div class="h-screen flex flex-col bg-[#1a1a1a] text-gray-200">
    <!-- Header -->
    <header class="h-14 bg-[#242424] border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
      <!-- 左侧 -->
      <div class="flex items-center gap-3">
        <button
          @click="toggleSidebar"
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition"
        >
          <el-icon :size="18">
            <Fold v-if="!isSidebarCollapsed" />
            <Expand v-else />
          </el-icon>
        </button>

        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
            <el-icon :size="14" class="text-white"><Grid /></el-icon>
          </div>
          <span class="font-semibold text-white">舆情监控系统</span>
        </div>
      </div>

      <!-- 右侧 -->
      <div class="flex items-center gap-4">
        <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition relative">
          <el-icon :size="18"><Bell /></el-icon>
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition">
          <el-icon :size="18"><QuestionFilled /></el-icon>
        </button>

        <!-- 登录按钮 / 用户头像 -->
        <el-button
          v-if="!isLoggedIn"
          type="primary"
          size="small"
          :icon="UserFilled"
          @click="openLoginDialog"
        >
          登录
        </el-button>

        <el-dropdown v-else trigger="click">
          <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-700 rounded px-2 py-1 transition">
            <el-avatar :size="28" :src="userInfo?.avatar" class="bg-green-600 text-sm">
              {{ userInfo?.nickname?.charAt(0) || userInfo?.username?.charAt(0) || '用' }}
            </el-avatar>
            <span class="text-sm text-gray-300 hidden sm:block">{{ userInfo?.nickname || userInfo?.username || '用户' }}</span>
          </div>

          <template #dropdown>
            <el-dropdown-menu class="bg-[#2a2a2a] border-gray-700">
              <el-dropdown-item class="text-gray-300 hover:bg-gray-700" @click="router.push('/profile')">
                <el-icon class="mr-2"><UserFilled /></el-icon>
                个人设置
              </el-dropdown-item>
              <el-dropdown-item divided class="text-gray-300 hover:bg-gray-700" @click="handleLogout">
                <el-icon class="mr-2"><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 登录弹窗 -->
    <el-dialog
      v-model="loginDialogVisible"
      title="用户登录"
      width="420px"
      :close-on-click-modal="false"
      class="login-dialog"
    >
      <!-- 登录方式切换 -->
      <div class="flex gap-2 mb-6 px-4">
        <el-button
          :type="loginType === 'code' ? 'primary' : 'default'"
          class="flex-1"
          @click="switchLoginType('code')"
        >
          <el-icon class="mr-1"><Message /></el-icon>
          验证码登录
        </el-button>
        <el-button
          :type="loginType === 'password' ? 'primary' : 'default'"
          class="flex-1"
          @click="switchLoginType('password')"
        >
          <el-icon class="mr-1"><Lock /></el-icon>
          密码登录
        </el-button>
      </div>

      <!-- 验证码登录表单 -->
      <el-form v-if="loginType === 'code'" :model="codeLoginForm" label-position="top" class="px-4">
        <el-form-item label="邮箱地址">
          <el-input
            v-model="codeLoginForm.email"
            placeholder="请输入邮箱地址"
            :prefix-icon="Message"
            size="large"
          />
        </el-form-item>

        <el-form-item label="验证码">
          <div class="flex gap-2">
            <el-input
              v-model="codeLoginForm.code"
              placeholder="请输入6位验证码"
              :prefix-icon="Grid"
              size="large"
              maxlength="6"
              @keyup.enter="handleLogin"
              class="flex-1"
            />
            <el-button
              type="primary"
              size="large"
              :loading="sendingCode"
              :disabled="countdown > 0"
              @click="handleSendCode"
              style="width: 140px;"
            >
              {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <!-- 密码登录表单 -->
      <el-form v-else :model="passwordLoginForm" label-position="top" class="px-4">
        <el-form-item label="账号/邮箱">
          <el-input
            v-model="passwordLoginForm.account"
            placeholder="请输入账号或邮箱"
            :prefix-icon="UserFilled"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="passwordLoginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="loginDialogVisible = false" size="large">取消</el-button>
          <el-button
            type="primary"
            size="large"
            :loading="loginLoading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 主体区域 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 侧边栏 -->
      <aside
        :class="[
          'bg-[#1e1e1e] border-r border-gray-700 flex flex-col transition-all duration-300',
          isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-56 opacity-100'
        ]"
      >
        <div class="p-3">
          <div class="h-9 bg-[#2a2a2a] rounded flex items-center px-3 text-gray-500 text-sm">
            <el-icon class="mr-2"><Search /></el-icon>
            <span>搜索</span>
          </div>
        </div>

        <nav class="flex-1 px-2">
          <div
            v-for="(item, index) in menuItems"
            :key="index"
            class="mb-1"
          >
            <div
              v-if="item.type === 'single'"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition',
                item.active
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-gray-400 hover:bg-[#252525] hover:text-gray-200'
              ]"
              @click="handleMenuClick(item, index)"
            >
              <el-icon :size="18">
                <component :is="item.icon" />
              </el-icon>
              <span class="text-sm">{{ item.label }}</span>
            </div>

            <div
              v-else-if="item.type === 'submenu'"
              class="relative"
            >
              <div
                :class="[
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition justify-between',
                  item.expanded
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-gray-400 hover:bg-[#252525] hover:text-gray-200'
                ]"
                @click="toggleSubMenu(item)"
              >
                <div class="flex items-center gap-3">
                  <el-icon :size="18">
                    <component :is="item.icon" />
                  </el-icon>
                  <span class="text-sm">{{ item.label }}</span>
                </div>
                <el-icon :size="14" :class="['transition-transform duration-200', item.expanded ? 'rotate-90' : '']">
                  <ArrowRight />
                </el-icon>
              </div>

              <div
                v-show="item.expanded"
                class="mt-1 ml-4 pl-2 border-l-2 border-gray-700 overflow-hidden transition-all duration-200"
              >
                <div
                  v-for="(subItem, subIndex) in item.children"
                  :key="subIndex"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-gray-400 hover:bg-[#252525] hover:text-gray-200 transition text-sm"
                  @click="handleSubMenuClick(subItem, item)"
                >
                  <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>{{ subItem.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="my-3 border-t border-gray-700"></div>

          <div class="px-3 py-2 text-xs text-gray-500 font-medium">置顶</div>

          <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-gray-400 hover:bg-[#252525] hover:text-gray-200 cursor-pointer transition">
            <div class="w-5 h-5 bg-yellow-600 rounded flex items-center justify-center">
              <span class="text-xs text-white">未</span>
            </div>
            <span class="text-sm">未命名多维表格</span>
          </div>

          <div class="mt-4 px-3 py-2 text-xs text-gray-500 font-medium">空间</div>

          <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-gray-400 hover:bg-[#252525] hover:text-gray-200 cursor-pointer transition">
            <div class="w-5 h-5 bg-orange-600 rounded flex items-center justify-center">
              <span class="text-xs text-white">未</span>
            </div>
            <span class="text-sm">未命名多维表格空间</span>
          </div>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="flex-1 overflow-auto bg-[#1a1a1a] p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
:deep(.login-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-right: 0;
  padding: 20px;
}

:deep(.login-dialog .el-dialog__title) {
  color: white;
  font-weight: 600;
}

:deep(.login-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

:deep(.login-dialog .el-dialog__body) {
  background-color: #1e1e1e;
  padding: 10px 0 20px 0;
}

:deep(.login-dialog .el-form-item__label) {
  color: #9ca3af;
}

:deep(.login-dialog .el-input__wrapper) {
  background-color: #2a2a2a;
  box-shadow: 0 0 0 1px #4b5563 inset;
}

:deep(.login-dialog .el-input__inner) {
  color: white;
}

:deep(.login-dialog .el-input__inner::placeholder) {
  color: #6b7280;
}

:deep(.login-dialog .el-dialog__footer) {
  background-color: #1e1e1e;
  border-top: 1px solid #374151;
  padding: 15px 20px;
}
</style>
