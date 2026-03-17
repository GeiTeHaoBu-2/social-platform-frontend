<!--
  ============================================
  个人中心页面 (Profile.vue)
  ============================================

  功能概述：
  1. 展示用户个人信息
  2. 支持修改昵称、头像等
  3. 需要登录权限（路由守卫会拦截）
-->

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user.js'
import { User, Message, Calendar } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)

// 编辑表单
const editForm = ref({
  nickname: '',
  email: '',
  gender: 0,
  age: null
})

onMounted(() => {
  // 同步 store 数据到表单
  editForm.value = { ...userStore.userInfo }
})

async function handleSave() {
  loading.value = true
  try {
    await userStore.updateUserInfo(editForm.value)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">个人中心</h1>
      <p class="text-gray-500 mt-1">管理您的账号信息和偏好设置</p>
    </div>

    <!-- 信息卡片 -->
    <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div class="flex items-center space-x-6 mb-6">
        <!-- 头像 -->
        <el-avatar :size="80" :src="userStore.avatarUrl" class="bg-blue-100" />
        <div>
          <h2 class="text-xl font-semibold text-gray-900">{{ userStore.displayName }}</h2>
          <p class="text-gray-500 text-sm mt-1">{{ userStore.userInfo.email || '未设置邮箱' }}</p>
        </div>
      </div>

      <!-- 编辑表单 -->
      <el-form :model="editForm" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="昵称">
              <el-input v-model="editForm.nickname" :prefix-icon="User" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="editForm.email" :prefix-icon="Message" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="editForm.gender" class="w-full">
                <el-option label="保密" :value="0" />
                <el-option label="男" :value="1" />
                <el-option label="女" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄">
              <el-input-number v-model="editForm.age" :min="1" :max="120" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item class="mt-4">
          <el-button type="primary" :loading="loading" @click="handleSave">
            保存修改
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
