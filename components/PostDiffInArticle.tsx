'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

// 调试日志工具
const DEBUG_PREFIX = '[PostDiffInArticle]'
function debugLog(step: string, data?: unknown) {
  const timestamp = new Date().toLocaleTimeString()
  if (data !== undefined) {
    console.log(`${DEBUG_PREFIX} [${timestamp}] ${step}`, data)
  } else {
    console.log(`${DEBUG_PREFIX} [${timestamp}] ${step}`)
  }
}
function debugError(step: string, error: unknown) {
  const timestamp = new Date().toLocaleTimeString()
  console.error(`${DEBUG_PREFIX} [${timestamp}] ❌ ${step}`, error)
}
function debugSuccess(step: string) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`${DEBUG_PREFIX} [${timestamp}] ✅ ${step}`)
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
  diffType?: string
}

const DEBUG_STATE_KEY = 'cofe-diff-debug-state'
const NOTIFICATION_STATE_KEY = 'cofe-notification-state'

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

export function PostDiffInArticle() {
  debugLog('===== 组件初始化 =====')
  
  const [post, setPost] = useState<Post | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    debugLog('===== useEffect 触发，检查 diff 数据 =====')
    
    const urlParams = new URLSearchParams(window.location.search)
    const hasDiffParam = urlParams.get('diff') === '1'
    
    debugLog('Step 1: 检查 URL 参数', { hasDiffParam, search: window.location.search })

    // 获取当前文章的路径
    const currentPath = window.location.pathname
    debugLog('Step 2: 当前路径', currentPath)

    // 从 sessionStorage 读取 diff 数据
    debugLog('Step 3: 读取 sessionStorage', { key: DEBUG_STATE_KEY })
    const stored = sessionStorage.getItem(DEBUG_STATE_KEY)
    debugLog('Step 4: sessionStorage 原始数据', { 
      hasData: !!stored, 
      dataLength: stored?.length,
      preview: stored?.substring(0, 200)
    })
    
    if (stored) {
      try {
        debugLog('Step 5: 解析 JSON 数据')
        const data = JSON.parse(stored)
        debugLog('Step 6: 解析成功', { 
          hasItems: !!data.items, 
          itemsCount: data.items?.length,
          timestamp: data.timestamp
        })
        
        if (data.items && data.items.length > 0) {
          debugLog('Step 7: 开始匹配文章', { itemsCount: data.items.length })
          
          // 查找与当前文章匹配的数据
          let matchingPost: Post | null = null
          let matchIndex = -1
          
          for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i]
            debugLog(`Step 7.${i + 1}: 检查第 ${i + 1} 篇文章`, { 
              title: item.title, 
              link: item.link,
              hasDiff: !!item.diff,
              diffLength: item.diff?.length
            })
            
            try {
              const itemPath = new URL(item.link, window.location.origin).pathname
              debugLog(`Step 7.${i + 1}.1: 比较路径`, { itemPath, currentPath })
              
              const isMatch = itemPath === currentPath || 
                             currentPath.includes(itemPath) || 
                             itemPath.includes(currentPath)
              
              debugLog(`Step 7.${i + 1}.2: 匹配结果`, { isMatch })
              
              if (isMatch) {
                matchingPost = item
                matchIndex = i
                break
              }
            } catch (e) {
              debugError(`Step 7.${i + 1}.3: URL 解析错误`, e)
            }
          }
          
          if (matchingPost) {
            debugSuccess(`Step 8: 找到匹配的文章 #${matchIndex + 1}`)
            debugLog('Step 8.1: 匹配文章详情', {
              title: matchingPost.title,
              link: matchingPost.link,
              diffBlocks: matchingPost.diff?.length
            })
            setPost(matchingPost)
            setIsVisible(true)
            debugSuccess('Step 8.2: 状态更新完成')
          } else {
            debugLog('Step 8: 未找到匹配当前路径的文章')
            // 如果没有精确匹配，但只有一个文章有 diff，可能是当前文章
            if (data.items.length === 1 && hasDiffParam) {
              debugLog('Step 9: 只有一个 diff 数据且 URL 有 diff 参数，使用它')
              setPost(data.items[0])
              setIsVisible(true)
              debugSuccess('Step 9.1: 使用唯一 diff 数据')
            } else {
              debugLog('Step 9: 不满足使用唯一数据的条件', { 
                itemsLength: data.items.length, 
                hasDiffParam 
              })
            }
          }
        } else {
          debugLog('Step 7: 没有 items 或 items 为空')
        }
      } catch (e) {
        debugError('Step 6: 解析 post changes 失败', e)
      }
    } else {
      debugLog('Step 5: sessionStorage 中没有 diff 数据')
    }
    
    debugLog('===== useEffect 完成 =====')
  }, [])

  const clearAllDiffState = useCallback(() => {
    debugLog('===== clearAllDiffState 开始 =====')
    
    debugLog('Step X.1: 清除 storage')
    sessionStorage.removeItem(DEBUG_STATE_KEY)
    localStorage.removeItem(NOTIFICATION_STATE_KEY)
    debugSuccess('Step X.2: storage 已清除')
    
    debugLog('Step X.3: 清除 DOM 标记')
    const containers = document.querySelectorAll('[data-post-inline-diff], [data-post-inline-diff-add-target], [data-post-inline-diff-del-target]')
    debugLog('Step X.3.1: 找到标记元素数量', containers.length)
    containers.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.removeAttribute('data-post-inline-diff')
        el.removeAttribute('data-post-inline-diff-add-target')
        el.removeAttribute('data-post-inline-diff-del-target')
      }
    })
    debugSuccess('Step X.3.2: DOM 标记已清除')
    
    debugLog('Step X.4: 移除 diff 元素')
    const addTargets = document.querySelectorAll('.post-inline-diff-add-target, .post-inline-diff-del-target, .post-inline-diff-add-line, .post-inline-diff-del-line')
    debugLog('Step X.4.1: 找到 diff 元素数量', addTargets.length)
    addTargets.forEach((el) => el.remove())
    debugSuccess('Step X.4.2: diff 元素已移除')
    
    debugLog('Step X.5: 清除 URL 参数')
    const url = new URL(window.location.href)
    url.searchParams.delete('diff')
    url.searchParams.delete('__diff_debug')
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    debugSuccess('Step X.6: URL 参数已清除')
    
    setIsVisible(false)
    debugLog('Step X.7: 状态已更新')
    
    debugSuccess('===== clearAllDiffState 完成 =====')
  }, [])

  const handleClose = useCallback(() => {
    debugLog('点击关闭按钮')
    setIsVisible(false)
    clearAllDiffState()
  }, [clearAllDiffState])

  const toggleMinimize = useCallback(() => {
    debugLog('点击最小化/展开按钮', { currentState: isMinimized ? 'minimized' : 'expanded' })
    setIsMinimized((prev) => !prev)
  }, [isMinimized])

  debugLog('===== 渲染检查 =====', { 
    isVisible, 
    hasPost: !!post,
    hasDiff: !!post?.diff 
  })

  if (!isVisible || !post || !post.diff) {
    debugLog('组件不渲染', { isVisible, hasPost: !!post, hasDiff: !!post?.diff })
    return null
  }

  const addedCount = post.diff.filter((p) => p.added).length
  const removedCount = post.diff.filter((p) => p.removed).length
  
  debugLog('组件渲染中...', { addedCount, removedCount, diffBlocks: post.diff.length })

  return (
    <div
      className={cn(
        'fixed top-20 right-4 z-40 w-80 max-w-[90vw]',
        'bg-background/95 dark:bg-background/95 border border-border',
        'rounded-xl shadow-lg overflow-hidden',
        'transition-all duration-300',
        isMinimized ? 'w-auto' : ''
      )}
      style={{
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Icon icon="material-symbols:edit-document" className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm text-foreground">文章变更</span>
          <span className="text-xs text-muted-foreground">
            +{addedCount} -{removedCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="p-1 rounded hover:bg-accent transition-colors"
            title={isMinimized ? '展开' : '最小化'}
          >
            <Icon
              icon={isMinimized ? 'material-symbols:expand-more' : 'material-symbols:expand-less'}
              className="w-4 h-4 text-muted-foreground"
            />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="关闭"
          >
            <Icon icon="material-symbols:close" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1 text-sm">
          {post.diff.map((part: DiffPart, idx: number) => {
            if (!part.added && !part.removed) {
              const lines = part.value.split('\n').filter((l) => l.trim())
              if (lines.length === 0) return null
              const contextLines = lines.slice(0, 2)
              return (
                <div key={idx} className="text-muted-foreground/50 text-xs py-1">
                  {contextLines.map((line, i) => (
                    <div key={i} className="truncate">
                      {line}
                    </div>
                  ))}
                  {lines.length > 2 && (
                    <div className="text-center text-[10px] opacity-50">...</div>
                  )}
                </div>
              )
            }

            return (
              <div
                key={idx}
                className={cn(
                  'py-1 px-2 rounded text-xs break-all whitespace-pre-wrap',
                  part.added
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-l-2 border-green-500'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-l-2 border-red-500 line-through opacity-70'
                )}
              >
                {part.value}
              </div>
            )
          })}
        </div>
      )}

      {!isMinimized && (
        <div className="px-3 py-2 bg-muted/30 text-[10px] text-muted-foreground border-t border-border">
          点击关闭后，变更提示将不再显示
        </div>
      )}
    </div>
  )
}
