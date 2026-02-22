'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import type { DiffPart } from '@/hooks/usePostChanges'

interface PostChanges {
  title: string
  link: string
  guid: string
  diff?: DiffPart[]
}

export default function PostInlineDiff() {
  const [changes, setChanges] = useState<PostChanges | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 从 sessionStorage 读取变更数据
    const stored = sessionStorage.getItem('active-post-changes')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setChanges(data)
      } catch (e) {
        console.error('Failed to parse post changes:', e)
      }
    }

    // 监听 sessionStorage 变化
    const interval = setInterval(() => {
      const current = sessionStorage.getItem('active-post-changes')
      if (!current && changes) {
        setIsVisible(false)
        setChanges(null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [changes])

  // 关闭 diff 显示
  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.removeItem('active-post-changes')
  }

  // 隐藏 diff 显示（保留 sessionStorage 数据）
  const handleHide = () => {
    setIsVisible(false)
  }

  if (!changes?.diff || !isVisible) {
    return null
  }

  // 过滤出有意义的变更
  const meaningfulDiff = changes.diff.filter(part => 
    (part.added || part.removed) && part.value.trim().length > 0
  )

  if (meaningfulDiff.length === 0) {
    return null
  }

  return (
    <div className="mb-8 rounded-xl border border-border bg-card overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon icon="material-symbols:edit-document" className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">文章变更</span>
          <span className="text-xs text-muted-foreground">
            +{meaningfulDiff.filter(d => d.added).length} -{meaningfulDiff.filter(d => d.removed).length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleHide}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            隐藏
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Icon icon="material-symbols:close" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Diff 内容 */}
      <div className="max-h-96 overflow-y-auto">
        {meaningfulDiff.map((part, index) => (
          <div
            key={index}
            className={cn(
              'px-4 py-2 text-sm border-l-4 whitespace-pre-wrap break-all',
              part.added && 'bg-green-50 dark:bg-green-950/30 border-green-400 text-green-900 dark:text-green-100',
              part.removed && 'bg-red-50 dark:bg-red-950/30 border-red-400 text-red-900 dark:text-red-100 line-through opacity-70'
            )}
          >
            {/* 行号指示器 */}
            <span className={cn(
              'inline-block w-6 text-xs mr-2 select-none',
              part.added && 'text-green-600 dark:text-green-400',
              part.removed && 'text-red-600 dark:text-red-400'
            )}>
              {part.added ? '+' : part.removed ? '-' : ' '}
            </span>
            {part.value}
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
        点击隐藏可在文章正文中查看变更，点击关闭将不再显示
      </div>
    </div>
  )
}
