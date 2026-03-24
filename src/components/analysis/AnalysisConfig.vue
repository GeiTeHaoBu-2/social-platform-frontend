<!--
  ============================================
  分析配置组件 (AnalysisConfig)
  ============================================
  
  功能：配置展示哪些分析组件，支持勾选控制
  
  使用方式：
  <AnalysisConfig
    v-model="config"
    @change="handleConfigChange"
  />
  
  配置对象格式：
  {
    trend: true,      // 趋势分析
    type: true,       // 类型分析
    sentiment: true   // 情感分析
  }
-->

<script setup>
import { ref, computed } from 'vue'
import { ArrowDown, TrendCharts, ChatDotRound, Collection } from '@element-plus/icons-vue'

// ============================================
// Props & Emits
// ============================================
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      trend: true,
      type: true,
      sentiment: true
    })
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// ============================================
// 配置项定义
// ============================================
const analysisOptions = [
  {
    key: 'trend',
    label: '趋势分析',
    icon: TrendCharts,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    key: 'type',
    label: '类型分析',
    icon: Collection,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    key: 'sentiment',
    label: '情感分析',
    icon: ChatDotRound,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  }
]

// ============================================
// 计算属性
// ============================================
const config = computed({
  get: () => ({
    trend: true,
    type: true,
    sentiment: true,
    ...props.modelValue
  }),
  set: (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  }
})

// 已启用的分析项数量
const enabledCount = computed(() => {
  return Object.values(config.value).filter(Boolean).length
})

// ============================================
// 方法
// ============================================
function handleToggle(key) {
  const newConfig = {
    ...config.value,
    [key]: !config.value[key]
  }
  config.value = newConfig
}

function handleSelectAll() {
  config.value = {
    trend: true,
    type: true,
    sentiment: true
  }
}

function handleClearAll() {
  config.value = {
    trend: false,
    type: false,
    sentiment: false
  }
}
</script>

<template>
  <el-dropdown trigger="click" placement="bottom-start" :hide-on-click="false">
    <!-- 触发按钮 -->
    <button
      class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 bg-[#27272A] hover:bg-[#323238] hover:border-gray-500 transition-all duration-200"
    >
      <el-icon><ArrowDown /></el-icon>
      <span>展示内容</span>
      <span class="ml-1 px-1.5 py-0.5 text-xs bg-[#7C3AED] text-white rounded">
        {{ enabledCount }}
      </span>
    </button>
    
    <!-- 下拉菜单内容 -->
    <template #dropdown>
      <div class="bg-[#27272A] border border-gray-700 rounded-lg p-3 min-w-[200px]">
        <!-- 标题 -->
        <div class="text-xs text-gray-500 font-medium mb-3 px-1">
          选择要展示的分析模块
        </div>
        
        <!-- 选项列表 -->
        <div class="space-y-1">
          <div
            v-for="option in analysisOptions"
            :key="option.key"
            @click="handleToggle(option.key)"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200"
            :class="config[option.key] 
              ? 'bg-[#323238] hover:bg-[#3a3a40]' 
              : 'hover:bg-[#2a2a30]'"
          >
            <!-- 复选框 -->
            <div
              class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
              :class="config[option.key]
                ? 'bg-[#7C3AED] border-[#7C3AED]'
                : 'border-gray-500'"
            >
              <el-icon v-if="config[option.key]" class="text-white text-xs">
                <Check />
              </el-icon>
            </div>
            
            <!-- 图标 -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center"
              :class="option.bgColor"
            >
              <el-icon :class="option.color">
                <component :is="option.icon" />
              </el-icon>
            </div>
            
            <!-- 标签 -->
            <span
              class="text-sm font-medium flex-1"
              :class="config[option.key] ? 'text-gray-200' : 'text-gray-500'"
            >
              {{ option.label }}
            </span>
            
            <!-- 状态指示 -->
            <div
              v-if="config[option.key]"
              class="w-1.5 h-1.5 rounded-full bg-[#7C3AED]"
            ></div>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="border-t border-gray-700 my-3"></div>
        
        <!-- 快捷操作 -->
        <div class="flex gap-2 px-1">
          <button
            @click="handleSelectAll"
            class="flex-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-[#323238] rounded transition-colors"
          >
            全选
          </button>
          <button
            @click="handleClearAll"
            class="flex-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-[#323238] rounded transition-colors"
          >
            清空
          </button>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script>
import { Check } from '@element-plus/icons-vue'
export { Check }
</script>
