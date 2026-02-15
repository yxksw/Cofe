---
title: 基于cloudflare worker的文章浏览量
date: 2026-02-15T12:47:18.077Z
latitude: 31.586876680633488
longitude: 120.70750042992626
city: 常熟市
street: 西南路
tags:
  - 博客
  - 浏览量
  - cloudflare
cover: "https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/wenzlll.avif"
---

# 从零开始搭建网站浏览量统计系统

> 使用 cf-umami 在 Cloudflare 上部署免费的浏览量统计服务

## 前言

想给自己的博客或网站添加浏览量统计功能，但又不想使用 Google Analytics 这种重量级工具？今天介绍一个轻量级解决方案 —— **cf-umami**，一个基于 Cloudflare Workers + D1 数据库的开源浏览量统计系统。

项目地址：https://github.com/afoim/cf-umami

## 为什么选择 cf-umami？

| 特性 | 说明 |
|------|------|
| 🚀 **完全免费** | 利用 Cloudflare 免费套餐，零成本运行 |
| ⚡ **边缘部署** | 全球 300+ 数据中心，访问速度极快 |
| 🔒 **隐私友好** | 不收集用户个人信息，仅记录页面浏览次数 |
| 💾 **数据持久化** | 使用 Cloudflare D1 数据库，数据安全可靠 |
| 📦 **轻量简洁** | 单文件实现，代码清晰易懂 |
| 🛠️ **易于部署** | 几分钟即可完成部署 |

## 工作原理

cf-umami 的工作流程非常简单：

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   用户访问   │────▶│  tracker.js 脚本 │────▶│  发送浏览数据 │
│   你的网站   │     │  (嵌入在网页中)   │     │   到 Workers │
└─────────────┘     └─────────────────┘     └──────┬──────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  D1 数据库   │
                                            │  存储浏览量  │
                                            └─────────────┘
```

1. 用户在浏览器中打开你的网站
2. 页面加载时，`tracker.js` 脚本自动执行
3. 脚本通过 `fetch` 或 `navigator.sendBeacon` 发送浏览数据
4. Workers 接收数据并写入 D1 数据库
5. 你可以随时通过 API 查询任意页面的浏览量

## 部署步骤

### 第一步：准备工作

确保你已经拥有：
- 一个 [Cloudflare](https://dash.cloudflare.com/) 账号（免费版即可）
- 安装 [Node.js](https://nodejs.org/)（建议 v18 或更高版本）

安装 Wrangler CLI 工具：

```bash
npm install -g wrangler
```

### 第二步：克隆项目

```bash
git clone https://github.com/afoim/cf-umami.git
cd cf-umami
```

### 第三步：安装依赖

```bash
npm install
```

### 第四步：登录 Cloudflare

```bash
npx wrangler login
```

运行后会打开浏览器让你授权登录，按提示操作即可。

### 第五步：创建 D1 数据库

```bash
npx wrangler d1 create cf-umami
```

创建成功后会看到类似输出：

```
✅ Successfully created DB 'cf-umami'

[[d1_databases]]
binding = "cf_umami"
database_name = "cf-umami"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**关键步骤**：将输出的 `database_id` 复制到 `wrangler.jsonc` 文件中：

```json
"d1_databases": [
  {
    "binding": "cf_umami",
    "database_name": "cf-umami",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "remote": false
  }
]
```

### 第六步：配置追踪域名

编辑 `wrangler.jsonc`，找到 `vars` 部分，修改为你的网站域名：

```json
"vars": {
  "TRACKED_SITE_HOST": "your-blog.com"
}
```

⚠️ **注意**：这里填写的是你要统计的网站域名，**不是** Workers 的域名。

### 第七步：本地测试（可选）

```bash
npm run dev
```

服务会在 `http://localhost:8787` 启动，你可以先测试一下是否正常。

### 第八步：部署上线

```bash
npm run deploy
```

部署成功后，会输出你的 Workers 地址：

```
✨ Successfully deployed
   https://cf-umami.xxx.workers.dev
```

记住这个地址，后面会用到！

## 如何使用

### 1. 在网站中嵌入追踪代码

在你网站的 HTML 模板中，添加以下脚本（通常在 `<head>` 或 `<body>` 底部）：

```html
<script src="https://cf-umami.xxx.workers.dev/tracker.js" defer></script>
```

将 `cf-umami.xxx.workers.dev` 替换为你实际的 Workers 域名。

**如果你是 Hugo 用户**，可以在 `layouts/partials/head.html` 中添加：

```html
{{ if not .Site.IsServer }}
<script src="https://cf-umami.xxx.workers.dev/tracker.js" defer></script>
{{ end }}
```

这样开发环境下不会记录浏览量。

### 2. 查看浏览量

cf-umami 提供了简单的 API 来查询浏览量。

#### 使用 curl 测试

```bash
curl "https://cf-umami.xxx.workers.dev/share?pathname=/your-article-path"
```

返回结果：

```json
{
  "pathname": "/your-article-path",
  "views": 256
}
```

