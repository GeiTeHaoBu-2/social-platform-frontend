<!--
  ============================================
  平台数据看板 (Platform Dashboard)
  ============================================
  
  路由路径: /platform/:source (weibo | zhihu | baidu)
  
  功能概述：
  1. 动态路由监听：根据 URL 参数切换平台数据
  2. Mock 数据驱动：暂用前端假数据填充 UI
  3. 响应式布局：左侧榜单 + 右侧图表占位
  
  技术要点：
  - useRoute: 获取动态路由参数
  - watch: 监听路由变化重新加载数据
  - onMounted: 页面挂载时首次加载
-->

<script setup>
// ============================================
// 1. 导入依赖
// ============================================

// Vue 核心 API：响应式数据、生命周期、监听器
import { ref, onMounted, watch } from 'vue'

// Vue Router：获取当前路由信息，用于读取动态参数
import { useRoute } from 'vue-router'

// Element Plus 图标组件
import { 
  TrendCharts,    // 趋势图表图标
  DataAnalysis,   // 数据分析图标
  HotWater,       // 热度图标
  ChatDotRound    // 评论/话题图标
} from '@element-plus/icons-vue'

// ============================================
// 2. 获取路由实例
// ============================================
// useRoute() 返回当前激活的路由对象
// 通过 route.params.source 可以获取 URL 中的平台参数（如 weibo/zhihu/baidu）
const route = useRoute()

// ============================================
// 3. 定义响应式数据 (Mock 数据)
// ============================================

/**
 * 热搜榜单数据
 * 每条记录包含：排名、标题、热度值、情感倾向
 * 使用 ref 包装使其具备响应式特性
 */
const hotListData = ref([])

/**
 * 图表数据占位
 * 后续接入 ECharts 时使用
 */
const chartData = ref({
  trend: [],    // 趋势图数据
  wordCloud: [], // 词云数据
  sentiment: []  // 情感分布数据
})

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

// ============================================
// 4. 定义 Mock 数据生成方法
// ============================================

/**
 * 根据平台类型生成对应的 Mock 热搜数据
 * @param {string} source - 平台标识（weibo/zhihu/baidu）
 * @returns {Array} 热搜数据数组
 */
function generateMockHotList(source) {
  // 不同平台的 Mock 数据模板
  const mockDataMap = {
    weibo: [
      { rank: 1, title: '某某明星官宣结婚', heat: 5284310, sentiment: 'positive' },
      { rank: 2, title: '某电影票房破纪录', heat: 4210921, sentiment: 'positive' },
      { rank: 3, title: '某地突发暴雨预警', heat: 3892000, sentiment: 'neutral' },
      { rank: 4, title: '某公司回应裁员传闻', heat: 3250100, sentiment: 'negative' },
      { rank: 5, title: '新发现某种远古生物化石', heat: 2894500, sentiment: 'neutral' },
      { rank: 6, title: '某球队夺冠游行', heat: 2456000, sentiment: 'positive' },
      { rank: 7, title: '某品牌产品质量问题曝光', heat: 2103200, sentiment: 'negative' },
      { rank: 8, title: '某综艺热播引热议', heat: 1890000, sentiment: 'positive' }
    ],
    zhihu: [
      { rank: 1, title: '如何评价某新发布的手机？', heat: 12450, sentiment: 'neutral' },
      { rank: 2, title: '程序员 35 岁危机真的存在吗？', heat: 9870, sentiment: 'neutral' },
      { rank: 3, title: '有哪些值得推荐的好书？', heat: 8650, sentiment: 'positive' },
      { rank: 4, title: '如何看待某政策调整？', heat: 7230, sentiment: 'neutral' },
      { rank: 5, title: '为什么现在的年轻人不愿意结婚了？', heat: 6890, sentiment: 'negative' },
      { rank: 6, title: '有哪些高效的健身方法？', heat: 5200, sentiment: 'positive' },
      { rank: 7, title: '如何评价某电影的剧情？', heat: 4100, sentiment: 'neutral' },
      { rank: 8, title: '互联网大厂的真实工作体验如何？', heat: 3800, sentiment: 'neutral' }
    ],
    baidu: [
      { rank: 1, title: '今天天气怎么样', heat: 9850000, sentiment: 'neutral' },
      { rank: 2, title: '某电视剧全集在线观看', heat: 7620000, sentiment: 'neutral' },
      { rank: 3, title: '健康码最新政策', heat: 6540000, sentiment: 'neutral' },
      { rank: 4, title: '股票行情今日走势', heat: 5430000, sentiment: 'neutral' },
      { rank: 5, title: '某游戏新英雄技能介绍', heat: 4320000, sentiment: 'positive' },
      { rank: 6, title: '火车票预订官网', heat: 3210000, sentiment: 'neutral' },
      { rank: 7, title: '今日油价调整最新消息', heat: 2800000, sentiment: 'neutral' },
      { rank: 8, title: '某明星演唱会门票', heat: 2100000, sentiment: 'positive' }
    ]
  }
  
  // 返回对应平台的数据，如果没有则默认返回微博数据
  return mockDataMap[source] || mockDataMap.weibo
}

/**
 * 生成图表占位数据
 * @param {string} source - 平台标识
 * @returns {Object} 图表数据对象
 */
