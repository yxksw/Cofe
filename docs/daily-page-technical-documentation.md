# 日常页面（Daily Page）技术文档

## 1. 项目概述

### 1.1 功能说明
日常页面是一个基于 Telegram 频道消息的朋友圈/说说展示系统，主要功能包括：
- 展示 Telegram 频道的历史消息
- 支持 Markdown 文本渲染
- 图片网格展示与灯箱查看
- 表情反应系统（Emaction 集成）
- 响应式设计与明暗主题适配

### 1.2 技术栈
| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 14 + React 18 | App Router 模式 |
| 样式方案 | Tailwind CSS + shadcn/ui | 原子化 CSS 与组件库 |
| 状态管理 | React Hooks | useState, useEffect, useCallback |
| 数据获取 | Fetch API | 原生异步请求 |
| 图片查看 | Fancybox | 灯箱组件 |
| Markdown | react-markdown + remark-gfm | Markdown 渲染 |
| 表情系统 | Emaction | 自托管后端 |

### 1.3 架构设计
```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   日常页面    │  │  消息卡片组件 │  │  表情反应组件     │  │
│  │  /daily      │  │ MessageCard  │  │ EmactionReactions│  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据服务层                              │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │ Telegram API     │        │ Emaction Backend         │  │
│  │ (数据获取)        │        │ (表情数据存储)            │  │
│  │ tg-api.381359.xyz│        │ api-emaction.381359.xyz  │  │
│  └──────────────────┘        └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 数据来源说明

### 2.1 数据源
Telegram 数据通过 Cloudflare Worker 代理获取，原始代码参考：
- **Gist**: https://gist.github.com/yxksw/d708d7cf2abf1b90cecc078897852e25

### 2.2 数据获取流程
```
用户访问页面
    │
    ▼
Next.js 页面组件
    │
    ▼
请求 tg-api.381359.xyz/
    │
    ▼
Cloudflare Worker 代理
    │
    ▼
请求 t.me/s/{ChannelName}
    │
    ▼
返回 HTML 页面
    │
    ▼
解析 HTML 提取消息数据
    │
    ▼
返回 JSON 格式数据
```

### 2.3 数据格式
```typescript
interface ApiResponse {
  nextBefore: number;        // 分页偏移量
  Region: string;            // 服务器区域
  version: string;           // API 版本
  ChannelMessageData: {      // 消息数据对象
    [messageId: string]: {
      text: string;          // 消息文本（支持 HTML）
      image: string[];       // 图片 URL 数组
      time: number;          // 时间戳（毫秒）
      views?: string | null; // 浏览量
    }
  }
}
```

### 2.4 数据处理
```typescript
// 数据获取与缓存
const fetchMessages = async () => {
  // 1. 检查本地缓存（5分钟有效期）
  const cacheKey = 'daily-messages-cache';
  const cached = localStorage.getItem(cacheKey);
  
  // 2. 缓存有效则直接返回
  if (cached && !expired) {
    return JSON.parse(cached);
  }
  
  // 3. 请求 API 获取最新数据
  const response = await fetch('http://tg-api.381359.xyz/');
  const data = await response.json();
  
  // 4. 更新缓存
  localStorage.setItem(cacheKey, JSON.stringify(data));
  
  return data;
};
```

---

## 3. 部署方案

### 3.1 Cloudflare Worker 部署架构
```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare 平台                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Worker 脚本                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ 请求拦截    │  │ HTML 解析   │  │ JSON 构造   │ │   │
│  │  │ fetch事件   │  │ DOM 提取    │  │ 数据格式化  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              D1 数据库（可选）                        │   │
│  │         用于存储表情反应数据                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Telegram API Worker 部署步骤

#### 步骤 1：创建 Worker
```bash
# 登录 Cloudflare
npx wrangler login

# 创建新项目
npx wrangler init tg-api-worker
cd tg-api-worker
```

#### 步骤 2：配置 wrangler.toml
```toml
name = "tg-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

# 自定义域名（可选）
[[routes]]
pattern = "tg-api.yourdomain.com"
custom_domain = true
```

