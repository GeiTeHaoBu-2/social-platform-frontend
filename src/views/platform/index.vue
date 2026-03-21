 <!--
  ============================================
  平台数据看板 (Platform Dashboard)
  ============================================
  
  路由路径: /platform/:source (weibo | zhihu | baidu)
  
  功能概述：
  1. 动态路由监听：根据 URL 参数切换平台数据
  2. 真实 API 数据：对接后端热搜接口
  3. 响应式布局：左侧榜单 + 右侧图表
  4. 趋势图表：点击热搜显示热度/排名趋势，支持时间维度切换
  
  技术要点：
  - useRoute: 获取动态路由参数
  - watch: 监听路由变化重新加载数据
  - onMounted: 页面挂载时首次加载
  - API 数据映射：将后端返回格式转换为组件展示格式
  - ECharts: 趋势数据可视化
-->

<script setup>
// ============================================
// 1. 导入依赖
// ============================================

// Vue 核心 API：响应式数据、生命周期、监听器
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'

// Vue Router：获取当前路由信息，用于读取动态参数
import { useRoute } from 'vue-router'

// Element Plus 图标组件
import {
  TrendCharts,    // 趋势图表图标
  DataAnalysis,   // 数据分析图标
  HotWater,       // 热度图标
  ChatDotRound    // 评论/话题图标
} from '@element-plus/icons-vue'

// 真实 API 接口
import { getCurrentHotSearchApi, getHotSearchTrendApi, getWordCloudApi, getSentimentStatsApi } from '@/api/hotsearch.js'

// ECharts 导入
import * as echarts from 'echarts'

// 图表组件
import WordCloud from '@/components/charts/WordCloud.vue'
import SentimentChart from '@/components/charts/SentimentChart.vue'

// ============================================
// 2. 获取路由实例
// ============================================
// useRoute() 返回当前激活的路由对象
// 通过 route.params.source 可以获取 URL 中的平台参数（如 weibo/zhihu/baidu）
const route = useRoute()

// ============================================
// 3. 定义响应式数据
// ============================================

/**
 * 加载状态
 * 用于控制表格 loading 效果
 */
const loading = ref(false)

/**
 * 图表加载状态
 */
const chartLoading = ref(false)

/**
 * 热搜榜单数据
 * 每条记录包含：排名、标题、热度值、情感倾向
 * 使用 ref 包装使其具备响应式特性
 */
const hotListData = ref([])

/**
 * 当前选中的热搜
 * 用于显示趋势图表
 */
const selectedHotItem = ref(null)

/**
 * 时间范围选择（1天/1周）
 * '1d' = 1天, '1w' = 1周
 */
const timeRange = ref('1d')

/**
 * 图表指标类型（热度/排名）
 * 'heat' = 热度, 'rank' = 排名
 */
const metricType = ref('heat')

/**
 * 趋势图表数据
 */
const trendData = ref([])

/**
 * 词云图表数据
 */
const wordCloudData = ref([])
const wordCloudLoading = ref(false)

/**
 * 情感分布数据
 */
const sentimentData = ref({ positive: 0, neutral: 0, negative: 0 })
const sentimentLoading = ref(false)

/**
 * 当前平台名称（用于显示）
 */
const currentPlatform = ref('')

/**
 * 平台名称映射表
 * 将 URL 参数映射为中文显示名称
 */
const platformNames = {
  weibo: '微博',
  zhihu: '知乎',
  baidu: '百度',
  toutiao: '今日头条'
}

/**
 * ECharts 实例
 */
let trendChartInstance = null
const trendChartRef = ref(null)

// ============================================
// 4. 数据加载逻辑（对接真实 API）
// ============================================

/**
 * 加载平台数据的主方法
 * 根据传入的平台 source 参数，调用后端 API 获取真实数据
 * 
 * @param {string} source - 平台标识（从路由参数获取）
 */
