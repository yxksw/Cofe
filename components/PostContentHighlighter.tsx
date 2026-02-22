'use client'

import { useEffect, useState, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'
import type { DiffPart } from '@/hooks/usePostChanges'

interface PostChanges {
  title: string
  link: string
  guid: string
  diff?: DiffPart[]
}

export default function PostContentHighlighter() {
  const [changes, setChanges] = useState<PostChanges | null>(null)
  const [highlighted, setHighlighted] = useState(false)
  const [stats, setStats] = useState({ added: 0, removed: 0 })
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
        // 清除高亮 - 使用函数形式避免依赖问题
        setHighlighted(currentHighlighted => {
          if (currentHighlighted) {
            const highlights = document.querySelectorAll('.diff-highlight-added, .diff-highlight-removed')
            highlights.forEach((el) => {
              const parent = el.parentNode
              if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent || ''), el)
                parent.normalize()
              }
            })
          }
          return false
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [changes])

  // 高亮文章中的变更内容
  const highlightChanges = useCallback(() => {
    if (!changes?.diff || highlighted) return

    const articleContent = document.querySelector('.markdown-body, .prose')
    if (!articleContent) return

    let addedCount = 0
    let removedCount = 0

    // 处理每个变更部分
    changes.diff.forEach((part) => {
      if (part.added && part.value.trim()) {
        addedCount++
        highlightText(articleContent, part.value, 'added')
      } else if (part.removed && part.value.trim()) {
        removedCount++
        highlightText(articleContent, part.value, 'removed')
      }
    })

    setStats({ added: addedCount, removed: removedCount })
    setHighlighted(true)
  }, [changes, highlighted])

  // 清除高亮
  const clearHighlight = useCallback(() => {
    const highlights = document.querySelectorAll('.diff-highlight-added, .diff-highlight-removed')
    highlights.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el)
        parent.normalize()
      }
    })
    setHighlighted(false)
  }, [])

  // 完全关闭
  const handleClose = useCallback(() => {
    clearHighlight()
    setIsVisible(false)
    sessionStorage.removeItem('active-post-changes')
  }, [clearHighlight])

  // 在文本中高亮指定内容
  const highlightText = (container: Element, text: string, type: 'added' | 'removed') => {
    if (!text.trim()) return

    // 清理搜索文本（去除多余空白）
    const searchText = text.trim().replace(/\s+/g, ' ')
    if (searchText.length < 3) return // 太短的文本不处理

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)
    const textNodes: Text[] = []
    let node: Node | null

    // 收集所有文本节点
    while ((node = walker.nextNode())) {
      // 跳过已经高亮的节点
      if ((node.parentElement?.classList.contains('diff-highlight-added')) ||
          (node.parentElement?.classList.contains('diff-highlight-removed'))) {
        continue
      }
      textNodes.push(node as Text)
    }

    // 处理每个文本节点
    textNodes.forEach((textNode) => {
      const content = textNode.textContent || ''
      
      // 尝试多种匹配方式
      const patterns = [
        searchText,
        searchText.replace(/[\n\r]/g, ''),
        searchText.replace(/\s+/g, ''),
        // 尝试匹配每一行
        ...searchText.split('\n').filter(line => line.trim().length > 5).map(line => line.trim())
      ]

      for (const pattern of patterns) {
        if (pattern.length < 3) continue
        
        const index = content.indexOf(pattern)
        if (index !== -1) {
          const span = document.createElement('span')
          span.className = type === 'added' 
            ? 'diff-highlight-added bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-100 px-1 rounded'
            : 'diff-highlight-removed bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-100 px-1 rounded line-through opacity-70'
          span.textContent = pattern

          const before = content.substring(0, index)
          const after = content.substring(index + pattern.length)
          
          const fragment = document.createDocumentFragment()
          if (before) fragment.appendChild(document.createTextNode(before))
          fragment.appendChild(span)
          if (after) fragment.appendChild(document.createTextNode(after))

          if (textNode.parentNode) {
            textNode.parentNode.replaceChild(fragment, textNode)
          }
          break // 匹配成功，跳出循环
        }
      }
    })
  }

  if (!changes?.diff || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-36 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
      {/* 控制按钮 */}
      <div className="pointer-events-auto flex flex-col gap-2">
        {!highlighted ? (
          <button
            onClick={highlightChanges}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'transition-all duration-300 animate-in fade-in slide-in-from-right'
            )}
          >
            <Icon icon="material-symbols:highlight-alt" className="w-5 h-5" />
            <span className="text-sm font-medium">高亮变更</span>
          </button>
        ) : (
          <>
            {/* 统计信息 */}
            <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-green-600 dark:text-green-400">+{stats.added}</span>
                <span className="text-red-600 dark:text-red-400">-{stats.removed}</span>
              </div>
            </div>
            
            {/* 清除高亮按钮 */}
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

            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg',
                'bg-destructive/10 text-destructive hover:bg-destructive/20',
                'transition-all duration-300'
              )}
            >
              <Icon icon="material-symbols:delete-outline" className="w-5 h-5" />
              <span className="text-sm font-medium">关闭</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
