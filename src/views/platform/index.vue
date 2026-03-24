<!--
  ============================================
  平台数据看板 (Platform Dashboard) - 完全组件化版本
  ============================================
  
  路由路径: /platform/:source (weibo | zhihu | baidu)
  
  架构设计：
  1. 页面只负责数据获取和状态管理
  2. 所有展示逻辑交给子组件
  3. 通过配置控制展示哪些分析模块
  
  组件关系：
  PlatformIndex
  ├── HotSearchTable (热搜表格)
  ├── AnalysisConfig (配置面板)
  └── AnalysisPanel (分析面板容器)
      ├── TrendChart (趋势分析)
      ├── WordFrequencyCloud (类型分析)
      └── SentimentChart (情感分析)
-->

<script setup>
// ============================================
// 1. 导入依赖
// ============================================
import { ref, onMounted, watch, onUnmounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import {
  TrendCharts,
  DataAnalysis,
  HotWater
} from '@element-plus/icons-vue'

// API 接口
import { getCurrentHotSearchApi, getHotSearchTrendApi, getSentimentStatsApi } from '@/api/hotsearch.js'

// 组件导入
import AnalysisConfig from '@/components/analysis/AnalysisConfig.vue'
import AnalysisPanel from '@/components/analysis/AnalysisPanel.vue'

// ============================================
// 2. 路由与状态
// ============================================
const route = useRoute()

// 注入侧边栏折叠状态（来自 AppLayout）
const sidebarCollapsed = inject('sidebarCollapsed', ref(false))

// 平台名称映射
const platformNames = {
  weibo: '微博',
  zhihu: '知乎',
  baidu: '百度',
  toutiao: '今日头条'
}

// 当前平台名称
const currentPlatform = ref('')

// 加载状态
const loading = ref(false)
const trendLoading = ref(false)
const sentimentLoading = ref(false)
const wordCloudLoading = ref(false)

// 数据
const hotListData = ref([])
const selectedHotItem = ref(null)
const trendData = ref([])
const sentimentData = ref({ positive: 0, neutral: 0, negative: 0 })

// 分析配置
const analysisConfig = ref({
  trend: true,
  type: true,
  sentiment: true
})

// 趋势图表配置
const timeRange = ref('1d')
const metricType = ref('heat')

// ============================================
// 3. 数据加载
// ============================================

/**
 * 加载平台热搜榜单数据
 */
async function loadData(source) {
  console.log('正在加载平台数据:', source)
  currentPlatform.value = platformNames[source] || source || '未知平台'
  
  loading.value = true
  
  try {
    const response = await getCurrentHotSearchApi({ limit: 50 })
    
    if (Array.isArray(response)) {
      hotListData.value = response.map(item => ({
        rank: item.rankPos,
        title: item.title,
        heat: item.heat,
        typeName: item.typeName,
        sentiment: mapScoreToSentiment(item.score),
        itemId: item.itemId,
        url: item.url
      }))
      
      // 默认选中第一个热搜
      if (hotListData.value.length > 0 && !selectedHotItem.value) {
        handleRowClick(hotListData.value[0])
      }
    } else {
      console.warn('API 返回数据格式异常:', response)
      hotListData.value = []
    }
  } catch (error) {
    console.error('获取热搜榜单失败:', error)
    hotListData.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 加载趋势数据
 */
async function loadTrendData() {
  if (!selectedHotItem.value?.title) return
  
  trendLoading.value = true
  
  try {
    const response = await getHotSearchTrendApi({ 
      title: selectedHotItem.value.title 
    })
    
    if (Array.isArray(response) && response.length > 0) {
      const now = new Date()
      let startTime = new Date()
      
      if (timeRange.value === '1d') {
        startTime.setDate(now.getDate() - 1)
      } else {
        startTime.setDate(now.getDate() - 7)
      }
      
      trendData.value = response
        .filter(item => new Date(item.eventTime) >= startTime)
        .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime))
    } else {
      trendData.value = []
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    trendData.value = []
  } finally {
    trendLoading.value = false
  }
}

/**
 * 加载情感分布数据
 */
async function loadSentimentData() {
  if (!selectedHotItem.value?.title) return
  
  sentimentLoading.value = true
  
  try {
    const response = await getSentimentStatsApi({ 
      title: selectedHotItem.value.title 
    })
    
    if (response && typeof response === 'object') {
      sentimentData.value = {
        positive: response.positiveCount || 0,
        neutral: response.neutralCount || 0,
        negative: response.negativeCount || 0
      }
    } else {
      sentimentData.value = { positive: 0, neutral: 0, negative: 0 }
    }
  } catch (error) {
    console.error('获取情感数据失败:', error)
    sentimentData.value = { positive: 0, neutral: 0, negative: 0 }
  } finally {
    sentimentLoading.value = false
  }
}

// ============================================
// 4. 事件处理
// ============================================

/**
 * 处理表格行点击
 */
function handleRowClick(row) {
  selectedHotItem.value = row
  if (analysisConfig.value.trend) {
    loadTrendData()
  }
  if (analysisConfig.value.sentiment) {
    loadSentimentData()
  }
}

/**
 * 处理配置变化
 */
function handleConfigChange(newConfig) {
  analysisConfig.value = newConfig
  
  // 如果启用了趋势分析但数据为空，重新加载
  if (newConfig.trend && trendData.value.length === 0 && selectedHotItem.value) {
    loadTrendData()
  }
  
  // 如果启用了情感分析但数据为空，重新加载
  if (newConfig.sentiment && sentimentData.value.positive === 0 && selectedHotItem.value) {
    loadSentimentData()
  }
}

/**
 * 刷新数据
 */
async function handleRefresh() {
  const source = route.params.source
  await loadData(source)
}

/**
 * 打开热搜链接
 */
function openHotSearchUrl(url) {
  if (url) {
    window.open(url, '_blank')
  }
}

// ============================================
// 5. 辅助函数
// ============================================

function mapScoreToSentiment(score) {
  if (score === 1) return 'positive'
  if (score === -1) return 'negative'
  return 'neutral'
}

function formatHeat(num) {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

function getRankColor(rank) {
  if (rank === 1) return '#ef4444'
  if (rank === 2) return '#f97316'
  if (rank === 3) return '#eab308'
  return '#6b7280'
}

function getSentimentStyle(sentiment) {
  const styleMap = {
    positive: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      color: '#4ADE80',
      border: 'none'
    },
    negative: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      color: '#F87171',
      border: 'none'
    },
    neutral: {
      backgroundColor: 'rgba(148, 163, 184, 0.15)',
      color: '#94A3B8',
      border: 'none'
    }
  }
  return styleMap[sentiment] || styleMap.neutral
}

function getSentimentText(sentiment) {
  const textMap = {
    positive: '正向',
    negative: '负向',
    neutral: '中性'
  }
  return textMap[sentiment] || '未知'
}

function getTypeTagStyle(typeName) {
  const styleMap = {
    '娱乐': { backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#F472B6' },
    '财经': { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' },
    '科技': { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' },
    '体育': { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399' },
    '社会': { backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' },
    '民生': { backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE' },
    '国际': { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171' },
    '国内': { backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' },
    '健康': { backgroundColor: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF' },
    '教育': { backgroundColor: 'rgba(132, 204, 22, 0.15)', color: '#A3E635' },
    '军事': { backgroundColor: 'rgba(120, 113, 108, 0.15)', color: '#A8A29E' },
    '游戏': { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80' },
    '汽车': { backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#FB923C' },
    '房产': { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }
  }
  return styleMap[typeName] || {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    color: '#94A3B8'
  }
}

// ============================================
// 6. 生命周期
// ============================================
onMounted(() => {
  const source = route.params.source
  loadData(source)
})

watch(
  () => route.params.source,
  async (newSource) => {
    console.log(`平台切换: ${newSource}`)
    selectedHotItem.value = null
    trendData.value = []
    sentimentData.value = { positive: 0, neutral: 0, negative: 0 }
    await loadData(newSource)
  }
)

watch(timeRange, () => {
  if (selectedHotItem.value && analysisConfig.value.trend) {
    loadTrendData()
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- ============================================
      页面头部
    ============================================ -->
    <header class="mb-6 flex items-center justify-between shrink-0">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <el-icon :size="28" class="text-purple-500">
            <DataAnalysis />
          </el-icon>
          {{ currentPlatform }} - 实时舆情监控大盘
        </h1>
        <p class="text-gray-500 text-sm mt-2">
          实时监控 {{ currentPlatform }} 平台热点话题动态，追踪舆情走势
        </p>
      </div>
      
      <!-- 右侧操作区 -->
      <div class="flex items-center gap-3">
        <!-- 分析配置组件 -->
        <AnalysisConfig
          v-model="analysisConfig"
          @change="handleConfigChange"
        />
        
        <!-- 刷新按钮 -->
        <button
          @click="handleRefresh"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/50 text-purple-400 bg-transparent hover:bg-purple-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <el-icon :class="{ 'animate-spin': loading }">
            <TrendCharts />
          </el-icon>
          <span>刷新数据</span>
        </button>
      </div>
    </header>
    
    <!-- ============================================
      主体内容区域
      左侧热搜列表自适应，右侧分析区域固定宽度
    ============================================ -->
    <div class="flex-1 flex gap-6 overflow-hidden min-h-0">
      
      <!-- 左侧：热搜榜单 - 自适应占据剩余空间 -->
      <div class="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <!-- 卡片容器 - 去掉内部padding，表格直接占满 -->
        <div class="bg-[#242424] rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
          <!-- 卡片头部 -->
          <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between shrink-0">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <el-icon class="text-red-500">
                <HotWater />
              </el-icon>
              实时热搜榜单
            </h2>
            <span class="text-xs text-gray-500">
              {{ hotListData.length }} 条数据
            </span>
          </div>
          
          <!-- 表格区域 - 固定表头，横向隐藏溢出 -->
          <div class="flex-1 overflow-hidden relative">
            <el-table
              :data="hotListData"
              size="small"
              height="100%"
              class="platform-table"
              row-class-name="cursor-pointer"
              highlight-current-row
              v-loading="loading"
              element-loading-text="加载中..."
              element-loading-background="rgba(26, 26, 26, 0.8)"
              @row-click="handleRowClick"
            >
              <el-table-column label="排名" width="40" align="center">
                <template #default="{ row }">
                  <span 
                    class="font-bold text-base"
                    :style="{ color: getRankColor(row.rank) }"
                  >
                    {{ row.rank }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column label="话题" min-width="280" show-overflow-tooltip>
                <template #default="{ row }">
                  <a
                    :href="row.url"
                    target="_blank"
                    class="text-gray-200 hover:text-blue-400 transition hover:underline"
                    @click.prevent="openHotSearchUrl(row.url)"
                  >
                    {{ row.title }}
                  </a>
                </template>
              </el-table-column>
              
              <el-table-column label="热度" width="80" align="right">
                <template #default="{ row }">
                  <span class="text-orange-400 font-medium">
                    {{ formatHeat(row.heat) }}
                  </span>
                </template>
              </el-table-column>
              
              <!-- 类型列 - 始终渲染，通过 overflow-x-hidden 隐藏 -->
              <el-table-column label="类型" width="70" align="center">
                <template #default="{ row }">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :style="getTypeTagStyle(row.typeName)"
                  >
                    {{ row.typeName || '其他' }}
                  </span>
                </template>
              </el-table-column>
              
              <!-- 情感列 - 始终渲染，通过 overflow-x-hidden 隐藏 -->
              <el-table-column label="情感" width="70" align="center">
                <template #default="{ row }">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :style="getSentimentStyle(row.sentiment)"
                  >
                    {{ getSentimentText(row.sentiment) }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      
      <!-- 右侧：分析面板 - 固定宽度 650px，不随侧边栏收起而扩展 -->
      <div class="w-[650px] shrink-0 overflow-y-auto pr-2" style="max-height: 100%;">
        <AnalysisPanel
          :config="analysisConfig"
          :hot-list="hotListData"
          :selected-item="selectedHotItem"
          :trend-data="trendData"
          :sentiment-data="sentimentData"
          :trend-loading="trendLoading"
          :sentiment-loading="sentimentLoading"
          :word-cloud-loading="wordCloudLoading"
          v-model:time-range="timeRange"
          v-model:metric-type="metricType"
          @trend-refresh="loadTrendData"
          @type-click="console.log('类型点击:', $event)"
          @sentiment-click="console.log('情感点击:', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 表格样式 - 卡片容器已设置 overflow-hidden 和圆角 */
:deep(.platform-table) {
  background-color: transparent;
  width: 100% !important;
}

/* 表格主体区域 - 添加自定义滚动条 */
:deep(.platform-table .el-table__body-wrapper) {
  background-color: transparent;
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
}

/* Webkit 滚动条样式 */
:deep(.platform-table .el-table__body-wrapper::-webkit-scrollbar) {
  width: 4px;
  height: 0;
  background-color: transparent;
}

:deep(.platform-table .el-table__body-wrapper::-webkit-scrollbar-track) {
  background-color: transparent;
}

:deep(.platform-table .el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background-color: rgba(75, 85, 99, 0.3);
  border-radius: 2px;
}

:deep(.platform-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(107, 114, 128, 0.5);
}

/* 固定表头样式 */
:deep(.platform-table .el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 表格头部 */
:deep(.platform-table .el-table__header-wrapper th) {
  background-color: #1e1e1e !important;
  color: #9ca3af;
  font-weight: 600;
  border-bottom: 1px solid #374151;
}

/* 表格行 */
:deep(.platform-table .el-table__row) {
  background-color: transparent;
}

:deep(.platform-table .el-table__row:hover > td) {
  background-color: #2a2a2a !important;
}

:deep(.platform-table .el-table__row.current-row > td) {
  background-color: #3b3b3b !important;
}

:deep(.platform-table td) {
  background-color: transparent;
  border-bottom: 1px solid #2a2a2a;
}

/* 最后一行样式 */
:deep(.platform-table .el-table__row:last-child td) {
  border-bottom: none;
}

/* 最后一行第一个单元格左下角圆角 */
:deep(.platform-table .el-table__row:last-child td:first-child) {
  border-bottom-left-radius: 12px;
}

/* 最后一行最后一个单元格右下角圆角 */
:deep(.platform-table .el-table__row:last-child td:last-child) {
  border-bottom-right-radius: 12px;
}

/* 透明滚动条样式 - 应用于 custom-scrollbar 类 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  background-color: transparent;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.3);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.5);
}

/* Firefox 滚动条 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
}

/* 动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
