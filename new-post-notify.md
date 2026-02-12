---
title: "新文章通知功能实现详解"
description: "详细介绍如何在 Astro 博客中实现新文章通知和内容更新检测功能"
publishedAt: 2026-01-28
categories: ["技术分享"]
tags: ["Astro", "JavaScript", "RSS", "前端开发"]
author: "钟神秀"
image: "https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/new-post-notify.avif"
status: "published"
featured: false
recommended: true
hideToc: false
draft: false
summary: "新文章通知功能是一个重要的博客用户体验改进功能，它包括以下特点：检测博客中新增的文章和现有文章的内容更新，使用Diff算法高亮显示文章变更，弹出通知提醒读者，支持液态玻璃UI效果和响应式设计，适配不同设备，前端框架为Astro3，0，状态管理采用IndexedDBlocalStorage，RSSS解析使用原生DOMParser，差异比较使用diff库，使用CSS实现现代化的液态玻璃UI效果，在文章页面检测内容更新并高亮显示。"
---
<div class="prose prose-lg max-w-none">

## 功能概述

新文章通知功能是一个为博客读者提供更好用户体验的重要功能，它能够：

- ✅ 检测博客中新增的文章
- ✅ 检测现有文章的内容更新
- ✅ 使用 Diff 算法高亮显示文章变更
- ✅ 弹出通知提醒读者
- ✅ 支持液态玻璃 UI 效果
- ✅ 响应式设计，适配不同设备

## 技术栈

- **前端框架**：Astro 3.0+
- **状态管理**：IndexedDB + localStorage
- **RSS 解析**：原生 DOMParser
- **差异比较**：diff 库
- **UI 效果**：Tailwind CSS + 液态玻璃效果
- **图标**：SVG 图标

## 核心组件

### 1. NewPostNotification.astro

主要负责检测新文章和文章更新，并显示通知弹窗。

### 2. PostContentHighlighter.astro

主要负责在文章页面高亮显示内容变更，并提供跳转到更新处的功能。

## 实现原理

### 1. RSS 订阅与解析

```javascript
async function fetchRSS(): Promise<Post[]> {
    try {
        const response = await fetch('/rss.xml', { cache: 'no-store' });
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = Array.from(xml.querySelectorAll('item'));

        return items.map(item => {
            const title = item.querySelector('title')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const guid = item.querySelector('guid')?.textContent || link;
            const pubDate = new Date(item.querySelector('pubDate')?.textContent || '').getTime();
            const description = item.querySelector('description')?.textContent || '';

            // 尝试从多个可能的来源获取内容
            const contentEncoded = item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0]?.textContent;
            const content = contentEncoded ||
                            item.getElementsByTagName('content:encoded')[0]?.textContent ||
                            item.querySelector('content')?.textContent || '';

            return {
                title,
                link,
                guid,
                pubDate,
                description,
                content // 存储完整内容用于比较
            };
        });
    } catch (e) {
        console.error('Failed to fetch RSS:', e);
        return [];
    }
}
```

### 2. IndexedDB 存储

使用 IndexedDB 存储文章内容，以便于后续比较：

```javascript
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // 使用 'id' 作为键路径
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}
```

### 3. 差异比较算法

使用 diff 库比较文章内容的变更：

```javascript
function computeDiff(oldText: string, newText: string): Diff.Change[] | null {
    if (!oldText || !newText) return null;

    // 去除 HTML 标签以获得更清晰的比较结果
    const stripHtml = (html: string): string => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const cleanOld = stripHtml(oldText);
    const cleanNew = stripHtml(newText);

    // 使用 'diff' 库计算行级差异
    const diffs = Diff.diffLines(cleanOld, cleanNew);

    // 检查是否有实际变更
    const hasChanges = diffs.some(part => part.added || part.removed);

    if (!hasChanges) return null;

    return diffs;
}
```

### 4. 通知显示逻辑

