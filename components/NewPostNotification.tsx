'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Post } from '@/hooks/usePostChanges'
import { checkForNewPosts } from '@/lib/rssStore'
import { useNotificationPanel } from '@/hooks/usePostChanges'

const INIT_TIME_KEY = 'cofe-notification-init-time'
const LAST_SEEN_TIME_KEY = 'cofe-last-seen-time'
const CHECK_INTERVAL = 5 * 60 * 1000 // 5分钟检查一次

export default function NewPostNotification() {
  const { isOpen, isMinimized, open, minimize } = useNotificationPanel()
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const [newPosts, setNewPosts] = useState<Post[]>([])
  const [initTime, setInitTime] = useState<number>(0)
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)
  const [expandedDiffs, setExpandedDiffs] = useState<Set<string>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstRender = useRef(true)

  // 检查新文章
  const checkPosts = useCallback(async () => {
    try {
      const { newPosts: posts, hasChanges } = await checkForNewPosts()
      const currentTime = Date.now()
      const lastInitTime = localStorage.getItem(INIT_TIME_KEY)
      const isFresh = !lastInitTime && isFirstRender.current

      if (isFirstRender.current) {
        isFirstRender.current = false
      }

      if (hasChanges) {
        console.log('[NewPostNotification] Total new/updated posts:', posts.length)
        setNewPosts(posts)
        setHasNewPosts(true)
        setInitTime(Number(lastInitTime) || currentTime)
        setLastCheckTime(currentTime)

        // 如果是新会话且有新文章，自动展开
        if (isFresh) {
          setTimeout(() => {
            open()
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
  }, [open])

  // 清除通知
  const clearNotification = useCallback(() => {
    const now = Date.now()
    localStorage.setItem(INIT_TIME_KEY, now.toString())
    localStorage.setItem(LAST_SEEN_TIME_KEY, now.toString())
    setNewPosts([])
    setHasNewPosts(false)
    setInitTime(now)
    setLastCheckTime(now)
    // 同时清除文章变更展示
    sessionStorage.removeItem('active-post-changes')
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

  // 在文章中显示变更
  const showChangesInArticle = useCallback((post: Post) => {
    sessionStorage.setItem('active-post-changes', JSON.stringify(post))
    // 如果当前就在文章页面，刷新页面以显示变更
    if (window.location.pathname.includes('/blog/')) {
      window.location.reload()
    } else {
      // 否则跳转到文章页面
      window.location.href = post.link
    }
  }, [])

  // 初始化
  useEffect(() => {
    checkPosts()

    // 设置定时检查
    intervalRef.current = setInterval(checkPosts, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkPosts])

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
        onClick={open}
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
                minimize()
                // 同时关闭文章变更展示
                sessionStorage.removeItem('active-post-changes')
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
                        <>
                          <button
                            onClick={() => toggleDiff(post.guid)}
                            className="text-xs text-primary hover:underline focus:outline-none"
                          >
                            {isExpanded ? '收起' : '查看变更'}
                          </button>
                          <button
                            onClick={() => showChangesInArticle(post)}
                            className="text-xs text-blue-500 hover:underline focus:outline-none ml-1"
                            title="在文章中查看变更"
                          >
                            文中查看
                          </button>
                        </>
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
