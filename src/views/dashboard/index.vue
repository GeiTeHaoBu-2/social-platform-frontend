<!--
  ============================================
  舆情大屏首页 (Dashboard.vue)
  ============================================

  功能概述：
  1. 响应式布局：使用 CSS Grid 实现四宫格布局
  2. 实时热搜榜单：轮询更新（每 30 秒）
  3. 词云图：展示当前热门话题关键词
  4. 趋势图：热度趋势 + 情感分析走势

  技术要点：
  - CSS Grid: grid-cols-2 实现左右分栏
  - ECharts: 使用 vue-echarts 组件化封装
  - 轮询机制: setInterval + onBeforeUnmount 清理
  - 自动刷新: 数据更新时图表联动刷新
-->

<script setup>
// ============================================
// 导入依赖
// ============================================

import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { ElMessage } from 'element-plus'

// ECharts 相关
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册 ECharts 模块（按需加载，减少包体积）
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent
])

// API 导入
import {
  getCurrentHotSearchApi,
  getHotSearchTrendApi,
  getSentimentStatsApi,
  getWordCloudApi
} from '@/api/hotsearch.js'

// ============================================
// 响应式数据
// ============================================

// 加载状态
const loading = ref({
  hotSearch: false,    // 热搜榜单
  wordCloud: false,    // 词云
  trend: false,        // 趋势图
  sentiment: false     // 情感分析
})

// 热搜榜单数据
const hotSearchList = ref([])

// 当前选中的热搜（用于趋势图联动）
const selectedHotSearch = ref('')

// 词云数据
const wordCloudData = ref([])

// 趋势图数据
const trendData = ref({
  times: [],      // 时间轴
  heats: [],      // 热度值
  ranks: []       // 排名
})

// 情感分析数据
const sentimentData = ref([
  { name: '正面', value: 0 },
  { name: '负面', value: 0 },
  { name: '中性', value: 0 }
])

// 自动刷新定时器
const refreshTimer = ref(null)

// ============================================
// 计算属性：ECharts 配置
// ============================================

/**
 * 趋势图配置
 * 使用 computed 确保数据变化时自动更新图表
 */
const trendOption = computed(() => ({
  // 图表标题
  title: {
    text: selectedHotSearch.value
      ? `"${selectedHotSearch.value}" 热度趋势`
      : '热搜热度趋势',
    left: 'center',
    textStyle: { fontSize: 14, fontWeight: 'normal' }
  },
  // 提示框
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' }
  },
  // 工具栏
  toolbox: {
    feature: {
      dataZoom: { yAxisIndex: 'none' },
      restore: {},
      saveAsImage: {}
    }
  },
  // 图例
  legend: {
    data: ['热度值', '排名'],
    bottom: 0
  },
  // 网格区域
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    containLabel: true
  },
  // X轴：时间
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trendData.value.times,
    axisLabel: { rotate: 30 }
  },
  // Y轴
  yAxis: [
    {
      type: 'value',
      name: '热度',
      position: 'left',
      axisLine: { show: true }
    },
    {
      type: 'value',
      name: '排名',
      position: 'right',
      inverse: true,  // 排名倒序（1在最上）
      min: 1,
      max: 50
    }
  ],
  // 数据系列
  series: [
    {
      name: '热度值',
      type: 'line',
      smooth: true,  // 平滑曲线
      data: trendData.value.heats,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ]
        }
      },
      itemStyle: { color: '#3b82f6' }
    },
    {
      name: '排名',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,  // 使用右侧Y轴
      data: trendData.value.ranks,
      itemStyle: { color: '#10b981' }
    }
  ]
}))

/**
 * 情感分析饼图配置
 */
const sentimentOption = computed(() => ({
  title: {
    text: '舆情情感分析',
    left: 'center',
    textStyle: { fontSize: 14, fontWeight: 'normal' }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 'center'
  },
  series: [
    {
      name: '情感分布',
      type: 'pie',
      radius: ['40%', '70%'],  // 环形图
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: sentimentData.value,
      color: ['#10b981', '#ef4444', '#6b7280']  // 绿、红、灰
    }
  ]
}))

// ============================================
// 方法定义
// ============================================

/**
 * 获取实时热搜榜单
 */
async function fetchHotSearchList() {
  loading.value.hotSearch = true
  try {
    const res = await getCurrentHotSearchApi({ limit: 50 })
    hotSearchList.value = res || []

    // 如果没有选中的热搜，默认选第一个
    if (!selectedHotSearch.value && hotSearchList.value.length > 0) {
      selectedHotSearch.value = hotSearchList.value[0].title
      // 加载该热搜的详细数据
      fetchTrendData(selectedHotSearch.value)
      fetchSentimentData(selectedHotSearch.value)
    }
  } catch (error) {
    console.error('获取热搜榜单失败:', error)
  } finally {
    loading.value.hotSearch = false
  }
}

/**
 * 获取词云数据
 */
