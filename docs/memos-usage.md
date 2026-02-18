# 外部调用 Memos 数据指南

本文档介绍如何在其他博客或应用中调用和创建 Cofe 博客的 Memos 数据。

---

## 目录

1. [获取 Memos 数据](#获取-memos-数据)
2. [创建 Memos](#创建-memos)
3. [在 Hexo 中使用](#在-hexo-中使用)
4. [在 Vue/React 中使用](#在-vuereact-中使用)
5. [在静态页面中使用](#在静态页面中使用)

---

## 获取 Memos 数据

### 基础请求

**接口地址**: `https://cofe.050815.xyz/api/graphql`

**请求方式**: POST

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "query": "query GetMemos { memos { id content timestamp image latitude longitude city street } }"
}
```

### cURL 示例

```bash
curl -X POST https://cofe.050815.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetMemos { memos { id content timestamp image city } }"
  }'
```

### JavaScript/Fetch 示例

```javascript
async function fetchMemos() {
  const response = await fetch('https://cofe.050815.xyz/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
        query GetMemos {
          memos {
            id
            content
            timestamp
            image
            city
          }
        }
      `
    })
  });
  
  const { data } = await response.json();
  return data.memos;
}

// 使用
fetchMemos().then(memos => {
  console.log(memos);
  // 渲染到页面
});
```

### Python 示例

```python
import requests

def fetch_memos():
    url = "https://cofe.050815.xyz/api/graphql"
    headers = {"Content-Type": "application/json"}
    payload = {
        "query": """
            query GetMemos {
                memos {
                    id
                    content
                    timestamp
                    image
                    city
                }
            }
        """
    }
    
    response = requests.post(url, json=payload, headers=headers)
    data = response.json()
    return data["data"]["memos"]

# 使用
memos = fetch_memos()
for memo in memos:
    print(f"{memo['timestamp']}: {memo['content']}")
```

---

## 创建 Memos

> ⚠️ **注意**: 创建 Memos 需要认证，必须先获取 session token。

### 获取 Session Token

1. 访问 `https://cofe.050815.xyz/login` 并登录
2. 打开浏览器开发者工具 (F12)
3. 进入 Application → Cookies
4. 复制 `next-auth.session-token` 的值

### 创建请求

```bash
curl -X POST https://cofe.050815.xyz/api/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "query": "mutation CreateMemo($input: CreateMemoInput!) { createMemo(input: $input) { id content timestamp } }",
    "variables": {
      "input": {
        "content": "这是一条新便签",
        "image": "https://example.com/image.jpg"
      }
    }
  }'
```

### JavaScript 示例

```javascript
async function createMemo(content, image = null, sessionToken) {
  const response = await fetch('https://cofe.050815.xyz/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${sessionToken}`
    },
    body: JSON.stringify({
      query: `
        mutation CreateMemo($input: CreateMemoInput!) {
          createMemo(input: $input) {
            id
            content
            timestamp
          }
        }
      `,
      variables: {
        input: {
          content,
          image
        }
      }
    })
  });
  
  const { data } = await response.json();
  return data.createMemo;
}
```

---

## 在 Hexo 中使用

### 创建 Memos 页面

1. 在 Hexo 博客中创建新页面：

```bash
hexo new page memos
```

2. 编辑 `source/memos/index.md`：

```markdown
---
title: 我的便签
layout: page
---

<div id="memos-container"></div>

<script>
async function loadMemos() {
  const response = await fetch('https://cofe.050815.xyz/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query GetMemos {
          memos {
            id
            content
            timestamp
            image
          }
        }
      `
    })
  });
  
  const { data } = await response.json();
  const container = document.getElementById('memos-container');
  
  data.memos.forEach(memo => {
    const memoEl = document.createElement('div');
    memoEl.className = 'memo-item';
    memoEl.innerHTML = `
      <div class="memo-content">${memo.content}</div>
      <div class="memo-time">${new Date(memo.timestamp).toLocaleString()}</div>
      ${memo.image ? `<img src="${memo.image}" class="memo-image">` : ''}
    `;
    container.appendChild(memoEl);
  });
}

loadMemos();
</script>

<style>
.memo-item {
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
}
.memo-time {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}
.memo-image {
  max-width: 100%;
  margin-top: 10px;
  border-radius: 4px;
}
</style>
```

---

## 在 Vue/React 中使用

### Vue 3 示例

```vue
<template>
  <div class="memos">
    <h2>我的便签</h2>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else class="memo-list">
      <div v-for="memo in memos" :key="memo.id" class="memo-card">
        <div class="memo-content" v-html="renderMarkdown(memo.content)"></div>
        <div class="memo-meta">
          <span>{{ formatDate(memo.timestamp) }}</span>
          <span v-if="memo.city">📍 {{ memo.city }}</span>
        </div>
        <img v-if="memo.image" :src="memo.image" class="memo-image">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { marked } from 'marked'

const memos = ref([])
const loading = ref(false)
const error = ref(null)

async function fetchMemos() {
  loading.value = true
  try {
    const response = await fetch('https://cofe.050815.xyz/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetMemos {
            memos {
              id
              content
              timestamp
              image
              city
            }
          }
        `
      })
    })
    const { data } = await response.json()
    memos.value = data.memos
  } catch (err) {
    error.value = '加载失败: ' + err.message
  } finally {
    loading.value = false
  }
}

