'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import type { Post } from './NewPostNotification'

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

export function PostDiffInArticle() {
  const [post, setPost] = useState<Post | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    // 从 sessionStorage 读取变更数据
    const stored = sessionStorage.getItem('active-post-changes')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setPost(data)
      } catch (e) {
        console.error('Failed to parse post changes:', e)
      }
    }
  }, [])

  // 关闭变更展示
  const handleClose = useCallback(() => {
    setIsVisible(false)
    sessionStorage.removeItem('active-post-changes')
  }, [])

  // 最小化/展开
  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev)
  }, [])

  if (!post || !post.diff || !isVisible) {
    return null
  }

  // 计算统计信息
  const addedCount = post.diff.filter((p) => p.added).length
  const removedCount = post.diff.filter((p) => p.removed).length

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
      {/* 头部 */}
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

      {/* 变更内容 */}
      {!isMinimized && (
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1 text-sm">
          {post.diff.map((part: DiffPart, idx: number) => {
            if (!part.added && !part.removed) {
              // 未变更的内容，只显示少量上下文
              const lines = part.value.split('\n').filter((l) => l.trim())
              if (lines.length === 0) return null
              // 只显示前2行作为上下文
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

      {/* 底部提示 */}
      {!isMinimized && (
        <div className="px-3 py-2 bg-muted/30 text-[10px] text-muted-foreground border-t border-border">
          点击关闭后，变更提示将不再显示
        </div>
      )}
    </div>
  )
}
