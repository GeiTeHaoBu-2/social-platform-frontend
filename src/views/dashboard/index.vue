<!--
  ============================================
  数据首页 - Dashboard (总览页面)
  ============================================
  
  从 AppLayout.vue 提取的业务内容
  作为系统的"总览首页"展示
-->

<script setup>
import {
  Plus,           // 加号图标
  Upload,         // 上传图标
  Document,       // 文档图标
  MoreFilled,     // 更多图标
  Setting,        // 设置图标
  List,           // 列表图标
  Grid            // 网格图标
} from '@element-plus/icons-vue'
</script>

<template>
  <div class="h-full">
    <!-- 页面标题区 -->
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-white mb-2">数据首页</h1>
      <p class="text-gray-500 text-sm">管理和查看您的数据内容</p>
    </div>
    
    <!-- 快速创建卡片区域 -->
    <div class="mb-8">
      <h2 class="text-sm text-gray-400 mb-4">快速创建</h2>
      <div class="flex gap-4">
        <!-- 卡片 1 -->
        <div class="w-48 h-20 bg-[#2d2b3a] border border-purple-900/30 rounded-lg flex items-center px-4 cursor-pointer hover:border-purple-700/50 transition group">
          <div class="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-600/30 transition">
            <el-icon :size="20" class="text-purple-400"><Plus /></el-icon>
          </div>
          <span class="text-sm text-gray-200">新建数据表</span>
        </div>
        
        <!-- 卡片 2 -->
        <div class="w-48 h-20 bg-[#2a2a2a] border border-gray-700 rounded-lg flex items-center px-4 cursor-pointer hover:border-gray-600 transition group">
          <div class="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-600/30 transition">
            <el-icon :size="20" class="text-green-400"><Upload /></el-icon>
          </div>
          <span class="text-sm text-gray-300">导入数据</span>
        </div>
        
        <!-- 卡片 3 -->
        <div class="w-48 h-20 bg-[#2a2a2a] border border-gray-700 rounded-lg flex items-center px-4 cursor-pointer hover:border-gray-600 transition group">
          <div class="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-600/30 transition">
            <el-icon :size="20" class="text-blue-400"><Document /></el-icon>
          </div>
          <span class="text-sm text-gray-300">新建文档</span>
        </div>
        
        <!-- 卡片 4 -->
        <div class="w-48 h-20 bg-[#2a2a2a] border border-gray-700 rounded-lg flex items-center px-4 cursor-pointer hover:border-gray-600 transition">
          <div class="w-10 h-10 bg-gray-600/20 rounded-lg flex items-center justify-center mr-3">
            <el-icon :size="20" class="text-gray-400"><MoreFilled /></el-icon>
          </div>
          <span class="text-sm text-gray-300">更多</span>
        </div>
      </div>
    </div>
    
    <!-- 数据列表区域 -->
    <div>
      <!-- 列表头部 -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm text-gray-400">最近访问</h2>
        <div class="flex gap-2">
          <button class="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition">
            <el-icon class="mr-1"><Setting /></el-icon>
            设置
          </button>
          <button class="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition">
            <el-icon class="mr-1"><List /></el-icon>
          </button>
          <button class="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition">
            <el-icon><Grid /></el-icon>
          </button>
        </div>
      </div>
      
      <!-- 表格头部 -->
      <div class="grid grid-cols-4 gap-4 px-4 py-3 text-xs text-gray-500 border-b border-gray-700">
        <span>标题</span>
        <span>类型</span>
        <span>所有者</span>
        <span>最近访问</span>
      </div>
      
      <!-- 表格内容（示例数据） -->
      <div class="divide-y divide-gray-800">
        <div class="grid grid-cols-4 gap-4 px-4 py-4 text-sm hover:bg-[#252525] transition cursor-pointer group">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-purple-600/20 rounded flex items-center justify-center">
              <el-icon :size="16" class="text-purple-400"><Grid /></el-icon>
            </div>
            <span class="text-gray-200 group-hover:text-white">未命名多维表格</span>
          </div>
          <span class="text-gray-400 flex items-center">多维表格</span>
          <div class="flex items-center gap-2">
            <el-avatar :size="20" class="bg-green-600 text-xs">用</el-avatar>
            <span class="text-gray-400">用户532640</span>
          </div>
          <span class="text-gray-500 flex items-center">3月6日 18:21</span>
        </div>
        
        <!-- 更多空行（装饰） -->
        <div class="grid grid-cols-4 gap-4 px-4 py-4 text-sm hover:bg-[#252525] transition cursor-pointer" v-for="i in 3" :key="i">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gray-700/50 rounded flex items-center justify-center">
              <el-icon :size="16" class="text-gray-500"><Document /></el-icon>
            </div>
            <span class="text-gray-500">示例数据 {{ i }}</span>
          </div>
          <span class="text-gray-600 flex items-center">-</span>
          <span class="text-gray-600 flex items-center">-</span>
          <span class="text-gray-600 flex items-center">-</span>
        </div>
      </div>
    </div>
  </div>
</template>
