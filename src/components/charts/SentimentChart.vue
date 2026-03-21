<!--
  ============================================
  情感分布图组件 (Sentiment Distribution Chart)
  ============================================
  
  功能：展示情感分布的饼图/环形图
  
  使用方式：
  <SentimentChart 
    :data="sentimentData" 
    :title="'情感分布'"
    type="pie|doughnut"
  />
-->

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  /**
   * 情感统计数据
   * 格式: { positive: 10, neutral: 5, negative: 3 }
   */
  data: {
    type: Object,
    default: () => ({ positive: 0, neutral: 0, negative: 0 })
  },
  /**
   * 图表标题
   */
  title: {
    type: String,
    default: '情感分布'
  },
  /**
   * 图表类型: pie(饼图) | doughnut(环形图)
   */
  type: {
    type: String,
    default: 'doughnut'
  },
  /**
   * 是否显示加载状态
   */
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['slice-click'])

// ECharts 实例
let chartInstance = null
const chartRef = ref(null)

/**
 * 转换数据为 ECharts 格式
 */
const chartData = computed(() => {
  const total = props.data.positive + props.data.neutral + props.data.negative
  if (total === 0) return []
  
  return [
    { 
      name: '正面', 
      value: props.data.positive,
      itemStyle: { color: '#10b981' }
    },
    { 
      name: '中性', 
      value: props.data.neutral,
      itemStyle: { color: '#6b7280' }
    },
    { 
      name: '负面', 
      value: props.data.negative,
      itemStyle: { color: '#ef4444' }
    }
  ].filter(item => item.value > 0)
})

/**
 * 初始化情感分布图
 */
function initChart() {
  if (!chartRef.value || chartData.value.length === 0) return
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', handleResize)
    
    // 点击事件
    chartInstance.on('click', (params) => {
      emit('slice-click', params.data)
    })
  }
  
  const isDoughnut = props.type === 'doughnut'
  const total = props.data.positive + props.data.neutral + props.data.negative
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(36, 36, 36, 0.95)',
      borderColor: '#4b5563',
      textStyle: { color: '#e5e7eb' },
      formatter: (params) => {
        const percent = ((params.value / total) * 100).toFixed(1)
        return `${params.name}: ${params.value} (${percent}%)`
      }
    },
    legend: {
      bottom: '5%',
      left: 'center',
      textStyle: {
        color: '#9ca3af',
        fontSize: 11
      },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [
      {
        name: '情感分布',
        type: 'pie',
        radius: isDoughnut ? ['40%', '70%'] : '65%',
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#242424',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
            formatter: (params) => {
              const percent = ((params.value / total) * 100).toFixed(1)
              return `${params.name}\n${percent}%`
            }
          },
          scale: true,
          scaleSize: 10
        },
        labelLine: {
          show: false
        },
        data: chartData.value
      }
    ]
  }
  
  chartInstance.setOption(option)
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
        v-if="!loading && chartData.length === 0"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center text-gray-500">
          <div class="text-3xl mb-2">🥧</div>
          <div class="text-xs">暂无情感数据</div>
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