#### 在网页中显示浏览量

如果你想在文章页面显示浏览量，可以使用以下 JavaScript 代码：

```html
<span id="page-views">加载中...</span>

<script>
async function showPageViews() {
  const workerUrl = 'https://cf-umami.xxx.workers.dev';
  const pathname = location.pathname;

  try {
    const response = await fetch(
      `${workerUrl}/share?pathname=${encodeURIComponent(pathname)}`
    );
    const data = await response.json();
    document.getElementById('page-views').textContent = `${data.views} 次阅读`;
  } catch (error) {
    document.getElementById('page-views').textContent = '';
  }
}

showPageViews();
</script>
```

#### 显示热门文章

如果你想在侧边栏显示浏览量最高的文章，可以在 Workers 中添加一个新端点，或者定期导出数据生成静态列表。

## 进阶配置

### 同时统计多个域名

目前项目只支持单个域名统计。如果你需要统计多个域名，可以：

1. **部署多个 Workers 实例**：为每个域名部署一个独立的实例
2. **修改源码支持多域名**：将 `TRACKED_SITE_HOST` 改为数组，并在代码中遍历验证

### 自定义追踪脚本

`tracker.js` 是动态生成的，你可以在 `src/index.ts` 中找到 `trackerJsResponse` 函数，根据需要修改追踪逻辑。

例如，添加自定义事件追踪：

```javascript
// 在 tracker.js 中添加
trackEvent: function(eventName) {
  fetch(e, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({pathname: location.pathname, event: eventName}),
    keepalive: true
  });
}
```

### 数据备份

D1 数据库支持导出，可以定期备份数据：

```bash
npx wrangler d1 export cf-umami --output ./backup.sql
```

## 常见问题

### Q: 浏览量统计不准确？

A: 可能的原因：
- 用户浏览器禁用了 JavaScript
- 用户使用了广告拦截器（部分会拦截追踪脚本）
- 网络问题导致请求未发送成功
- 这是正常现象，所有统计工具都会有偏差

### Q: 如何排除自己的访问？

A: 可以在 Workers 代码中添加逻辑，根据 IP 或 User-Agent 过滤：

```typescript
// 在 /send 处理中添加
const userAgent = request.headers.get('User-Agent');
if (userAgent?.includes('Your-Browser-UA')) {
  return jsonResponse({ ok: true });
}
```

### Q: 支持服务端渲染 (SSR) 吗？

A: 支持。`tracker.js` 会在客户端执行，与 SSR 不冲突。

### Q: 免费版有什么限制？

A: Cloudflare Workers 免费版限制：
- 每天 100,000 次请求
- D1 数据库 5GB 存储
- 对于个人博客完全够用

### Q: 如何更新部署？

A: 修改代码后，再次运行：

```bash
npm run deploy
```

## 技术细节

### 数据库结构

```sql
CREATE TABLE IF NOT EXISTS pageviews (
  pathname TEXT PRIMARY KEY,    -- 页面路径，如 /blog/hello
  views INTEGER NOT NULL        -- 浏览次数
);
```

### 安全机制

- **来源验证**：通过 `Origin` 和 `Referer` 头部验证请求来源
- **域名白名单**：只有 `TRACKED_SITE_HOST` 配置的域名才能上报数据
- **参数化查询**：防止 SQL 注入攻击
- **路径长度限制**：最大 512 字符，防止恶意数据

### 追踪脚本特点

- 使用 `navigator.sendBeacon`（如果可用），确保页面关闭时数据也能发送
- 监听 `history.pushState` 和 `popstate`，支持 SPA 应用
- 使用 `fetch` 的 `keepalive` 选项，提高数据发送成功率
- 脚本经过压缩，体积很小

## 与其他工具对比

| 工具 | 优点 | 缺点 |
|------|------|------|
| **cf-umami** | 免费、轻量、隐私友好、可自托管 | 功能较简单 |
| Google Analytics | 功能强大、报表丰富 | 隐私问题、需要同意弹窗、较重 |
| Umami | 开源、功能完整 | 需要服务器/VPS |
| Plausible | 简洁、隐私友好 | 付费或自建服务器 |
| 百度统计 | 国内访问快 | 广告、隐私问题 |

如果你只需要简单的浏览量统计，cf-umami 是一个很好的选择！

## 贡献与反馈

如果你在使用过程中遇到问题，或者有新功能建议，欢迎到 GitHub 仓库提交 Issue 或 PR：

👉 https://github.com/afoim/cf-umami

## 总结

cf-umami 是一个简单实用的浏览量统计方案，特别适合：

- 个人博客/网站
- 不想使用 Google Analytics 的用户
- 追求简洁和隐私保护的项目
- 希望零成本运行的网站

快去试试吧！🚀

## 每日一图

![](https://bing.liushen.fun/api/daily)

---

**参考链接：**
- 项目源码：https://github.com/afoim/cf-umami
- Cloudflare Workers 文档：https://developers.cloudflare.com/workers/
- Cloudflare D1 文档：https://developers.cloudflare.com/d1/