async function fetchWordCloudData() {
  loading.value.wordCloud = true
  try {
    // 使用第一个热搜作为词云关键词来源，或传入空获取全局词云
    const keyword = selectedHotSearch.value || ''
    const res = await getWordCloudApi({
      title: keyword,
      limit: 100
    })
    wordCloudData.value = res || []
  } catch (error) {
    console.error('获取词云数据失败:', error)
    // 使用模拟数据作为 fallback
    wordCloudData.value = [
      { word: '热搜', weight: 100 },
      { word: '舆情', weight: 85 },
      { word: '监控', weight: 72 },
      { word: '分析', weight: 68 },
      { word: '数据', weight: 60 }
    ]
  } finally {
    loading.value.wordCloud = false
  }
}

/**
 * 获取趋势数据
 * @param {string} title - 热搜标题
 */
async function fetchTrendData(title) {
  if (!title) return
  loading.value.trend = true
  try {
    const res = await getHotSearchTrendApi({
      title,
      hours: 24  // 最近24小时
    })

    // 转换数据格式
    if (res && Array.isArray(res)) {
      trendData.value.times = res.map(item => {
        // 格式化时间：只显示小时:分钟
        const date = new Date(item.timestamp)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      })
      trendData.value.heats = res.map(item => item.heat)
      trendData.value.ranks = res.map(item => item.rank)
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    // 模拟数据
    trendData.value.times = Array.from({ length: 12 }, (_, i) => `${i * 2}:00`)
    trendData.value.heats = Array.from({ length: 12 }, () => Math.floor(Math.random() * 5000000) + 1000000)
    trendData.value.ranks = Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 1)
  } finally {
    loading.value.trend = false
  }
}

/**
 * 获取情感分析数据
 * @param {string} title - 热搜标题
 */
async function fetchSentimentData(title) {
  if (!title) return
  loading.value.sentiment = true
  try {
    const res = await getSentimentStatsApi({ title })
    if (res && res.sentiment) {
      sentimentData.value = [
        { name: '正面', value: res.sentiment.positive || 0 },
        { name: '负面', value: res.sentiment.negative || 0 },
        { name: '中性', value: res.sentiment.neutral || 0 }
      ]
    }
  } catch (error) {
    console.error('获取情感分析失败:', error)
    // 模拟数据
    sentimentData.value = [
      { name: '正面', value: 45 },
      { name: '负面', value: 25 },
      { name: '中性', value: 30 }
    ]
  } finally {
    loading.value.sentiment = false
  }
}

/**
 * 处理热搜点击
 * 点击榜单项，更新趋势图和情感分析
 */
function handleHotSearchClick(item) {
  selectedHotSearch.value = item.title
  fetchTrendData(item.title)
  fetchSentimentData(item.title)
  ElMessage.info(`已切换至：${item.title}`)
}

/**
 * 格式化热度数字
 * 例如：1234567 -> 123.5万
 */
function formatHeat(heat) {
  if (heat >= 10000) {
    return (heat / 10000).toFixed(1) + '万'
  }
  return heat.toString()
}

/**
 * 获取排名颜色
 */
function getRankColor(rank) {
  if (rank === 1) return '#ef4444'  // 红色 - 榜首
  if (rank === 2) return '#f97316'  // 橙色
  if (rank === 3) return '#eab308'  // 黄色
  return '#6b7280'  // 灰色
}

/**
 * 获取热度标签样式
 */
function getHeatTagClass(heat) {
  if (heat > 5000000) return 'bg-red-100 text-red-600'     // 爆
  if (heat > 1000000) return 'bg-orange-100 text-orange-600'  // 热
  if (heat > 500000) return 'bg-blue-100 text-blue-600'    // 新
  return 'bg-gray-100 text-gray-600'                       // 荐
}

/**
 * 获取热度标签文字
 */
function getHeatTagText(heat) {
  if (heat > 5000000) return '爆'
  if (heat > 1000000) return '热'
  if (heat > 500000) return '新'
  return '荐'
}

/**
 * 手动刷新所有数据
 */
async function handleRefresh() {
  ElMessage.info('正在刷新数据...')
  await Promise.all([
    fetchHotSearchList(),
    fetchWordCloudData()
  ])
  if (selectedHotSearch.value) {
    await Promise.all([
      fetchTrendData(selectedHotSearch.value),
      fetchSentimentData(selectedHotSearch.value)
    ])
  }
  ElMessage.success('数据刷新完成')
}

// ============================================
// 生命周期钩子
// ============================================

onMounted(() => {
  // 初始加载数据
  fetchHotSearchList()
  fetchWordCloudData()

  // 设置自动刷新（每 30 秒）
  refreshTimer.value = setInterval(() => {
    fetchHotSearchList()
    fetchWordCloudData()
  }, 30000)
})

onBeforeUnmount(() => {
  // 清理定时器
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
})
</script>

