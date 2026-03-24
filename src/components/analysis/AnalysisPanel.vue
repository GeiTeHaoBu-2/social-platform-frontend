<!--
  ============================================
  分析面板容器组件 (AnalysisPanel)
  ============================================
  
  功能：统一管理所有分析组件的展示，根据配置动态渲染
  
  使用方式：
  <AnalysisPanel
    :config="analysisConfig"
    :hot-list="hotListData"
    :selected-item="selectedItem"
    :trend-data="trendData"
    :sentiment-data="sentimentData"
    :loading="loading"
    v-model:time-range="timeRange"
    v-model:metric-type="metricType"
    @trend-refresh="loadTrendData"
    @type-click="handleTypeClick"
    @sentiment-click="handleSentimentClick"
  />
-->

<script setup>
import { computed } from 'vue'
import { TrendCharts, ChatDotRound, Collection } from '@element-plus/icons-vue'

// 导入分析组件
import TrendChart from '@/components/charts/TrendChart.vue'
import WordFrequencyCloud from '@/components/charts/WordFrequencyCloud.vue'
import SentimentChart from '@/components/charts/SentimentChart.vue'

// ============================================
// Props & Emits
// ============================================
const props = defineProps({
  // 配置对象
  config: {
    type: Object,
    default: () => ({
      trend: true,
      type: true,
      sentiment: true
    })
  },
  // 热搜列表（用于类型分析）
  hotList: {
    type: Array,
    default: () => []
  },
  // 当前选中的热搜项
  selectedItem: {
    type: Object,
    default: null
  },
  // 趋势数据
  trendData: {
    type: Array,
    default: () => []
  },
  // 情感数据
  sentimentData: {
    type: Object,
    default: () => ({ positive: 0, neutral: 0, negative: 0 })
  },
  // 趋势图表加载状态
  trendLoading: {
    type: Boolean,
    default: false
  },
  // 情感图表加载状态
  sentimentLoading: {
    type: Boolean,
    default: false
  },
  // 词云加载状态
  wordCloudLoading: {
    type: Boolean,
    default: false
  },
  // 时间范围（v-model）
  timeRange: {
    type: String,
    default: '1d'
  },
  // 指标类型（v-model）
  metricType: {
    type: String,
    default: 'heat'
  }
})

const emit = defineEmits([
  'update:timeRange',
  'update:metricType',
  'trendRefresh',
  'typeClick',
  'sentimentClick'
])

// ============================================
// 计算属性
// ============================================

// 启用的分析组件列表
const enabledComponents = computed(() => {
  const list = []
  if (props.config.trend !== false) {
    list.push({
      key: 'trend',
      component: TrendChart,
      title: '趋势分析',
      icon: TrendCharts,
      iconColor: 'text-blue-500',
      minHeight: '300px',
      height: '35vh',
      maxHeight: '400px'
    })
  }
  if (props.config.type !== false) {
    list.push({
      key: 'type',
      component: WordFrequencyCloud,
      title: '类型分析',
      icon: Collection,
      iconColor: 'text-purple-500',
      minHeight: '200px',
      height: '28vh',
      maxHeight: '320px'
    })
  }
  if (props.config.sentiment !== false) {
    list.push({
      key: 'sentiment',
      component: SentimentChart,
      title: '情感分布',
      icon: ChatDotRound,
      iconColor: 'text-green-500',
      minHeight: '200px',
      height: '28vh',
      maxHeight: '320px'
    })
  }
  return list
})

// 当前启用数量
const enabledCount = computed(() => enabledComponents.value.length)

// 计算属性：时间范围
const currentTimeRange = computed({
  get: () => props.timeRange,
  set: (val) => emit('update:timeRange', val)
})

// 计算属性：指标类型
const currentMetricType = computed({
  get: () => props.metricType,
  set: (val) => emit('update:metricType', val)
})

// ============================================
// 事件处理
// ============================================
function handleTrendRefresh() {
  emit('trendRefresh')
}

function handleTypeClick(data) {
  emit('typeClick', data)
}

function handleSentimentClick(data) {
  emit('sentimentClick', data)
}
</script>

<template>
  <div class="w-full h-full flex flex-col gap-4">
    <!-- 
      ============================================
      动态渲染启用的分析组件
      ============================================
    -->
    <template v-if="enabledCount > 0">
      <div
        v-for="item in enabledComponents"
        :key="item.key"
        class="bg-[#242424] rounded-xl border border-gray-700 flex flex-col shrink-0 overflow-hidden"
        :style="{
          minHeight: item.minHeight,
          height: item.height,
          maxHeight: item.maxHeight
        }"
      >
        <!-- 
          趋势分析组件
          使用独立组件，包含自己的头部控制
        -->
        <template v-if="item.key === 'trend'">
          <TrendChart
            :item-title="selectedItem?.title || ''"
            :data="trendData"
            :loading="trendLoading"
            v-model:time-range="currentTimeRange"
            v-model:metric-type="currentMetricType"
            @refresh="handleTrendRefresh"
          />
        </template>
        
        <!-- 
          类型分析组件
          使用通用卡片包装
        -->
        <template v-else-if="item.key === 'type'">
          <div class="w-full h-full flex flex-col">
            <!-- 模块头部 -->
            <div class="px-4 py-3 border-b border-gray-700 shrink-0">
              <h2 class="font-semibold text-white flex items-center gap-2">
                <el-icon :class="item.iconColor">
                  <component :is="item.icon" />
                </el-icon>
                {{ item.title }}
              </h2>
            </div>
            <!-- 组件内容区域 -->
            <div class="flex-1 p-4 min-h-0">
              <div class="w-full h-full bg-[#1a1a1a] rounded-lg overflow-hidden">
                <WordFrequencyCloud
                  :items="hotList"
                  :loading="wordCloudLoading"
                  @type-click="handleTypeClick"
                />
              </div>
            </div>
          </div>
        </template>
        
        <!-- 
          情感分析组件
          使用通用卡片包装
        -->
        <template v-else-if="item.key === 'sentiment'">
          <div class="w-full h-full flex flex-col">
            <!-- 模块头部 -->
            <div class="px-4 py-3 border-b border-gray-700 shrink-0">
              <h2 class="font-semibold text-white flex items-center gap-2">
                <el-icon :class="item.iconColor">
                  <component :is="item.icon" />
                </el-icon>
                {{ item.title }}
              </h2>
            </div>
            <!-- 组件内容区域 -->
            <div class="flex-1 p-4 min-h-0">
              <div class="w-full h-full bg-[#1a1a1a] rounded-lg overflow-hidden">
                <SentimentChart
                  :data="sentimentData"
                  :loading="sentimentLoading"
                  title="情感分布"
                  type="doughnut"
                  @slice-click="handleSentimentClick"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
    
    <!-- 空状态：未启用任何分析组件 -->
    <div
      v-else
      class="flex-1 flex items-center justify-center bg-[#242424] rounded-xl border border-gray-700"
    >
      <div class="text-center text-gray-500">
        <div class="text-5xl mb-4">📊</div>
        <div class="text-base font-medium mb-2">未启用任何分析模块</div>
        <div class="text-sm text-gray-600">
          请点击上方"展示内容"按钮选择要显示的分析模块
        </div>
      </div>
    </div>
  </div>
</template>
