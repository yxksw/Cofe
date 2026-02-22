'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

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
  const [stats, setStats] = useState({ added: 0, removed: 0 })

  useEffect(() => {
    debugLog('===== useEffect 触发，检查 diff 数据 =====')
    
    // 获取当前文章的路径
    const currentPath = window.location.pathname
    debugLog('Step 1: 当前路径', currentPath)

    // 检查是否设置了"不再提醒"
    const dismissKey = `post-diff-dismissed-${currentPath}`
    const isDismissed = sessionStorage.getItem(dismissKey)
    if (isDismissed) {
      debugLog('Step 2: 用户已选择不再提醒此文章的变更')
      return
    }

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
        } else {
          debugLog('Step 7: diff 数据为空')
        }
      } catch (e) {
        debugError('Step 5: 解析 diff 数据失败', e)
      }
    } else {
      debugLog('Step 5: sessionStorage 中没有 diff 数据')
    }
    
    debugLog('===== useEffect 完成 =====')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleMinimize = useCallback(() => {
    debugLog('点击最小化/展开按钮', { currentState: isMinimized ? 'minimized' : 'expanded' })
    setIsMinimized((prev) => !prev)
  }, [isMinimized])

  const handleClose = useCallback(() => {
    debugLog('点击关闭按钮')
    setIsVisible(false)
  }, [])

  const handleDismiss = useCallback(() => {
    debugLog('点击不再提醒按钮')
    
    // 获取当前文章的路径
    const currentPath = window.location.pathname
    const dismissKey = `post-diff-dismissed-${currentPath}`
    
    // 设置不再提醒标记
    sessionStorage.setItem(dismissKey, 'true')
    debugSuccess(`已设置不再提醒标记: ${dismissKey}`)
    
    // 隐藏弹窗
    setIsVisible(false)
  }, [])

  debugLog('===== 渲染检查 =====', { 
    isVisible, 
    hasData: !!diffData,
    hasDiff: !!diffData?.diff
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
    diffBlocks: meaningfulDiff.length
  })

  return (
    <>
      {/* 悬浮面板 - 显示 diff 列表 */}
      <div
        className={cn(
          'fixed z-50 overflow-hidden',
          // 移动端：全宽，顶部
          'top-4 left-4 right-4',
          // 桌面端：右上角固定宽度
          'md:top-20 md:left-auto md:right-4 md:w-80',
          'bg-background/95 dark:bg-background/95 border border-border',
          'rounded-xl shadow-lg',
          'transition-all duration-300',
          isMinimized && 'md:w-auto'
        )}
        style={{
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2 min-w-0">
            <Icon icon="material-symbols:edit-document" className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-medium text-sm text-foreground truncate">文章变更</span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              +{stats.added} -{stats.removed}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={toggleMinimize}
              className="p-1.5 rounded hover:bg-accent transition-colors"
              title={isMinimized ? '展开' : '最小化'}
            >
              <Icon
                icon={isMinimized ? 'material-symbols:expand-more' : 'material-symbols:expand-less'}
                className="w-4 h-4 text-muted-foreground"
              />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="关闭"
            >
              <Icon icon="material-symbols:close" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        {!isMinimized && (
          <div className="max-h-[60vh] md:max-h-[50vh] overflow-y-auto">
            {/* Diff 列表 */}
            <div className="p-3 space-y-1">
              {meaningfulDiff.map((part: DiffPart, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    'py-2 px-3 rounded text-sm break-words border-l-2',
                    part.added
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200 border-green-400'
                      : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 border-red-400'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      'text-xs font-bold flex-shrink-0 mt-0.5',
                      part.added ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {part.added ? '+' : part.removed ? '-' : ' '}
                    </span>
                    <span className={cn(
                      part.removed && 'line-through opacity-70'
                    )}>
                      {part.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 底部操作栏 */}
            <div className="px-3 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                文章已更新
              </span>
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="不再提醒此文章的变更"
              >
                <Icon icon="material-symbols:notifications-off" className="w-3 h-3" />
                不再提醒
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