#### 步骤 3：编写 Worker 代码
核心逻辑参考 gist，主要功能：
- 代理请求 Telegram 频道页面
- 解析 HTML 提取消息内容
- 返回标准化 JSON 数据

#### 步骤 4：部署
```bash
npx wrangler deploy
```

### 3.3 注意事项
1. **频率限制**：Telegram 可能对频繁请求进行限制，建议添加缓存机制
2. **区域限制**：部分区域可能无法访问 Telegram，需要考虑代理方案
3. **CORS 配置**：确保 Worker 返回正确的跨域头

---

## 4. 表情系统集成

### 4.1 后端集成（Emaction Backend）

#### 4.1.1 项目地址
- **GitHub**: https://github.com/yxksw/emaction-backend

#### 4.1.2 API 接口规范

**获取反应列表**
```http
GET /reactions?targetId={targetId}
```

响应格式：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "reactionsGot": [
      { "reaction_name": "thumbs-up", "count": 10 },
      { "reaction_name": "red-heart", "count": 5 }
    ]
  }
}
```

**添加/取消反应**
```http
PATCH /reaction?targetId={targetId}&reaction_name={name}&diff={1|-1}
```

响应格式：
```json
{
  "code": 0,
  "msg": "success"
}
```

#### 4.1.3 前端调用示例
```typescript
const CONFIG = {
  emactionApi: 'https://api-emaction.381359.xyz/',
};

// 获取反应
const fetchReactions = async (targetId: string) => {
  const response = await fetch(
    `${CONFIG.emactionApi}reactions?targetId=${targetId}`
  );
  const data = await response.json();
  return data.data?.reactionsGot || [];
};

// 切换反应
const toggleReaction = async (targetId: string, reactionName: string, diff: 1 | -1) => {
  const response = await fetch(
    `${CONFIG.emactionApi}reaction?targetId=${targetId}&reaction_name=${reactionName}&diff=${diff}`,
    { method: 'PATCH' }
  );
  return response.ok;
};
```

### 4.2 前端集成（Emaction Frontend）

#### 4.2.1 项目地址
- **GitHub**: https://github.com/yxksw/emaction.frontend

#### 4.2.2 自定义实现
由于使用 React 框架，我们实现了自定义的表情组件：

```typescript
function EmactionReactions({ messageId }: { messageId: string }) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  
  const availableEmojis = ['👍', '❤️', '😄', '🎉', '🤔', '👏', '🔥', '👀'];
  
  // emoji 到 reaction_name 的映射
  const EMOJI_MAP: Record<string, string> = {
    '👍': 'thumbs-up',
    '❤️': 'red-heart',
    '😄': 'smile-face',
    '🎉': 'party-popper',
    '🤔': 'thinking-face',
    '👏': 'clap',
    '🔥': 'fire',
    '👀': 'eyes',
  };

  // 渲染已有反应
  const renderReactions = () => reactions.map(r => (
    <button key={r.name} onClick={() => toggleReaction(r.emoji)}>
      {r.emoji} {r.count}
    </button>
  ));

  // 渲染表情选择器
  const renderPicker = () => showPicker && (
    <div className="emoji-picker">
      {availableEmojis.map(emoji => (
        <button key={emoji} onClick={() => toggleReaction(emoji)}>
          {emoji}
        </button>
      ))}
    </div>
  );

  return (
    <div className="reactions-container">
      {renderReactions()}
      <button onClick={() => setShowPicker(!showPicker)}>😊</button>
      {renderPicker()}
    </div>
  );
}
```

### 4.3 跨域解决方案

#### 4.3.1 问题描述
前端应用（localhost:3000 或部署域名）请求后端 API 时遇到 CORS 限制：
```
Access to fetch at 'https://api-emaction...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

#### 4.3.2 解决方案
在 Cloudflare Worker 中添加 CORS 头：