```javascript
function showNotification(newPosts: Post[], timestamp: number, isFresh: boolean, initTime: number): void {
    const minimizedBtn = document.getElementById('notification-minimized') as HTMLButtonElement | null;
    const panel = document.getElementById('notification-panel') as HTMLDivElement | null;
    const list = document.getElementById(LIST_ID) as HTMLDivElement | null;
    const dot = document.getElementById('notification-dot') as HTMLSpanElement | null;
    const minimizeBtn = document.getElementById('minimize-notification') as HTMLButtonElement | null;
    const clearBtn = document.getElementById('clear-notification') as HTMLButtonElement | null;
    const NOTIFICATION_STATE_KEY = 'mapleblog-notification-state';
    const INIT_TIME_KEY = 'mapleblog-notification-init-time';

    if (!minimizedBtn || !panel || !list) return;

    // 显示通知图标
    requestAnimationFrame(() => {
        if (minimizedBtn) {
            // 重置位置和可见性
            minimizedBtn.style.position = '';
            minimizedBtn.style.left = '';
            minimizedBtn.style.top = '';
            // 移除隐藏类
            minimizedBtn.classList.remove('translate-y-20', 'opacity-0');
            minimizedBtn.classList.remove('pointer-events-none'); // 允许点击
        }
    });

    // 显示时间戳头部
    let html = `
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1 flex flex-col gap-0.5">
            <div class="font-medium">发现更新</div>
            <div class="opacity-70 text-[10px]">${initTimeStr} - ${checkTimeStr}</div>
        </div>`;

    // 渲染新文章列表
    newPosts.forEach(post => {
        const isUpdated = post.isUpdated || false;
        const badge = isUpdated
            ? '<span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded ml-2">更新</span>'
            : '<span class="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-1.5 py-0.5 rounded ml-2">新文章</span>';

        // 为更新的文章生成差异查看按钮
        let diffButton = '';
        const safeId = 'diff-' + post.guid.replace(/[^a-zA-Z0-9-_]/g, '_');

        if (isUpdated && post.diff) {
            diffButton = `
            <button data-diff-toggle="${safeId}" class="ml-auto text-xs text-[var(--primary)] hover:underline focus:outline-none pointer-events-auto">
                查看变更
            </button>`;
        }

        html += `
        <div class="mb-2 last:mb-0">
            <div class="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--primary)]/5 transition-colors">
                <a href="${post.link}" class="font-medium truncate pr-2 hover:text-[var(--primary)] transition-colors text-black dark:text-white block flex-1">
                    ${post.title}
                </a>
                <div class="flex items-center shrink-0">
                    ${diffButton}
                    ${badge}
                </div>
            </div>
            ${isUpdated && post.diff ? `
            <div id="${safeId}" class="hidden mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                ${post.diff.map(part => {
                    const colorClass = part.added ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 block my-1 p-1 rounded break-all whitespace-pre-wrap' :
                                     part.removed ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 block my-1 p-1 rounded break-all whitespace-pre-wrap' :
                                     'text-gray-500 dark:text-gray-400 block my-1 p-1 break-all whitespace-pre-wrap';
                    return `<div class="${colorClass}">${part.value}</div>`;
                }).join('')}
            </div>
            ` : ''}
        </div>`;
    });

    if (list) {
        list.innerHTML = html;
    }

    // 显示红点通知
    if (isFresh) {
         dot?.classList.remove('hidden');
         // 自动打开面板
         setTimeout(() => {
             openPanel();
         }, 1500);
    } else {
         dot?.classList.add('hidden');
    }

    // 设置事件监听器
    setupEventListeners();
}
```

## 液态玻璃效果

使用 CSS 实现现代化的液态玻璃 UI 效果：

```css
/* Liquid glass effect */
#notification-minimized {
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
}

#notification-panel {
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
}
```

## 内容更新高亮

在文章页面检测内容更新并高亮显示：

```javascript
function highlightDiff(oldText: string, newText: string) {
    if (!oldText || !newText) return;
    
    const diff = Diff.diffWords(oldText, newText);
    const container = document.querySelector('.markdown-content');
    if (!container) return;

    // 过滤出重要的添加部分
    const addedParts = diff.filter(part => part.added && part.value.trim().length > 10);

    if (addedParts.length === 0) return;

    // 显示通知
    const notification = document.getElementById('post-update-notification');
    if (notification) {
        notification.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');

        document.getElementById('close-diff-toast')?.addEventListener('click', () => {
            notification.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
        });

        document.getElementById('scroll-to-diff')?.addEventListener('click', () => {
            scrollToFirstDiff(addedParts[0].value);
        });
    }
}
```

## 技术亮点

### 1. 双存储策略

- **IndexedDB**：存储文章的完整内容和元数据
- **localStorage**：存储通知状态和初始化时间

### 2. 高效的差异比较

- 使用 diff 库进行行级差异比较
- 只显示有实际变更的部分
- 为新增和删除的内容使用不同的颜色标识

### 3. 现代化的 UI 设计

- 液态玻璃效果
- 平滑的动画和过渡
- 响应式设计
- 深色模式支持

### 4. 优化的用户体验

- 自动检测新文章和更新
- 智能的通知显示逻辑
- 一键跳转到更新处
- 可关闭的通知面板

## 实现步骤

### 1. 准备工作

#### 1.1 安装依赖

首先，确保项目中已经安装了 `diff` 库，用于比较文章内容的差异：

```bash
pnpm add diff
# 或
npm install diff
# 或
yarn add diff
```

#### 1.2 配置 RSS 输出

确保 `src/pages/rss.xml.ts` 文件能够输出完整的文章内容，需要添加 `content:encoded` 字段：

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_INFO } from '@lib/config';

