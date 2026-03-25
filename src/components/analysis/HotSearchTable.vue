<!--
  ============================================
  热搜榜单表格组件 (HotSearchTable)
  ============================================
  
  功能：展示实时热搜榜单，支持单选/多选模式、行点击选中、链接跳转
  
  使用方式：
  <!-- 单选模式（平台页） -->
  <HotSearchTable
    v-model="selectedHotItem"
    selection-mode="single"
    :data="hotListData"
    @row-click="handleRowClick"
    @link-click="openHotSearchUrl"
  />

  <!-- 多选模式（对比页） -->
  <HotSearchTable
    v-model:selected-items="selectedItems"
    selection-mode="multiple"
    :data="hotListData"
    :max-selection="5"
    @selection-change="handleSelectionChange"
  />
-->

<script setup>
import { computed } from 'vue'
import { HotWater } from '@element-plus/icons-vue'

// ============================================
// Props & Emits
// ============================================
const props = defineProps({
  // 热搜列表数据
  data: {
    type: Array,
    default: () => []
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 选择模式: 'single' | 'multiple'
  selectionMode: {
    type: String,
    default: 'single',
    validator: (value) => ['single', 'multiple'].includes(value)
  },
  // 单选模式：当前选中的热搜项（用于高亮）- 支持 v-model
  modelValue: {
    type: Object,
    default: null
  },
  // 多选模式：选中的热搜项数组 - 支持 v-model:selected-items
  selectedItems: {
    type: Array,
    default: () => []
  },
  // 多选模式下最大选择数量
  maxSelection: {
    type: Number,
    default: null
  }
})

const emit = defineEmits([
  'update:modelValue',      // 单选模式 v-model
  'update:selectedItems',   // 多选模式 v-model:selected-items
  'rowClick',               // 行点击事件
  'linkClick',              // 链接点击事件
  'selectionChange'         // 多选模式选择变化事件
])

// ============================================
// 计算属性
// ============================================

// 是否为单选模式
const isSingleMode = computed(() => props.selectionMode === 'single')

// 是否为多选模式
const isMultipleMode = computed(() => props.selectionMode === 'multiple')

// 单选模式：当前选中项（兼容旧版 selectedItem prop 和新的 v-model）
const currentSelectedItem = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

// 多选模式：当前选中项数组
const currentSelectedItems = computed({
  get() {
    return props.selectedItems || []
  },
  set(value) {
    emit('update:selectedItems', value)
    emit('selectionChange', value)
  }
})

// 多选模式：已选中数量
const selectedCount = computed(() => currentSelectedItems.value.length)

// 多选模式：是否已达到最大选择数量
const isMaxReached = computed(() => {
  if (!props.maxSelection) return false
  return selectedCount.value >= props.maxSelection
})

// ============================================
// 辅助函数
// ============================================

/**
 * 获取排名对应的颜色
 * @param {number} rank - 排名
 * @returns {string} 颜色值
 */
function getRankColor(rank) {
  if (rank === 1) return '#ef4444'
  if (rank === 2) return '#f97316'
  if (rank === 3) return '#eab308'
  return '#6b7280'
}

/**
 * 格式化热度值（转换为万/亿单位）
 * @param {number} num - 热度数值
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
 * 获取情感标签样式
 * @param {string} sentiment - 情感类型: positive/negative/neutral
 * @returns {Object} 样式对象
 */
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

/**
 * 获取情感文本
 * @param {string} sentiment - 情感类型
 * @returns {string} 显示文本
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
 * 获取类型标签样式
 * @param {string} typeName - 类型名称
 * @returns {Object} 样式对象
 */
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

/**
 * 检查某项是否被选中（多选模式）
 * @param {Object} row - 行数据
 * @returns {boolean}
 */
function isSelected(row) {
  if (isSingleMode.value) {
    return currentSelectedItem.value?.itemId === row.itemId
  }
  return currentSelectedItems.value.some(item => item.itemId === row.itemId)
}

// ============================================
// 事件处理
// ============================================

/**
 * 处理行点击事件
 * @param {Object} row - 行数据
 */
function handleRowClick(row) {
  if (isSingleMode.value) {
    // 单选模式
    currentSelectedItem.value = row
    emit('rowClick', row)
  } else {
    // 多选模式：切换选中状态
    toggleSelection(row)
  }
}

/**
 * 切换选中状态（多选模式）
 * @param {Object} row - 行数据
 */
function toggleSelection(row) {
  const index = currentSelectedItems.value.findIndex(item => item.itemId === row.itemId)
  let newSelection = [...currentSelectedItems.value]
  
  if (index > -1) {
    // 取消选中
    newSelection.splice(index, 1)
  } else {
    // 检查是否达到最大选择数量
    if (isMaxReached.value) {
      // 可以在这里添加提示，比如使用 ElMessage
      console.warn(`最多只能选择 ${props.maxSelection} 项`)
      return
    }
    // 添加到选中列表
    newSelection.push(row)
  }
  
  currentSelectedItems.value = newSelection
}

/**
 * 处理复选框变化（多选模式）
 * @param {Object} row - 行数据
 * @param {boolean} checked - 是否选中
 */
function handleCheckboxChange(row, checked) {
  const index = currentSelectedItems.value.findIndex(item => item.itemId === row.itemId)
  let newSelection = [...currentSelectedItems.value]
  
  if (checked && index === -1) {
    // 检查是否达到最大选择数量
    if (isMaxReached.value) {
      console.warn(`最多只能选择 ${props.maxSelection} 项`)
      return
    }
    newSelection.push(row)
  } else if (!checked && index > -1) {
    newSelection.splice(index, 1)
  }
  
  currentSelectedItems.value = newSelection
}

/**
 * 处理链接点击事件
 * @param {string} url - 链接地址
 * @param {Event} event - 事件对象
 */
function handleLinkClick(url, event) {
  event.preventDefault()
  event.stopPropagation()
  emit('linkClick', url)
}

/**
 * 清空所有选择（多选模式）
 */
function clearSelection() {
  if (isMultipleMode.value) {
    currentSelectedItems.value = []
  } else {
    currentSelectedItem.value = null
  }
}

/**
 * 全选当前页（多选模式，受 maxSelection 限制）
 */
function selectAll() {
  if (!isMultipleMode.value) return
  
  let availableItems = props.data
  if (props.maxSelection) {
    const remainingSlots = props.maxSelection - selectedCount.value
    // 过滤掉已选中的，然后取剩余槽位数量
    const unselectedItems = props.data.filter(
      row => !currentSelectedItems.value.some(item => item.itemId === row.itemId)
    )
    availableItems = unselectedItems.slice(0, remainingSlots)
  }
  
  const newSelection = [...currentSelectedItems.value, ...availableItems]
  currentSelectedItems.value = newSelection
}

// 暴露方法给父组件
defineExpose({
  clearSelection,
  selectAll,
  isSelected
})
</script>

<template>
  <!-- 卡片容器 -->
  <div class="bg-[#242424] rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden">
    <!-- 卡片头部 -->
    <div class="px-4 py-3 border-b border-gray-700 flex items-center justify-between shrink-0">
      <h2 class="font-semibold text-white flex items-center gap-2">
        <el-icon class="text-red-500">
          <HotWater />
        </el-icon>
        实时热搜榜单
      </h2>
      <div class="flex items-center gap-3">
        <!-- 多选模式：显示选择数量 -->
        <template v-if="isMultipleMode">
          <span class="text-xs" :class="isMaxReached ? 'text-orange-400' : 'text-blue-400'">
            已选 {{ selectedCount }}
            <template v-if="maxSelection">/ {{ maxSelection }}</template>
            项
          </span>
          <!-- 清空按钮 -->
          <button
            v-if="selectedCount > 0"
            @click="clearSelection"
            class="text-xs text-gray-400 hover:text-red-400 transition"
          >
            清空
          </button>
        </template>
        <span class="text-xs text-gray-500">
          {{ data.length }} 条数据
        </span>
      </div>
    </div>
    
    <!-- 表格区域 -->
    <div class="flex-1 overflow-hidden relative">
      <el-table
        :data="data"
        size="small"
        height="100%"
        class="hot-search-table"
        :class="{ 'multiple-mode': isMultipleMode }"
        :row-class-name="({ row }) => isSelected(row) ? 'selected-row' : ''"
        :highlight-current-row="isSingleMode"
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-background="rgba(26, 26, 26, 0.8)"
        @row-click="handleRowClick"
      >
        <!-- 多选模式：复选框列 -->
        <el-table-column
          v-if="isMultipleMode"
          type="selection"
          width="45"
          align="center"
          :selectable="() => !isMaxReached"
        >
          <template #default="{ row }">
            <el-checkbox
              :model-value="isSelected(row)"
              @change="(checked) => handleCheckboxChange(row, checked)"
              @click.stop
              :disabled="isMaxReached && !isSelected(row)"
            />
          </template>
        </el-table-column>
        
        <!-- 排名列 -->
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
        
        <!-- 话题列 -->
        <el-table-column label="话题" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <a
              :href="row.url"
              target="_blank"
              class="text-gray-200 hover:text-blue-400 transition hover:underline"
              @click.prevent="handleLinkClick(row.url, $event)"
            >
              {{ row.title }}
            </a>
          </template>
        </el-table-column>
        
        <!-- 热度列 -->
        <el-table-column label="热度" width="80" align="right">
          <template #default="{ row }">
            <span class="text-orange-400 font-medium">
              {{ formatHeat(row.heat) }}
            </span>
          </template>
        </el-table-column>
        
        <!-- 类型列 -->
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
        
        <!-- 情感列 -->
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
</template>

<style scoped>
/* 表格样式 */
:deep(.hot-search-table) {
  background-color: transparent;
  width: 100% !important;
}

/* 表格主体区域 - 添加自定义滚动条 */
:deep(.hot-search-table .el-table__body-wrapper) {
  background-color: transparent;
  scrollbar-width: thin;
  scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
}

/* Webkit 滚动条样式 */
:deep(.hot-search-table .el-table__body-wrapper::-webkit-scrollbar) {
  width: 4px;
  height: 0;
  background-color: transparent;
}

:deep(.hot-search-table .el-table__body-wrapper::-webkit-scrollbar-track) {
  background-color: transparent;
}

:deep(.hot-search-table .el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background-color: rgba(75, 85, 99, 0.3);
  border-radius: 2px;
}

:deep(.hot-search-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(107, 114, 128, 0.5);
}

/* 固定表头样式 */
:deep(.hot-search-table .el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 表格头部 */
:deep(.hot-search-table .el-table__header-wrapper th) {
  background-color: #1e1e1e !important;
  color: #9ca3af;
  font-weight: 600;
  border-bottom: 1px solid #374151;
}

/* 表格行 */
:deep(.hot-search-table .el-table__row) {
  background-color: transparent;
}

:deep(.hot-search-table .el-table__row:hover > td) {
  background-color: #2a2a2a !important;
}

/* 单选模式：当前行高亮 */
:deep(.hot-search-table .el-table__row.current-row > td) {
  background-color: #3b3b3b !important;
}

/* 多选模式：选中行高亮 */
:deep(.hot-search-table.multiple-mode .el-table__row.selected-row > td) {
  background-color: rgba(59, 130, 246, 0.15) !important;
}

:deep(.hot-search-table.multiple-mode .el-table__row.selected-row:hover > td) {
  background-color: rgba(59, 130, 246, 0.25) !important;
}

:deep(.hot-search-table td) {
  background-color: transparent;
  border-bottom: 1px solid #2a2a2a;
}

/* 最后一行样式 */
:deep(.hot-search-table .el-table__row:last-child td) {
  border-bottom: none;
}

/* 最后一行第一个单元格左下角圆角 */
:deep(.hot-search-table .el-table__row:last-child td:first-child) {
  border-bottom-left-radius: 12px;
}

/* 最后一行最后一个单元格右下角圆角 */
:deep(.hot-search-table .el-table__row:last-child td:last-child) {
  border-bottom-right-radius: 12px;
}

/* 复选框样式调整 */
:deep(.hot-search-table .el-checkbox__inner) {
  background-color: transparent;
  border-color: #6b7280;
}

:deep(.hot-search-table .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

:deep(.hot-search-table .el-checkbox__input.is-disabled .el-checkbox__inner) {
  background-color: #374151;
  border-color: #4b5563;
}

/* 禁用状态的复选框 */
:deep(.hot-search-table .el-checkbox__input.is-disabled.is-checked .el-checkbox__inner) {
  background-color: #1e3a5f;
  border-color: #1e3a5f;
}
</style>
