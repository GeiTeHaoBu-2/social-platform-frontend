<!--
  ============================================
  全局顶部导航栏组件 (TopNav.vue)
  ============================================

  功能概述：
  1. 响应式布局：左侧 Logo + 导航链接，右侧用户操作区
  2. 登录状态感知：通过 Pinia store 实时响应登录状态变化
  3. 下拉菜单：已登录用户显示个人中心、退出等操作
  4. 移动端适配：小屏幕下自动调整间距

  技术要点：
  - 使用 TailwindCSS 的 flex + justify-between 实现左右布局
  - 使用 Element Plus 的 Dropdown 组件实现用户菜单
  - 使用 Vue Router 的 router-link 和 useRoute 实现导航
-->

<script setup>
/**
 * ============================================
 * Script Setup 语法说明
 * ============================================
 *
 * `<script setup>` 是 Vue3 的编译时语法糖，特点：
 * 1. 顶层定义的变量/函数自动暴露给模板使用，无需 return
 * 2. 导入的组件自动可用，无需 components 选项注册
 * 3. 更好的 TypeScript 类型推导
 * 4. 代码更简洁，符合 Composition API 风格
 */

// ============================================
// 导入依赖
// ============================================

/**
 * useRoute: 获取当前路由信息（只读）
 * useRouter: 获取路由实例，用于编程式导航
 *
 * 类比：
 * - useRoute 像 $route，提供当前 URL 参数、path、query 等
 * - useRouter 像 $router，提供 push/replace/go 等导航方法
 */
import { useRoute, useRouter } from 'vue-router'

/**
 * storeToRefs: 将 Pinia store 的 state/getters 转为响应式 ref
 * 作用：解构 store 时保持响应性，避免直接解构丢失响应式
 */
import { storeToRefs } from 'pinia'

// 导入 User Store
import { useUserStore } from '@/store/modules/user.js'

// Element Plus 图标组件（需要安装 @element-plus/icons-vue）
// npm install @element-plus/icons-vue
import {
  ArrowDown,      // 下拉箭头
  User,           // 用户图标
  Setting,        // 设置图标
  SwitchButton,   // 退出图标
  DataLine        // 数据/图表图标（用于 Logo）
} from '@element-plus/icons-vue'

// ============================================
// 初始化
// ============================================

// 获取路由相关实例
const route = useRoute()
const router = useRouter()

// 获取 User Store
const userStore = useUserStore()

/**
 * storeToRefs 解构说明：
 * 从 store 中解构出响应式数据，保持响应性
 * isLoggedIn 是 getter，但也能通过 storeToRefs 转为 ref
 */
const { isLoggedIn, displayName } = storeToRefs(userStore)

// ============================================
// 方法定义
// ============================================

/**
 * 处理退出登录
 *
 * 流程：
 * 1. 调用 Pinia store 的 logoutAction
 * 2. 该方法会清除 token、userInfo，并重定向到登录页
 */
async function handleLogout() {
  await userStore.logoutAction()
  // logoutAction 内部已处理跳转，这里无需额外操作
}

/**
 * 跳转到登录页
 * 使用 router.push 进行编程式导航
 */
function goToLogin() {
  router.push('/auth/login')
}

/**
 * 跳转到注册页
 */
function goToRegister() {
  router.push('/auth/register')
}

/**
 * 跳转到个人中心
 */
function goToProfile() {
  router.push('/profile/index')
}

/**
 * 判断当前路由是否激活
 * 用于高亮当前导航项
 *
 * @param {string} path - 路由路径
 * @returns {boolean} 是否匹配当前路由
 */
function isActive(path) {
  return route.path === path
}
</script>

