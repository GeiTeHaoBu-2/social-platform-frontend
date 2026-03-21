<!--
  ============================================
  词云图组件 (Word Cloud Chart)
  ============================================
  
  功能：展示热搜话题的核心关键词（使用散点图模拟词云效果）
  
  使用方式：
  <WordCloud 
    :data="wordCloudData" 
    :title="'核心词云图'"
    @word-click="handleWordClick"
  />
-->

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  /**
   * 词云数据
   * 格式: [{ name: '关键词', value: 权重 }, ...]
   */
  data: {
    type: Array,
    default: () => []
  },
  /**
   * 图表标题
   */
  title: {
    type: String,
    default: '核心词云图'
  },
  /**
   * 是否显示加载状态
   */
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['word-click'])

// ECharts 实例
let chartInstance = null
const chartRef = ref(null)

/**
 * 颜色配置
 */
const colors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#ef4444', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#eab308'
]

/**
 * 转换数据为 ECharts 格式
 * 使用散点图模拟词云效果
 */
const chartData = computed(() => {
  if (props.data.length === 0) return []
  
  // 按权重排序
  const sortedData = [...props.data].sort((a, b) => b.value - a.value)
  const maxValue = sortedData[0].value
  const minValue = sortedData[sortedData.length - 1].value
  
  return sortedData.map((item, index) => {
    // 计算字体大小 (12 - 40)
    const size = minValue === maxValue 
      ? 20 
      : 12 + (item.value - minValue) / (maxValue - minValue) * 28
    
    // 随机位置（使用伪随机保证可复现）
    const seed = index * 137.5
    const x = (Math.sin(seed) * 0.8 + 1) / 2 * 100
    const y = (Math.cos(seed * 1.3) * 0.8 + 1) / 2 * 100
    
    return {
      name: item.name,
      value: [x, y, item.value, size],
      itemStyle: {
        color: colors[index % colors.length]
      },
      label: {
        show: true,
        formatter: item.name,
        fontSize: size,
        fontWeight: 'bold'
      }
    }
  })
})

/**
 * 初始化词云图
 */
function initChart() {
  if (!chartRef.value) return
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', handleResize)
    
    // 点击事件
    chartInstance.on('click', (params) => {
      emit('word-click', {
        name: params.name,
        value: params.value[2]
      })
    })
  }
  
  const option = {
    grid: {
      left: '5%',
      right: '5%',
      top: '5%',
      bottom: '5%',
      containLabel: false
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: false
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: false
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(36, 36, 36, 0.95)',
      borderColor: '#4b5563',
      textStyle: { color: '#e5e7eb' },
      formatter: (params) => {
        return `${params.name}: 权重 ${params.value[2]}`
      }
    },
    series: [{
      type: 'scatter',
      symbolSize: 1,
      data: chartData.value,
      emphasis: {
        focus: 'self',
        scale: true,
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0,0,0,0.5)'
        }
      }
    }]
  }
  
  chartInstance.setOption(option, true)
}

/**
 * 窗口大小变化处理
 */
function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听数据变化
watch(() => props.data, () => {
  nextTick(() => {
    initChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <!-- 标题 -->
    <div v-if="title" class="px-3 py-2 text-sm text-gray-400 border-b border-gray-700/50">
      {{ title }}
    </div>
    <!-- 图表容器 -->
    <div class="flex-1 relative">
      <div 
        ref="chartRef" 
        class="w-full h-full"
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-background="rgba(26, 26, 26, 0.8)"
      ></div>
      <!-- 空状态 -->
      <div 
        v-if="!loading && data.length === 0"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center text-gray-500">
          <div class="text-3xl mb-2">☁️</div>
          <div class="text-xs">暂无词云数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-loading-mask) {
  background-color: rgba(26, 26, 26, 0.8) !important;
}
</style>
