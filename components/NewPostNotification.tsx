'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import * as Diff from 'diff'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
const CHECK_INTERVAL = 5 * 60 * 1000

function normalizeGuid(guid: string, link: string) {
  const value = (guid || link || '').trim()
  if (!value) return ''
  try {
    const url = new URL(value, window.location.origin)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return value
  }
}

function generateId(guid: string) {
  return `root:${guid}`
}

function normalizeRaw(text: string) {
  const s = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = s.split('\n').map((line) => line.replace(/[ \t]+$/g, ''))
  return lines.join('\n').trim()
}

function normalizeForDiffHtml(html: string) {
  const raw = normalizeRaw(html)
  if (!raw) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${raw}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return raw

  const lines: string[] = []
  for (const el of Array.from(root.children)) {
    const htmlLine = String(el.outerHTML || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n+/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim()
    if (!htmlLine) continue
    lines.push(htmlLine)
  }

  return lines.join('\n')
}

function computeDiff(oldText: string, newText: string) {
  if (!oldText || !newText) return null

  const cleanOld = normalizeForDiffHtml(oldText)
  const cleanNew = normalizeForDiffHtml(newText)

  if (!cleanOld || !cleanNew) return null

  const diffs = Diff.diffLines(cleanOld, cleanNew)
  const hasChanges = diffs.some((part) => part.added || part.removed)

  if (!hasChanges) return null

  return diffs
}

export default function NewPostNotification() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const [newPosts, setNewPosts] = useState<Post[]>([])
  const [initTime, setInitTime] = useState<number>(0)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result
        const ensureStore = (name: string) => {
          if (db.objectStoreNames.contains(name)) {
            const existingStore = (event.target as IDBOpenDBRequest).transaction?.objectStore(name)
            if (existingStore && existingStore.keyPath !== 'id') {
              db.deleteObjectStore(name)
              db.createObjectStore(name, { keyPath: 'id' })
            }
            return
          }
          db.createObjectStore(name, { keyPath: 'id' })
        }
        ensureStore(STORE_OLD)
        ensureStore(STORE_NEW)
      }
    })
  }, [])

  const getStoredPosts = useCallback(async (db: IDBDatabase, storeName: string): Promise<Post[]> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as Post[])
      request.onerror = () => reject(request.error)
    })
  }, [])

  const savePosts = useCallback(async (db: IDBDatabase, storeName: string, posts: Post[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)

      posts.forEach((post) => {
        const itemToSave = { ...post, id: generateId(post.guid) }
        store.put(itemToSave)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }, [])

  const fetchRSS = useCallback(async (): Promise<Post[]> => {
    try {
      const response = await fetch('/atom.xml', { cache: 'no-store' })
      const text = await response.text()
      const parser = new DOMParser()
      const xml = parser.parseFromString(text, 'text/xml')

      const items = Array.from(xml.querySelectorAll('entry'))

      return items.map((item) => {
        const title = item.querySelector('title')?.textContent || ''
        const link = (item.querySelector('link')?.getAttribute('href') || '').trim()
        const rawGuid = (item.querySelector('id')?.textContent || '').trim()
        const pubDateStr = item.querySelector('updated')?.textContent || item.querySelector('published')?.textContent || ''
        const pubDate = new Date(pubDateStr).getTime()
        const content = item.querySelector('content')?.textContent || ''
        const description = item.querySelector('summary')?.textContent || ''

        const guid = normalizeGuid(rawGuid || link, link)

        return {
          title,
          link,
          guid,
          pubDate,
          description,
          content,
        }
      })
    } catch (e) {
      console.error('Failed to fetch RSS:', e)
      return []
    }
  }, [])

  const checkForNewPosts = useCallback(async () => {
    try {
      console.log('[NewPostNotification] ========== 开始检查 ==========')
      const db = await openDB()
      const storedPosts = await getStoredPosts(db, STORE_OLD)
      const fetchedPosts = await fetchRSS()

      console.log('[NewPostNotification] 存储的文章数:', storedPosts.length)
      console.log('[NewPostNotification] 获取的文章数:', fetchedPosts.length)

      const currentTime = Date.now()
      const lastInitTime = localStorage.getItem(INIT_TIME_KEY)
      // 首次访问：没有存储过数据
      const isFirstVisit = storedPosts.length === 0

      console.log('[NewPostNotification] 是否首次访问:', isFirstVisit)

      if (isFirstRender.current) {
        isFirstRender.current = false
      }

      // 首次访问：只存储数据，不显示通知
      if (isFirstVisit) {
        console.log('[NewPostNotification] 首次访问，存储数据并返回')
        await savePosts(db, STORE_OLD, fetchedPosts)
        localStorage.setItem(INIT_TIME_KEY, currentTime.toString())
        return
      }

      // 后续访问：比较差异
      const newOrUpdatedPosts: Post[] = []

      for (const post of fetchedPosts) {
        const existingPost = storedPosts.find((p) => p.guid === post.guid)

        if (!existingPost) {
          // 新文章
          console.log('[NewPostNotification] 发现新文章:', post.title)
          newOrUpdatedPosts.push({ ...post, isUpdated: false })
        } else if (existingPost.content !== post.content) {
          // 文章更新
          console.log('[NewPostNotification] 文章有变更:', post.title)
          console.log('[NewPostNotification] 旧内容长度:', existingPost.content?.length)
          console.log('[NewPostNotification] 新内容长度:', post.content?.length)
          const diff = computeDiff(existingPost.content, post.content)
          if (diff) {
            console.log('[NewPostNotification] 差异块数:', diff.length)
            newOrUpdatedPosts.push({ ...post, isUpdated: true, diff })
          } else {
            console.log('[NewPostNotification] 内容不同但 diff 计算为空')
          }
        } else {
          console.log('[NewPostNotification] 文章无变更:', post.title)
        }
      }

      console.log('[NewPostNotification] 变更文章数:', newOrUpdatedPosts.length)

      // 用新数据覆盖旧数据
      await savePosts(db, STORE_OLD, fetchedPosts)
      console.log('[NewPostNotification] 已用新数据覆盖旧数据')

      // 更新检查时间
      localStorage.setItem(INIT_TIME_KEY, currentTime.toString())

      // 有变更时显示通知
      if (newOrUpdatedPosts.length > 0) {
        console.log('[NewPostNotification] 设置通知状态')
        setNewPosts(newOrUpdatedPosts)
        setHasNewPosts(true)
        setInitTime(Number(lastInitTime) || currentTime)
        setLastCheckTime(currentTime)
      } else {
        console.log('[NewPostNotification] 无变更，不显示通知')
      }

      console.log('[NewPostNotification] ========== 检查结束 ==========')
    } catch (error) {
      console.error('[NewPostNotification] 检查出错:', error)
    }
  }, [openDB, getStoredPosts, fetchRSS, savePosts])

  const clearNotification = useCallback(() => {
    localStorage.removeItem(NOTIFICATION_STATE_KEY)
    const now = Date.now()
    localStorage.setItem(INIT_TIME_KEY, now.toString())
    setNewPosts([])
    setHasNewPosts(false)
    setInitTime(now)
    setLastCheckTime(now)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setIsMinimized(true), 300)
  }, [])

  useEffect(() => {
    checkForNewPosts()

    intervalRef.current = setInterval(checkForNewPosts, CHECK_INTERVAL)

    return () => {
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

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end pointer-events-none">
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
              onClick={clearNotification}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
              title="清空通知"
            >
              <Icon icon="material-symbols:delete-outline" className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
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
              let postHref = post.link
              if (post.isUpdated && post.diff) {
                try {
                  const url = new URL(post.link, window.location.origin)
                  url.searchParams.set('diff', '1')
                  url.hash = 'post-diff'
                  postHref = `${url.pathname}${url.search}${url.hash}`
                } catch {
                  const base = post.link.split('#')[0]
                  postHref = base.includes('?') ? `${base}&diff=1#post-diff` : `${base}?diff=1#post-diff`
                }
              }

              return (
                <div key={post.guid} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <Link
                      href={postHref}
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