export async function GET(context: any) {
  const blog = await getCollection('blog', ({ data }) => data.status === 'published');
  
  return rss({
    title: SITE_INFO.SITE_NAME,
    description: SITE_INFO.DESCRIPTION,
    site: context.site,
    items: blog.map((post) => {
      // 确保文章内容被正确处理
      const content = post.body || '';
      
      return {
        title: post.data.title,
        description: post.data.description || '',
        link: `/blog/${post.slug}/`,
        pubDate: post.data.publishedAt || post.data.createdAt,
        // 添加 content:encoded 字段
        customData: `<content:encoded><![CDATA[${content}]]></content:encoded>`,
      };
    }),
    // 添加 content 命名空间
    xmlns: {
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
  });
}
```

### 2. 创建核心组件

#### 2.1 创建 NewPostNotification.astro

1. **创建文件**：在 `src/components/widget/` 目录下创建 `NewPostNotification.astro` 文件

2. **添加样式**：实现液态玻璃效果和滚动条样式

3. **添加 HTML 结构**：包含通知图标和通知面板

4. **添加脚本**：实现 RSS 解析、差异比较、通知显示等核心功能

#### 2.2 创建 PostContentHighlighter.astro

1. **创建文件**：在 `src/components/widget/` 目录下创建 `PostContentHighlighter.astro` 文件

2. **添加样式**：实现液态玻璃效果

3. **添加 HTML 结构**：包含内容更新通知弹窗

4. **添加脚本**：实现内容检测、差异高亮、滚动到更新处等功能

### 3. 集成到布局

#### 3.1 修改 BaseLayout.astro

在 `src/components/base/BaseLayout.astro` 文件中添加组件导入和使用：

```typescript
// 导入文章更新通知组件
import PostContentHighlighter from "@components/widget/PostContentHighlighter.astro";
import NewPostNotification from "@components/widget/NewPostNotification.astro";

// 在布局中添加组件
<Background />
<Header />
<main id="main-content" class="flex-1 pb-16 md:pb-36">
  <slot />
</main>
<Footer />
<!-- 文章更新通知组件 -->
<PostContentHighlighter />
<NewPostNotification />
```

### 4. 测试和优化

#### 4.1 测试新文章检测

1. **创建新文章**：在 `src/content/blog/` 目录下创建一篇新文章

2. **刷新页面**：在浏览器中刷新博客首页

3. **验证通知**：检查是否显示新文章通知

#### 4.2 测试文章更新检测

1. **修改现有文章**：编辑一篇已有的文章，添加或修改一些内容

2. **刷新页面**：在浏览器中刷新该文章页面

3. **验证高亮**：检查是否显示内容更新通知，并高亮显示变更部分

#### 4.3 优化 UI/UX

1. **调整弹窗位置**：确保弹窗不会被页面元素遮挡

2. **优化动画效果**：调整弹窗的显示和隐藏动画

3. **测试响应式**：确保在不同设备上都能正常显示

4. **测试深色模式**：确保在深色模式下也能正常显示

### 5. 性能优化

#### 5.1 减少 DOM 操作

- 使用 `requestAnimationFrame` 优化动画
- 避免频繁的 DOM 操作
- 使用事件委托减少事件监听器

#### 5.2 优化存储

- 合理使用 IndexedDB 存储文章内容
- 使用 localStorage 存储轻量级数据
- 定期清理过期数据

#### 5.3 优化网络请求

- 使用适当的缓存策略
- 减少不必要的网络请求
- 优化 RSS 解析性能

## 代码优化建议

1. **性能优化**：
   - 使用 `requestAnimationFrame` 优化动画
   - 避免频繁的 DOM 操作
   - 使用事件委托减少事件监听器
   - 优化 RSS 解析性能，使用流式解析处理大型 RSS  feeds
   - 实现缓存策略，减少重复的网络请求

2. **代码结构**：
   - 分离关注点，将逻辑拆分为更小的函数
   - 使用 TypeScript 类型定义提高代码可维护性
   - 添加适当的注释和文档
   - 使用模块化设计，便于后续扩展

3. **用户体验**：
   - 添加更丰富的动画效果
   - 优化移动端体验
   - 添加更多的配置选项
   - 实现个性化的通知设置
   - 添加通知声音和振动（可选）

## 常见问题和解决方案

### 1. 通知不显示

**可能原因**：
- RSS  feed 未正确配置
- 浏览器阻止了本地存储
- 网络连接问题

**解决方案**：
- 检查 RSS 输出是否包含完整的文章内容
- 确保浏览器允许本地存储和 IndexedDB
- 检查网络连接，确保能够访问 RSS feed

### 2. 内容更新未检测到

**可能原因**：
- RSS  feed 未更新
- 文章内容未正确存储
- 差异比较算法未正确配置

**解决方案**：
- 确保 RSS  feed 包含最新的文章内容
- 检查 IndexedDB 存储是否正常工作
- 调整差异比较算法的阈值，确保能够检测到较小的变更

### 3. 弹窗被页面元素遮挡

**可能原因**：
- CSS z-index 冲突
- 弹窗定位不正确
- 页面布局问题

**解决方案**：
- 确保弹窗的 z-index 值足够高
- 调整弹窗的定位，避免与其他元素重叠
- 优化页面布局，为弹窗预留足够的空间

### 4. 性能问题

**可能原因**：
- 文章数量过多
- 差异比较算法效率低
- 频繁的 DOM 操作

**解决方案**：
- 实现分页加载，限制单次处理的文章数量
- 优化差异比较算法，使用更高效的比较策略
- 减少 DOM 操作，使用虚拟列表技术

## 高级功能扩展

### 1. 个性化通知设置

允许用户自定义通知设置，如：
- 通知显示方式（弹窗、横幅、邮件等）
- 通知频率（实时、每日摘要、每周摘要）
- 通知内容（新文章、更新、评论等）

### 2. 多平台通知

扩展通知功能到多个平台，如：
- 浏览器推送通知
- 邮件通知
- 移动应用通知
- 社交媒体通知

### 3. 智能通知

实现智能通知系统，如：
- 基于用户兴趣的通知过滤
- 通知优先级排序
- 通知聚合和摘要
- 通知阅读状态跟踪

### 4. 通知分析

添加通知分析功能，如：
- 通知点击率统计
- 用户参与度分析
- 最佳通知时间分析
- 通知效果评估

## 最佳实践

### 1. 前端通知系统最佳实践

- **及时性**：确保通知及时送达
- **相关性**：只发送与用户相关的通知
- **可控制**：允许用户控制通知设置
- **可操作**：提供清晰的操作选项
- **美观性**：设计美观、一致的通知界面

### 2. 性能优化最佳实践

- **懒加载**：只在需要时加载通知组件
- **缓存**：合理使用缓存减少网络请求
- **防抖**：对频繁触发的事件使用防抖处理
- **节流**：对高频操作使用节流处理
- **代码分割**：按需加载通知相关代码

### 3. 用户体验最佳实践

- **透明度**：清晰告知用户通知的目的
- **简洁性**：保持通知内容简洁明了
- **一致性**：确保通知风格与网站整体风格一致
- **可访问性**：确保通知对所有用户可访问
- **尊重性**：避免过度打扰用户

## 总结

新文章通知功能是一个提升博客用户体验的重要特性，它能够：

- ✅ 及时通知读者博客的更新
- ✅ 高亮显示文章的具体变更
- ✅ 提供现代化的 UI 交互
- ✅ 增强读者的参与感
- ✅ 支持个性化设置
- ✅ 集成多平台通知

通过本文的实现方案，你可以为你的 Astro 博客添加这个功能，让你的读者能够更方便地了解博客的最新动态。同时，你还可以根据自己的需求扩展更多高级功能，打造一个更加智能、个性化的通知系统。

希望本文对你有所帮助！如果你有任何问题或建议，欢迎在评论区留言。

## 完整代码

### NewPostNotification.astro

```html
<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: var(--primary);
        border-radius: 20px;
        opacity: 0.5;
    }
    .custom-scrollbar::-webkit-
