<!--
  ============================================
  个人设置页面 (Settings)
  ============================================
  
  功能：
  - 基本资料管理（头像、昵称、签名、性别）
  - 账号安全（邮箱绑定、密码修改）
  - 登录日志查看
  
  路由路径: /settings
-->

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Lock,
  Clock,
  Upload,
  Check
} from '@element-plus/icons-vue'

// ============================================
// 用户数据
// ============================================
const userProfile = reactive({
  avatar: 'https://bailian-bmp-pre.oss-cn-hangzhou.aliyuncs.com/public/system_agent/PlaceHolder.png',
  nickname: '陈舟',
  signature: '数据驱动决策，洞察舆情先机。',
  gender: 'male', // male/female/secret
  email: 'chenzhou@example.com'
})

// ============================================
// 密码修改
// ============================================
const showPasswordForm = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// ============================================
// 保存状态
// ============================================
const saving = ref(false)
const scanning = ref(false)

// ============================================
// 登录日志数据
// ============================================
const loginLogs = ref([
  {
    time: '2023-10-27 14:30:22',
    ip: '192.168.1.105',
    location: '中国 北京',
    device: 'Chrome / macOS',
    status: 'current',
    statusText: '当前在线'
  },
  {
    time: '2023-10-26 09:15:40',
    ip: '114.24.18.92',
    location: '中国 上海',
    device: 'Chrome / Windows',
    status: 'normal',
    statusText: '正常'
  },
  {
    time: '2023-10-25 22:05:11',
    ip: '203.0.113.45',
    location: '未知区域',
    device: 'Safari / iOS',
    status: 'warning',
    statusText: '异地登录'
  }
])

// ============================================
// 计算属性
// ============================================
const avatarPreview = computed(() => userProfile.avatar)

// ============================================
// 方法
// ============================================

/**
 * 触发安全扫描动画
 */
function triggerSecurityScan() {
  scanning.value = true
  setTimeout(() => {
    scanning.value = false
  }, 2000)
}

/**
 * 处理头像上传
 */
function handleAvatarChange(file) {
  const isJPG = file.raw.type === 'image/jpeg'
  const isPNG = file.raw.type === 'image/png'
  const isLt2M = file.raw.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('头像必须是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }

  // 本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    userProfile.avatar = e.target.result
    triggerSecurityScan()
    ElMessage.success('头像上传成功')
  }
  reader.readAsDataURL(file.raw)
  return false
}

/**
 * 保存基本资料
 */
async function handleSaveProfile() {
  saving.value = true
  triggerSecurityScan()
  
  // 模拟 API 请求
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  saving.value = false
  ElMessage.success('资料保存成功')
}

/**
 * 切换密码表单显示
 */
function togglePasswordForm() {
  showPasswordForm.value = !showPasswordForm.value
  if (showPasswordForm.value) {
    triggerSecurityScan()
  }
}

/**
 * 取消密码修改
 */
