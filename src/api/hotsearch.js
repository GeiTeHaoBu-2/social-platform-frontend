/**
 * ============================================
 * 大屏热搜数据相关 API 接口模块
 * ============================================
 * 
 * 本模块职责：
 * - 封装大屏展示所需的全部数据接口
 * - 包括实时榜单、趋势分析、情感统计等
 * 
 * 数据流向：
 * Flink 实时计算 -> Kafka -> Spring Boot API -> 本模块 -> Vue 组件
 */

import request from '@/utils/request.js'

/**
 * ============================================
 * 1. 获取当前热搜榜单
 * ============================================
 * 
 * 接口：GET /api/v1/hotsearch/current
 * 用途：获取微博实时热搜 Top 50 榜单
 * 
 * @param {Object} params - 查询参数
 * @param {number} [params.limit=50] - 返回条数，默认 50
 * @param {string} [params.category='all'] - 分类筛选：all(全部) | ent(娱乐) | soc(社会) | tech(科技)
 * @returns {Promise<Array>} 热搜条目数组
 * 
 * 预期响应：
 * [
 *   {
 *     rank: 1,                    // 排名
 *     title: "某某明星结婚",       // 热搜标题
 *     heat: 5234123,              // 热度值
 *     tag: "爆",                   // 标签：爆/热/新/荐
 *     category: "ent",            // 分类
 *     url: "https://s.weibo.com/...",
 *     createTime: "2024-03-17T15:30:00"
 *   },
 *   ...
 * ]
 */
export function getCurrentHotSearchApi(params = {}) {
  return request({
    url: '/api/v1/hotsearch/current',
    method: 'GET',
    params: {
      limit: 50,
      category: 'all',
      ...params  // 允许调用方覆盖默认参数
    }
  })
}

/**
 * ============================================
 * 2. 获取热搜趋势数据
 * ============================================
 * 
 * 接口：GET /api/v1/hotsearch/trend
 * 用途：获取指定热搜条目的历史热度趋势（用于趋势图）
 * 
 * @param {Object} params - 查询参数
 * @param {string} params.title - 热搜标题（唯一标识）
 * @param {number} [params.hours=24] - 查询近 N 小时的数据
 * @returns {Promise<Array>} 趋势数据点数组
 * 
 * 预期响应：
 * [
 *   {
 *     timestamp: "2024-03-16T15:00:00",
 *     heat: 1234567,
 *     rank: 5
 *   },
 *   {
 *     timestamp: "2024-03-16T16:00:00",
 *     heat: 2345678,
 *     rank: 3
 *   }
 * ]
 * 
 * 应用场景：ECharts 折线图展示热度随时间变化
 */
export function getHotSearchTrendApi(params) {
  return request({
    url: '/api/v1/hotsearch/trend',
    method: 'GET',
    params
  })
}

/**
 * ============================================
 * 3. 热搜对比分析
 * ============================================
 * 
 * 接口：GET /api/v1/hotsearch/compare
 * 用途：对比多个热搜条目的热度走势
 * 
 * @param {Object} params - 查询参数
 * @param {string} params.titles - 要对比的热搜标题，逗号分隔，如 "话题A,话题B,话题C"
 * @param {number} [params.days=7] - 查询近 N 天的数据
 * @returns {Promise<Object>} 多维度对比数据
 * 
 * 预期响应：
 * {
 *   series: [
 *     { name: "话题A", data: [...] },
 *     { name: "话题B", data: [...] }
 *   ],
 *   categories: ["03-10", "03-11", "03-12", ...]  // X轴时间标签
 * }
 */
export function compareHotSearchApi(params) {
  return request({
    url: '/api/v1/hotsearch/compare',
    method: 'GET',
    params
  })
}

