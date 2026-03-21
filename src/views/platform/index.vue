<!--
  ============================================
  平台数据看板 (Platform Dashboard)
  ============================================
  
  路由路径: /platform/:source (weibo | zhihu | baidu)
  
  功能概述：
  1. 动态路由监听：根据 URL 参数切换平台数据
  2. 真实 API 数据：对接后端热搜接口
  3. 响应式布局：左侧榜单 + 右侧图表占位
  
  技术要点：
  - useRoute: 获取动态路由参数
  - watch: 监听路由变化重新加载数据
  - onMounted: 页面挂载时首次加载
  - API 数据映射：将后端返回格式转换为组件展示格式
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

// 真实 API 接口
import { getCurrentHotSearchApi, getHotSearchTrendApi } from '@/api/hotsearch.js'

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
// 5. 生命周期钩子与路由监听
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
 */
watch(
  // 第一个参数：要监听的响应式数据源（返回 source 参数的函数）
  () => route.params.source,
  
  // 第二个参数：回调函数，当 source 变化时执行
  // newSource 是变化后的新值，oldSource 是变化前的旧值
  async (newSource, oldSource) => {
    console.log(`平台切换: ${oldSource} -> ${newSource}`)
    // 调用 loadData 重新加载新平台的数据
    await loadData(newSource)
  }
)

// ============================================
// 6. 辅助工具函数
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
    '国际': '',
    '国内': ''
  }
  return typeMap[typeName] || ''
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
            -->
            <el-table
              :data="hotListData"
              stripe
              size="small"
              class="platform-table"
              row-class-name="hover:bg-[#2a2a2a]"
              v-loading="loading"
              element-loading-text="加载中..."
              element-loading-background="rgba(26, 26, 26, 0.8)"
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
