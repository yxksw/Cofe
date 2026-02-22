# 日常页面（Daily Page）技术文档

## 1. 项目概述

### 1.1 功能说明

日常页面是一个基于 Telegram 频道消息的朋友圈/说说展示系统，主要功能包括：

- 展示 Telegram 频道的历史消息
- 支持 Markdown 文本渲染
- 图片网格展示与灯箱查看（Fancybox）
- 表情反应系统（Emaction 集成）
- 响应式设计与明暗主题适配
- 本地数据缓存机制

### 1.2 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 14 + React 18 | App Router 模式 |
| 样式方案 | Tailwind CSS + shadcn/ui | 原子化 CSS 与组件库 |
| 状态管理 | React Hooks | useState, useEffect, useCallback, useRef |
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
│  │ tg-api.050815.xyz│        │ api-emaction.050815.xyz  │  │
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
用户访问 /daily 页面
    │
    ▼
请求 tg-api.050815.xyz/
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

### 2.4 客户端缓存机制

```typescript
const CONFIG = {
  apiUrl: 'https://tg-api.050815.xyz/',
  cacheKey: 'daily-messages-cache',
  cacheTimeKey: 'daily-messages-cache-time',
  cacheDuration: 5 * 60 * 1000, // 5分钟缓存
};

// 数据获取与缓存
const fetchMessages = async () => {
  const now = Date.now();
  const cacheTime = localStorage.getItem(CONFIG.cacheTimeKey);

  // 缓存有效则直接返回
  if (cacheTime && now - parseInt(cacheTime) < CONFIG.cacheDuration) {
    const cached = localStorage.getItem(CONFIG.cacheKey);
    if (cached) return JSON.parse(cached);
  }

  // 请求 API 获取最新数据
  const response = await fetch(CONFIG.apiUrl);
  const data = await response.json();

  // 更新缓存
  localStorage.setItem(CONFIG.cacheKey, JSON.stringify(data));
  localStorage.setItem(CONFIG.cacheTimeKey, now.toString());

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

### 4.2 前端集成

#### 4.2.1 表情类型定义

```typescript
interface Reaction {
  emoji: string;      // 显示的 emoji
  name: string;       // reaction_name
  count: number;      // 数量
  reacted: boolean;   // 当前用户是否已反应
}

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

const NAME_TO_EMOJI: Record<string, string> = {
  'thumbs-up': '👍',
  'red-heart': '❤️',
  'smile-face': '😄',
  'party-popper': '🎉',
  'thinking-face': '🤔',
  'clap': '👏',
  'fire': '🔥',
  'eyes': '👀',
};
```

#### 4.2.2 获取反应

```typescript
const fetchReactions = async (messageId: string) => {
  const targetId = `daily-${messageId}`;
  const response = await fetch(
    `${CONFIG.emactionApi}reactions?targetId=${encodeURIComponent(targetId)}`
  );
  const result = await response.json();

  if (result.code === 0 && result.data?.reactionsGot) {
    return result.data.reactionsGot.map((r) => ({
      emoji: NAME_TO_EMOJI[r.reaction_name] || r.reaction_name,
      name: r.reaction_name,
      count: r.count,
      reacted: userReactions.has(r.reaction_name),
    }));
  }
  return [];
};
```

#### 4.2.3 切换反应

```typescript
const toggleReaction = async (messageId: string, emoji: string) => {
  const targetId = `daily-${messageId}`;
  const reactionName = EMOJI_MAP[emoji];
  const hasReacted = userReactions.has(reactionName);
  const diff = hasReacted ? -1 : 1;

  const response = await fetch(
    `${CONFIG.emactionApi}reaction?targetId=${encodeURIComponent(targetId)}&reaction_name=${reactionName}&diff=${diff}`,
    { method: 'PATCH' }
  );

  if (response.ok) {
    const result = await response.json();
    if (result.code === 0) {
      // 更新本地状态
      setUserReactions((prev) => {
        const newSet = new Set(prev);
        if (hasReacted) {
          newSet.delete(reactionName);
        } else {
          newSet.add(reactionName);
        }
        return newSet;
      });
      // 重新获取反应数据
      fetchReactions(messageId);
    }
  }
};
```

### 4.3 跨域解决方案

#### 4.3.1 问题描述

前端应用请求后端 API 时遇到 CORS 限制：

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

```bash
curl -I -X OPTIONS https://api-emaction.050815.xyz/reactions
# 应返回 Access-Control-Allow-Origin: *
```

---

## 5. 组件说明

### 5.1 页面组件结构

```
app/daily/page.tsx
├── EmactionReactions    # 表情反应组件
│   ├── fetchReactions   # 获取反应数据
│   ├── toggleReaction   # 切换反应状态
│   └── Emoji Picker     # 表情选择弹窗
├── MessageCard          # 消息卡片组件
│   ├── 时间显示
│   ├── Markdown 内容渲染
│   ├── 图片网格
│   └── EmactionReactions
├── SkeletonCard         # 加载骨架屏
└── DailyPage            # 主页面组件
    ├── fetchMessages    # 获取消息数据
    └── 缓存管理
