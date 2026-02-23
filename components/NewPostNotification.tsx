'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import * as Diff from 'diff'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// 调试日志工具（生产环境禁用）
const DEBUG_PREFIX = '[NewPostNotification]'
function debugLog(step: string, data?: unknown) {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toLocaleTimeString()
    if (data !== undefined) {
      console.log(`${DEBUG_PREFIX} [${timestamp}] ${step}`, data)
    } else {
      console.log(`${DEBUG_PREFIX} [${timestamp}] ${step}`)
    }
  }
}
function debugError(step: string, error: unknown) {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toLocaleTimeString()
    console.error(`${DEBUG_PREFIX} [${timestamp}] ❌ ${step}`, error)
  }
}
function debugSuccess(step: string) {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`${DEBUG_PREFIX} [${timestamp}] ✅ ${step}`)
  }
}

export interface Post {
  title: string
  link: string
  guid: string
  pubDate: number
  content: string
  description?: string
  isUpdated?: boolean
  diff?: Array<{
    value: string
    added?: boolean
    removed?: boolean
  }>
}

const DB_NAME = 'cofe-blog-rss-store'
const DB_VERSION = 4
const STORE_OLD = 'posts'
const STORE_NEW = 'posts_new'
const NOTIFICATION_STATE_KEY = 'cofe-notification-state'
const INIT_TIME_KEY = 'cofe-notification-init-time'
const DEBUG_STATE_KEY = 'cofe-diff-debug-state'
const CHECK_INTERVAL = 5 * 60 * 1000

function normalizeGuid(guid: string, link: string) {
  debugLog('Step 1.1: normalizeGuid 输入', { guid: guid?.substring(0, 50), link: link?.substring(0, 50) })
  const value = (guid || link || '').trim()
  if (!value) {
    debugLog('Step 1.2: normalizeGuid 结果为空')
    return ''
  }
  try {
    const url = new URL(value, window.location.origin)
    const result = `${url.pathname}${url.search}${url.hash}`
    debugLog('Step 1.2: normalizeGuid 成功', result)
    return result
  } catch {
    debugLog('Step 1.2: normalizeGuid 失败，返回原值', value.substring(0, 50))
    return value
  }
}

function generateId(guid: string) {
  const id = `root:${guid}`
  debugLog('Step 1.3: generateId', id)
  return id
}

function computeDiff(oldText: string, newText: string) {
  debugLog('Step 4.1: computeDiff 开始', { 
    oldTextLength: oldText?.length, 
    newTextLength: newText?.length,
    oldTextPreview: oldText?.substring(0, 100),
    newTextPreview: newText?.substring(0, 100)
  })
  
  if (!oldText || !newText) {
    debugLog('Step 4.2: computeDiff 返回 null - 文本为空')
    return null
  }

  // 直接对原始文本进行行级 diff
  debugLog('Step 4.3: 调用 Diff.diffLines')
  const diffs = Diff.diffLines(oldText, newText)
  debugLog('Step 4.4: diff 结果块数', diffs.length)
  
  const hasChanges = diffs.some((part) => part.added || part.removed)
  debugLog('Step 4.5: 是否有变更', hasChanges)

  if (!hasChanges) {
    debugLog('Step 4.6: computeDiff 返回 null - 无变更')
    return null
  }

  // 过滤出有变更的部分用于调试
  const changedParts = diffs.filter(p => p.added || p.removed)
  debugLog('Step 4.6: 变更块详情', changedParts.map(p => ({
    type: p.added ? 'added' : p.removed ? 'removed' : 'context',
    length: p.value?.length,
    preview: p.value?.substring(0, 50)
  })))

  debugSuccess('computeDiff 完成')
  return diffs
}