async function loadData(source) {
  // 打印日志，便于调试时观察数据加载时机
  console.log('正在加载平台数据:', source)
  
  // 更新当前平台显示名称（如果没有匹配则显示原值）
  currentPlatform.value = platformNames[source] || source || '未知平台'
  
  // 开始加载，显示 loading 状态
  loading.value = true
  
  try {
    // ============================================
    // 调用真实 API：获取实时热搜榜单 Top 50
    // ============================================
    // 接口文档: GET /api/v1/hotsearch/current
    // 返回字段: itemId, rankPos, title, url, heat, score, typeName
    const response = await getCurrentHotSearchApi({ limit: 50 })
    
    // 检查响应数据
    // 注意：响应拦截器已经剥离了外层包装，response 直接就是 data 字段
    // 成功时直接返回热搜数组
    if (Array.isArray(response)) {
      // 将 API 返回数据映射为组件需要的格式
      // API 字段 -> 组件字段：
      // rankPos -> rank (排名)
      // title -> title (标题)
      // heat -> heat (热度)
      // score -> sentiment (情感分数：1正 0中 -1负 null未分析)
      hotListData.value = response.map(item => ({
        rank: item.rankPos,           // 排名
        title: item.title,            // 标题
        heat: item.heat,              // 热度值
        typeName: item.typeName,      // 分类
        sentiment: mapScoreToSentiment(item.score),  // 情感倾向转换
        itemId: item.itemId,          // 唯一标识（用于后续查询趋势）
        url: item.url                 // 链接
      }))
      
      // 默认选中第一个热搜
      if (hotListData.value.length > 0 && !selectedHotItem.value) {
        handleRowClick(hotListData.value[0])
      }
    } else {
      // 数据格式异常，使用空数组
      console.warn('API 返回数据格式异常:', response)
      hotListData.value = []
    }
  } catch (error) {
    // 请求失败处理
    console.error('获取热搜榜单失败:', error)
    hotListData.value = []
    // 可以在这里添加错误提示，例如 ElMessage.error('数据加载失败')
  } finally {
    // 无论成功失败，都关闭 loading 状态
    loading.value = false
  }
}

/**
 * 获取趋势数据
 * 调用 API 获取指定热搜的趋势数据
 * 
 * @param {string} title - 热搜标题
 */
async function loadTrendData(title) {
  if (!title) return
  
  chartLoading.value = true
  
  try {
    const response = await getHotSearchTrendApi({ title })
    
    if (Array.isArray(response) && response.length > 0) {
      // 根据时间范围过滤数据
      const now = new Date()
      let startTime = new Date()
      
      if (timeRange.value === '1d') {
        // 1天前
        startTime.setDate(now.getDate() - 1)
      } else {
        // 1周前
        startTime.setDate(now.getDate() - 7)
      }
      
      // 过滤并排序数据
      trendData.value = response
        .filter(item => new Date(item.eventTime) >= startTime)
        .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime))
      
      // 关闭 loading 后再初始化图表
      chartLoading.value = false
      
      // 更新图表
      await nextTick()
      initOrUpdateChart()
    } else {
      console.warn('API 返回数据为空或格式不正确:', response)
      trendData.value = []
      chartLoading.value = false
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    trendData.value = []
    chartLoading.value = false
  }
}

/**
 * 获取词云数据
 * @param {string} title - 热搜标题
 */
async function loadWordCloudData(title) {
  if (!title) return
  
  wordCloudLoading.value = true
  try {
    const response = await getWordCloudApi({ title })
    
    if (Array.isArray(response)) {
      wordCloudData.value = response.map(item => ({
        name: item.word || item.name,
        value: item.weight || item.value || item.count
      }))
    } else {
      wordCloudData.value = []
    }
  } catch (error) {
    console.error('获取词云数据失败:', error)
    wordCloudData.value = []
  } finally {
    wordCloudLoading.value = false
  }
}

/**
 * 获取情感分布数据
 * @param {string} title - 热搜标题
 */
