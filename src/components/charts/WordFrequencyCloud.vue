<!--
  ============================================
  类型分析组件 (Type Analysis)
  ============================================
  
  功能：统计热搜类型占比，以标签云形式展示
  
  使用方式：
  <TypeAnalysisCloud 
    :items="hotListData" 
    :loading="loading"
    @type-click="handleTypeClick"
  />
-->

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  maxTypes: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['type-click'])

const typeColorMap = {
  '娱乐': { bg: 'rgba(236, 72, 153, 0.2)', text: '#F472B6', border: 'rgba(236, 72, 153, 0.4)' },
  '财经': { bg: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.4)' },
  '科技': { bg: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.4)' },
  '体育': { bg: 'rgba(16, 185, 129, 0.2)', text: '#34D399', border: 'rgba(16, 185, 129, 0.4)' },
  '社会': { bg: 'rgba(139, 92, 246, 0.2)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.4)' },
  '民生': { bg: 'rgba(6, 182, 212, 0.2)', text: '#22D3EE', border: 'rgba(6, 182, 212, 0.4)' },
  '国际': { bg: 'rgba(239, 68, 68, 0.2)', text: '#F87171', border: 'rgba(239, 68, 68, 0.4)' },
  '国内': { bg: 'rgba(99, 102, 241, 0.2)', text: '#818CF8', border: 'rgba(99, 102, 241, 0.4)' },
  '军事': { bg: 'rgba(120, 113, 108, 0.2)', text: '#A8A29E', border: 'rgba(120, 113, 108, 0.4)' },
  '教育': { bg: 'rgba(132, 204, 22, 0.2)', text: '#A3E635', border: 'rgba(132, 204, 22, 0.4)' },
  '健康': { bg: 'rgba(20, 184, 166, 0.2)', text: '#2DD4BF', border: 'rgba(20, 184, 166, 0.4)' },
  '汽车': { bg: 'rgba(249, 115, 22, 0.2)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.4)' },
  '房产': { bg: 'rgba(168, 85, 247, 0.2)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.4)' },
  '旅游': { bg: 'rgba(14, 165, 233, 0.2)', text: '#38BDF8', border: 'rgba(14, 165, 233, 0.4)' },
  '美食': { bg: 'rgba(244, 63, 94, 0.2)', text: '#FB7185', border: 'rgba(244, 63, 94, 0.4)' },
  '时尚': { bg: 'rgba(217, 70, 239, 0.2)', text: '#E879F9', border: 'rgba(217, 70, 239, 0.4)' },
  '游戏': { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ADE80', border: 'rgba(34, 197, 94, 0.4)' },
  '动漫': { bg: 'rgba(234, 179, 8, 0.2)', text: '#FACC15', border: 'rgba(234, 179, 8, 0.4)' },
  '其他': { bg: 'rgba(148, 163, 184, 0.2)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.4)' }
}

const typeStats = computed(() => {
  if (props.items.length === 0) return []
  
  const total = props.items.length
  const typeCount = {}
  
  props.items.forEach(item => {
    const typeName = item.typeName || '其他'
    typeCount[typeName] = (typeCount[typeName] || 0) + 1
  })
  
  return Object.entries(typeCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, props.maxTypes)
})

function getTypeStyle(typeName, count, maxCount) {
  const colors = typeColorMap[typeName] || typeColorMap['其他']
  const ratio = count / maxCount
  
  // 字体大小：16px - 32px
  const fontSize = 16 + ratio * 16
  
  // 透明度：0.6 - 1.0
  const opacity = 0.6 + ratio * 0.4
  
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    fontSize: `${fontSize}px`,
    opacity: opacity,
    padding: `${8 + ratio * 4}px ${12 + ratio * 8}px`,
    borderRadius: '8px',
    fontWeight: ratio > 0.7 ? 'bold' : 'normal'
  }
}

function handleClick(item) {
  emit('type-click', item)
}
</script>

<template>
  <div class="w-full h-full relative overflow-hidden">
    <!-- 标签云容器 - 使用 Grid 布局确保不重叠 -->
    <div
      v-if="!loading && typeStats.length > 0"
      class="w-full h-full overflow-auto p-4"
    >
      <div class="flex flex-wrap justify-center gap-3 min-h-full content-start">
        <div
          v-for="item in typeStats"
          :key="item.name"
          class="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg whitespace-nowrap"
          :style="getTypeStyle(item.name, item.count, typeStats[0].count)"
          @click="handleClick(item)"
          :title="`${item.name}: ${item.count}条 (${item.percentage}%)`"
        >
          {{ item.name }}
          <span class="ml-1 text-xs opacity-70">{{ item.count }}</span>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div 
      v-else-if="loading" 
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="text-center text-gray-500">
        <div class="text-3xl mb-2 animate-spin">⏳</div>
        <div class="text-sm">分析中...</div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div 
      v-else
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="text-center text-gray-500">
        <div class="text-4xl mb-3">🏷️</div>
        <div class="text-sm">暂无类型数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* 隐藏滚动条但保留功能 */
.overflow-auto::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>