export default function NewPostNotification() {
  debugLog('===== 组件初始化 =====')
  
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const [newPosts, setNewPosts] = useState<Post[]>([])
  const [initTime, setInitTime] = useState<number>(0)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  const openDB = useCallback((): Promise<IDBDatabase> => {
    debugLog('Step 2.1: openDB 开始')
    return new Promise((resolve, reject) => {
      debugLog('Step 2.2: 调用 indexedDB.open', { DB_NAME, DB_VERSION })
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => {
        debugError('Step 2.3: 打开数据库失败', request.error)
        reject(request.error)
      }
      
      request.onsuccess = () => {
        debugSuccess('Step 2.3: 数据库打开成功')
        resolve(request.result)
      }
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        debugLog('Step 2.4: 数据库升级中...')
        const db = (event.target as IDBOpenDBRequest).result
        const ensureStore = (name: string) => {
          debugLog('Step 2.5: 检查 store', name)
          if (db.objectStoreNames.contains(name)) {
            debugLog('Step 2.6: store 已存在', name)
            const existingStore = (event.target as IDBOpenDBRequest).transaction?.objectStore(name)
            if (existingStore && existingStore.keyPath !== 'id') {
              debugLog('Step 2.7: 删除旧 store', name)
              db.deleteObjectStore(name)
              db.createObjectStore(name, { keyPath: 'id' })
              debugSuccess(`Step 2.8: store ${name} 重建完成`)
            }
            return
          }
          debugLog('Step 2.6: 创建新 store', name)
          db.createObjectStore(name, { keyPath: 'id' })
          debugSuccess(`Step 2.7: store ${name} 创建完成`)
        }
        ensureStore(STORE_OLD)
        ensureStore(STORE_NEW)
      }
    })
  }, [])

  const getStoredPosts = useCallback(async (db: IDBDatabase, storeName: string): Promise<Post[]> => {
    debugLog('Step 3.1: getStoredPosts 开始', storeName)
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const posts = request.result as Post[]
        debugLog('Step 3.2: 读取存储的文章', { 
          count: posts.length,
          titles: posts.map(p => p.title)
        })
        resolve(posts)
      }
      
      request.onerror = () => {
        debugError('Step 3.2: 读取存储失败', request.error)
        reject(request.error)
      }
    })
  }, [])

  const savePosts = useCallback(async (db: IDBDatabase, storeName: string, posts: Post[]): Promise<void> => {
    debugLog('Step 6.1: savePosts 开始', { storeName, postCount: posts.length })
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)

      // 先清空旧数据
      debugLog('Step 6.2: 清空旧数据')
      const clearRequest = store.clear()
      
      clearRequest.onsuccess = () => {
        debugSuccess('Step 6.3: 清空完成，开始存储新数据')
      }
      
      clearRequest.onerror = () => {
        debugError('Step 6.3: 清空失败', clearRequest.error)
        reject(clearRequest.error)
      }

      // 使用 request 的 onsuccess 来跟踪所有 put 操作
      let completedCount = 0
      const totalCount = posts.length
      
      if (totalCount === 0) {
        debugLog('没有文章需要存储')
        resolve()
        return
      }
      
      // 再存储新数据
      posts.forEach((post, index) => {
        const itemToSave = { ...post, id: generateId(post.guid) }
        debugLog(`Step 6.4: 存储文章 ${index + 1}/${posts.length}`, { title: post.title, id: itemToSave.id })
        const putRequest = store.put(itemToSave)
        
        putRequest.onsuccess = () => {
          completedCount++
          debugLog(`Step 6.4.${index + 1}: 文章 ${post.title} 存储成功 (${completedCount}/${totalCount})`)
        }
        
        putRequest.onerror = () => {
          debugError(`Step 6.4.${index + 1}: 文章 ${post.title} 存储失败`, putRequest.error)
        }
      })

      transaction.oncomplete = () => {
        debugSuccess(`Step 6.5: 所有文章存储完成 (${completedCount}/${totalCount})`)
        resolve()
      }
      
      transaction.onerror = () => {
        debugError('Step 6.5: 事务失败', transaction.error)
        reject(transaction.error)
      }
    })
  }, [])

  const fetchRSS = useCallback(async (): Promise<Post[]> => {
    debugLog('Step 5.1: fetchRSS 开始')
    try {
      // 添加时间戳防止缓存
      const timestamp = Date.now()
      const url = `/atom.xml?t=${timestamp}`
      debugLog('Step 5.2: 请求 URL', url)
      
      const response = await fetch(url, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      debugLog('Step 5.3: 响应状态', { status: response.status, ok: response.ok })
      
      const text = await response.text()
      debugLog('Step 5.4: 获取文本长度', text.length)
      
      const parser = new DOMParser()
      const xml = parser.parseFromString(text, 'text/xml')
      
      // 检查解析错误
      const parseError = xml.querySelector('parsererror')
      if (parseError) {
        debugError('Step 5.5: XML 解析错误', parseError.textContent)
      }

      const items = Array.from(xml.querySelectorAll('entry'))
      debugLog('Step 5.6: 找到 entry 条目数', items.length)

      const posts = items.map((item, index) => {
        debugLog(`Step 5.7: 解析文章 ${index + 1}/${items.length}`)
        
        const title = item.querySelector('title')?.textContent || ''
        const link = (item.querySelector('link')?.getAttribute('href') || '').trim()
        const rawGuid = (item.querySelector('id')?.textContent || '').trim()
        const pubDateStr = item.querySelector('updated')?.textContent || item.querySelector('published')?.textContent || ''
        const pubDate = new Date(pubDateStr).getTime()
        const content = item.querySelector('content')?.textContent || ''
        const description = item.querySelector('summary')?.textContent || ''

        const guid = normalizeGuid(rawGuid || link, link)

        const post = {
          title,
          link,
          guid,
          pubDate,
          description,
          content,
        }
        
        debugLog(`Step 5.8: 文章 ${index + 1} 解析结果`, {
          title: post.title,
          link: post.link,
          guid: post.guid,
          contentLength: post.content?.length
        })
        
        return post
      })
      
      debugSuccess(`Step 5.9: fetchRSS 完成，共 ${posts.length} 篇文章`)
      return posts
    } catch (e) {
      debugError('Step 5.9: fetchRSS 失败', e)
      return []
    }
  }, [])

  const checkForNewPosts = useCallback(async () => {
    debugLog('========== 开始检查文章更新 ==========')
    
    try {
      debugLog('Step 1: 打开数据库')
      const db = await openDB()
      
      debugLog('Step 2: 获取存储的文章')
      const storedPosts = await getStoredPosts(db, STORE_OLD)
      
      debugLog('Step 3: 获取 RSS 文章')
      const fetchedPosts = await fetchRSS()

      const currentTime = Date.now()
      const lastInitTime = localStorage.getItem(INIT_TIME_KEY)
      const isFirstVisit = storedPosts.length === 0

      debugLog('Step 4: 检查状态', {
        storedCount: storedPosts.length,
        fetchedCount: fetchedPosts.length,
        isFirstVisit,
        lastInitTime
      })

      if (isFirstRender.current) {
        debugLog('Step 4.1: 首次渲染标记')
        isFirstRender.current = false
      }

      // 首次访问：只存储数据，不显示通知
      if (isFirstVisit) {
        debugLog('Step 5: 首次访问，存储数据')
        await savePosts(db, STORE_OLD, fetchedPosts)
        localStorage.setItem(INIT_TIME_KEY, currentTime.toString())
        debugSuccess('Step 5.1: 首次访问数据处理完成')
        return
      }

      // 后续访问：比较差异
      debugLog('Step 6: 开始比较文章差异')
      const newOrUpdatedPosts: Post[] = []

      for (let i = 0; i < fetchedPosts.length; i++) {
        const post = fetchedPosts[i]
        debugLog(`Step 6.${i + 1}: 检查文章 "${post.title}"`)
        
        const existingPost = storedPosts.find((p) => p.guid === post.guid)
        debugLog(`Step 6.${i + 1}.1: 查找已存储文章`, { 
          found: !!existingPost,
          guid: post.guid 
        })

        if (!existingPost) {
          // 新文章
          debugLog(`Step 6.${i + 1}.2: ✅ 发现新文章`, post.title)
          newOrUpdatedPosts.push({ ...post, isUpdated: false })
        } else if (existingPost.content !== post.content) {
          // 文章更新
          debugLog(`Step 6.${i + 1}.2: 📝 文章内容不同`, {
            title: post.title,
            oldContentLength: existingPost.content?.length,
            newContentLength: post.content?.length,
            oldContentPreview: existingPost.content?.substring(0, 100),
            newContentPreview: post.content?.substring(0, 100)
          })
          
          const diff = computeDiff(existingPost.content, post.content)
          
          if (diff) {
            debugLog(`Step 6.${i + 1}.3: ✅ 发现文章更新且有 diff`, post.title)
            newOrUpdatedPosts.push({ ...post, isUpdated: true, diff })
          } else {
            debugLog(`Step 6.${i + 1}.3: ⚠️ 内容不同但 diff 为空`)
          }
        } else {
          debugLog(`Step 6.${i + 1}.2: ➖ 文章无变更`, post.title)
        }
      }

      debugLog('Step 7: 比较完成', { 
        changedCount: newOrUpdatedPosts.length,
        changedTitles: newOrUpdatedPosts.map(p => p.title)
      })

      // 用新数据覆盖旧数据
      debugLog('Step 8: 保存新数据到 IndexedDB')
      await savePosts(db, STORE_OLD, fetchedPosts)

      // 更新检查时间
      localStorage.setItem(INIT_TIME_KEY, currentTime.toString())
      debugLog('Step 9: 更新时间戳')

      // 有变更时显示通知
      if (newOrUpdatedPosts.length > 0) {
        debugLog('Step 10: ✅ 有文章变更，更新状态', {
          count: newOrUpdatedPosts.length,
          posts: newOrUpdatedPosts.map(p => ({ title: p.title, isUpdated: p.isUpdated }))
        })
        
        setNewPosts(newOrUpdatedPosts)
        setHasNewPosts(true)
        setInitTime(Number(lastInitTime) || currentTime)
        setLastCheckTime(currentTime)
        
        // 关键：将变更数据存储到 sessionStorage，供文章页面使用
        const updatedPostsWithDiff = newOrUpdatedPosts.filter(p => p.isUpdated && p.diff)
        debugLog('Step 10.1: 需要存储 diff 的文章数', updatedPostsWithDiff.length)
        
        if (updatedPostsWithDiff.length > 0) {
          // 存储所有变更文章的列表（用于通知面板）
          const storageData = {
            items: updatedPostsWithDiff,
            timestamp: currentTime
          }
          debugLog('Step 10.2: 存储到 sessionStorage (列表)', storageData)
          sessionStorage.setItem(DEBUG_STATE_KEY, JSON.stringify(storageData))
          
          // 为每个文章单独存储 diff 数据（用于文章页面）
          updatedPostsWithDiff.forEach(post => {
            try {
              // 使用 guid 作为路径（guid 已经是 pathname 格式，如 /blog/文章名）
              const postPath = post.guid
              const postKey = `post-diff-${postPath}`
              const postData = {
                title: post.title,
                link: post.link,
                guid: post.guid,
                diff: post.diff,
                timestamp: currentTime
              }
              debugLog(`Step 10.2a: 存储文章 diff 数据`, { key: postKey, title: post.title, path: postPath })
              sessionStorage.setItem(postKey, JSON.stringify(postData))
            } catch (e) {
              debugError('Step 10.2a: 存储文章 diff 失败', e)
            }
          })
          
          debugSuccess('Step 10.3: sessionStorage 存储完成')
        }
      } else {
        debugLog('Step 10: ➖ 无文章变更')
      }

      debugSuccess('========== 检查完成 ==========')
    } catch (error) {
      debugError('========== 检查出错 ==========', error)
    }
  }, [openDB, getStoredPosts, fetchRSS, savePosts])

  const clearNotification = useCallback(() => {
    debugLog('清除通知状态')
    localStorage.removeItem(NOTIFICATION_STATE_KEY)
    sessionStorage.removeItem(DEBUG_STATE_KEY)
    const now = Date.now()
    localStorage.setItem(INIT_TIME_KEY, now.toString())
    setNewPosts([])
    setHasNewPosts(false)
    setInitTime(now)
    setLastCheckTime(now)
    debugSuccess('通知状态已清除')
  }, [])

  const handleClose = useCallback(() => {
    debugLog('关闭通知面板')
    setIsOpen(false)
    setTimeout(() => setIsMinimized(true), 300)
  }, [])

  // 从 sessionStorage 恢复之前检测到的变更
  useEffect(() => {
    debugLog('===== 尝试从 sessionStorage 恢复数据 =====')
    try {
      const stored = sessionStorage.getItem(DEBUG_STATE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.items && data.items.length > 0) {
          debugLog('从 sessionStorage 恢复变更数据', { count: data.items.length })
          setNewPosts(data.items)
          setHasNewPosts(true)
          setInitTime(data.timestamp || Date.now())
          setLastCheckTime(data.timestamp || Date.now())
        }
      }
    } catch (e) {
      debugError('从 sessionStorage 恢复数据失败', e)
    }
  }, [])

  useEffect(() => {
    debugLog('===== useEffect 触发，开始检查 =====')
    checkForNewPosts()

    intervalRef.current = setInterval(() => {
      debugLog('===== 定时器触发，开始检查 =====')
      checkForNewPosts()
    }, CHECK_INTERVAL)

    return () => {
      debugLog('清理定时器')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkForNewPosts])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const showDot = hasNewPosts && newPosts.length > 0 && isMinimized

  debugLog('===== 渲染组件 =====', { 
    hasNewPosts, 
    newPostsCount: newPosts.length, 
    isMinimized, 
    isOpen,
    showDot 
  })

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end pointer-events-none">
      <button
        onClick={() => {
          debugLog('点击通知按钮，打开面板')
          setIsMinimized(false)
          setIsOpen(true)
        }}
        className={cn(
          'pointer-events-auto p-3 rounded-full shadow-lg transition-all duration-500',
          'bg-primary/10 dark:bg-primary/20 border border-primary/20',
          'hover:scale-110 active:scale-95 relative group',
          isMinimized ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        )}
        style={{
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        }}
      >
        <Icon
          icon="material-symbols:notifications-outline"
          className="w-5 h-5 text-primary"
        />
        {showDot && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      <div
        className={cn(
          'pointer-events-auto rounded-xl shadow-lg p-4 max-w-[90vw] w-80',
          'bg-background/80 dark:bg-background/80 border border-border',
          'transition-all duration-300 origin-bottom-right',
          isOpen && !isMinimized
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-4 opacity-0 scale-95 pointer-events-none hidden'
        )}
        style={{
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-primary">
            <Icon icon="material-symbols:notifications-active" className="w-5 h-5" />
            <h3 className="font-bold text-foreground">发现新文章</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                debugLog('点击清空按钮')
                clearNotification()
              }}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
              title="清空通知"
            >
              <Icon icon="material-symbols:delete-outline" className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                debugLog('点击关闭按钮')
                handleClose()
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              title="隐藏"
            >
              <Icon icon="material-symbols:close" className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-2 px-1 flex flex-col gap-0.5">
          <div className="font-medium">
            {newPosts.length > 0 ? '发现更新' : '暂无更新'}
          </div>
          {initTime > 0 && (
            <div className="opacity-70 text-[10px]">
              {formatTime(initTime)} - {formatTime(lastCheckTime || Date.now())}
            </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden space-y-1 custom-scrollbar">
          {newPosts.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <Icon
                icon="material-symbols:check-circle-outline"
                className="w-8 h-8 mx-auto mb-2 opacity-50"
              />
              <p className="text-sm">暂无文章更新</p>
              <p className="text-xs mt-1 opacity-70">稍后再来看看吧</p>
            </div>
          ) : (
            newPosts.map((post) => {
              // 使用 guid（pathname）作为跳转路径
              let postHref = post.guid
              if (post.isUpdated && post.diff) {
                postHref = `${post.guid}?diff=1#post-diff`
              }

              return (
                <div key={post.guid} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <Link
                      href={postHref}
                      onClick={() => debugLog('点击文章链接', { title: post.title, href: postHref })}
                      className="font-medium truncate pr-2 hover:text-primary transition-colors text-foreground block flex-1 text-sm"
                    >
                      {post.title}
                    </Link>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded shrink-0',
                        post.isUpdated
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                      )}
                    >
                      {post.isUpdated ? '更新' : '新文章'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: hsl(var(--primary));
          border-radius: 20px;
          opacity: 0.5;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          opacity: 0.8;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--primary)) transparent;
        }
      `}</style>
    </div>
  )
}