<template>
  <!--
    ============================================
    导航栏主体
    ============================================

    TailwindCSS 类名解析：
    - fixed top-0 left-0 right-0: 固定在页面顶部，宽度铺满
    - h-16: 高度 64px (4rem)
    - bg-white/95: 白色背景，95% 不透明度（毛玻璃效果基础）
    - backdrop-blur-sm: 背景模糊效果（毛玻璃）
    - border-b border-gray-200: 底部边框
    - z-50: 层级最高，确保浮于内容之上
    - shadow-sm: 轻微阴影，增加层次感
  -->
  <nav class="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
    <!--
      内容容器
      - max-w-7xl: 最大宽度 1280px，避免超宽屏过度拉伸
      - mx-auto: 水平居中
      - px-4 sm:px-6 lg:px-8: 响应式水平内边距（小屏16px，中屏24px，大屏32px）
    -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
      <!--
        Flex 布局容器
        - flex: 开启弹性布局
        - items-center: 垂直居中
        - justify-between: 子元素左右两端对齐
        - h-full: 继承父级高度
      -->
      <div class="flex items-center justify-between h-full">

        <!-- ============================================ -->
        <!-- 左侧：Logo 和导航链接 -->
        <!-- ============================================ -->
        <div class="flex items-center space-x-8">
          <!--
            Logo 区域
            - flex items-center: 图标和文字水平排列并垂直居中
            - space-x-2: 子元素间距 8px
            - cursor-pointer: 鼠标悬停变手型
            - hover:opacity-80: 悬停时降低不透明度
            - transition: 添加过渡动画
          -->
          <router-link
            to="/"
            class="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition"
          >
            <!--
              Element Plus 图标组件
              - w-8 h-8: 宽度和高度 32px
              - text-blue-600: 主色调蓝色
            -->
            <el-icon class="w-8 h-8 text-blue-600" :size="32">
              <DataLine />
            </el-icon>
            <!--
              品牌名称
              - text-xl: 字体大小 1.25rem (20px)
              - font-bold: 加粗
              - text-gray-900: 深灰色文字
            -->
            <span class="text-xl font-bold text-gray-900">舆情监控</span>
          </router-link>

          <!--
            导航链接列表
            - hidden md:flex: 小屏幕隐藏，中等屏幕以上显示
            - space-x-6: 链接间距 24px
          -->
          <div class="hidden md:flex items-center space-x-6">
            <!--
              舆情大屏链接
              - router-link: Vue Router 导航组件，点击无刷新跳转
              - px-3 py-2: 内边距，增大点击区域
              - rounded-md: 圆角
              - transition-colors: 颜色变化过渡
              - :class 动态绑定：当前路由时高亮显示
            -->
            <router-link
              to="/"
              :class="[
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive('/')
                  ? 'text-blue-600 bg-blue-50'              // 激活状态：蓝色文字+浅蓝背景
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'  // 默认状态
              ]"
            >
              舆情大屏
            </router-link>

            <!-- 预留：更多导航链接可在此添加 -->
            <!-- <router-link to="/analysis" ...>数据分析</router-link> -->
          </div>
        </div>

        <!-- ============================================ -->
        <!-- 右侧：用户操作区 -->
        <!-- ============================================ -->
        <div class="flex items-center space-x-4">

          <!--
            场景 1：未登录状态
            - v-if="!isLoggedIn": 条件渲染，未登录时显示
          -->
          <template v-if="!isLoggedIn">
            <!--
              登录按钮
              - el-button: Element Plus 按钮组件
              - type="primary": 主色调（蓝色）
              - plain: 朴素按钮（边框样式）
              - @click: 点击事件绑定
            -->
            <el-button
              type="primary"
              plain
              @click="goToLogin"
            >
              登录
            </el-button>

            <!-- 注册按钮 -->
            <el-button
              type="default"
              @click="goToRegister"
            >
              注册
            </el-button>
          </template>

          <!--
            场景 2：已登录状态
            - v-else: isLoggedIn 为 true 时显示
          -->
          <template v-else>
            <!--
              Element Plus 下拉菜单
              - trigger="click": 点击触发下拉（默认是 hover）
              - placement="bottom-end": 从底部右对齐展开
            -->
            <el-dropdown trigger="click" placement="bottom-end">
              <!--
                下拉菜单触发区域
                - flex items-center: 水平排列
                - space-x-2: 间距
                - cursor-pointer: 手型光标
                - hover:text-blue-600: 悬停变蓝
              -->
              <div class="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition">
                <!-- 用户头像 -->
                <el-avatar
                  :size="32"
                  :src="userStore.avatarUrl"
                  :icon="User"
                  class="bg-blue-100 text-blue-600"
                />
                <!-- 用户昵称 -->
                <span class="text-sm font-medium text-gray-700 hidden sm:block">
                  {{ displayName }}
                </span>
                <!-- 下拉箭头 -->
                <el-icon class="text-gray-400">
                  <ArrowDown />
                </el-icon>
              </div>

              <!--
                下拉菜单内容
                - #dropdown: 具名插槽，定义下拉内容
              -->
              <template #dropdown>
                <el-dropdown-menu>
                  <!-- 个人中心菜单项 -->
                  <el-dropdown-item @click="goToProfile">
                    <el-icon class="mr-2"><User /></el-icon>
                    个人中心
                  </el-dropdown-item>

                  <!-- 分隔线 -->
                  <el-dropdown-item divided>
                    <el-icon class="mr-2"><Setting /></el-icon>
                    账号设置
                  </el-dropdown-item>

                  <!-- 退出登录（红色警示） -->
                  <el-dropdown-item @click="handleLogout" class="text-red-500">
                    <el-icon class="mr-2"><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>

      </div>
    </div>
  </nav>

  <!--
    ============================================
    占位元素
    ============================================
    导航栏固定定位后脱离文档流，需要占位元素撑起高度
    避免页面内容被导航栏遮挡
    - h-16: 与导航栏同高
  -->
  <div class="h-16"></div>
</template>

<style scoped>
/**
 * scoped 样式说明：
 * - 样式只作用于当前组件，不影响其他组件
 * - Vue 会自动为元素添加 data-v-xxxx 属性实现隔离
 * - 深度选择器 :deep() 可穿透作用域（用于修改子组件样式）
 */

/* 可以在此处添加组件特定的样式 */
</style>
