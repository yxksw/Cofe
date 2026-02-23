---
title: 基于 Cloudflare Worker 的文章浏览量
date: 2026-02-15T12:47:18.077Z
tags:
  - 博客
  - 浏览量
  - cloudflare
categories:
  - 技术分享
cover: "https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/wenzlll.avif"
---

# 博客文章浏览量统计方案

使用 Cloudflare Workers + D1 数据库实现轻量级文章浏览量统计。

## 技术栈

- **Cloudflare Workers**: 边缘计算服务，处理浏览量上报和查询
- **D1 数据库**: SQLite 数据库，存储页面浏览数据
- **cf-umami**: 开源浏览量统计系统

## 实现原理

```
用户访问文章页面
    │
    ▼
tracker.js 自动上报浏览数据
    │
    ▼
Cloudflare Worker 接收并写入 D1
    │
    ▼
前端组件查询并展示浏览量
```

## 核心代码

### tracker.js（修复版）

解决原版的 `document.currentScript` 在 Next.js 中不可用的问题：

```javascript
(function() {
    const WORKER_URL = 'https://cf-umami-cofe.050815.xyz';
    const SEND_ENDPOINT = WORKER_URL + '/send';
    let lastPathname = null;

    function sendPageView() {
        const pathname = location.pathname || '/';
        if (lastPathname === pathname) return;
        lastPathname = pathname;

        const data = JSON.stringify({ pathname });

        if (navigator.sendBeacon) {
            try {
                const blob = new Blob([data], { type: 'application/json' });
                if (navigator.sendBeacon(SEND_ENDPOINT, blob)) return;
            } catch (e) {}
        }

        fetch(SEND_ENDPOINT, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: data,
            keepalive: true,
            mode: 'cors'
        }).catch(() => {});
    }

    // 监听路由变化（SPA 支持）
    const originalPushState = history.pushState;
    history.pushState = function() {
        const result = originalPushState.apply(this, arguments);
        sendPageView();
        return result;
    };

    addEventListener('popstate', sendPageView, true);

    // 页面加载时发送
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sendPageView, { once: true });
    } else {
        sendPageView();
    }
})();
```

### 前端组件

使用 React Hook 获取并展示浏览量：

```typescript
export function PostMeta({ slug }: { slug: string }) {
  const [views, setViews] = useState(0);

  useEffect(() => {
    async function fetchViews() {
      const encodedSlug = encodeURIComponent(slug);
      const pathname = `/blog/${encodedSlug}`;
      
      const response = await fetch(
        `https://cf-umami-cofe.050815.xyz/share?pathname=${encodeURIComponent(pathname)}`
      );
      const data = await response.json();
      setViews(data.views || 0);
    }

    fetchViews();
  }, [slug]);

  return <span>{views} 次浏览</span>;
}
```

## 路径编码处理

中文路径需要双重编码：

1. **slug 编码**: `新文章通知` → `%E6%96%B0%E6%96%87%E7%AB%A0%E9%80%9A%E7%9F%A5`
2. **URL 参数编码**: `/blog/%E6%96%B0...` → `/blog/%25E6%2596%25B0...`

Worker 存储的是编码后的路径，查询时需要保持一致。

## 部署配置

### wrangler.toml

```toml
name = "cf-umami"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "cf-umami-db"
database_id = "your-database-id"

[vars]
TRACKED_SITE_HOST = "cofe.050815.xyz"
```

### 数据库初始化

```sql
CREATE TABLE IF NOT EXISTS pageviews (
  pathname TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0
);
```

## 使用方式

1. 在 `layout.tsx` 中引入 tracker：

```tsx
import Script from 'next/script'

<Script src="/js/tracker-fixed.js" strategy="afterInteractive" />
```

2. 在文章组件中展示浏览量（见上方 `PostMeta` 组件）

## 特点

- **轻量**: 单文件实现，无外部依赖
- **免费**: Cloudflare 免费套餐即可运行
- **隐私友好**: 仅记录页面路径和次数，不收集用户信息
- **SPA 支持**: 监听路由变化，单页应用也能正常统计

## 参考

- 项目源码: https://github.com/afoim/cf-umami