async function loadSentimentData(title) {
  if (!title) return
  
  sentimentLoading.value = true
  try {
    const response = await getSentimentStatsApi({ title })
    
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

/**
 * 将 API 返回的 score 转换为组件使用的 sentiment 字符串
 * 
 * API 返回的 score 定义（根据接口文档）：
 * - 1: 正面
 * - 0: 中性
 * - -1: 负面
 * - null: 未分析
 * 
 * @param {number|null} score - API 返回的情感分数
 * @returns {string} 组件使用的情感标识：positive/negative/neutral
 */
function mapScoreToSentiment(score) {
  // 使用严格相等判断，处理 null 和 undefined
  if (score === 1) return 'positive'
  if (score === -1) return 'negative'
  // score 为 0 或 null 或 undefined 都视为中性
  return 'neutral'
}

// ============================================
// 5. ECharts 图表相关
// ============================================

/**
 * 初始化或更新趋势图表
 */
function initOrUpdateChart() {
  if (!trendChartRef.value) return
  
  // 如果没有数据，显示空状态
  if (trendData.value.length === 0) {
    if (trendChartInstance) {
      trendChartInstance.dispose()
      trendChartInstance = null
    }
    return
  }
  
  // 初始化 ECharts 实例
  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
    
    // 监听窗口大小变化，自适应调整
    window.addEventListener('resize', handleResize)
  }
  
  // 准备图表数据
  const xData = trendData.value.map(item => {
    const date = new Date(item.eventTime)
    return timeRange.value === '1d'
      ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      : `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:00`
  })
  
  const yData = trendData.value.map(item =>
    metricType.value === 'heat' ? item.hotCount : item.rank
  )
  
  // 图表颜色配置
  const lineColor = metricType.value === 'heat' ? '#f97316' : '#8b5cf6'
  const areaColor = metricType.value === 'heat' 
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
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(36, 36, 36, 0.95)',
      borderColor: '#4b5563',
      borderWidth: 1,
      textStyle: {
        color: '#e5e7eb'
      },
      formatter: function(params) {
        const data = trendData.value[params[0].dataIndex]
        const time = new Date(data.eventTime).toLocaleString('zh-CN')
        const value = params[0].value
        const metricName = metricType.value === 'heat' ? '热度' : '排名'
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
      name: metricType.value === 'heat' ? '热度' : '排名',
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
        fontSize: 11,
        formatter: metricType.value === 'rank' ? '{value}' : '{value}'
      },
      // 排名模式：只显示整数
      minInterval: metricType.value === 'rank' ? 1 : 0,
      splitLine: {
        lineStyle: {
          color: '#374151',
          type: 'dashed'
        }
      },
      // 排名是倒序的，第一名在最上面
      inverse: metricType.value === 'rank'
    },
    series: [
      {
        name: metricType.value === 'heat' ? '热度' : '排名',
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
  
  trendChartInstance.setOption(option, true)
}

/**
 * 窗口大小变化处理
 */
function handleResize() {
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
}

// ============================================
// 6. 交互处理函数
// ============================================

/**
 * 处理表格行点击事件
 * 点击热搜后加载对应的趋势数据
 * 
 * @param {Object} row - 点击的行数据
 */
function handleRowClick(row) {
  selectedHotItem.value = row
  loadTrendData(row.title)
  loadWordCloudData(row.title)
  loadSentimentData(row.title)
}

/**
 * 处理词云点击事件
 * @param {Object} wordData - 点击的词数据
 */
function handleWordClick(wordData) {
  console.log('点击词云:', wordData)
  // 可以在这里添加跳转或筛选逻辑
}

/**
 * 处理情感分布点击事件
 * @param {Object} sentimentData - 点击的情感数据
 */
function handleSentimentClick(sentimentData) {
  console.log('点击情感分布:', sentimentData)
  // 可以在这里添加筛选逻辑
}

/**
 * 处理时间范围切换
 * 
 * @param {string} range - '1d' 或 '1w'
 */
function handleTimeRangeChange(range) {
  timeRange.value = range
  if (selectedHotItem.value) {
    loadTrendData(selectedHotItem.value.title)
  }
}

/**
 * 处理指标类型切换
 * 
 * @param {string} type - 'heat' 或 'rank'
 */
function handleMetricChange(type) {
  metricType.value = type
  nextTick(() => {
    initOrUpdateChart()
  })
}

// ============================================
// 7. 生命周期钩子与路由监听
// ============================================

/**
 * onMounted：组件挂载完成后执行
 * 
 * 用途：
 * - 进行首次数据加载
 * - 此时 DOM 已渲染完成，可以安全地操作数据
 */
onMounted(() => {
  // 组件首次加载时，获取当前路由参数并加载对应数据
  const source = route.params.source
  loadData(source)
})

/**
 * onUnmounted：组件卸载时清理
 */
onUnmounted(() => {
  // 销毁 ECharts 实例
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})

/**
 * watch：监听路由参数变化
 * 
 * 监听目标：() => route.params.source
 * - 这是一个返回 route.params.source 的函数
 * - Vue 的 watch 会追踪这个函数的返回值变化
 * 
 * 使用场景：
 * - 当用户在侧边栏切换平台时（如从微博切换到知乎）
 * - URL 从 /platform/weibo 变为 /platform/zhihu
 * - route.params.source 的值发生变化
 * - watch 回调被触发，重新加载数据
 */
watch(
  // 第一个参数：要监听的响应式数据源（返回 source 参数的函数）
  () => route.params.source,
  
  // 第二个参数：回调函数，当 source 变化时执行
  // newSource 是变化后的新值，oldSource 是变化前的旧值
  async (newSource, oldSource) => {
    console.log(`平台切换: ${oldSource} -> ${newSource}`)
    // 重置选中状态
    selectedHotItem.value = null
    trendData.value = []
    // 调用 loadData 重新加载新平台的数据
    await loadData(newSource)
  }
)

// ============================================
// 8. 辅助工具函数
// ============================================

/**
 * 格式化热度数字
 * 将大数字转换为带单位的字符串（如 1.2万、3.5亿）
 * 
 * @param {number} num - 原始数字
 * @returns {string} 格式化后的字符串
 */
function formatHeat(num) {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

/**
 * 获取情感标签的类型（用于 el-tag 的 type 属性）
 * 
 * @param {string} sentiment - 情感标识（positive/negative/neutral）
 * @returns {string} Element Plus 标签类型
 */
function getSentimentType(sentiment) {
  const typeMap = {
    positive: 'success',  // 绿色
    negative: 'danger',   // 红色
    neutral: 'info'       // 灰色
  }
  return typeMap[sentiment] || 'info'
}

/**
 * 获取情感标签的显示文字
 * 
 * @param {string} sentiment - 情感标识
 * @returns {string} 中文显示文字
 */
function getSentimentText(sentiment) {
  const textMap = {
    positive: '正向',
    negative: '负向',
    neutral: '中性'
  }
  return textMap[sentiment] || '未知'
}

/**
 * 获取排名对应的颜色样式
 *
 * @param {number} rank - 排名数字
 * @returns {string} CSS 颜色值
 */
function getRankColor(rank) {
  if (rank === 1) return '#ef4444'  // 红色 - 榜首
  if (rank === 2) return '#f97316'  // 橙色
  if (rank === 3) return '#eab308'  // 黄色
  return '#6b7280'  // 灰色
}

/**
 * 获取类型标签的样式类型
 *
 * @param {string} typeName - 类型名称
 * @returns {string} Element Plus 标签类型
 */
function getTypeTagType(typeName) {
  const typeMap = {
    '娱乐': 'danger',
    '财经': 'warning',
    '科技': 'primary',
    '体育': 'success',
    '社会': 'info',
    '民生': 'info',
    '国际': 'info',
    '国内': 'info'
  }
  return typeMap[typeName] || 'info'
}

/**
 * 打开热搜链接
 * 在新标签页打开热搜页面
 *
 * @param {string} url - 热搜链接
 */
function openHotSearchUrl(url) {
  if (url) {
    window.open(url, '_blank')
  }
}

/**
 * 刷新数据
 * 手动触发重新加载当前平台数据
 */
async function handleRefresh() {
  console.log('手动刷新数据')
  const source = route.params.source
  await loadData(source)
}
</script>

<template>
  <!-- 
    ============================================
    页面主体容器
    使用 h-full 占满父容器高度
    背景色与 Layout 保持一致
    ============================================
  -->
  <div class="h-full flex flex-col">
    
    <!-- 
      ============================================
      页面头部区域
      包含：动态标题 + 刷新按钮
      ============================================
    -->
    <header class="mb-6 flex items-center justify-between">
      <div>
        <!-- 动态标题：显示当前平台名称 -->
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <!-- 平台图标 -->
          <el-icon :size="28" class="text-purple-500">
            <DataAnalysis />
          </el-icon>
          <!-- 平台名称 + 固定后缀 -->
          {{ currentPlatform }} - 实时舆情监控大盘
        </h1>
        <!-- 副标题/描述 -->
        <p class="text-gray-500 text-sm mt-2">
          实时监控 {{ currentPlatform }} 平台热点话题动态，追踪舆情走势
        </p>
      </div>
      
      <!-- 右侧操作区 -->
      <div class="flex gap-2">
        <el-button type="primary" :icon="TrendCharts" @click="handleRefresh" :loading="loading">
          刷新数据
        </el-button>
      </div>
    </header>
    
    <!-- 
      ============================================
      主体内容区域
      使用 Flex 布局实现左右分栏
      gap-6 设置列间距
      ============================================
    -->
    <div class="flex-1 flex gap-6 min-h-0">
      
      <!-- 
        ============================================
        左侧区域：热搜榜单（约占 35%）
        使用 flex-[35] 设置 flex-grow 比例为 35
        ============================================
      -->
      <div class="flex-[35] flex flex-col">
        <!-- 卡片容器 -->
        <div class="bg-[#242424] rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
          <!-- 卡片头部 -->
          <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <el-icon class="text-red-500">
                <HotWater />
              </el-icon>
              实时热搜榜单
            </h2>
            <!-- 数据条数显示 -->
            <span class="text-xs text-gray-500">
              {{ hotListData.length }} 条数据
            </span>
          </div>
          
          <!-- 表格区域 -->
          <div class="flex-1 overflow-auto p-2">
            <!-- 
              Element Plus 表格组件
              :data 绑定响应式数据 hotListData
              stripe 启用斑马纹
              size="small" 紧凑尺寸
              v-loading 绑定 loading 状态
              highlight-current-row 高亮当前选中行
              @row-click 行点击事件
            -->
            <el-table
              :data="hotListData"
              stripe
              size="small"
              class="platform-table"
              row-class-name="cursor-pointer"
              highlight-current-row
              v-loading="loading"
              element-loading-text="加载中..."
              element-loading-background="rgba(26, 26, 26, 0.8)"
              @row-click="handleRowClick"
            >
              <!-- 排名列 -->
              <el-table-column label="排名" width="70" align="center">
                <template #default="{ row }">
                  <!-- 
                    根据排名显示不同颜色
                    :style 绑定动态样式
                  -->
                  <span 
                    class="font-bold text-lg"
                    :style="{ color: getRankColor(row.rank) }"
                  >
                    {{ row.rank }}
                  </span>
                </template>
              </el-table-column>
              
              <!-- 话题列 -->
              <el-table-column label="话题" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">
                  <!-- 话题标题，点击可跳转 -->
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
              
              <!-- 热度列 -->
              <el-table-column label="热度" width="100" align="right">
                <template #default="{ row }">
                  <!-- 使用 formatHeat 格式化数字 -->
                  <span class="text-orange-400 font-medium">
                    {{ formatHeat(row.heat) }}
                  </span>
                </template>
              </el-table-column>
              
              <!-- 类型列 -->
              <el-table-column label="类型" width="80" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="getTypeTagType(row.typeName)"
                    effect="plain"
                    size="small"
                  >
                    {{ row.typeName || '其他' }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <!-- 情感列 -->
              <el-table-column label="情感" width="80" align="center">
                <template #default="{ row }">
                  <!-- 
                    Element Plus 标签组件
                    :type 绑定 getSentimentType 返回的类型
                    effect="dark" 深色主题
                    size="small" 小尺寸
                  -->
                  <el-tag
                    :type="getSentimentType(row.sentiment)"
                    effect="dark"
                    size="small"
                  >
                    {{ getSentimentText(row.sentiment) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      
      <!-- 
        ============================================
        右侧区域：图表区（约占 65%）
        使用 flex-[65] 设置 flex-grow 比例为 65
        内部垂直分布两个模块
        ============================================
      -->
      <div class="flex-[65] flex flex-col gap-4">
        
        <!-- 
          ============================================
          右上：热度/排名趋势图表
          h-[400px] 固定高度 400px
          ============================================
        -->
        <div class="h-[400px] bg-[#242424] rounded-xl border border-gray-700 flex flex-col">
          <!-- 模块头部 -->
          <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <el-icon class="text-blue-500">
                <TrendCharts />
              </el-icon>
              {{ selectedHotItem ? `「${selectedHotItem.title}」` : '' }}趋势分析
            </h2>
            <!-- 图表控制按钮组 -->
            <div class="flex items-center gap-2">
              <!-- 时间范围选择 -->
              <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
                <el-radio-button label="1d">1天内</el-radio-button>
                <el-radio-button label="1w">1周内</el-radio-button>
              </el-radio-group>
              <!-- 指标类型切换 -->
              <el-radio-group v-model="metricType" size="small" @change="handleMetricChange">
                <el-radio-button label="heat">热度</el-radio-button>
                <el-radio-button label="rank">排名</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <!-- 图表容器区域 -->
          <div class="flex-1 relative">
            <!-- ECharts 图表容器 -->
            <div 
              ref="trendChartRef" 
              class="w-full h-full"
              v-loading="chartLoading"
              element-loading-text="加载中..."
              element-loading-background="rgba(26, 26, 26, 0.8)"
            ></div>
            <!-- 空状态提示 - 只有真正没有数据且不在加载状态时才显示 -->
            <div
              v-if="!chartLoading && (!selectedHotItem || trendData.length === 0)"
              class="absolute inset-0 flex items-center justify-center bg-[#242424]"
            >
              <div class="text-center text-gray-500">
                <div class="text-4xl mb-3">📈</div>
                <div class="text-sm">{{ selectedHotItem ? '暂无趋势数据' : '点击左侧热搜查看趋势' }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 
          ============================================
          右下：词云 + 情感分布占位
          flex-1 占据剩余空间
          ============================================
        -->
        <div class="flex-1 bg-[#242424] rounded-xl border border-gray-700 flex flex-col min-h-0">
          <!-- 模块头部 -->
          <div class="px-4 py-3 border-b border-gray-700">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <el-icon class="text-green-500">
                <ChatDotRound />
              </el-icon>
              舆情分析可视化
            </h2>
          </div>
          <!-- 图表区域 -->
          <div class="flex-1 p-4 min-h-0">
            <div class="w-full h-full grid grid-cols-2 gap-4">
              <!-- 左侧：词云图 -->
              <div class="bg-[#1a1a1a] rounded-lg overflow-hidden">
                <WordCloud
                  :data="wordCloudData"
                  :loading="wordCloudLoading"
                  title="核心词云"
                  @word-click="handleWordClick"
                />
              </div>
              <!-- 右侧：情感分布 -->
              <div class="bg-[#1a1a1a] rounded-lg overflow-hidden">
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
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 
  ============================================
  组件局部样式
  覆盖 Element Plus 表格默认样式以适配深色主题
  ============================================
*/

/* 表格背景透明 */
:deep(.platform-table) {
  background-color: transparent;
}

/* 表格头部样式 */
:deep(.platform-table .el-table__header-wrapper th) {
  background-color: #1e1e1e !important;
  color: #9ca3af;
  font-weight: 600;
  border-bottom: 1px solid #374151;
}

/* 表格行背景 */
:deep(.platform-table .el-table__row) {
  background-color: transparent;
}

/* 表格行 hover 效果 */
:deep(.platform-table .el-table__row:hover > td) {
  background-color: #2a2a2a !important;
}

/* 当前选中行样式 */
:deep(.platform-table .el-table__row.current-row > td) {
  background-color: #3b3b3b !important;
}

/* 表格单元格样式 */
:deep(.platform-table td) {
  background-color: transparent;
  border-bottom: 1px solid #374151;
  color: #d1d5db;
}

/* 斑马纹颜色 */
:deep(.platform-table .el-table__row--striped td) {
  background-color: #1e1e1e !important;
}

/* 空数据提示样式 */
:deep(.platform-table .el-table__empty-block) {
  background-color: transparent;
}

/* 自定义滚动条 - 适配深色主题 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* 单选按钮组样式调整 */
:deep(.el-radio-button__inner) {
  background-color: #1e1e1e;
  border-color: #4b5563;
  color: #9ca3af;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}
</style>