<template>
  <!-- 页面容器 -->
  <div class="p-4 lg:p-6 min-h-screen bg-gray-50">
    <!--
      ============================================
      页面标题栏
      ============================================
    -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">舆情监控大屏</h1>
        <p class="text-sm text-gray-500 mt-1">
          实时追踪微博热搜动态，智能分析舆情走势
        </p>
      </div>
      <el-button type="primary" :icon="Refresh" @click="handleRefresh">
        刷新数据
      </el-button>
    </div>

    <!--
      ============================================
      四宫格布局（CSS Grid）
      ============================================
      - grid-cols-1: 移动端单列
      - md:grid-cols-2: 中等屏幕双列
      - gap-4: 网格间距
      - h-[calc(100vh-200px)]: 动态计算高度，避免页面滚动
    -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">

      <!--
        ============================================
        左上：实时热搜榜单
        ============================================
      -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <!-- 卡片头部 -->
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-800 flex items-center">
            <el-icon class="mr-2 text-red-500"><TrendCharts /></el-icon>
            实时热搜 Top 50
          </h2>
          <span class="text-xs text-gray-400">
            {{ hotSearchList.length }} 条数据
          </span>
        </div>

        <!-- 榜单列表 -->
        <div class="flex-1 overflow-y-auto p-2">
          <div
            v-for="(item, index) in hotSearchList"
            :key="item.id || index"
            class="flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition group"
            :class="{ 'bg-blue-50': selectedHotSearch === item.title }"
            @click="handleHotSearchClick(item)"
          >
            <!-- 排名 -->
            <span
              class="w-8 text-center font-bold text-lg"
              :style="{ color: getRankColor(index + 1) }"
            >
              {{ index + 1 }}
            </span>

            <!-- 标题 -->
            <span class="flex-1 truncate text-sm text-gray-700 group-hover:text-blue-600">
              {{ item.title }}
            </span>

            <!-- 热度标签 -->
            <span
              class="text-xs px-2 py-0.5 rounded"
              :class="getHeatTagClass(item.heat)"
            >
              {{ getHeatTagText(item.heat) }}
            </span>

            <!-- 热度数值 -->
            <span class="ml-3 text-xs text-gray-400 w-16 text-right">
              {{ formatHeat(item.heat) }}
            </span>
          </div>

          <!-- 空状态 -->
          <el-empty v-if="hotSearchList.length === 0" description="暂无数据" />
        </div>
      </div>

      <!--
        ============================================
        右上：词云图
        ============================================
      -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div class="px-4 py-3 border-b border-gray-100">
          <h2 class="font-semibold text-gray-800 flex items-center">
            <el-icon class="mr-2 text-purple-500"><Collection /></el-icon>
            热门话题词云
          </h2>
        </div>
        <div class="flex-1 p-4 relative">
          <!--
            词云组件
            这里使用简单的标签云实现
            如需更复杂效果，可引入 vue3-word-cloud 或 echarts-wordcloud
          -->
          <div class="flex flex-wrap gap-2 content-center justify-center h-full">
            <span
              v-for="(word, index) in wordCloudData"
              :key="index"
              class="px-3 py-1.5 rounded-full cursor-pointer transition hover:scale-110"
              :class="[
                // 根据权重设置大小和颜色
                word.weight > 80 ? 'text-lg bg-red-100 text-red-600' :
                word.weight > 60 ? 'text-base bg-orange-100 text-orange-600' :
                word.weight > 40 ? 'text-sm bg-blue-100 text-blue-600' :
                'text-xs bg-gray-100 text-gray-600'
              ]"
              :style="{
                opacity: 0.6 + (word.weight / 200)
              }"
            >
              {{ word.word }}
            </span>
          </div>

          <!-- 加载状态 -->
          <el-loading v-if="loading.wordCloud" />
        </div>
      </div>

      <!--
        ============================================
        左下：趋势图（ECharts）
        ============================================
      -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div class="px-4 py-3 border-b border-gray-100">
          <h2 class="font-semibold text-gray-800 flex items-center">
            <el-icon class="mr-2 text-blue-500"><TrendCharts /></el-icon>
            热度趋势分析
          </h2>
        </div>
        <div class="flex-1 p-4">
          <!--
            vue-echarts 组件
            autoresize: 窗口大小变化时自动调整图表尺寸
          -->
          <v-chart
            class="w-full h-full"
            :option="trendOption"
            autoresize
          />
        </div>
      </div>

      <!--
        ============================================
        右下：情感分析图（ECharts）
        ============================================
      -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div class="px-4 py-3 border-b border-gray-100">
          <h2 class="font-semibold text-gray-800 flex items-center">
            <el-icon class="mr-2 text-green-500"><PieChart /></el-icon>
            舆情情感分布
          </h2>
        </div>
        <div class="flex-1 p-4">
          <v-chart
            class="w-full h-full"
            :option="sentimentOption"
            autoresize
          />
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
