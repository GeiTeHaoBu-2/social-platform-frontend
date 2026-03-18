<!--
  ============================================
  应用根组件 (App.vue)
  ============================================
  
  根组件仅作为路由的挂载点
  实际布局由路由配置中的 AppLayout.vue 提供
-->

<template>
  <!-- 路由视图：根据当前路径渲染对应组件 -->
  <router-view />
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
