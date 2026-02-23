'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { applyInlineDiff, clearInlineDiff } from '@/lib/post-inline-diff'

// 调试日志工具（生产环境禁用）
const DEBUG_PREFIX = '[PostContentHighlighter]'
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

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

interface PostChanges {
  title: string
  link: string
  guid: string
  diff?: DiffPart[]
  diffType?: string
}

const DEBUG_STATE_KEY = 'cofe-diff-debug-state'
const NOTIFICATION_STATE_KEY = 'cofe-notification-state'

export default function PostContentHighlighter() {
  debugLog('===== 组件初始化 =====')
  
  const [changes, setChanges] = useState<PostChanges | null>(null)
  const [highlighted, setHighlighted] = useState(false)
  const [stats, setStats] = useState({ added: 0, removed: 0 })
  const [isVisible, setIsVisible] = useState(false)

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
          let matchingPost: PostChanges | null = null
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
            setChanges(matchingPost)
            setIsVisible(true)
            debugSuccess('Step 8.2: 状态更新完成')
          } else {
            debugLog('Step 8: 未找到匹配当前路径的文章')
            // 如果没有精确匹配，但只有一个文章有 diff，可能是当前文章
            if (data.items.length === 1 && hasDiffParam) {
              debugLog('Step 9: 只有一个 diff 数据且 URL 有 diff 参数，使用它')
              setChanges(data.items[0])
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

  const highlightChanges = useCallback(() => {
    debugLog('===== highlightChanges 开始 =====')
    
    if (!changes?.diff) {
      debugLog('Step H.1: 没有 diff 数据，返回')
      return
    }
    
    if (highlighted) {
      debugLog('Step H.1: 已经高亮过，返回')
      return
    }

    debugLog('Step H.2: 查找文章容器')
    const container = document.querySelector('.markdown-body, .markdown-content, .prose, article')
    
    if (!container) {
      debugLog('Step H.3: ❌ 未找到文章容器，尝试的选择器: .markdown-body, .markdown-content, .prose, article')
      // 列出页面上所有可能的内容容器
      const possibleContainers = document.querySelectorAll('article, main, [class*="content"], [class*="markdown"], [class*="prose"]')
      debugLog('Step H.3.1: 页面上可能的内容容器', Array.from(possibleContainers).map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id
      })))
      return
    }
    
    if (!(container instanceof HTMLElement)) {
      debugLog('Step H.3: ❌ 容器不是 HTMLElement', { type: typeof container, constructor: container?.constructor?.name })
      return
    }

    debugSuccess('Step H.3: 找到文章容器')
    debugLog('Step H.4: 容器信息', {
      tag: container.tagName,
      class: container.className,
      id: container.id,
      childrenCount: container.children.length
    })

    debugLog('Step H.5: 调用 applyInlineDiff', { diffBlocks: changes.diff.length })
    try {
      applyInlineDiff(container, changes.diff)
      debugSuccess('Step H.6: applyInlineDiff 完成')
    } catch (e) {
      debugError('Step H.6: applyInlineDiff 失败', e)
      return
    }

    const addedCount = changes.diff.filter((p) => p.added).length
    const removedCount = changes.diff.filter((p) => p.removed).length
    debugLog('Step H.7: 统计变更', { addedCount, removedCount })
    
    setStats({ added: addedCount, removed: removedCount })
    setHighlighted(true)
    debugSuccess('Step H.8: 状态更新完成')

    const postDiffEl = document.getElementById('post-diff')
    if (postDiffEl) {
      debugLog('Step H.9: 找到 #post-diff 元素，滚动到该位置')
      postDiffEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      debugLog('Step H.9: 未找到 #post-diff 元素')
    }
    
    debugSuccess('===== highlightChanges 完成 =====')
  }, [changes, highlighted])

  const clearHighlight = useCallback(() => {
    debugLog('===== clearHighlight 开始 =====')
    
    const container = document.querySelector('.markdown-body, .markdown-content, .prose, article')
    if (container && container instanceof HTMLElement) {
      debugLog('Step C.1: 找到容器，调用 clearInlineDiff')
      try {
        clearInlineDiff(container)
        debugSuccess('Step C.2: clearInlineDiff 完成')
      } catch (e) {
        debugError('Step C.2: clearInlineDiff 失败', e)
      }
    } else {
      debugLog('Step C.1: 未找到容器，跳过 clearInlineDiff')
    }

    setHighlighted(false)
    setIsVisible(false)
    debugLog('Step C.3: 状态已重置')

    debugLog('Step C.4: 清除 storage')
    sessionStorage.removeItem(DEBUG_STATE_KEY)
    localStorage.removeItem(NOTIFICATION_STATE_KEY)
    debugSuccess('Step C.5: storage 已清除')

    const url = new URL(window.location.href)
    url.searchParams.delete('diff')
    url.searchParams.delete('__diff_debug')
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    debugLog('Step C.6: URL 参数已清除')
    
    debugSuccess('===== clearHighlight 完成 =====')
  }, [])

  const scrollToDiff = useCallback(() => {
    debugLog('===== scrollToDiff =====')
    const postDiffEl = document.getElementById('post-diff')
    if (postDiffEl) {
      debugLog('找到 #post-diff，滚动')
      postDiffEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      debugLog('未找到 #post-diff，尝试高亮并滚动到文章顶部')
      highlightChanges()
      // 延迟滚动到文章容器
      setTimeout(() => {
        const container = document.querySelector('.markdown-body, .markdown-content, .prose, article')
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [highlightChanges])

  // 如果 URL 有 diff 参数，自动高亮
  useEffect(() => {
    debugLog('===== 自动高亮检查 =====')
    const urlParams = new URLSearchParams(window.location.search)
    const hasDiffParam = urlParams.get('diff') === '1'
    
    debugLog('自动高亮条件检查', {
      hasDiffParam,
      hasChanges: !!changes?.diff,
      isHighlighted: highlighted
    })
    
    if (hasDiffParam && changes?.diff && !highlighted) {
      debugLog('满足自动高亮条件，延迟 500ms 执行')
      const timer = setTimeout(() => {
        debugLog('定时器触发，开始高亮')
        highlightChanges()
      }, 500)
      return () => {
        debugLog('清理定时器')
        clearTimeout(timer)
      }
    } else {
      debugLog('不满足自动高亮条件')
    }
  }, [changes, highlighted, highlightChanges])

  debugLog('===== 渲染检查 =====', { 
    isVisible, 
    hasChanges: !!changes?.diff,
    highlighted 
  })

  if (!isVisible || !changes?.diff) {
    debugLog('组件不渲染', { isVisible, hasDiff: !!changes?.diff })
    return null
  }

  debugLog('组件渲染中...')

  return (
    <div className="fixed bottom-36 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {!highlighted ? (
          <>
            <div
              className={cn(
                'bg-card border border-green-500/50 rounded-lg shadow-lg px-4 py-3',
                'animate-in fade-in slide-in-from-right-4'
              )}
            >
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <Icon icon="material-symbols:update" className="w-5 h-5" />
                <span className="text-sm font-medium">文章已更新</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                检测到内容有变化，点击下方按钮查看变更
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    debugLog('点击"查看变更"按钮')
                    // 先尝试高亮变更，然后滚动到变更位置
                    highlightChanges()
                    // 延迟滚动，确保高亮已应用
                    setTimeout(() => {
                      const postDiffEl = document.getElementById('post-diff')
                      if (postDiffEl) {
                        postDiffEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }, 100)
                  }}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg',
                    'bg-green-500 text-white hover:bg-green-600',
                    'text-xs font-medium transition-colors'
                  )}
                >
                  <Icon icon="material-symbols:highlight-alt" className="w-4 h-4" />
                  查看变更
                </button>
                <button
                  onClick={() => {
                    debugLog('点击"忽略"按钮')
                    clearHighlight()
                  }}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg',
                    'bg-muted text-muted-foreground hover:bg-muted/80',
                    'text-xs font-medium transition-colors'
                  )}
                >
                  <Icon icon="material-symbols:close" className="w-4 h-4" />
                  忽略
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-sm flex items-center gap-3">
              <span className="text-green-600 dark:text-green-400 font-medium">+{stats.added}</span>
              <span className="text-red-600 dark:text-red-400 font-medium">-{stats.removed}</span>
              <button
                onClick={() => {
                  debugLog('点击"跳转"按钮')
                  scrollToDiff()
                }}
                className="text-primary hover:underline text-xs"
              >
                跳转
              </button>
            </div>

            <button
              onClick={() => {
                debugLog('点击"清除高亮"按钮')
                clearHighlight()
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg',
                'bg-muted text-muted-foreground hover:bg-muted/80',
                'transition-all duration-300'
              )}
            >
              <Icon icon="material-symbols:close" className="w-5 h-5" />
              <span className="text-sm font-medium">清除高亮</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
