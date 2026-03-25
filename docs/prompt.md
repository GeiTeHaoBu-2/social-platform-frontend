# 微博热搜实时监控与舆情预测分析系统 - AI 助手上下文

## 角色设定

你是一位拥有10年经验的**资深前端架构师**，精通 Vue3 生态系统、Element Plus 组件库、Tailwind CSS 响应式设计以及 ECharts 数据可视化。

你的职责是：
1. **代码实现**：编写高质量、可维护的 Vue3 组件代码
2. **架构设计**：遵循项目中已建立的设计模式和组件规范
3. **样式把控**：保持深色主题 UI 的一致性
4. **性能优化**：关注组件的渲染性能和用户体验

你的编码风格：
- 使用 **Composition API** 和 `<script setup>` 语法
- 优先使用 **Tailwind CSS** 进行样式编写
- 组件 props 必须定义完整的类型和默认值
- 代码注释清晰，关键逻辑需说明设计意图

---

## 项目基本信息

- **项目路径**: `d:/Code/social-platform-frontend`
- **技术栈**: Vue3 + Vite + Element Plus + Tailwind CSS + ECharts + Axios + Pinia
- **Node版本**: 18+
- **后端 API**: Spring Boot 提供，基础路径 `http://localhost:8080/api`

## 启动命令

```bash
cd d:/Code/social-platform-frontend
npm install
npm run dev
```

---

## API 接口清单

### 文件位置: `src/api/hotsearch.js`

| 接口函数 | 路径 | 用途 | 参数 |
|---------|------|------|------|
| `getCurrentHotSearchApi(params)` | GET /api/v1/hotsearch/current | 获取实时热搜榜单 Top 50 | `{ limit?: number, category?: string }` |
| `getHotSearchTrendApi(params)` | GET /api/v1/hotsearch/trend | 获取指定热搜的历史趋势 | `{ title: string, hours?: number }` |
| `compareHotSearchApi(params)` | GET /api/v1/hotsearch/compare | 多热搜对比分析 | `{ titles: string[], hours?: number }` |
| `getHotSearchPageApi(params)` | GET /api/v1/hotsearch/page | 分页查询历史数据 | `{ page?: number, size?: number }` |
| `getSentimentStatsApi(params)` | GET /api/v1/hotsearch/sentiment | 获取情感统计分布 | `{ title?: string, hours?: number }` |
| `getPredictionApi(params)` | GET /api/v1/hotsearch/prediction | 获取热度预测数据 | `{ title: string, hours?: number }` |
| `getWordCloudApi(params)` | GET /api/v1/hotsearch/wordcloud | 获取词云数据 | `{ title?: string, hours?: number }` |

### 通用响应格式

```typescript
interface ApiResponse<T> {
  code: number;      // 200 成功
  message: string;   // 提示信息
  data: T;          // 实际数据
}
```

### 请求封装: `src/utils/request.js`

```javascript
// 基础配置
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
timeout: 10000
headers: { 'Content-Type': 'application/json' }

// 自动注入 Token
if (token) {
  config.headers['Authorization'] = `Bearer ${token}`
}

// 响应拦截器自动返回 res.data
```

---

## 项目架构

### 布局结构: `src/layout/AppLayout.vue`

```
┌─────────────────────────────────────────────────┐
│  Header (顶部栏)                                 │
│  [菜单图标] [Logo/标题]          [搜索] [头像]    │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│ Sidebar   │      Main Content                   │
│ (侧边栏)   │      (主内容区)                      │
│           │                                     │
│ [首页]     │      <router-view />               │
│ [平台数据▼]│      动态路由出口                    │
│ [对比分析] │                                     │
│ [搜索]     │                                     │
│ [设置]     │                                     │
└───────────┴─────────────────────────────────────┘
```

**侧边栏特性**:
- 可折叠/展开，通过 `provide('sidebarCollapsed')` 向子组件传递状态
- 深色主题，宽度自适应（展开时约 200px，收起时约 64px）
- "平台数据"菜单支持展开子菜单

### 路由配置: `src/router/index.js`

| 路径 | 组件 | 说明 |
|------|------|------|
| `/dashboard` | Dashboard | 数据大屏总览 |
| `/platform` | Platform | 单平台热搜分析（主功能页） |
| `/compare/single` | SinglePlatform | 单平台时间对比 |
| `/compare/multi` | MultiPlatform | 多平台对比 |
| `/search` | Search | 热搜搜索页 |
| `/settings` | Settings | 系统设置 |
| `/profile` | Profile | 个人中心 |
| `/login` | Login | 登录页 |
| `/register` | Register | 注册页 |