/**
 * ============================================
 * 4. 分页查询历史热搜
 * ============================================
 * 
 * 接口：GET /api/v1/hotsearch/page
 * 用途：分页查询历史热搜记录，支持搜索和筛选
 * 
 * @param {Object} params - 查询参数
 * @param {number} [params.pageNum=1] - 当前页码
 * @param {number} [params.pageSize=20] - 每页条数
 * @param {string} [params.keyword] - 关键词搜索（标题模糊匹配）
 * @param {string} [params.startDate] - 开始日期，格式：2024-03-01
 * @param {string} [params.endDate] - 结束日期
 * @param {string} [params.category] - 分类筛选
 * @returns {Promise<Object>} 分页结果
 * 
 * 预期响应：
 * {
 *   total: 1523,          // 总记录数
 *   pages: 77,            // 总页数
 *   pageNum: 1,           // 当前页
 *   pageSize: 20,         // 每页大小
 *   list: [               // 数据列表
 *     { id: 1, title: "...", heat: 1234567, ... },
 *     ...
 *   ]
 * }
 * 
 * 应用场景：热搜历史记录表格、带搜索条件的分页列表
 */
export function getHotSearchPageApi(params = {}) {
  return request({
    url: '/api/v1/hotsearch/page',
    method: 'GET',
    params: {
      pageNum: 1,
      pageSize: 20,
      ...params
    }
  })
}

/**
 * ============================================
 * 5. 获取情感分析统计
 * ============================================
 * 
 * 接口：GET /api/v1/hotsearch/sentiment-stats
 * 用途：获取指定热搜的情感分析统计数据（正面/负面/中性占比）
 * 
 * @param {Object} params - 查询参数
 * @param {string} params.title - 热搜标题
 * @returns {Promise<Object>} 情感统计数据
 * 
 * 预期响应：
 * {
 *   title: "某某话题",
 *   total: 10000,           // 分析的微博总数
 *   sentiment: {
 *     positive: 65.5,       // 正面情感占比 %
 *     negative: 20.3,       // 负面情感占比 %
 *     neutral: 14.2         // 中性情感占比 %
 *   },
 *   keywords: [             // 高频关键词
 *     { word: "支持", count: 523 },
 *     { word: "反对", count: 234 }
 *   ],
 *   trend: [                // 情感趋势（可选）
 *     { time: "08:00", positive: 60, negative: 25 },
 *     { time: "12:00", positive: 70, negative: 15 }
 *   ]
 * }
 * 
 * 应用场景：
 * - 饼图展示情感占比
 * - 词云展示高频关键词
 * - 折线图展示情感走势
 */
export function getSentimentStatsApi(params) {
  return request({
    url: '/api/v1/hotsearch/sentiment-stats',
    method: 'GET',
    params
  })
}

/**
 * ============================================
 * 6. 获取舆情预测数据（可选扩展）
 * ============================================
 * 
 * 接口：GET /api/v1/hotsearch/prediction
 * 用途：获取 Flink 预测模型的舆情走向预测
 * 
 * @param {Object} params
 * @param {string} params.title - 热搜标题
 * @param {number} [params.hours=6] - 预测未来 N 小时
 * @returns {Promise<Object>} 预测结果
 * 
 * 预期响应：
 * {
 *   title: "某某话题",
 *   currentHeat: 5000000,
 *   prediction: [
 *     { time: "16:00", heat: 5200000, confidence: 0.85 },
 *     { time: "17:00", heat: 4800000, confidence: 0.72 },
 *     { time: "18:00", heat: 4500000, confidence: 0.65 }
 *   ],
 *   trend: "downward"  // upward(上升) | stable(平稳) | downward(下降)
 * }
 */
export function getPredictionApi(params) {
  return request({
    url: '/api/v1/hotsearch/prediction',
    method: 'GET',
    params
  })
}

/**
 * ============================================
 * 7. 获取词云数据（可选扩展）
 * ============================================
 * 
 * 接口：GET /api/v1/hotsearch/wordcloud
 * 用途：获取指定热搜的高频关键词，用于词云展示
 * 
 * @param {Object} params
 * @param {string} params.title - 热搜标题
 * @param {number} [params.limit=100] - 返回关键词数量
 * @returns {Promise<Array>} 关键词权重数组
 * 
 * 预期响应：
 * [
 *   { word: "中国", weight: 100 },
 *   { word: "发展", weight: 85 },
 *   { word: "经济", weight: 72 }
 * ]
 */
export function getWordCloudApi(params) {
  return request({
    url: '/api/v1/hotsearch/wordcloud',
    method: 'GET',
    params: {
      limit: 100,
      ...params
    }
  })
}