function generateMockChartData(source) {
  // 模拟生成 24 小时的趋势数据点
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const trendData = hours.map(hour => ({
    time: hour,
    value: Math.floor(Math.random() * 1000000) + 500000
  }))
  
  // 模拟词云数据
  const wordCloudData = [
    { word: '热搜', weight: 100 },
    { word: '舆情', weight: 85 },
    { word: source, weight: 95 },
    { word: '监控', weight: 72 },
    { word: '分析', weight: 68 },
    { word: '数据', weight: 60 },
    { word: '趋势', weight: 55 },
    { word: '话题', weight: 50 }
  ]
  
  // 模拟情感分布数据
  const sentimentData = [
    { name: '正面', value: Math.floor(Math.random() * 40) + 30 },
    { name: '负面', value: Math.floor(Math.random() * 30) + 10 },
    { name: '中性', value: Math.floor(Math.random() * 30) + 20 }
  ]
  
  return {
    trend: trendData,
    wordCloud: wordCloudData,
    sentiment: sentimentData
  }
}

// ============================================
// 5. 数据加载逻辑
// ============================================

/**
 * 加载平台数据的主方法
 * 根据传入的平台 source 参数，更新所有响应式数据
 * 
 * @param {string} source - 平台标识（从路由参数获取）
 */
function loadData(source) {
  // 打印日志，便于调试时观察数据加载时机
  console.log('正在加载平台数据:', source)
  
  // 更新当前平台显示名称（如果没有匹配则显示原值）
  currentPlatform.value = platformNames[source] || source || '未知平台'
  
  // 生成并更新热搜榜单数据
  hotListData.value = generateMockHotList(source)
  
  // 生成并更新图表数据
  chartData.value = generateMockChartData(source)
}

// ============================================
// 6. 生命周期钩子与路由监听
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
 * 
 * 立即执行：{ immediate: false }
 * - 不立即执行，因为 onMounted 已经处理了首次加载
 */
watch(
  // 第一个参数：要监听的响应式数据源（返回 source 参数的函数）
  () => route.params.source,
  
  // 第二个参数：回调函数，当 source 变化时执行
  // newSource 是变化后的新值，oldSource 是变化前的旧值
  (newSource, oldSource) => {
    console.log(`平台切换: ${oldSource} -> ${newSource}`)
    // 调用 loadData 重新加载新平台的数据
    loadData(newSource)
  }
)

// ============================================
// 7. 辅助工具函数
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
      包含：动态标题 + 平台切换提示
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
      
      <!-- 右侧操作区（预留） -->
      <div class="flex gap-2">
        <el-button type="primary" :icon="TrendCharts">
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
            -->
            <el-table
              :data="hotListData"
              stripe
              size="small"
              class="platform-table"
              row-class-name="hover:bg-[#2a2a2a]"
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
                  <!-- 话题标题，hover 时变蓝色 -->
                  <span class="text-gray-200 hover:text-blue-400 cursor-pointer transition">
                    {{ row.title }}
                  </span>
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
        右侧区域：图表占位区（约占 65%）
        使用 flex-[65] 设置 flex-grow 比例为 65
        内部垂直分布两个模块
        ============================================
      -->
      <div class="flex-[65] flex flex-col gap-4">
        
        <!-- 
          ============================================
          右上：热度趋势图表占位
          h-[400px] 固定高度 400px
          ============================================
        -->
        <div class="h-[400px] bg-[#242424] rounded-xl border border-gray-700 flex flex-col">
          <!-- 模块头部 -->
          <div class="px-4 py-3 border-b border-gray-700">
            <h2 class="font-semibold text-white flex items-center gap-2">
              <el-icon class="text-blue-500">
                <TrendCharts />
              </el-icon>
              热度趋势分析
            </h2>
          </div>
          <!-- 图表占位区域 -->
          <div class="flex-1 flex items-center justify-center">
            <!-- 
              占位符样式：
              - 虚线边框：border-dashed border-2
              - 圆角：rounded-lg
              - 背景色：bg-[#1a1a1a]
              - 文字居中显示
            -->
            <div class="w-[90%] h-[85%] border-2 border-dashed border-gray-600 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-3">📈</div>
                <div class="text-gray-500 text-sm">热度趋势图表 (ECharts 待接入)</div>
                <div class="text-gray-600 text-xs mt-2">预计展示 24 小时热度走势曲线</div>
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
          <!-- 图表占位区域 -->
          <div class="flex-1 flex items-center justify-center p-4">
            <!-- 
              占位符：使用 Grid 布局展示两个子模块
              grid-cols-2 两列布局
            -->
            <div class="w-full h-full grid grid-cols-2 gap-4">
              <!-- 左侧：词云图占位 -->
              <div class="border-2 border-dashed border-gray-600 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                <div class="text-center">
                  <div class="text-3xl mb-2">☁️</div>
                  <div class="text-gray-500 text-sm">核心词云图</div>
                  <div class="text-gray-600 text-xs mt-1">(ECharts 待接入)</div>
                </div>
              </div>
              <!-- 右侧：情感分布占位 -->
              <div class="border-2 border-dashed border-gray-600 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                <div class="text-center">
                  <div class="text-3xl mb-2">🥧</div>
                  <div class="text-gray-500 text-sm">情感分布大盘</div>
                  <div class="text-gray-600 text-xs mt-1">(ECharts 待接入)</div>
                </div>
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
</style>
