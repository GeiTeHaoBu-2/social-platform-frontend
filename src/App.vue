<!--
  ============================================
  应用根组件 (App.vue)
  ============================================
  
  当前使用 AppLayout 作为主布局框架
  包含：顶部栏 + 可折叠侧边栏 + 主内容区
-->

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<template>
  <!-- 使用新的布局组件 -->
  <AppLayout />
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 自定义滚动条 - 深色主题 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Element Plus 深色主题覆盖 */
.el-dropdown-menu {
  background-color: #2a2a2a !important;
  border-color: #444 !important;
}

.el-dropdown-menu__item {
  color: #ccc !important;
}

.el-dropdown-menu__item:hover {
  background-color: #3a3a3a !important;
  color: #fff !important;
}
</style>
