'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { applyInlineDiff, clearInlineDiff } from '@/lib/post-inline-diff'

// 调试日志工具
const DEBUG_PREFIX = '[PostDiffViewer]'
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

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

interface PostDiffData {
  title: string
  link: string
  guid: string
  diff?: DiffPart[]
  timestamp: number
}

export default function PostDiffViewer() {
  debugLog('===== 组件初始化 =====')
  
  const [diffData, setDiffData] = useState<PostDiffData | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [stats, setStats] = useState({ added: 0, removed: 0 })

  useEffect(() => {
    debugLog('===== useEffect 触发，检查 diff 数据 =====')
    
    const urlParams = new URLSearchParams(window.location.search)
    const hasDiffParam = urlParams.get('diff') === '1'
    
    debugLog('Step 1: 检查 URL 参数', { hasDiffParam, search: window.location.search })

    // 获取当前文章的路径
    const currentPath = window.location.pathname
    debugLog('Step 2: 当前路径', currentPath)

    // 构建 storage key
    const postKey = `post-diff-${currentPath}`
    debugLog('Step 3: 构建 storage key', postKey)

    // 从 sessionStorage 读取 diff 数据
    const stored = sessionStorage.getItem(postKey)
    debugLog('Step 4: 读取 sessionStorage', { 
      key: postKey,
      hasData: !!stored, 
      dataLength: stored?.length,
      preview: stored?.substring(0, 200)
    })
    
    if (stored) {
      try {
        debugLog('Step 5: 解析 JSON 数据')
        const data: PostDiffData = JSON.parse(stored)
        debugLog('Step 6: 解析成功', { 
          title: data.title,
          hasDiff: !!data.diff,
          diffLength: data.diff?.length,
          timestamp: data.timestamp
        })
        
        if (data.diff && data.diff.length > 0) {
          debugSuccess('Step 7: 找到有效的 diff 数据')
          setDiffData(data)
          setIsVisible(true)
          
          // 计算统计
          const addedCount = data.diff.filter((p) => p.added).length
          const removedCount = data.diff.filter((p) => p.removed).length
          setStats({ added: addedCount, removed: removedCount })
          
          // 如果 URL 有 diff 参数，自动高亮
          if (hasDiffParam) {
            debugLog('Step 8: URL 有 diff 参数，准备自动高亮')
            setTimeout(() => {
              highlightChanges(data.diff!)
            }, 500)
          }
        } else {
          debugLog('Step 7: diff 数据为空')
        }
      } catch (e) {
        debugError('Step 6: 解析 diff 数据失败', e)
      }
    } else {
      debugLog('Step 5: sessionStorage 中没有 diff 数据')
      
      // 尝试从旧的 storage key 读取（兼容性）
      const oldKey = 'cofe-diff-debug-state'
      const oldStored = sessionStorage.getItem(oldKey)
      if (oldStored) {
        debugLog('Step 5.1: 尝试从旧 key 读取')
        try {
          const oldData = JSON.parse(oldStored)
          if (oldData.items && oldData.items.length > 0) {
            const matchingPost = oldData.items.find((item: PostDiffData) => {
              try {
                const itemPath = new URL(item.link, window.location.origin).pathname
                return itemPath === currentPath
              } catch { return false }
            })
            
            if (matchingPost && matchingPost.diff) {
              debugSuccess('Step 5.2: 从旧 key 找到匹配数据')
              setDiffData(matchingPost)
              setIsVisible(true)
              const addedCount = matchingPost.diff.filter((p: DiffPart) => p.added).length
              const removedCount = matchingPost.diff.filter((p: DiffPart) => p.removed).length
              setStats({ added: addedCount, removed: removedCount })
              
              if (hasDiffParam) {
                setTimeout(() => {
                  highlightChanges(matchingPost.diff)
                }, 500)
              }
            }
          }
        } catch (e) {
          debugError('Step 5.2: 解析旧数据失败', e)
        }
      }
    }
    
    debugLog('===== useEffect 完成 =====')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const highlightChanges = useCallback((diff: DiffPart[]) => {
    debugLog('===== highlightChanges 开始 =====')
    
    if (!diff || diff.length === 0) {
      debugLog('Step H.1: 没有 diff 数据，返回')
      return
    }
    
    if (highlighted) {
      debugLog('Step H.1: 已经高亮过，返回')
      return
    }

    debugLog('Step H.2: 查找文章容器')
    // 尝试多种选择器来找到文章容器
    const selectors = [
      '.markdown-body',
      '.prose',
      'article',
      '.markdown-content',
      '[class*="markdown"]',
      '[class*="prose"]',
      'main'
    ]
    
    let container: HTMLElement | null = null
    for (const selector of selectors) {
      container = document.querySelector(selector)
      if (container) {
        debugLog(`Step H.3: 找到容器 (${selector})`)
        break
      }
    }
    
    if (!container) {
      debugLog('Step H.3: ❌ 未找到文章容器，尝试的选择器:', selectors)
      // 列出页面上所有可能的内容容器
      const possibleContainers = document.querySelectorAll('article, main, [class*="content"], [class*="markdown"], [class*="prose"]')
      debugLog('Step H.3.1: 页面上可能的内容容器', Array.from(possibleContainers).map(el => ({
        tag: el.tagName,
        class: el.className,
        id: el.id
      })))
      return
    }

    debugLog('Step H.4: 容器信息', {
      tag: container.tagName,
      class: container.className,
      id: container.id,
      childrenCount: container.children.length
    })

    debugLog('Step H.5: 调用 applyInlineDiff', { diffBlocks: diff.length })
    try {
      applyInlineDiff(container, diff)
      debugSuccess('Step H.6: applyInlineDiff 完成')
    } catch (e) {
      debugError('Step H.6: applyInlineDiff 失败', e)
      return
    }

    setHighlighted(true)
    debugSuccess('Step H.7: 状态更新完成')

    const postDiffEl = document.getElementById('post-diff')
    if (postDiffEl) {
      debugLog('Step H.8: 找到 #post-diff 元素，滚动到该位置')
      postDiffEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      debugLog('Step H.8: 未找到 #post-diff 元素')
    }
    
    debugSuccess('===== highlightChanges 完成 =====')
  }, [highlighted])

  const clearAllDiffState = useCallback(() => {
    debugLog('===== clearAllDiffState 开始 =====')
    
    const currentPath = window.location.pathname
    const postKey = `post-diff-${currentPath}`
    
    debugLog('Step C.1: 清除 storage', { key: postKey })
    sessionStorage.removeItem(postKey)
    sessionStorage.removeItem('cofe-diff-debug-state')
    sessionStorage.removeItem('active-post-changes')
    debugSuccess('Step C.2: storage 已清除')
    
    debugLog('Step C.3: 清除 DOM 标记')
    const container = document.querySelector('.markdown-body, .prose, article')
    if (container && container instanceof HTMLElement) {
      try {
        clearInlineDiff(container)
        debugSuccess('Step C.4: inline diff 已清除')
      } catch (e) {
        debugError('Step C.4: 清除 inline diff 失败', e)
      }
    }
    
    debugLog('Step C.5: 清除 URL 参数')
    const url = new URL(window.location.href)
    url.searchParams.delete('diff')
    url.searchParams.delete('__diff_debug')
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    debugSuccess('Step C.6: URL 参数已清除')
    
    setIsVisible(false)
    setHighlighted(false)
    debugLog('Step C.7: 状态已更新')
    
    debugSuccess('===== clearAllDiffState 完成 =====')
  }, [])

  const handleClose = useCallback(() => {
    debugLog('点击关闭按钮')
    clearAllDiffState()
  }, [clearAllDiffState])

  const toggleMinimize = useCallback(() => {
    debugLog('点击最小化/展开按钮', { currentState: isMinimized ? 'minimized' : 'expanded' })
    setIsMinimized((prev) => !prev)
  }, [isMinimized])

  const handleHighlight = useCallback(() => {
    debugLog('点击高亮按钮')
    if (diffData?.diff) {
      highlightChanges(diffData.diff)
    }
  }, [diffData, highlightChanges])

  debugLog('===== 渲染检查 =====', { 
    isVisible, 
    hasData: !!diffData,
    hasDiff: !!diffData?.diff,
    highlighted 
  })

  if (!isVisible || !diffData || !diffData.diff) {
    debugLog('组件不渲染', { isVisible, hasData: !!diffData, hasDiff: !!diffData?.diff })
    return null
  }

  const meaningfulDiff = diffData.diff.filter(part => 
    (part.added || part.removed) && part.value.trim().length > 0
  )

  if (meaningfulDiff.length === 0) {
    debugLog('没有有意义的 diff 内容')
    return null
  }

  debugLog('组件渲染中...', { 
    added: stats.added, 
    removed: stats.removed, 
    diffBlocks: meaningfulDiff.length,
    highlighted 
  })

  return (
    <>
      {/* 悬浮面板 - 显示 diff 列表 */}
      <div
        className={cn(
          'fixed top-4 right-4 sm:top-20 sm:right-4 z-40 w-[calc(100%-2rem)] sm:w-80 max-w-[90vw]',
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
              +{stats.added} -{stats.removed}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!highlighted && (
              <button
                onClick={handleHighlight}
                className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                title="在文章中高亮显示"
              >
                <Icon icon="material-symbols:highlight-alt" className="w-4 h-4" />
              </button>
            )}
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
          <>
            <div className="max-h-[50vh] overflow-y-auto p-3 space-y-1 text-sm">
              {meaningfulDiff.map((part: DiffPart, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    'py-1.5 px-2 rounded text-xs break-all whitespace-pre-wrap border-l-2',
                    part.added
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200 border-green-400'
                      : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 border-red-400 line-through opacity-70'
                  )}
                >
                  <span className={cn(
                    'inline-block w-4 text-xs mr-1 select-none font-bold',
                    part.added && 'text-green-600 dark:text-green-400',
                    part.removed && 'text-red-600 dark:text-red-400'
                  )}>
                    {part.added ? '+' : part.removed ? '-' : ' '}
                  </span>
                  {part.value}
                </div>
              ))}
            </div>
            
            <div className="px-3 py-2 bg-muted/30 text-[10px] text-muted-foreground border-t border-border">
              {highlighted ? '变更已在文章中高亮显示' : '点击高亮按钮在文章中查看变更'}
            </div>
          </>
        )}
      </div>

      {/* 底部提示条 - 当高亮显示时 */}
      {highlighted && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto w-[calc(100%-2rem)] max-w-md sm:w-auto">
          <div className="bg-card border border-green-500/50 rounded-lg shadow-lg px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Icon icon="material-symbols:check-circle" className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">变更已高亮</span>
                <span className="text-xs text-muted-foreground">
                  +{stats.added} 新增, -{stats.removed} 删除
                </span>
              </div>
            </div>
            <button
              onClick={clearAllDiffState}
              className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
              title="清除高亮"
            >
              <Icon icon="material-symbols:close" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
