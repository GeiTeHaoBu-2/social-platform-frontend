# 微博热搜实时监控与舆情预测分析系统 - API接口文档

**版本**: v1.0.0  
**文档更新时间**: 2026-03-21  
**后端服务地址**: `http://localhost:8080`

---

## 📋 目录

1. [通用说明](#通用说明)
2. [认证接口](#认证接口-auth)
3. [用户接口](#用户接口-user)
4. [热搜接口](#热搜接口-hotsearch)
5. [错误码说明](#错误码说明)
6. [数据模型](#数据模型)
7. [变更记录](#变更记录)

---

## 通用说明

### 1. 接口规范

| 项目 | 说明 |
|------|------|
| **协议** | HTTP/HTTPS |
| **数据格式** | JSON |
| **字符编码** | UTF-8 |
| **Content-Type** | `application/json` |

### 2. 统一响应格式

所有接口返回统一格式的响应：

```json
{
  "code": 200,          // 状态码，200表示成功
  "message": "success", // 提示信息
  "data": {}            // 业务数据，类型根据接口不同而变化
}
```

### 3. 认证方式

- **除登录/注册外**，所有接口需在请求头携带 JWT Token：
  ```
  Authorization: Bearer <token>
  ```

---

## 认证接口 (Auth)

基础路径：`/api/v1/auth`

---

### 1. 发送验证码

**接口说明**：发送邮箱验证码，用于用户注册/登录

```http
GET /api/v1/auth/send-code
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| email | String | 是 | 目标邮箱地址 | user@example.com |

#### 请求示例

```bash
curl -X GET "http://localhost:8080/api/v1/auth/send-code?email=user@example.com"
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "验证码已发送至您的邮箱，请注意查收",
  "data": null
}
```

**发送频繁 (429)**:
```json
{
  "code": 429,
  "message": "发送过于频繁，请 45 秒后再试",
  "data": null
}
```

**参数错误 (400)**:
```json
{
  "code": 400,
  "message": "邮箱格式不正确",
  "data": null
}
```

#### 业务说明
- 防刷机制：60秒内同一邮箱只能发送一次
- 验证码有效期：5分钟（存储在Redis中）

---

### 2. 用户注册

**接口说明**：用户注册（账户+密码+邮箱验证码）

```http
POST /api/v1/auth/register
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 限制 |
|--------|------|------|------|------|
| account | String | 是 | 登录账户 | 5-20位，仅数字+英文 |
| password | String | 是 | 登录密码 | 8-20位，必须包含大小写字母、数字、特殊符号 |
| nickname | String | 是 | 用户昵称 | 2-20位字符 |
| email | String | 是 | 邮箱地址 | 标准邮箱格式 |
| code | String | 是 | 邮箱验证码 | 6位数字 |

#### 请求示例

```bash
curl -X POST "http://localhost:8080/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "zhangsan123",
    "password": "Pass123!@#",
    "nickname": "张三",
    "email": "zhangsan@example.com",
    "code": "123456"
  }'
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "userId": 1,
    "account": "zhangsan123",
    "nickname": "张三",
    "email": "zhangsan@example.com",
    "roleType": 1,
    "registerTime": "2026-03-21T10:00:00"
  }
}
```

**账户已存在 (400)**:
```json
{
  "code": 400,
  "message": "该账户已被注册",
  "data": null
}
```

**验证码错误 (400)**:
```json
{
  "code": 400,
  "message": "验证码错误或已过期",
  "data": null
}
```

**参数校验失败 (400)**:
```json
{
  "code": 400,
  "message": "账户只能包含英文字母和数字",
  "data": null
}
```

#### 业务说明
- 默认角色：客户（roleType=1）
- 默认性别：未知（gender=0）
- 首次注册不分配头像，前端显示默认头像
- 注册成功后需使用密码登录获取 Token

---

### 3. 用户登录（验证码方式）

**接口说明**：邮箱验证码登录，首次登录自动注册

```http
POST /api/v1/auth/login
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| email | String | 是 | 邮箱地址 | user@example.com |
| code | String | 是 | 6位验证码 | 123456 |

#### 请求示例

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 604800,
    "userInfo": {
      "id": 1,
      "username": "user_1234",
      "email": "user@example.com",
      "nickname": "用户893452",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=user_1234",
      "gender": 0,
      "createdAt": "2026-03-21T10:00:00"
    }
  }
}
```

**验证码错误 (401)**:
```json
{
  "code": 401,
  "message": "验证码错误或已过期",
  "data": null
}
```

#### 业务说明
- 首次登录自动注册：如果邮箱未注册，系统自动创建用户
- 默认用户名：邮箱前缀 + 4位随机数字
- 默认昵称：用户 + 6位随机数字
- Token 有效期：7天

---

### 4. 用户登录（密码方式）

**接口说明**：账户/邮箱 + 密码登录

```http
POST /api/v1/auth/login/password
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| account | String | 是 | 账户名或邮箱 | zhangsan123 或 zhangsan@example.com |
| password | String | 是 | 登录密码 | Pass123!@# |

#### 请求示例

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login/password" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "zhangsan123",
    "password": "Pass123!@#"
  }'
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 604800,
    "userInfo": {
      "id": 1,
      "username": "zhangsan123",
      "email": "zhangsan@example.com",
      "nickname": "张三",
      "avatar": null,
      "gender": 0,
      "createdAt": "2026-03-21T10:00:00"
    }
  }
}
```

**账户或密码错误 (401)**:
```json
{
  "code": 401,
  "message": "账户或密码错误",
  "data": null
}
```

#### 业务说明
- 支持账户名或邮箱作为登录凭证
- 系统自动识别邮箱格式（包含@符号）
- 为安全考虑，账户不存在和密码错误返回相同提示

---

### 5. 检查账户可用性

**接口说明**：检查账户名是否已被注册

```http
GET /api/v1/auth/check-account
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| account | String | 是 | 待检查的账户名 | zhangsan123 |

#### 请求示例

```bash
curl -X GET "http://localhost:8080/api/v1/auth/check-account?account=zhangsan123"
```

#### 响应示例

**可用 (200)**:
```json
{
  "code": 200,
  "message": "该账户可用",
  "data": true
}
```

**已被占用 (200)**:
```json
{
  "code": 200,
  "message": "该账户已被注册",
  "data": false
}
```

---

### 6. 健康检查

**接口说明**：检查认证服务是否正常运行

```http
GET /api/v1/auth/health
```

#### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": "Auth service is running"
}
```

---

## 用户接口 (User)

基础路径：`/api/v1/user`

**权限要求**：所有接口需要登录（携带JWT Token）

---

### 1. 获取当前用户信息

**接口说明**：获取当前登录用户的个人信息（脱敏）

```http
GET /api/v1/user/info
```

#### 请求头

```
Authorization: Bearer <jwt-token>
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "获取用户信息成功",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "管理员",
    "avatar": "https://example.com/avatar.png",
    "gender": 1,
    "age": 25,
    "createdAt": "2026-03-21T10:00:00",
    "updatedAt": "2026-03-21T10:00:00"
  }
}
```

**未登录 (401)**:
```json
{
  "code": 401,
  "message": "用户未登录",
  "data": null
}
```

---

### 2. 更新用户信息

**接口说明**：更新当前登录用户的个人信息（部分更新）

```http
PUT /api/v1/user/info
```

#### 请求头

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 限制 |
|--------|------|------|------|------|
| nickname | String | 否 | 用户昵称 | 长度≤50 |
| avatar | String | 否 | 头像URL | - |
| gender | Integer | 否 | 性别 | 0-未知, 1-男, 2-女 |
| age | Integer | 否 | 年龄 | 1-150 |

#### 请求示例

```json
{
  "nickname": "新昵称",
  "avatar": "https://example.com/new-avatar.png",
  "gender": 1,
  "age": 26
}
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "个人信息更新成功",
  "data": null
}
```

**未登录 (401)**:
```json
{
  "code": 401,
  "message": "用户未登录",
  "data": null
}
```

**用户不存在 (404)**:
```json
{
  "code": 404,
  "message": "用户不存在",
  "data": null
}
```

#### 业务说明
- 采用**部分更新**策略，只更新提供的非空字段
- 不提供字段保持原值不变
- **不可修改字段**：username、email、password（需通过专门接口）

---

## 热搜接口 (HotSearch)

基础路径：`/api/v1/hotsearch`

**权限要求**：公开接口，无需登录

---

### 1. 获取实时榜单 Top 50

**接口说明**：获取当前微博热搜实时榜单前50条

```http
GET /api/v1/hotsearch/current
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "itemId": "e99a18c428cb38d5f260853678922e03",
      "rankPos": 1,
      "title": "某明星宣布恋情",
      "url": "https://s.weibo.com/weibo?q=...",
      "heat": 5234567,
      "score": 1,
      "typeName": "娱乐"
    },
    {
      "itemId": "a87ff679a2f3e71d9181a67b7542122c",
      "rankPos": 2,
      "title": "股市大涨",
      "url": "https://s.weibo.com/weibo?q=...",
      "heat": 4123456,
      "score": 0,
      "typeName": "财经"
    }
  ]
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| itemId | String | 热搜唯一标识（MD5加密标题） |
| rankPos | Integer | 榜单排名（1-50） |
| title | String | 热搜标题 |
| url | String | 热搜链接 |
| heat | Long | 热度值 |
| score | Integer | 情感评分：1-正面, 0-中性, -1-负面, null-未分析 |
| typeName | String | 分类名称（如娱乐、财经等） |

#### 缓存策略
- **Redis Key**: `hotsearch:current::top50`
- **TTL**: 30秒

---

### 2. 查询单条热搜趋势

**接口说明**：根据标题查询单条热搜的历史趋势数据（用于趋势图）

```http
GET /api/v1/hotsearch/trend?title={title}
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| title | String | 是 | 热搜标题（需URL编码） | %E6%9F%90%E6%98%8E%E6%98%9F |

#### 请求示例

```bash
curl -X GET "http://localhost:8080/api/v1/hotsearch/trend?title=某明星宣布恋情"
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "eventTime": "2026-03-21 08:00:00",
      "hotCount": 1234567,
      "rank": 5
    },
    {
      "eventTime": "2026-03-21 09:00:00",
      "hotCount": 3456789,
      "rank": 2
    },
    {
      "eventTime": "2026-03-21 10:00:00",
      "hotCount": 5234567,
      "rank": 1
    }
  ]
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| eventTime | String | 数据点时间（格式：yyyy-MM-dd HH:mm:ss） |
| hotCount | Long | 热度值 |
| rank | Integer | 排名位置 |

#### 缓存策略
- **Redis Key**: `hotsearch:trend::{title}`
- **TTL**: 5分钟

#### 错误响应

**标题为空 (400)**:
```json
{
  "code": 400,
  "message": "标题不能为空",
  "data": null
}
```

---

### 3. 批量趋势对比

**接口说明**：批量查询多个热搜的趋势数据（用于对比分析图）

```http
GET /api/v1/hotsearch/compare?titles={title1}&titles={title2}&...
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| titles | Array[String] | 是 | 热搜标题列表（可传多个） | titles=A&titles=B |

#### 请求示例

```bash
curl -X GET "http://localhost:8080/api/v1/hotsearch/compare?titles=某明星宣布恋情&titles=股市大涨"
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "title": "某明星宣布恋情",
      "trendPoints": [
        {
          "eventTime": "2026-03-21 08:00:00",
          "hotCount": 1234567,
          "rank": 5
        },
        {
          "eventTime": "2026-03-21 10:00:00",
          "hotCount": 5234567,
          "rank": 1
        }
      ]
    },
    {
      "title": "股市大涨",
      "trendPoints": [
        {
          "eventTime": "2026-03-21 08:00:00",
          "hotCount": 2345678,
          "rank": 3
        },
        {
          "eventTime": "2026-03-21 10:00:00",
          "hotCount": 4123456,
          "rank": 2
        }
      ]
    }
  ]
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| title | String | 热搜标题（用于图表图例） |
| trendPoints | Array | 该热搜的趋势数据点列表 |

#### 缓存策略
- **Redis Key**: `hotsearch:compare::{titles数组}`
- **TTL**: 5分钟

---

### 4. 条件分页查询

**接口说明**：根据条件分页查询热搜数据（支持高级搜索）

```http
GET /api/v1/hotsearch/search
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| keyword | String | 否 | 标题关键词（模糊匹配） | 明星 |
| score | Integer | 否 | 情感评分筛选：1正面, 0中性, -1负面 | 1 |
| startTime | Long | 否 | 开始时间（时间戳，毫秒） | 1700000000000 |
| endTime | Long | 否 | 结束时间（时间戳，毫秒） | 1700100000000 |
| pageNum | Integer | 否 | 页码，从1开始，默认1 | 1 |
| pageSize | Integer | 否 | 每页大小，默认10，最大100 | 20 |

#### 请求示例

```bash
curl -X GET "http://localhost:8080/api/v1/hotsearch/search?keyword=明星&score=1&pageNum=1&pageSize=20"
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "itemId": "e99a18c428cb38d5f260853678922e03",
        "rankPos": 1,
        "title": "某明星宣布恋情",
        "url": "https://s.weibo.com/weibo?q=...",
        "heat": 5234567,
        "score": 1,
        "typeName": "娱乐"
      }
    ],
    "total": 156,
    "pageNum": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| list | Array | 热搜数据列表（同实时榜单结构） |
| total | Long | 总记录数 |
| pageNum | Integer | 当前页码 |
| pageSize | Integer | 每页大小 |
| totalPages | Integer | 总页数 |

#### 缓存策略
- **无缓存**：查询条件组合多，缓存命中率低

---

### 5. 情感分布统计

**接口说明**：统计指定时间之后的情感分布（用于舆情分析仪表盘）

```http
GET /api/v1/hotsearch/sentiment/stats?sinceTime={timestamp}
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| sinceTime | Long | 是 | 统计起始时间（时间戳，毫秒） | 1700000000000 |

#### 请求示例

```bash
curl -X GET "http://localhost:8080/api/v1/hotsearch/sentiment/stats?sinceTime=1700000000000"
```

#### 响应示例

**成功 (200)**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "positiveCount": 150,
    "neutralCount": 230,
    "negativeCount": 120
  }
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| positiveCount | Long | 正面情感数量（score=1） |
| neutralCount | Long | 中性情感数量（score=0） |
| negativeCount | Long | 负面情感数量（score=-1） |

#### 缓存策略
- **Redis Key**: `hotsearch:sentiment::{sinceTime}`
- **TTL**: 1分钟

#### 错误响应

**时间戳无效 (400)**:
```json
{
  "code": 400,
  "message": "sinceTime 参数无效，必须为正整数时间戳",
  "data": null
}
```

---

## 错误码说明

### HTTP状态码

| 状态码 | 说明 | 场景 |
|--------|------|------|
| 200 | 请求成功 | 正常处理 |
| 400 | 请求参数错误 | 参数缺失、格式错误、验证失败 |
| 401 | 未授权 | 未登录、Token无效/过期 |
| 403 | 禁止访问 | 无权限访问该资源 |
| 404 | 资源不存在 | 用户不存在、数据不存在 |
| 429 | 请求过于频繁 | 触发限流（如验证码发送） |
| 500 | 服务器内部错误 | 系统异常、数据库错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| 400001 | 参数校验失败 |
| 400002 | 验证码错误 |
| 400003 | 用户名已存在 |
| 400004 | 邮箱已存在 |
| 401001 | Token缺失 |
| 401002 | Token无效 |
| 401003 | Token已过期 |
| 404001 | 用户不存在 |
| 404002 | 热搜数据不存在 |
| 429001 | 发送验证码过于频繁 |

---

## 数据模型

### CurrentHotSearchVO（实时热搜）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| itemId | String | 是 | 热搜唯一标识 |
| rankPos | Integer | 是 | 排名（1-50） |
| title | String | 是 | 热搜标题 |
| url | String | 否 | 热搜链接 |
| heat | Long | 是 | 热度值 |
| score | Integer | 否 | 情感评分（1/0/-1/null） |
| typeName | String | 否 | 分类名称 |

### TrendPointVO（趋势数据点）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| eventTime | String | 是 | 时间（yyyy-MM-dd HH:mm:ss） |
| hotCount | Long | 是 | 热度值 |
| rank | Integer | 是 | 排名 |

### TrendCompareVO（趋势对比）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | String | 是 | 热搜标题 |
| trendPoints | Array[TrendPointVO] | 是 | 趋势数据点列表 |

### SentimentStatsVO（情感统计）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| positiveCount | Long | 是 | 正面数量 |
| neutralCount | Long | 是 | 中性数量 |
| negativeCount | Long | 是 | 负面数量 |

### UserInfoVO（用户信息）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 用户ID |
| username | String | 是 | 登录账户名（即account） |
| email | String | 是 | 邮箱地址 |
| nickname | String | 否 | 用户昵称 |
| avatar | String | 否 | 头像URL |
| gender | Integer | 否 | 性别（0-未知，1-男，2-女） |
| roleType | Integer | 是 | 用户角色（1-客户，2-业务管理员，3-系统管理员） |
| signature | String | 否 | 个性签名 |
| createdAt | String | 是 | 注册时间 |

### LoginVO（登录返回）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | String | 是 | JWT Token |
| expiresIn | Long | 是 | Token有效期（秒） |
| userInfo | UserInfoVO | 是 | 用户信息 |

### RegisterDTO（注册请求）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| account | String | 是 | 登录账户（5-20位，仅数字+英文） |
| password | String | 是 | 密码（8-20位，必须包含大小写字母+数字+特殊符号） |
| nickname | String | 是 | 昵称（2-20位） |
| email | String | 是 | 邮箱地址 |
| code | String | 是 | 邮箱验证码（6位数字） |

### PasswordLoginDTO（密码登录请求）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| account | String | 是 | 账户名或邮箱 |
| password | String | 是 | 登录密码 |

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.1.0 | 2026-03-21 | 新增注册、密码登录接口，完善用户数据模型 | SPB Team |
| v1.0.0 | 2026-03-21 | 初始版本，包含验证码登录、用户、热搜接口 | SPB Team |

### v1.1.0 详细变更

#### 新增接口
1. **用户注册** `POST /api/v1/auth/register` - 支持账户+密码+邮箱验证码注册
2. **密码登录** `POST /api/v1/auth/login/password` - 支持账户/邮箱+密码登录
3. **检查账户可用性** `GET /api/v1/auth/check-account` - 校验账户名是否已注册

#### 接口变更
1. **用户登录** 原 `POST /api/v1/auth/login` 改为验证码专用登录接口

#### 数据模型更新
1. **UserInfoVO** 新增字段：`roleType`（用户角色）、`signature`（个性签名）
2. **UserInfoVO** 移除字段：`age`、`updatedAt`

#### 密码规则
- 账户：5-20位，仅数字+英文
- 密码：8-20位，必须包含大小写字母、数字、特殊符号

---

## 附录

### 测试环境

- **Base URL**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`（如集成）
- **API Docs**: `http://localhost:8080/v3/api-docs`（如集成SpringDoc）

### 常用时间戳示例

| 时间 | 时间戳（毫秒） |
|------|---------------|
| 2026-03-21 00:00:00 | 1700000000000 |
| 2026-03-21 12:00:00 | 1700043200000 |
| 2026-03-22 00:00:00 | 1700086400000 |

### 分类列表

| 分类名 | 说明 |
|--------|------|
| 娱乐 | 明星、影视、综艺等 |
| 财经 | 股票、经济、商业等 |
| 体育 | 赛事、运动员等 |
| 科技 | 互联网、AI、数码等 |
| 社会 | 民生、热点事件等 |
| 国际 | 国际新闻、外交等 |
| 军事 | 军事、国防等 |
| 其他 | 未分类内容 |
