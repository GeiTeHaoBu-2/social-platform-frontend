<!--
  ============================================
  趋势分析组件 (TrendChart)
  ============================================
  
  功能：展示热搜热度/排名趋势图表
  
  使用方式：
  <TrendChart
    :title="selectedItem.title"
    :data="trendData"
    :loading="loading"
    v-model:timeRange="timeRange"
    v-model:metricType="metricType"
    @refresh="handleRefresh"
  />
-->

<script setup>
import { ref, watch, onUnmounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { TrendCharts } from '@element-plus/icons-vue'

// ============================================
// Props & Emits
// ============================================
const props = defineProps({
  // 热搜标题（用于显示）
  itemTitle: {
    type: String,
    default: ''
  },
  // 趋势数据
  data: {
    type: Array,
    default: () => []
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 时间范围（支持 v-model）
  timeRange: {
    type: String,
    default: '1d'
  },
  // 指标类型（支持 v-model）
  metricType: {
    type: String,
    default: 'heat'
  }
})

const emit = defineEmits([
  'update:timeRange',
  'update:metricType',
  'refresh'
])

// ============================================
// 内部状态
// ============================================
const chartRef = ref(null)
let chartInstance = null

// 时间范围选项
const timeRangeOptions = [
  { label: '1天内', value: '1d' },
  { label: '1周内', value: '1w' }
]

// 指标类型选项
const metricTypeOptions = [
  { label: '热度', value: 'heat' },
  { label: '排名', value: 'rank' }
]

// 计算属性：当前显示的时间范围
const currentTimeRange = computed({
  get: () => props.timeRange,
  set: (val) => emit('update:timeRange', val)
})

// 计算属性：当前显示的指标类型
const currentMetricType = computed({
  get: () => props.metricType,
  set: (val) => emit('update:metricType', val)
})

// ============================================
// 图表相关方法
// ============================================

/**
 * 初始化或更新图表
 */
function initOrUpdateChart() {
  if (!chartRef.value) return
  
  // 如果没有数据，销毁实例
  if (props.data.length === 0) {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    return
  }
  
  // 初始化 ECharts 实例
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  }
  
  // 准备图表数据
  const xData = props.data.map(item => {
    const date = new Date(item.eventTime)
    return currentTimeRange.value === '1d'
      ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      : `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:00`
  })
  
  const yData = props.data.map(item =>
    currentMetricType.value === 'heat' ? item.hotCount : item.rank
  )
  
  // 图表颜色配置
  const lineColor = currentMetricType.value === 'heat' ? '#f97316' : '#8b5cf6'
  const areaColor = currentMetricType.value === 'heat'
    ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
        { offset: 1, color: 'rgba(249, 115, 22, 0.05)' }
      ])
    : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
        { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
      ])
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '15%',
      containLabel: true
    },
    // 滚轮缩放和拖拽缩放
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseWheel: true,
        moveOnMouseMove: true
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        start: 0,
        end: 100,
        height: 20,
        bottom: 10,
        handleIcon: 'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%',
        handleStyle: {
          color: '#fff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          shadowOffsetX: 2,
          shadowOffsetY: 2
        },
        textStyle: {
          color: '#9ca3af'
        },
        borderColor: '#4b5563',
        fillerColor: 'rgba(59, 130, 246, 0.2)',
        dataBackground: {
          lineStyle: {
            color: '#4b5563'
          },
          areaStyle: {
            color: '#374151'
          }
        },
        selectedDataBackground: {
          lineStyle: {
            color: '#3b82f6'
          },
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.3)'
          }
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(36, 36, 36, 0.95)',
      borderColor: '#4b5563',
      borderWidth: 1,
      textStyle: {
        color: '#e5e7eb'
      },
      formatter: function(params) {
        const data = props.data[params[0].dataIndex]
        const time = new Date(data.eventTime).toLocaleString('zh-CN')
        const value = params[0].value
        const metricName = currentMetricType.value === 'heat' ? '热度' : '排名'
        return `<div style="font-weight: bold; margin-bottom: 5px;">${time}</div>
                <div>${metricName}: <span style="color: ${lineColor}; font-weight: bold;">${value}</span></div>`
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisLine: {
        lineStyle: { color: '#4b5563' }
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: currentMetricType.value === 'heat' ? '热度' : '排名',
      nameLocation: 'end',
      nameGap: 8,
      nameTextStyle: {
        color: '#9ca3af',
        fontSize: 12,
        align: 'left',
        padding: [0, 0, 0, -25]
      },
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11
      },
      // 排名模式：只显示整数
      minInterval: currentMetricType.value === 'rank' ? 1 : 0,
      splitLine: {
        lineStyle: {
          color: '#374151',
          type: 'dashed'
        }
      },
      // 排名是倒序的，第一名在最上面
      inverse: currentMetricType.value === 'rank'
    },
    series: [
      {
        name: currentMetricType.value === 'heat' ? '热度' : '排名',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        sampling: 'average',
        itemStyle: {
          color: lineColor
        },
        lineStyle: {
          width: 3,
          color: lineColor
        },
        areaStyle: {
          color: areaColor
        },
        data: yData,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ]
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

/**
 * 处理时间范围切换
 */
function handleTimeRangeChange(range) {
  currentTimeRange.value = range
  emit('refresh')
}

/**
 * 处理指标类型切换
 */
function handleMetricChange(type) {
  currentMetricType.value = type
  nextTick(() => {
    initOrUpdateChart()
  })
}

// ============================================
// 监听数据变化
// ============================================
watch(() => props.data, () => {
  nextTick(() => {
    initOrUpdateChart()
  })
}, { deep: true })

// ============================================
// 生命周期
// ============================================
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
    <!-- 模块头部 -->
    <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between shrink-0">
      <h2 class="font-semibold text-white flex items-center gap-2">
        <el-icon class="text-blue-500">
          <TrendCharts />
        </el-icon>
        <span class="truncate max-w-[200px]" :title="itemTitle">
          {{ itemTitle ? `「${itemTitle}」` : '' }}
        </span>
        趋势分析
      </h2>
      <!-- 图表控制按钮组 - 分段控制器风格 -->
      <div class="flex items-center gap-3">
        <!-- 时间范围选择 -->
        <div class="flex bg-[#27272A] rounded-lg p-1">
          <button
            v-for="option in timeRangeOptions"
            :key="option.value"
            @click="handleTimeRangeChange(option.value)"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
            :class="currentTimeRange === option.value
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'text-[#71717A] hover:text-gray-300'"
          >
            {{ option.label }}
          </button>
        </div>
        <!-- 指标类型切换 -->
        <div class="flex bg-[#27272A] rounded-lg p-1">
          <button
            v-for="option in metricTypeOptions"
            :key="option.value"
            @click="handleMetricChange(option.value)"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
            :class="currentMetricType === option.value
              ? 'bg-[#7C3AED] text-white shadow-sm'
              : 'text-[#71717A] hover:text-gray-300'"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 图表容器区域 -->
    <div class="flex-1 relative min-h-0">
      <!-- ECharts 图表容器 -->
      <div
        ref="chartRef"
        class="w-full h-full"
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-background="rgba(26, 26, 26, 0.8)"
      ></div>
      
      <!-- 空状态提示 -->
      <div
        v-if="!loading && data.length === 0"
        class="absolute inset-0 flex items-center justify-center bg-[#242424]"
      >
        <div class="text-center text-gray-500">
          <div class="text-4xl mb-3">📈</div>
          <div class="text-sm">{{ itemTitle ? '暂无趋势数据' : '点击左侧热搜查看趋势' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
