<!--
  ============================================
  应用根组件 (App.vue)
  ============================================

  功能概述：
  1. 挂载全局导航栏 TopNav（固定在所有页面顶部）
  2. 配置 <router-view> 作为页面内容渲染区域
  3. 可在此添加全局组件如：消息通知、加载动画等

  组件结构：
  - TopNav: 全局顶部导航栏
  - router-view: 路由视图容器，根据 URL 渲染对应页面组件
-->

<script setup>
/**
 * 导入全局导航栏组件
 * 
 * 路径说明：
 * - @/components/common/TopNav.vue
 * - @ 是 Vite 配置的 alias，指向 src 目录
 * - 需要在 vite.config.js 中配置 resolve.alias
 */
import TopNav from '@/components/common/TopNav.vue'

/**
 * 可选：应用级初始化逻辑
 * 
 * 例如：
 * - 恢复用户登录状态
 * - 初始化全局配置
 * - 监听系统事件
 * 
 * 示例（恢复登录状态）：
 * 
 * import { onMounted } from 'vue'
 * import { useUserStore } from '@/store/modules/user.js'
 * 
 * const userStore = useUserStore()
 * 
 * onMounted(() => {
 *   // 检查 localStorage 中的 token，恢复登录状态
 *   userStore.initUserState()
 * })
 */
</script>

<template>
  <!-- 
    ============================================
    应用布局
    ============================================
    
    使用 flex 纵向布局：
    - TopNav: 固定在顶部（组件内部已实现 fixed 定位）
    - main: 内容区域，flex-1 占据剩余空间
  -->
  <div class="min-h-screen flex flex-col">
    
    <!-- 
      全局顶部导航栏
      - 显示在所有页面
      - 根据登录状态显示不同内容
    -->
    <TopNav />
    
    <!-- 
      页面内容区域
      - flex-1: 占据剩余垂直空间
      - overflow-auto: 内容过多时滚动
      - bg-gray-50: 浅灰背景色，与导航栏区分
    -->
    <main class="flex-1 overflow-auto bg-gray-50">
      <!--
        ============================================
        路由视图 (router-view)
        ============================================
        
        router-view 是 Vue Router 提供的内置组件：
        - 根据当前 URL 渲染匹配的路由组件
        - 相当于页面的"内容插槽"
        
        路由匹配示例：
        - URL: /           -> 渲染 Dashboard 组件
        - URL: /auth/login -> 渲染 Login 组件
        - URL: /profile    -> 渲染 Profile 组件
        
        v-slot 语法（可选）：
        可获取当前路由组件的属性和方法
        <router-view v-slot="{ Component }">
          <transition name="fade">
            <component :is="Component" />
          </transition>
        </router-view>
      -->
      <router-view />
    </main>
    
    <!--
      可选：全局页脚
      如需添加，取消下面注释
    -->
    <!--
    <footer class="bg-white border-t border-gray-200 py-4">
      <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        © 2024 微博舆情监控系统. All rights reserved.
      </div>
    </footer>
    -->
  </div>
</template>

<style>
/**
 * ============================================
 * 全局样式（非 scoped）
 * ============================================
 * 
 * 注意：这里不使用 scoped，因为：
 * - 样式需要应用到 router-view 渲染的子组件
 * - scoped 样式只能影响当前组件模板内的元素
 * 
 * 如需局部样式，请使用 <style scoped>
 */

/**
 * 页面切换过渡动画
 * 
 * 使用方式：
 * 1. 给 router-view 添加 v-slot 和 transition
 * 2. 定义下面 CSS 类
 */

/* 进入动画 */
.fade-enter-active {
  transition: opacity 0.3s ease;
}

/* 离开动画 */
.fade-leave-active {
  transition: opacity 0.3s ease;
}

/* 进入开始状态和离开结束状态 */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