scrollbar-thumb:hover {
        background-color: var(--primary);
        opacity: 0.8;
    }
    /* Firefox */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: var(--primary) transparent;
    }

    /* Liquid glass effect */
    #notification-minimized {
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
    }

    #notification-panel {
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
    }
</style>

<div id="new-post-notification" class="fixed bottom-20 right-4 z-50 flex flex-col items-end pointer-events-none">
    <!-- Minimized State (Bell Icon) -->
    <button id="notification-minimized" class="pointer-events-auto bg-blue-100/80 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 p-3 rounded-full shadow-lg transform translate-y-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-95 flex items-center justify-center relative group ml-2 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
        <span id="notification-dot" class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-100 dark:border-blue-900 hidden animate-pulse"></span>
    </button>

    <!-- Expanded State (Panel) -->
    <div id="notification-panel" class="pointer-events-auto bg-blue-100/80 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-xl shadow-lg p-4 max-w-[90vw] w-80 transform -translate-y-4 opacity-0 scale-95 origin-bottom-right transition-all duration-300 hidden absolute bottom-full right-0 mb-2">
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 text-blue-600 dark:text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg>
                <h3 class="font-bold text-black dark:text-white">发现新文章</h3>
            </div>
            <div class="flex items-center gap-1">
                <button id="clear-notification" class="text-black/50 dark:text-white/50 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10" title="清空通知">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
                <button id="minimize-notification" class="text-black/50 dark:text-white/50 hover:text-[var(--primary)] transition-colors p-1 rounded-md hover:bg-[var(--primary)]/10" title="隐藏">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div id="new-post-list" class="text-sm text-black/80 dark:text-white/80 transition-colors space-y-1 max-h-[60vh] overflow-y-auto overflow-x-hidden custom-scrollbar"></div>
    </div>