```

### 5.2 消息卡片组件

```typescript
function MessageCard({
  id,
  message,
  index,
}: {
  id: string;
  message: MessageData[string];
  index: number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {/* 头部：时间和浏览量 */}
      <div className="flex items-center justify-between mb-3">
        <time>{format(date, 'yyyy-MM-dd HH:mm')}</time>
        {message.views && <span>{message.views} 次浏览</span>}
      </div>

      {/* Markdown 内容 */}
      <div className="prose prose-sm dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.text}
        </ReactMarkdown>
      </div>

      {/* 图片网格 */}
      {message.image?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {message.image.map((img, idx) => (
            <Image key={idx} src={img} alt={`图片 ${idx + 1}`} />
          ))}
        </div>
      )}

      {/* 表情反应 */}
      <EmactionReactions messageId={id} />
    </div>
  );
}
```

### 5.3 表情反应组件

```typescript
function EmactionReactions({ messageId }: { messageId: string }) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {/* 已有反应 */}
      {reactions.map((reaction) => (
        <button
          key={reaction.name}
          onClick={() => toggleReaction(reaction.emoji)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
            reaction.reacted
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-muted border border-border'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span className="text-xs">{reaction.count}</span>
        </button>
      ))}

      {/* 添加反应按钮 */}
      <div className="relative" ref={pickerRef}>
        <button onClick={() => setShowPicker(!showPicker)}>
          <Icon icon="lucide:smile-plus" />
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-card border rounded-lg shadow-lg">
            {availableEmojis.map((emoji) => (
              <button key={emoji} onClick={() => toggleReaction(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 6. 开发与部署流程

### 6.1 开发环境搭建

#### 前置要求

- Node.js 18+
- npm 或 pnpm
- Git

#### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/yxksw/Cofe.git
cd Cofe-Blog

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 6.2 项目结构

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
│   └── ui/                  # shadcn/ui 组件
├── lib/
│   ├── types.ts              # TypeScript 类型定义
│   └── utils.ts             # 工具函数
├── docs/
│   └── daily-page-technical-documentation.md
└── package.json
```

### 6.3 测试方法

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
```

#### 表情 API 测试

```bash
# 测试获取反应
curl "https://api-emaction.050815.xyz/reactions?targetId=daily-test-1"

# 测试添加反应
curl -X PATCH "https://api-emaction.050815.xyz/reaction?targetId=daily-test-1&reaction_name=thumbs-up&diff=1"
```

### 6.4 部署流程

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

## 7. 常见问题与解决方案

### 7.1 CORS 错误

**症状**：浏览器控制台显示 CORS policy 错误
**原因**：后端未配置跨域头
**解决**：在 Worker 中添加 `Access-Control-Allow-Origin: *`

### 7.2 500 Internal Server Error

**症状**：API 返回 500 错误
**原因**：

- D1 数据库绑定名称错误
- SQL 语法错误
- 数据库表未创建

**解决**：

1. 检查 wrangler.toml 绑定配置
2. 执行数据库初始化：`npx wrangler d1 execute emaction --remote --file=schema.sql`
3. 查看 Worker 日志：`npx wrangler tail`

### 7.3 表情不显示

**症状**：点击表情后没有视觉反馈
**原因**：

- API 调用失败
- 状态未正确更新
- 用户反应状态未持久化

**解决**：

1. 检查网络请求是否成功
2. 确认 `userReactions` Set 正确更新
3. 验证 `fetchReactions` 重新获取数据

### 7.4 图片加载失败

**症状**：消息图片无法显示
**原因**：

- 图片 URL 失效
- 跨域限制
- 网络问题

**解决**：

1. 检查 Telegram 图片 URL 是否可访问
2. 使用 Next.js Image 组件优化
3. 添加图片加载失败占位符

### 7.5 数据缓存不更新

**症状**：刷新页面后数据未更新
**原因**：本地缓存未过期
**解决**：

1. 点击页面"刷新"按钮强制更新
2. 清除 localStorage：`localStorage.removeItem('daily-messages-cache')`
3. 调整缓存过期时间（默认 5 分钟）

---

## 8. 相关链接

- **项目仓库**: https://github.com/yxksw/Cofe
- **Emaction Backend**: https://github.com/yxksw/emaction-backend
- **Emaction Frontend**: https://github.com/yxksw/emaction.frontend
- **Telegram API Gist**: https://gist.github.com/yxksw/d708d7cf2abf1b90cecc078897852e25
