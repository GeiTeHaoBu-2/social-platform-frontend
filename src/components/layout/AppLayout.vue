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
  │  [导航]   │                              │
  │  [导航]   │                              │
  │  [导航]   │                              │
  │          │                              │
  └──────────┴──────────────────────────────┘
  
  功能：
  - 侧边栏可折叠/展开
  - 深色主题（参考图片风格）
  - 响应式布局
-->

<script setup>
import { ref } from 'vue'
import {
  Fold,           // 收起图标
  Expand,         // 展开图标
  HomeFilled,     // 首页图标
  Grid,           // 应用/数据图标
  Setting,        // 设置图标
  UserFilled,     // 用户图标
  Bell,           // 通知图标
  QuestionFilled, // 帮助图标
  Search,         // 搜索图标
  Plus,           // 加号图标
  Upload,         // 上传图标
  Document,       // 文档图标
  MoreFilled,     // 更多图标
  List,           // 列表图标
  SwitchButton    // 退出图标
} from '@element-plus/icons-vue'

// ============================================
// 侧边栏折叠状态
// ============================================
const isSidebarCollapsed = ref(false)

// 切换侧边栏状态
function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// ============================================
// 导航菜单数据
// ============================================
const menuItems = [
  { icon: HomeFilled, label: '首页', active: true },
  { icon: Grid, label: '数据管理', active: false },
  { icon: Setting, label: '系统设置', active: false },
]

// ============================================
// 用户下拉菜单
// ============================================
const userMenuItems = [
  { label: '个人设置', icon: 'UserFilled' },
  { label: '退出登录', icon: 'SwitchButton', divided: true }
]
</script>

<template>
  <!-- 外层容器 -->
  <div class="h-screen flex flex-col bg-[#1a1a1a] text-gray-200">
    
    <!-- ============================================ -->
    <!-- Header 顶部栏 -->
    <!-- ============================================ -->
    <header class="h-14 bg-[#242424] border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
      <!-- 左侧：菜单按钮 + Logo -->
      <div class="flex items-center gap-3">
        <!-- 展开/收起侧边栏按钮 -->
        <button 
          @click="toggleSidebar"
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition"
        >
          <el-icon :size="18">
            <Fold v-if="!isSidebarCollapsed" />
            <Expand v-else />
          </el-icon>
        </button>
        
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <!-- 紫色方块 Logo -->
          <div class="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
            <el-icon :size="14" class="text-white"><Grid /></el-icon>
          </div>
          <span class="font-semibold text-white">舆情监控系统</span>
        </div>
      </div>
      
      <!-- 右侧：用户头像 -->
      <div class="flex items-center gap-4">
        <!-- 通知图标（装饰） -->
        <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition relative">
          <el-icon :size="18"><Bell /></el-icon>
          <!-- 红点通知 -->
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <!-- 帮助图标（装饰） -->
        <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 transition">
          <el-icon :size="18"><QuestionFilled /></el-icon>
        </button>
        
        <!-- 用户头像下拉菜单 -->
        <el-dropdown trigger="click">
          <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-700 rounded px-2 py-1 transition">
            <el-avatar :size="28" class="bg-green-600 text-sm">用户</el-avatar>
          </div>
          
          <template #dropdown>
            <el-dropdown-menu class="bg-[#2a2a2a] border-gray-700">
              <el-dropdown-item class="text-gray-300 hover:bg-gray-700">
                <el-icon class="mr-2"><UserFilled /></el-icon>
                个人设置
              </el-dropdown-item>
              <el-dropdown-item divided class="text-gray-300 hover:bg-gray-700">
                <el-icon class="mr-2"><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    
    <!-- ============================================ -->
    <!-- 主体区域：侧边栏 + 内容区 -->
    <!-- ============================================ -->
    <div class="flex flex-1 overflow-hidden">
      
      <!-- 侧边栏 Sidebar -->
      <aside 
        :class="[
          'bg-[#1e1e1e] border-r border-gray-700 flex flex-col transition-all duration-300',
          isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-56 opacity-100'
        ]"
      >
        <!-- 搜索框 -->
        <div class="p-3">
          <div class="h-9 bg-[#2a2a2a] rounded flex items-center px-3 text-gray-500 text-sm">
            <el-icon class="mr-2"><Search /></el-icon>
            <span>搜索</span>
          </div>
        </div>
        
        <!-- 导航菜单 -->
        <nav class="flex-1 px-2">
          <div 
            v-for="(item, index) in menuItems" 
            :key="index"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition',
              item.active 
                ? 'bg-[#2a2a2a] text-white' 
                : 'text-gray-400 hover:bg-[#252525] hover:text-gray-200'
            ]"
          >
            <el-icon :size="18">
              <component :is="item.icon" />
            </el-icon>
            <span class="text-sm">{{ item.label }}</span>
          </div>
          
          <!-- 分隔线 -->
          <div class="my-3 border-t border-gray-700"></div>
          
          <!-- 分组标题 -->
          <div class="px-3 py-2 text-xs text-gray-500 font-medium">
            置顶
          </div>
          
          <!-- 更多菜单项（装饰） -->
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-gray-400 hover:bg-[#252525] hover:text-gray-200 cursor-pointer transition">
            <div class="w-5 h-5 bg-yellow-600 rounded flex items-center justify-center">
              <span class="text-xs text-white">未</span>
            </div>
            <span class="text-sm">未命名多维表格</span>
          </div>
          
          <!-- 空间分组 -->
          <div class="mt-4 px-3 py-2 text-xs text-gray-500 font-medium">
            空间
          </div>
          
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-gray-400 hover:bg-[#252525] hover:text-gray-200 cursor-pointer transition">
            <div class="w-5 h-5 bg-orange-600 rounded flex items-center justify-center">
              <span class="text-xs text-white">未</span>
            </div>
            <span class="text-sm">未命名多维表格空间</span>
          </div>
        </nav>
      </aside>
      
      <!-- ============================================ -->
      <!-- 主内容区 Main Content -->
      <!-- ============================================ -->
      <main class="flex-1 overflow-auto bg-[#1a1a1a] p-6">
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
      </main>
    </div>
  </div>
</template>