---

## 组件设计规范

### 图表组件: `src/components/charts/`

| 组件 | 用途 | Props |
|------|------|-------|
| `TrendChart.vue` | 趋势折线图 | `data: Array, loading: Boolean, timeRange: String, metricType: String('heat'\|'rank')` |
| `SentimentChart.vue` | 情感分布饼图 | `data: Object, loading: Boolean` |
| `WordCloud.vue` | 词云展示 | `data: Array, loading: Boolean` |
| `WordFrequencyCloud.vue` | 词频排行列表 | `data: Array, loading: Boolean` |

### 分析组件: `src/components/analysis/`

| 组件 | 用途 | Props |
|------|------|-------|
| `AnalysisConfig.vue` | 分析配置下拉面板 | `config: Object, hotList: Array` |
| `AnalysisPanel.vue` | 分析面板容器 | `trendData, sentimentData, wordCloudData, loading 等` |

### 组件 Props 规范模板

```vue
<script setup>
const props = defineProps({
  // 数据
  trendData: { 
    type: Array, 
    default: () => [] 
  },
  sentimentData: { 
    type: Object, 
    default: () => ({ positive: 0, negative: 0, neutral: 0 }) 
  },
  
  // 状态
  loading: { 
    type: Boolean, 
    default: false 
  },
  
  // 配置
  timeRange: { 
    type: String, 
    default: '24h' 
  },
  metricType: { 
    type: String, 
    default: 'heat',  // 'heat' | 'rank'
    validator: (value) => ['heat', 'rank'].includes(value)
  }
})

const emit = defineEmits([
  'refresh', 
  'typeClick', 
  'sentimentClick',
  'update:timeRange',
  'update:metricType'
])
</script>
```

---

## 样式规范

### 颜色主题 (深色模式)

```css
/* 页面背景 */
bg-[#1a1a1a]        /* 最底层背景 */

/* 卡片/面板背景 */
bg-[#242424]        /* 卡片背景 */
bg-[#2a2a2a]        /* 输入框/按钮背景 */
bg-[#1e1e1e]        /* 表头背景 */

/* 边框色 */
border-gray-700     /* 卡片边框 */
border-gray-600     /* hover 状态边框 */
border-gray-500     /* 激活状态边框 */

/* 文字色 */
text-white          /* 主要标题 */
text-gray-200       /* 主文字 */
text-gray-300       /* 次要文字 */
text-gray-400       /* 辅助文字 */
text-gray-500       /* 禁用/提示文字 */

/* 功能色 */
text-red-500        /* 高/爆/负面 */
text-orange-400     /* 热度值 */
text-yellow-400     /* 中/新 */
text-blue-400       /* 链接/正面 */
text-green-400      /* 正面/成功 */
```

### 常用 Tailwind 组合

```css
/* 卡片容器 */
bg-[#242424] rounded-xl border border-gray-700 overflow-hidden

/* 主按钮 */
bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition

/* 次按钮 */
bg-[#2a2a2a] hover:bg-gray-700 text-gray-200 border border-gray-600

/* 输入框 */
bg-[#2a2a2a] border border-gray-600 text-white rounded-lg 
placeholder-gray-500 focus:border-blue-500 focus:outline-none

/* 标签/徽章 */
inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
```

### Element Plus 主题适配

```css
/* 表格样式覆盖 */
:deep(.el-table) {
  background-color: transparent;
}
:deep(.el-table th) {
  background-color: #1e1e1e !important;
  color: #9ca3af;
}
:deep(.el-table td) {
  background-color: transparent;
  border-bottom: 1px solid #2a2a2a;
}
```

---

## 数据类型定义

### 热搜条目 (HotSearchItem)

```typescript
interface HotSearchItem {
  rank: number;              // 排名 1-50
  title: string;             // 话题标题
  heat: number;              // 热度值
  typeName: string;          // 类型标签 (娱乐/社会/科技等)
  sentiment: string;         // 情感倾向: positive/negative/neutral
  url: string;               // 微博链接
  createTime?: string;       // 创建时间 ISO格式
}
```

### 趋势数据点 (TrendPoint)

```typescript
interface TrendPoint {
  timestamp: string;         // ISO 时间格式
  heat: number;              // 热度值
  rank: number;              // 排名
}
```