function renderMarkdown(content) {
  return marked(content)
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN')
}

onMounted(fetchMemos)
</script>

<style scoped>
.memo-list {
  display: grid;
  gap: 16px;
}
.memo-card {
  border: 1px solid #e0e0e0;
  padding: 16px;
  border-radius: 8px;
}
.memo-meta {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}
.memo-image {
  max-width: 100%;
  margin-top: 12px;
  border-radius: 4px;
}
</style>
```

### React 示例

```tsx
import { useState, useEffect } from 'react'
import { marked } from 'marked'

interface Memo {
  id: string
  content: string
  timestamp: string
  image?: string
  city?: string
}

export default function Memos() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMemos()
  }, [])

  async function fetchMemos() {
    setLoading(true)
    try {
      const response = await fetch('https://cofe.050815.xyz/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetMemos {
              memos {
                id
                content
                timestamp
                image
                city
              }
            }
          `
        })
      })
      const { data } = await response.json()
      setMemos(data.memos)
    } catch (err) {
      setError('加载失败: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>
  if (error) return <div>{error}</div>

  return (
    <div className="memos">
      <h2>我的便签</h2>
      <div className="memo-list">
        {memos.map(memo => (
          <div key={memo.id} className="memo-card">
            <div 
              className="memo-content" 
              dangerouslySetInnerHTML={{ __html: marked(memo.content) }}
            />
            <div className="memo-meta">
              <span>{new Date(memo.timestamp).toLocaleString('zh-CN')}</span>
              {memo.city && <span>📍 {memo.city}</span>}
            </div>
            {memo.image && <img src={memo.image} className="memo-image" />}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 在静态页面中使用

### 纯 HTML + JavaScript

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的便签</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .memo-item {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .memo-content {
      line-height: 1.6;
    }
    .memo-content img {
      max-width: 100%;
      border-radius: 8px;
    }
    .memo-meta {
      color: #999;
      font-size: 14px;
      margin-top: 12px;
      display: flex;
      gap: 16px;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #999;
    }
  </style>
</head>
<body>
  <h1>📒 我的便签</h1>
  <div id="memos-container">
    <div class="loading">加载中...</div>
  </div>

  <script>
    async function loadMemos() {
      try {
        const response = await fetch('https://cofe.050815.xyz/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetMemos {
                memos {
                  id
                  content
                  timestamp
                  image
                  city
                }
              }
            `
          })
        });
        
        const { data } = await response.json();
        const container = document.getElementById('memos-container');
        
        if (data.memos.length === 0) {
          container.innerHTML = '<div class="loading">暂无便签</div>';
          return;
        }
        
        container.innerHTML = data.memos.map(memo => `
          <div class="memo-item">
            <div class="memo-content">${formatContent(memo.content)}</div>
            <div class="memo-meta">
              <span>🕐 ${new Date(memo.timestamp).toLocaleString('zh-CN')}</span>
              ${memo.city ? `<span>📍 ${memo.city}</span>` : ''}
            </div>
            ${memo.image ? `<img src="${memo.image}" style="max-width:100%;margin-top:12px;border-radius:8px;">` : ''}
          </div>
        `).join('');
        
      } catch (error) {
        document.getElementById('memos-container').innerHTML = `
          <div class="loading">加载失败: ${error.message}</div>
        `;
      }
    }

    function formatContent(content) {
      // 简单的 Markdown 转换
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:#f0f0f0;padding:2px 4px;border-radius:4px;">$1</code>')
        .replace(/\n/g, '<br>');
    }

    loadMemos();
  </script>
</body>
</html>
```

---

## 常见问题

### Q: 请求被 CORS 拦截怎么办？

A: 由于 GraphQL API 不支持跨域，你需要：
1. 使用服务器端代理
2. 使用 Vercel/Cloudflare Serverless Function 中转
3. 在服务端渲染时获取数据

### Q: 如何实时同步数据？

A: 可以使用轮询或 WebSocket：

```javascript
// 轮询方式
setInterval(fetchMemos, 30000); // 每30秒刷新
```

### Q: 数据格式是什么？

A: 完整的数据类型定义请参考 [memos.ts](./memos.ts)

---

## 相关文档

- [API 文档](./API.md)
- [TypeScript 类型定义](./memos.ts)
