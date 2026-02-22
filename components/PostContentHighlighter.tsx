'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import { applyInlineDiff, clearInlineDiff } from '@/lib/post-inline-diff'

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
  const [changes, setChanges] = useState<PostChanges | null>(null)
  const [highlighted, setHighlighted] = useState(false)
  const [stats, setStats] = useState({ added: 0, removed: 0 })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const hasDiffParam = urlParams.get('diff') === '1'

    if (hasDiffParam) {
      const stored = sessionStorage.getItem(DEBUG_STATE_KEY)
      if (stored) {
        try {
          const data = JSON.parse(stored)
          if (data.items && data.items.length > 0) {
            setChanges(data.items[0])
          }
        } catch (e) {
          console.error('Failed to parse post changes:', e)
        }
      }
    }
  }, [])

  const highlightChanges = useCallback(() => {
    if (!changes?.diff || highlighted) return

    const container = document.querySelector('.markdown-content, .prose, article')
    if (!container || !(container instanceof HTMLElement)) return

    applyInlineDiff(container, changes.diff)

    const addedCount = changes.diff.filter((p) => p.added).length
    const removedCount = changes.diff.filter((p) => p.removed).length
    setStats({ added: addedCount, removed: removedCount })
    setHighlighted(true)

    const postDiffEl = document.getElementById('post-diff')
    if (postDiffEl) {
      postDiffEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [changes, highlighted])

  const clearHighlight = useCallback(() => {
    const container = document.querySelector('.markdown-content, .prose, article')
    if (container && container instanceof HTMLElement) {
      clearInlineDiff(container)
    }

    setHighlighted(false)

    sessionStorage.removeItem(DEBUG_STATE_KEY)
    localStorage.removeItem(NOTIFICATION_STATE_KEY)

    const url = new URL(window.location.href)
    url.searchParams.delete('diff')
    url.searchParams.delete('__diff_debug')
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const scrollToDiff = useCallback(() => {
    const postDiffEl = document.getElementById('post-diff')
    if (postDiffEl) {
      postDiffEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      highlightChanges()
    }
  }, [highlightChanges])

  if (!changes?.diff) {
    return null
  }

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
                  onClick={highlightChanges}
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
                  onClick={clearHighlight}
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
                onClick={scrollToDiff}
                className="text-primary hover:underline text-xs"
              >
                跳转
              </button>
            </div>

            <button
              onClick={clearHighlight}
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
