'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { diffLines } from 'diff'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Post {
  title: string
  link: string
  guid: string
  pubDate: number
  content: string
  isUpdated?: boolean
  diff?: Array<{
    value: string
    added?: boolean
    removed?: boolean
  }>
}

interface StoredPost extends Post {
  id: string
}

const DB_NAME = 'cofe-blog-rss-store'
const DB_VERSION = 1
const STORE_NAME = 'posts'
const NOTIFICATION_STATE_KEY = 'cofe-notification-state'
const INIT_TIME_KEY = 'cofe-notification-init-time'
const CHECK_INTERVAL = 5 * 60 * 1000 // 5分钟检查一次

export default function NewPostNotification() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const [newPosts, setNewPosts] = useState<Post[]>([])
  const [initTime, setInitTime] = useState<number>(0)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  // 打开 IndexedDB
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }, [])

  // 生成作用域 ID
  const generateId = useCallback((guid: string): string => {
    const scope = window.location.hostname
    return `${scope}:${guid}`
  }, [])

  // 获取存储的文章
  const getStoredPosts = useCallback(async (db: IDBDatabase): Promise<StoredPost[]> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as StoredPost[])
      request.onerror = () => reject(request.error)
    })
  }, [])

  // 保存文章
  const savePosts = useCallback(async (db: IDBDatabase, posts: Post[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      posts.forEach((post) => {
        const itemToSave: StoredPost = { ...post, id: generateId(post.guid) }
        store.put(itemToSave)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }, [generateId])

  // 获取 RSS 数据
  const fetchRSS = useCallback(async (): Promise<Post[]> => {
    try {
      const response = await fetch('/atom.xml', { cache: 'no-store' })
      const text = await response.text()
      const parser = new DOMParser()
      const xml = parser.parseFromString(text, 'text/xml')
      const entries = Array.from(xml.querySelectorAll('entry'))

      return entries.map((entry) => {
        const title = entry.querySelector('title')?.textContent || ''
        const link = entry.querySelector('link')?.getAttribute('href') || ''
        const guid = entry.querySelector('id')?.textContent || link
        const updated = entry.querySelector('updated')?.textContent || ''
        const pubDate = new Date(updated).getTime()
        const content = entry.querySelector('content')?.textContent || ''

        return {
          title,
          link,
          guid,
          pubDate,
          content,
        }
      })
    } catch (e) {
      console.error('Failed to fetch RSS:', e)
      return []
    }
  }, [])

  // 计算差异
  const computeDiff = useCallback((oldText: string, newText: string) => {
    if (!oldText || !newText) return null

    // 去除 HTML 标签
    const stripHtml = (html: string): string => {
      const tmp = document.createElement('DIV')
      tmp.innerHTML = html
      return tmp.textContent || tmp.innerText || ''
    }

    const cleanOld = stripHtml(oldText)
    const cleanNew = stripHtml(newText)

    const diffs = diffLines(cleanOld, cleanNew)
    const hasChanges = diffs.some((part) => part.added || part.removed)

    if (!hasChanges) return null

    return diffs.map((part) => ({
      value: part.value,
      added: part.added,
      removed: part.removed,
    }))
  }, [])

  // 检查新文章
  const checkForNewPosts = useCallback(async () => {
    try {
      const db = await openDB()
      const storedPosts = await getStoredPosts(db)
      const fetchedPosts = await fetchRSS()

      const currentTime = Date.now()
      const lastInitTime = localStorage.getItem(INIT_TIME_KEY)
      const isFresh = !lastInitTime && isFirstRender.current

      if (isFirstRender.current) {
        isFirstRender.current = false
      }

      // 比较存储的和获取的文章
      const newOrUpdatedPosts: Post[] = []

      for (const post of fetchedPosts) {
        const existingPost = storedPosts.find((p) => p.guid === post.guid)

        if (!existingPost) {
          // 新文章
          newOrUpdatedPosts.push({ ...post, isUpdated: false })
        } else if (existingPost.content !== post.content) {
          // 更新的文章
          const diff = computeDiff(existingPost.content, post.content)
          if (diff) {
            newOrUpdatedPosts.push({ ...post, isUpdated: true, diff })
          }
        }
      }

      // 保存所有获取的文章
      await savePosts(db, fetchedPosts)

      // 更新状态
      if (newOrUpdatedPosts.length > 0) {
        setNewPosts(newOrUpdatedPosts)
        setHasNewPosts(true)
        setInitTime(Number(lastInitTime) || currentTime)
        setLastCheckTime(currentTime)

        // 如果是新会话且有新文章，自动展开
        if (isFresh) {
          setTimeout(() => {
            setIsMinimized(false)
            setIsOpen(true)
          }, 1500)
        }
      }

      // 保存初始化时间
      if (!lastInitTime) {
        localStorage.setItem(INIT_TIME_KEY, currentTime.toString())
      }
    } catch (error) {
      console.error('Error checking for new posts:', error)
    }
  }, [openDB, getStoredPosts, fetchRSS, computeDiff, savePosts])

  // 清除通知
  const clearNotification = useCallback(() => {
    localStorage.removeItem(NOTIFICATION_STATE_KEY)
    const now = Date.now()
    localStorage.setItem(INIT_TIME_KEY, now.toString())
    setNewPosts([])
    setHasNewPosts(false)
    setInitTime(now)
    setLastCheckTime(now)
  }, [])

  // 切换 diff 展开状态
  const toggleDiff = useCallback((guid: string) => {
    setExpandedDiffs((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(guid)) {
        newSet.delete(guid)
      } else {
        newSet.add(guid)
      }
      return newSet
    })
  }, [])

  // 初始化
  useEffect(() => {
    checkForNewPosts()

    // 设置定时检查
    intervalRef.current = setInterval(checkForNewPosts, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkForNewPosts])

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 如果没有新文章且是最小化状态，不显示红点
  const showDot = hasNewPosts && newPosts.length > 0 && isMinimized

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end pointer-events-none">
      {/* 最小化状态 - 铃铛图标 */}
      <button
        onClick={() => {
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
        {/* 红点通知 */}
        {showDot && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      {/* 展开状态 - 通知面板 */}
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
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-primary">
            <Icon icon="material-symbols:notifications-active" className="w-5 h-5" />
            <h3 className="font-bold text-foreground">发现新文章</h3>
          </div>
          <div className="flex items-center gap-1">
            {/* 清空按钮 */}
            <button
              onClick={clearNotification}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
              title="清空通知"
            >
              <Icon icon="material-symbols:delete-outline" className="w-4 h-4" />
            </button>
            {/* 最小化按钮 */}
            <button
              onClick={() => {
                setIsOpen(false)
                setTimeout(() => setIsMinimized(true), 300)
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              title="隐藏"
            >
              <Icon icon="material-symbols:close" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 时间戳 */}
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

        {/* 文章列表 */}
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
              const isExpanded = expandedDiffs.has(post.guid)

              return (
                <div key={post.guid} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <Link
                      href={post.link}
                      className="font-medium truncate pr-2 hover:text-primary transition-colors text-foreground block flex-1 text-sm"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center shrink-0 gap-1">
                      {post.isUpdated && post.diff && (
                        <button
                          onClick={() => toggleDiff(post.guid)}
                          className="text-xs text-primary hover:underline focus:outline-none"
                        >
                          {isExpanded ? '收起' : '查看变更'}
                        </button>
                      )}
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded',
                          post.isUpdated
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                            : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                        )}
                      >
                        {post.isUpdated ? '更新' : '新文章'}
                      </span>
                    </div>
                  </div>

                  {/* Diff 内容 */}
                  {post.isUpdated && post.diff && isExpanded && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto border border-border max-h-60 overflow-y-auto">
                      {post.diff.map((part, idx) => {
                        const colorClass = part.added
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 block my-1 p-1 rounded break-all whitespace-pre-wrap'
                          : part.removed
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 block my-1 p-1 rounded break-all whitespace-pre-wrap'
                          : 'text-muted-foreground block my-1 p-1 break-all whitespace-pre-wrap'
                        return (
                          <div key={idx} className={colorClass}>
                            {part.value}
                          </div>
                        )
                      })}
                    </div>
                  )}
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
