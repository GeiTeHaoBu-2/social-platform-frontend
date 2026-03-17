<!--
  ============================================
  404 页面未找到 (404.vue)
  ============================================
-->

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <!-- 404 图标 -->
      <div class="text-9xl font-bold text-gray-200 mb-4">404</div>

      <h1 class="text-3xl font-bold text-gray-900 mb-2">页面未找到</h1>
      <p class="text-gray-500 mb-8">抱歉，您访问的页面不存在或已被移除</p>

      <div class="space-x-4">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>