function cancelPasswordChange() {
  showPasswordForm.value = false
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

/**
 * 确认修改密码
 */
async function confirmPasswordChange() {
  if (!passwordForm.currentPassword) {
    ElMessage.warning('请输入当前密码')
    return
  }
  if (!passwordForm.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.newPassword.length < 8 || passwordForm.newPassword.length > 20) {
    ElMessage.warning('密码长度必须在 8-20 位之间')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }

  // 模拟 API 请求
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  ElMessage.success('密码修改成功')
  cancelPasswordChange()
}

/**
 * 获取状态标签样式
 */
function getStatusType(status) {
  const typeMap = {
    current: 'success',
    normal: 'success',
    warning: 'warning'
  }
  return typeMap[status] || 'info'
}
</script>

<template>
  <div class="h-full overflow-y-auto pr-2 custom-scrollbar">
    <!-- 页面标题区 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-2">个人设置</h1>
      <p class="text-gray-500 text-sm">管理您的个人资料、账号安全及登录记录</p>
    </div>

    <!-- 1. 基本资料卡片 -->
    <div class="bg-[#242424] rounded-xl border border-gray-700 p-6 mb-6 relative overflow-hidden">
      <!-- 安全扫描环动画 -->
      <div 
        class="absolute top-5 right-5 w-10 h-10 rounded-full border-2 border-purple-500/10 border-t-purple-500 transition-opacity duration-300"
        :class="{ 'opacity-100 animate-spin': scanning, 'opacity-0': !scanning }"
        :style="scanning ? 'animation-duration: 0.5s' : 'animation-duration: 2s'"
      ></div>

      <!-- 卡片头部 -->
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
        <div class="flex items-center gap-2 text-white text-lg font-medium">
          <el-icon :size="20"><User /></el-icon>
          基本资料
        </div>
      </div>

      <!-- 表单区域 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 头像上传 -->
        <div class="md:col-span-2">
          <label class="block text-sm text-gray-400 mb-3">头像</label>
          <div class="flex items-center gap-4">
            <el-upload
              class="avatar-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              accept="image/jpeg,image/png"
            >
              <div class="relative group cursor-pointer">
                <img 
                  :src="avatarPreview" 
                  class="w-20 h-20 rounded-full object-cover border-2 border-gray-600 group-hover:border-purple-500 transition-colors"
                  alt="avatar"
                >
                <div class="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <el-icon :size="24" class="text-white"><Upload /></el-icon>
                </div>
              </div>
            </el-upload>
            <div>
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleAvatarChange"
                accept="image/jpeg,image/png"
              >
                <el-button type="primary" plain size="small">
                  更换头像
                </el-button>
              </el-upload>
              <p class="text-xs text-gray-500 mt-2">支持 JPG, PNG，最大 2MB</p>
            </div>
          </div>
        </div>

        <!-- 昵称 -->
        <div class="md:col-span-2">
          <label class="block text-sm text-gray-400 mb-2">昵称</label>
          <el-input
            v-model="userProfile.nickname"
            placeholder="请输入昵称"
            class="w-full max-w-md"
          />
        </div>

        <!-- 个人签名 -->
        <div class="md:col-span-2">
          <label class="block text-sm text-gray-400 mb-2">个人签名</label>
          <el-input
            v-model="userProfile.signature"
            type="textarea"
            :rows="3"
            placeholder="请输入您的个人签名..."
            class="w-full max-w-2xl"
            resize="none"
          />
        </div>

        <!-- 性别 -->
        <div>
          <label class="block text-sm text-gray-400 mb-3">性别</label>
          <el-radio-group v-model="userProfile.gender">
            <el-radio label="male">
              <span class="text-gray-300">男</span>
            </el-radio>
            <el-radio label="female">
              <span class="text-gray-300">女</span>
            </el-radio>
            <el-radio label="secret">
              <span class="text-gray-300">保密</span>
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="mt-6 text-right">
        <el-button 
          type="primary" 
          :loading="saving"
          @click="handleSaveProfile"
          class="bg-purple-600 hover:bg-purple-700 border-purple-600"
        >
          <el-icon v-if="!saving" class="mr-1"><Check /></el-icon>
          {{ saving ? '保存中...' : '保存修改' }}
        </el-button>
      </div>
    </div>

    <!-- 2. 账号安全卡片 -->
    <div class="bg-[#242424] rounded-xl border border-gray-700 p-6 mb-6">
      <!-- 卡片头部 -->
      <div class="flex items-center gap-2 text-white text-lg font-medium mb-6 pb-4 border-b border-gray-700/50">
        <el-icon :size="20"><Lock /></el-icon>
        账号安全
      </div>

      <!-- 表单区域 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 绑定邮箱 -->
        <div>
          <label class="block text-sm text-gray-400 mb-2">绑定邮箱</label>
          <div class="flex gap-2">
            <el-input
              v-model="userProfile.email"
              disabled
              class="flex-1"
            />
            <el-button plain>换绑</el-button>
          </div>
        </div>

        <!-- 登录密码 -->
        <div>
          <label class="block text-sm text-gray-400 mb-2">登录密码</label>
          <div class="flex items-center gap-2">
            <span class="text-gray-300 font-mono">••••••••</span>
            <el-button 
              plain 
              size="small"
              @click="togglePasswordForm"
            >
              {{ showPasswordForm ? '取消' : '重置密码' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 密码修改区域 (可展开) -->
      <transition name="el-zoom-in-top">
        <div v-if="showPasswordForm" class="mt-6 pt-6 border-t border-dashed border-gray-700">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-2">当前密码</label>
              <el-input
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="请输入当前密码"
                show-password
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">新密码</label>
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="8-20 位，包含字母和数字"
                show-password
              />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-2">确认新密码</label>
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="再次输入新密码"
                show-password
              />
            </div>
          </div>
          <div class="mt-4 text-right">
            <el-button plain size="small" @click="cancelPasswordChange" class="mr-2">
              取消
            </el-button>
            <el-button 
              type="primary" 
              size="small"
              @click="confirmPasswordChange"
              class="bg-purple-600 hover:bg-purple-700 border-purple-600"
            >
              确认修改
            </el-button>
          </div>
        </div>
      </transition>
    </div>

    <!-- 3. 登录日志卡片 -->
    <div class="bg-[#242424] rounded-xl border border-gray-700 p-6">
      <!-- 卡片头部 -->
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
        <div class="flex items-center gap-2 text-white text-lg font-medium">
          <el-icon :size="20"><Clock /></el-icon>
          最近登录记录
        </div>
        <el-button plain size="small">查看全部</el-button>
      </div>

      <!-- 日志表格 -->
      <el-table
        :data="loginLogs"
        style="width: 100%"
        class="settings-table"
        :header-cell-style="{ background: '#1e1e1e', color: '#9ca3af' }"
      >
        <el-table-column prop="time" label="登录时间" min-width="160">
          <template #default="{ row }">
            <span class="text-gray-300">{{ row.time }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="ip" label="IP 地址" min-width="140">
          <template #default="{ row }">
            <span 
              class="font-mono"
              :class="row.status === 'current' ? 'text-purple-400' : 'text-gray-400'"
            >
              {{ row.ip }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="location" label="地理位置" min-width="120">
          <template #default="{ row }">
            <span class="text-gray-300">{{ row.location }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="device" label="设备/浏览器" min-width="140">
          <template #default="{ row }">
            <span class="text-gray-300">{{ row.device }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
              :effect="row.status === 'current' ? 'dark' : 'plain'"
              class="rounded-full"
            >
              {{ row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.3);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.5);
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
}

/* 表格样式覆盖 */
:deep(.settings-table) {
  background-color: transparent;
}

:deep(.settings-table .el-table__row) {
  background-color: transparent;
}

:deep(.settings-table .el-table__row:hover > td) {
  background-color: #2a2a2a !important;
}

:deep(.settings-table td) {
  background-color: transparent;
  border-bottom: 1px solid #2a2a2a;
}

:deep(.settings-table .el-table__row:last-child td) {
  border-bottom: none;
}

/* 单选按钮样式 */
:deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: #9333ea;
  background-color: #9333ea;
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #9333ea;
}

/* 输入框深色主题 */
:deep(.el-input__wrapper) {
  background-color: #1a1a1a;
  box-shadow: 0 0 0 1px #374151 inset;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-textarea__inner) {
  background-color: #1a1a1a;
  color: #fff;
  border-color: #374151;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #9333ea inset;
}

:deep(.el-textarea__inner:focus) {
  border-color: #9333ea;
}

/* 动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 0.5s linear infinite;
}
</style>