```javascript
const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export default {
  async fetch(request, env, ctx) {
    // 处理 OPTIONS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors_headers
      });
    }
    
    // 正常请求添加 CORS 头
    const response = await handleRequest(request, env);
    Object.entries(cors_headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
};
```

#### 4.3.3 配置验证
部署后验证 CORS 配置：
```bash
curl -I -X OPTIONS https://api-emaction.381359.xyz/reactions
# 应返回 Access-Control-Allow-Origin: *
```

---

## 5. 开发与部署流程

### 5.1 开发环境搭建

#### 前置要求
- Node.js 18+
- npm 或 pnpm
- Git

#### 安装步骤
```bash
# 1. 克隆项目
git clone https://github.com/yxksw/Cofe-Blog.git
cd Cofe-Blog

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 5.2 项目结构
```
Cofe-Blog/
├── app/
│   ├── daily/
│   │   └── page.tsx          # 日常页面主组件
│   ├── blog/
│   ├── link/
│   └── ...
├── components/
│   ├── FancyboxWrapper.tsx   # 灯箱组件
│   ├── ThemeProvider.tsx     # 主题提供者
│   └── ...
├── lib/
│   └── types.ts              # TypeScript 类型定义
├── docs/
│   └── daily-page-technical-documentation.md
└── package.json
```

### 5.3 测试方法

#### 本地测试
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000/daily
```

#### 构建测试
```bash
# 构建生产版本
npm run build

# 检查是否有错误
```

#### 表情 API 测试
```bash
# 测试获取反应
curl "https://api-emaction.381359.xyz/reactions?targetId=test-1"

# 测试添加反应
curl -X PATCH "https://api-emaction.381359.xyz/reaction?targetId=test-1&reaction_name=thumbs-up&diff=1"
```

### 5.4 部署流程

#### 前端部署（Vercel）
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录并部署
vercel login
vercel --prod
```

#### 后端部署（Cloudflare Workers）
```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 部署 Worker
npx wrangler deploy
```

---

## 6. 常见问题与解决方案

### 6.1 CORS 错误
**症状**：浏览器控制台显示 CORS policy 错误
**原因**：后端未配置跨域头
**解决**：在 Worker 中添加 `Access-Control-Allow-Origin: *`

### 6.2 500 Internal Server Error
**症状**：API 返回 500 错误
**原因**：
- D1 数据库绑定名称错误
- SQL 语法错误
- 数据库表未创建

**解决**：
1. 检查 wrangler.toml 绑定配置
2. 执行数据库初始化：`npx wrangler d1 execute emaction --remote --file=schema.sql`
3. 查看 Worker 日志：`npx wrangler tail`

### 6.3 表情不显示
**症状**：点击表情后没有视觉反馈
**原因**：
- API 调用失败
- 状态未正确更新
- 用户反应状态未持久化

**解决**：
1. 检查网络请求是否成功
2. 确认 `userReactions` Set 正确更新
3. 验证 `fetchReactions` 重新获取数据

### 6.4 图片加载失败
**症状**：消息图片无法显示
**原因**：
- 图片 URL 失效
- 跨域限制
- 网络问题

**解决**：
1. 检查 Telegram 图片 URL 是否可访问
2. 使用 Next.js Image 组件优化
3. 添加图片加载失败占位符

### 6.5 数据缓存不更新
**症状**：刷新页面后数据未更新
**原因**：本地缓存未过期
**解决**：
1. 点击页面"刷新"按钮强制更新
2. 清除 localStorage：`localStorage.removeItem('daily-messages-cache')`
3. 调整缓存过期时间

---

## 7. 附录

### 7.1 相关链接
- **项目仓库**: https://github.com/yxksw/Cofe-Blog
- **Emaction Backend**: https://github.com/yxksw/emaction-backend
- **Emaction Frontend**: https://github.com/yxksw/emaction.frontend
- **Telegram API Gist**: https://gist.github.com/yxksw/d708d7cf2abf1b90cecc078897852e25

### 7.2 版本历史
| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-02-15 | 初始版本，完成基础功能 |

### 7.3 贡献指南
欢迎提交 Issue 和 Pull Request！