</div>

<script>
    import * as Diff from 'diff';

    // 类型定义
    interface Post {
        title: string;
        link: string;
        guid: string;
        pubDate: number;
        description: string;
        content: string;
        isUpdated?: boolean;
        diff?: Diff.Change[];
    }

    interface StoredPost extends Post {
        id: string;
    }

    (async function() {
    const DB_NAME = 'mapleblog-rss-store';
    const DB_VERSION = 2;
    const STORE_NAME = 'posts';
    const LOCAL_STORAGE_KEY = 'blog-posts-cache';
    const NOTIFICATION_ID = 'new-post-notification';
    const LIST_ID = 'new-post-list';

    // 计算当前站点/路径的上下文感知 ID
    const SCOPE_ID = window.location.pathname.split('/')[1] || 'root';

    // IndexedDB 辅助函数
    function openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // 使用 'id' 作为键路径
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    function generateId(guid: string): string {
        // 创建一个包含作用域和文章 guid 的复合键
        return `${SCOPE_ID}:${guid}`;
    }

    function getStoredPosts(db: IDBDatabase): Promise<StoredPost[]> {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result as StoredPost[]);
            request.onerror = () => reject(request.error);
        });
    }

    function savePosts(db: IDBDatabase, posts: Post[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            posts.forEach(post => {
                // 确保使用作用域 ID 保存
                const itemToSave: StoredPost = { ...post, id: generateId(post.guid) };
                store.put(itemToSave);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // 获取当前 RSS 项目的辅助函数
    async function fetchRSS(): Promise<Post[]> {
        try {
            const response = await fetch('/rss.xml', { cache: 'no-store' });
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            const items = Array.from(xml.querySelectorAll('item'));

            return items.map(item => {
                const title = item.querySelector('title')?.textContent || '';
                const link = item.querySelector('link')?.textContent || '';
                const guid = item.querySelector('guid')?.textContent || link;
                const pubDate = new Date(item.querySelector('pubDate')?.textContent || '').getTime();
                const description = item.querySelector('description')?.textContent || '';

                // 尝试从多个可能的来源获取内容
                const contentEncoded = item.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0]?.textContent;
                const content = contentEncoded ||
                                item.getElementsByTagName('content:encoded')[0]?.textContent ||
                                item.querySelector('content')?.textContent || '';

                return {
                    title,
                    link,
                    guid,
                    pubDate,
                    description,
                    content // 完整内容存储在这里
                };
            });
        } catch (e) {
            console.error('Failed to fetch RSS:', e);
            return [];
        }
    }

    // 计算文本差异的辅助函数
    function computeDiff(oldText: string, newText: string): Diff.Change[] | null {
        if (!oldText || !newText) return null;

        // 去除 HTML 标签以获得更清晰的比较结果
        const stripHtml = (html: string): string => {
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        };

        const cleanOld = stripHtml(oldText);
        const cleanNew = stripHtml(newText);

        // 使用 'diff' 库计算行级差异
        const diffs = Diff.diffLines(cleanOld, cleanNew);

        // 检查是否有实际变更
        const hasChanges = diffs.some(part => part.added || part.removed);

        if (!hasChanges) return null;

        return diffs;
    }

    // 显示通知的辅助函数
    function showNotification(newPosts: Post[], timestamp: number, isFresh: boolean, initTime: number): void {
        const minimizedBtn = document.getElementById('notification-minimized') as HTMLButtonElement | null;
        const panel = document.getElementById('notification-panel') as HTMLDivElement | null;
        const list = document.getElementById(LIST_ID) as HTMLDivElement | null;
        const dot = document.getElementById('notification-dot') as HTMLSpanElement | null;
        const minimizeBtn = document.getElementById('minimize-notification') as HTMLButtonElement | null;
        const clearBtn = document.getElementById('clear-notification') as HTMLButtonElement | null;
        const NOTIFICATION_STATE_KEY = 'mapleblog-notification-state';
        const INIT_TIME_KEY = 'mapleblog-notification-init-time';

        if (!minimizedBtn || !panel || !list) return;

        // 显示通知图标
        requestAnimationFrame(() => {
            if (minimizedBtn) {
                // 重置位置和可见性
                minimizedBtn.style.position = '';
                minimizedBtn.style.left = '';
                minimizedBtn.style.top = '';
                // 移除隐藏类
                minimizedBtn.classList.remove('translate-y-20', 'opacity-0');
                minimizedBtn.classList.remove('pointer-events-none'); // 允许点击
            }
        });

        const initTimeStr = new Date(initTime).toLocaleString();
        const checkTimeStr = new Date(timestamp).toLocaleString();

        // 无更新的逻辑
        if (newPosts.length === 0) {
             if (list) {
                 list.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    <p class="text-sm font-medium mb-2">暂无文章更新</p>
                    <div class="text-xs opacity-70 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 inline-block">
                        ${initTimeStr} - ${checkTimeStr}
                    </div>
                 </div>`;
             }
             dot?.classList.add('hidden');

             // 即使没有文章也设置事件监听器
             setupEventListeners();
             return;
        }

        // 显示时间戳头部
        let html = `
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1 flex flex-col gap-0.5">
                <div class="font-medium">发现更新</div>
                <div class="opacity-70 text-[10px]">${initTimeStr} - ${checkTimeStr}</div>
            </div>`;

        newPosts.forEach(post => {
            const isUpdated = post.isUpdated || false;
            const badge = isUpdated
                ? '<span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded ml-2">更新</span>'
                : '<span class="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-1.5 py-0.5 rounded ml-2">新文章</span>';

            // 为更新的文章生成差异查看按钮
            let diffButton = '';
            const safeId = 'diff-' + post.guid.replace(/[^a-zA-Z0-9-_]/g, '_');

            if (isUpdated && post.diff) {
                diffButton = `
                <button data-diff-toggle="${safeId}" class="ml-auto text-xs text-[var(--primary)] hover:underline focus:outline-none pointer-events-auto">
                    查看变更
                </button>`;
            }

            html += `
            <div class="mb-2 last:mb-0">
                <div class="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--primary)]/5 transition-colors">
                    <a href="${post.link}" class="font-medium truncate pr-2 hover:text-[var(--primary)] transition-colors text-black dark:text-white block flex-1">
                        ${post.title}
                    </a>
                    <div class="flex items-center shrink-0">
                        ${diffButton}
                        ${badge}
                    </div>
                </div>
                ${isUpdated && post.diff ? `
                <div id="${safeId}" class="hidden mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                    ${post.diff.map(part => {
                        const colorClass = part.added ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 block my-1 p-1 rounded break-all whitespace-pre-wrap' :
                                         part.removed ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 block my-1 p-1 rounded break-all whitespace-pre-wrap' :
                                         'text-gray-500 dark:text-gray-400 block my-1 p-1 break-all whitespace-pre-wrap';
                        return `<div class="${colorClass}">${part.value}</div>`;
                    }).join('')}
                </div>
                ` : ''}
            </div>`;
        });

        if (list) {
            list.innerHTML = html;
        }

        // 显示红点通知
        if (isFresh) {
             dot?.classList.remove('hidden');
             // 自动打开面板
             setTimeout(() => {
                 openPanel();
             }, 1500);
        } else {
             dot?.classList.add('hidden');
        }

        setupEventListeners();

        function setupEventListeners() {
            // 状态管理函数
            const openPanel = () => {
                if (panel) {
                    panel.classList.remove('hidden');
                    // 小延迟以允许 display:block 在过渡前应用
                    requestAnimationFrame(() => {
                        panel.classList.remove('-translate-y-4', 'opacity-0', 'scale-95');
                    });
                    dot?.classList.add('hidden'); // 打开时隐藏红点
                }
            };

            const closePanel = () => {
                if (panel) {
                    panel.classList.add('-translate-y-4', 'opacity-0', 'scale-95');
                    setTimeout(() => {
                        panel.classList.add('hidden');
                    }, 300); // 匹配过渡持续时间
                }
            };

            // 事件监听器
            if (minimizedBtn) {
                minimizedBtn.onclick = () => {
                    if (panel) {
                        if (panel.classList.contains('hidden')) {
                            openPanel();
                        } else {
                            closePanel();
                        }
                    }
                };

                if (minimizeBtn) {
                    minimizeBtn.onclick = (e: MouseEvent) => {
                        e.stopPropagation();
                        closePanel();
                        // 关闭面板后完全隐藏铃铛
                        // 等待面板关闭动画完成
                        setTimeout(() => {
                            if (minimizedBtn) {
                                // 添加动画类
                                minimizedBtn.classList.add('translate-y-20', 'opacity-0');
                                // 动画开始后添加 pointer-events-none
                                setTimeout(() => {
                                    minimizedBtn.classList.add('pointer-events-none'); // 隐藏时防止点击
                                    // 也将其移到屏幕外以确保它不会接收点击
                                    minimizedBtn.style.position = 'fixed';
                                    minimizedBtn.style.left = '-100px';
                                    minimizedBtn.style.top = '-100px';
                                }, 100);
                            }
                        }, 300);
                    };
                }
            }

            if (clearBtn) {
                clearBtn.onclick = (e: MouseEvent) => {
                    e.stopPropagation();
                    // 从 localStorage 清除状态
                    localStorage.removeItem(NOTIFICATION_STATE_KEY);

                    // 更新初始化时间为当前时间
                    const now = Date.now();
                    localStorage.setItem(INIT_TIME_KEY, now.toString());

                    // 用新的初始化时间刷新视图
                    showNotification([], now, false, now);
                };
            }

            // 添加事件委托
            if (list && !list.hasAttribute('data-listening')) {
                list.addEventListener('click', (e: MouseEvent) => {
                    const target = e.target as Element;
                    const btn = target.closest('[data-diff-toggle]') as HTMLElement | null;
                    if (btn) {
                        const targetId = btn.getAttribute('data-diff-toggle');
                        if (targetId) {
                            const element = document.getElementById(targetId);
                            if (element) {
                                element.classList.toggle('hidden');
                            }
                        }
                    }
                });
                list.setAttribute('data-listening', 'true');
            }
        }

        // 从外部触发打开的辅助函数
        function openPanel() {
            if (panel) {
                panel.classList.remove('hidden');
                // 小延迟以允许 display:block 在过渡前应用
                requestAnimationFrame(() => {
                    panel.classList.remove('-translate-y-4', 'opacity-0', 'scale-95');
                });
                dot?.classList.add('hidden');
            }
        }

        const closePanel = () => {
            if (panel) {
                panel.classList.add('-translate-y-4', 'opacity-0', 'scale-95');
                setTimeout(() => {
                    panel.classList.add('hidden');
                }, 300); // 匹配过渡持续时间
            }
        };

        // 事件监听器
        if (minimizedBtn) {
            minimizedBtn.onclick = () => {
                if (panel) {
                    if (panel.classList.contains('hidden')) {
                        openPanel();
                    } else {
                        closePanel();
                    }
                }
            };

            if (minimizeBtn) {
                minimizeBtn.onclick = (e: MouseEvent) => {
                    e.stopPropagation();
                    closePanel();
                    setTimeout(() => {
                        // 添加动画类
                        minimizedBtn.classList.add('translate-y-20', 'opacity-0');
                        // 动画开始后添加 pointer-events-none
                        setTimeout(() => {
                            minimizedBtn.classList.add('pointer-events-none'); // 隐藏时防止点击
                            // 也将其移到屏幕外以确保它不会接收点击
                            minimizedBtn.style.position = 'fixed';
                            minimizedBtn.style.left = '-100px';
                            minimizedBtn.style.top = '-100px';
                        }, 100);
                    }, 300);
                };
            }

            if (clearBtn) {
                clearBtn.onclick = (e: MouseEvent) => {
                    e.stopPropagation();
                    localStorage.removeItem(NOTIFICATION_STATE_KEY);
                    const now = Date.now();
                    localStorage.setItem(INIT_TIME_KEY, now.toString());
                    showNotification([], now, false, now);
                };
            }
        }
    }

    // 主函数
    async function main(): Promise<void> {
        try {
            const db = await openDB();
            const storedPosts = await getStoredPosts(db);
            const fetchedPosts = await fetchRSS();

            const initTime = Date.now();
            const NOTIFICATION_STATE_KEY = 'mapleblog-notification-state';
            const INIT_TIME_KEY = 'mapleblog-notification-init-time';

            const lastInitTime = localStorage.getItem(INIT_TIME_KEY);
            localStorage.setItem(INIT_TIME_KEY, initTime.toString());

            const isFresh = !lastInitTime;

            // 比较存储的和获取的
            const storedGuids = new Set(storedPosts.map(p => p.guid));
            const newPosts: Post[] = [];

            for (const post of fetchedPosts) {
                const existingPost = storedPosts.find(p => p.guid === post.guid);

                if (!existingPost) {
                    // 新文章
                    newPosts.push({ ...post, isUpdated: false });
                } else if (existingPost.content !== post.content) {
                    // 更新的文章
                    const diff = computeDiff(existingPost.content, post.content);
                    if (diff) {
                        newPosts.push({ ...post, isUpdated: true, diff });
                    }
                }
            }

            // 保存所有获取的文章
            await savePosts(db, fetchedPosts);

            // 总是显示通知
            showNotification(newPosts, initTime, isFresh, initTime);
        } catch (error) {
            console.error('Error in new post notification:', error);
        }
    }

    // 全局暴露 toggleDiff 函数
    (window as any).toggleDiff = function(id: string): void {
        const element = document.getElementById(id);
        if (element) {
            element.classList.toggle('hidden');
        }
    };

    // 运行主函数
    main();
    })();
</script>
```

### PostContentHighlighter.astro

```html
<style>
    /* Liquid glass effect */
    #post-update-notification > div {
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
    }
</style>

<div id="post-update-notification" class="fixed top-20 right-4 z-50 transform translate-x-full opacity-0 transition-all duration-300 pointer-events-none">
    <div class="bg-blue-100/80 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-xl shadow-lg p-4 max-w-sm relative pointer-events-auto flex flex-col gap-2">
        <div class="flex items-center gap-2 text-blue-600 dark:text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <span class="font-bold text-sm">内容已更新</span>
        </div>
        <p class="text-xs text-[var(--text-main)] opacity-80">检测到文章内容有变化，已为您高亮差异部分。</p>
        <div class="flex gap-2 mt-1">
            <button id="scroll-to-diff" class="px-3 py-1 bg-[var(--admonitions-color-tip)] text-white rounded text-xs hover:opacity-90 transition-opacity">
                跳转到更新处
            </button>
            <button id="close-diff-toast" class="px-3 py-1 bg-transparent border border-[var(--line-divider)] text-[var(--text-main)] rounded text-xs hover:bg-[var(--btn-regular-bg-hover)] transition-colors">
                忽略
            </button>
        </div>
    </div>
</div>

<script>
    import * as Diff from 'diff';

    // 从 markdown 容器获取纯文本内容的辅助函数
    function getContentText() {
        const container = document.querySelector('.markdown-content');
        return container ? container.textContent || '' : '';
    }

    // 存储内容哈希/文本的辅助函数
    const STORAGE_PREFIX = 'mapleblog-post-content-cache-';

    async function initDiffCheck() {
        // 只在文章页面运行
        const postContainer = document.getElementById('post-container');
        if (!postContainer) return;

        const currentPath = window.location.pathname;
        const storageKey = STORAGE_PREFIX + currentPath;
        const currentText = getContentText();

        // 开发者模式检查
        const urlParams = new URLSearchParams(window.location.search);
        const isDevMode = urlParams.has('debug-diff');

        if (isDevMode) {
            console.log('[Diff] Developer mode active');
            // 通过移除随机段落或添加虚拟文本模拟旧文本
            const paragraphs = currentText.split('\n\n');
            // 模拟中间段落是新的
            const middleIndex = Math.floor(paragraphs.length / 2);
            const oldText = paragraphs.filter((_, i) => i !== middleIndex).join('\n\n');

            highlightDiff(oldText, currentText);
            return;
        }

        const cachedText = localStorage.getItem(storageKey);

        if (!cachedText) {
            // 首次访问，缓存当前文本
            localStorage.setItem(storageKey, currentText);
        } else if (cachedText !== currentText) {
            // 内容已更改
            console.log('[Diff] Content change detected');
            highlightDiff(cachedText, currentText);
            // 更新缓存
            localStorage.setItem(storageKey, currentText);
        }
    }

    function highlightDiff(oldText: string, newText: string) {
        if (!oldText || !newText) return;
        
        const diff = Diff.diffWords(oldText, newText);
        const container = document.querySelector('.markdown-content');
        if (!container) return;

        // 过滤出重要的添加部分
        const addedParts = diff.filter(part => part.added && part.value.trim().length > 10);

        if (addedParts.length === 0) return;

        // 显示通知
        const notification = document.getElementById('post-update-notification');
        if (notification) {
            notification.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');

            document.getElementById('close-diff-toast')?.addEventListener('click', () => {
                notification.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
            });

            document.getElementById('scroll-to-diff')?.addEventListener('click', () => {
                scrollToFirstDiff(addedParts[0].value);
            });
        }
    }

    function scrollToFirstDiff(textToFind: string) {
        if (!textToFind) return;
        
        // 尝试找到包含此文本的文本节点
        const container = document.querySelector('.markdown-content');
        if (!container) return;

        // 清理搜索文本
        const searchStr = textToFind.trim().substring(0, 50); // 搜索前 50 个字符

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent && node.textContent.includes(searchStr)) {
                // 找到它！
                const range = document.createRange();
                range.selectNodeContents(node);
                const rect = range.getBoundingClientRect();

                // 高亮
                const span = document.createElement('span');
                span.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                span.style.transition = 'background-color 1s';
                span.className = 'diff-highlight-flash';

                // 滚动到父元素
                const parent = node.parentElement;
                if (parent) {
                    parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    parent.classList.add('animate-pulse'); // Tailwind 脉冲动画
                    setTimeout(() => parent.classList.remove('animate-pulse'), 2000);
                }

                return;
            }
        }
    }

    // 在加载和 swup 导航时初始化
    document.addEventListener('DOMContentLoaded', initDiffCheck);
    document.addEventListener('swup:contentReplaced', initDiffCheck);

</script>
```

## 结语

新文章通知功能是一个提升博客用户体验的重要特性，它能够让读者及时了解博客的最新动态，并且能够清晰地看到文章的具体变更。通过本文的实现方案，你可以为你的 Astro 博客添加这个功能，让你的博客更加现代化和用户友好。

希望本文对你有所帮助！如果你有任何问题或建议，欢迎在评论区留言。

</div>
