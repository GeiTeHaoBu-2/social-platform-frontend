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
-->

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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
  SwitchButton,   // 退出图标
  TrendCharts,    // 趋势图标
  DataAnalysis,   // 数据分析图标
  ArrowRight,     // 右箭头图标
  ArrowDown       // 下箭头图标
} from '@element-plus/icons-vue'

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
// 导航菜单数据 - 包含子菜单的平台数据
// ============================================
// 平台数据子菜单配置
const platformSubMenus = [
  { label: '微博', path: '/platform/weibo', icon: 'weibo' },
  { label: '知乎', path: '/platform/zhihu', icon: 'zhihu' },
  { label: '百度', path: '/platform/baidu', icon: 'baidu' },
  { label: '今日头条', path: '/platform/toutiao', icon: 'toutiao' }
]

// 主导航菜单配置
const menuItems = ref([
  { 
    icon: HomeFilled, 
    label: '首页', 
    path: '/dashboard', 
    active: true,
    type: 'single'  // 单层菜单
  },
  { 
    icon: TrendCharts, 
    label: '平台数据', 
    type: 'submenu',  // 子菜单类型
    expanded: false,   // 展开状态
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

/**
 * 处理单层菜单点击
 * @param {Object} item - 菜单项
 * @param {number} index - 菜单索引
 */
function handleMenuClick(item, index) {
  // 更新激活状态：只有单层菜单可以被激活
  menuItems.value.forEach((menu, i) => {
    if (menu.type === 'single') {
      menu.active = (i === index)
    }
  })
  // 路由跳转
  router.push(item.path)
}

/**
 * 处理子菜单项点击
 * @param {Object} subItem - 子菜单项
 * @param {Object} parentItem - 父菜单项
 */
function handleSubMenuClick(subItem, parentItem) {
  console.log('跳转到平台:', subItem.label)
  // 路由跳转到对应平台
  router.push(subItem.path)
}

/**
 * 切换子菜单展开/收起状态
 * @param {Object} item - 菜单项
 */
function toggleSubMenu(item) {
  item.expanded = !item.expanded
}

// ============================================
// 用户下拉菜单
// ============================================
const userMenuItems = [
  { label: '个人设置', icon: 'UserFilled', path: '/profile' },
  { label: '退出登录', icon: 'SwitchButton', divided: true }
]

// 处理用户菜单点击
function handleUserMenuClick(item) {
  if (item.path) {
    router.push(item.path)
  }
}
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
        <el-dropdown trigger="click" @command="handleUserMenuClick">
          <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-700 rounded px-2 py-1 transition">
            <el-avatar :size="28" class="bg-green-600 text-sm">用户</el-avatar>
          </div>
          
          <template #dropdown>
            <el-dropdown-menu class="bg-[#2a2a2a] border-gray-700">
              <el-dropdown-item 
                v-for="item in userMenuItems" 
                :key="item.label"
                :divided="item.divided"
                :command="item"
                class="text-gray-300 hover:bg-gray-700"
              >
                <el-icon class="mr-2">
                  <component :is="item.icon" />
                </el-icon>
                {{ item.label }}
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
            class="mb-1"
          >
            <!-- 单层菜单项 -->
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
            
            <!-- 子菜单项（平台数据） -->
            <div
              v-else-if="item.type === 'submenu'"
              class="relative"
            >
              <!-- 主菜单按钮 -->
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
                <!-- 展开/收起箭头 -->
                <el-icon :size="14" :class="['transition-transform duration-200', item.expanded ? 'rotate-90' : '']">
                  <ArrowRight />
                </el-icon>
              </div>
              
              <!-- 子菜单列表（点击展开） -->
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
                  <!-- 平台图标（小圆点） -->
                  <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>{{ subItem.label }}</span>
                </div>
              </div>
            </div>
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
      <!-- 主内容区 Main Content - 动态路由出口 -->
      <!-- ============================================ -->
      <main class="flex-1 overflow-auto bg-[#1a1a1a] p-6">
        <!-- 嵌套路由出口：点击左侧菜单时动态替换内容 -->
        <router-view />
      </main>
    </div>
  </div>
</template>