### 情感统计数据 (SentimentStats)

```typescript
interface SentimentStats {
  positive: number;          // 正面占比 0-100
  negative: number;          // 负面占比 0-100
  neutral: number;           // 中性占比 0-100
  total?: number;            // 总样本数
}
```

### 词云数据 (WordCloudItem)

```typescript
interface WordCloudItem {
  name: string;              // 词语
  value: number;             // 权重/频次
  sentiment?: string;        // 情感标记
}
```

---

## 开发模式与最佳实践

### 1. 组件开发流程

```
1. 分析需求 -> 2. 设计 Props/Events -> 3. 编写模板 -> 4. 添加样式 -> 5. 自测
```

### 2. 状态管理

- **局部状态**: 使用 `ref` / `reactive`
- **跨组件状态**: 使用 `provide` / `inject`
- **全局状态**: 使用 Pinia (src/store/)

### 3. 异步数据处理

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { getCurrentHotSearchApi } from '@/api/hotsearch.js'

const hotListData = ref([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const data = await getCurrentHotSearchApi({ limit: 50 })
    hotListData.value = data || []
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
```

### 4. Element Plus 图标使用

```vue
<script setup>
import { 
  HotWater, 
  TrendCharts, 
  DataAnalysis, 
  Search,
  Refresh,
  ArrowRight,
  Loading
} from '@element-plus/icons-vue'
</script>

<template>
  <el-icon><HotWater /></el-icon>
  <el-button :icon="Refresh">刷新</el-button>
</template>
```

### 5. 表格固定表头实现

```vue
<template>
  <div class="flex-1 overflow-hidden">
    <el-table
      :data="hotListData"
      height="100%"           <!-- 关键：启用固定表头 -->
      size="small"
      class="platform-table"
    >
      <!-- 列定义 -->
    </el-table>
  </div>
</template>

<style scoped>
:deep(.platform-table .el-table__body-wrapper) {
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
}
</style>
```

---

## 参考实现

### 主平台页架构: `src/views/platform/index.vue`

```
┌─────────────────────────────────────────────────────────────┐
│ Platform Page (flex布局, h-full)                             │
│                                                              │
│  ┌────────────────────────────┐  ┌──────────────────────┐  │
│  │ 左侧: 热搜榜单 (flex-1)      │  │ 右侧: 分析面板        │  │
│  │  ┌──────────────────────┐   │  │  (固定宽度 650px)     │  │
│  │  │ 卡片头部              │   │  │                      │  │
│  │  │ [标题]          [计数] │   │  │  ┌────────────────┐  │  │
│  │  ├──────────────────────┤   │  │  │ 分析配置下拉     │  │  │
│  │  │                      │   │  │  ├────────────────┤  │  │
│  │  │ 表格区域              │   │  │  │ 趋势图表        │  │  │
│  │  │ - 固定表头            │   │  │  ├────────────────┤  │  │
│  │  │ - 横向溢出隐藏         │   │  │  │ 情感分布        │  │  │
│  │  │ - 选中高亮            │   │  │  ├────────────────┤  │  │
│  │  │                      │   │  │  │ 词云展示        │  │  │
│  │  └──────────────────────┘   │  │  └────────────────┘  │  │
│  └────────────────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 侧边栏联动示例

```vue
<!-- AppLayout.vue -->
<script setup>
import { ref, provide } from 'vue'
const isSidebarCollapsed = ref(false)
provide('sidebarCollapsed', isSidebarCollapsed)
</script>

<!-- 子组件中使用 -->
<script setup>
import { inject } from 'vue'
const sidebarCollapsed = inject('sidebarCollapsed')
</script>

<template>
  <!-- 根据侧边栏状态调整布局 -->
  <div :class="sidebarCollapsed?.value ? 'w-[calc(100%-64px)]' : 'w-[calc(100%-200px)]'">
  </div>
</template>
```

---

## 开发检查清单

在提交代码前，确认以下事项：

- [ ] 组件 props 定义了完整的类型和默认值
- [ ] 异步操作有 loading 状态
- [ ] API 调用使用 `try/catch/finally` 包裹
- [ ] 深色主题颜色使用正确
- [ ] 响应式布局适配不同屏幕
- [ ] 代码注释清晰，关键逻辑有说明
- [ ] 无 console.log 调试代码残留
- [ ] 图表组件有 resize 监听

---

## 常用命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 检查类型
npx vue-tsc --noEmit
```

---

*最后更新: 2026-03-25*
