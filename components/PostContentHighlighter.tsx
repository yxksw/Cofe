'use client'

import { useEffect, useState, useCallback } from 'react'
import { diffWords } from 'diff'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

const STORAGE_PREFIX = 'cofe-post-content-cache-'

export default function PostContentHighlighter() {
  const [showNotification, setShowNotification] = useState(false)
  const [diffCount, setDiffCount] = useState(0)

  // 获取文章内容文本
  const getContentText = useCallback(() => {
    // 查找文章内容的容器
    const container = document.querySelector('.prose') || 
                      document.querySelector('article') || 
                      document.querySelector('[class*="markdown"]') ||
                      document.querySelector('main')
    return container ? container.textContent || '' : ''
  }, [])

  // 高亮第一个差异
  const highlightFirstDiff = useCallback((textToFind: string) => {
    if (!textToFind) return

    const container = 
      document.querySelector('.prose') || 
      document.querySelector('article') || 
      document.querySelector('[class*="markdown"]') ||
      document.querySelector('main')
    
    if (!container) return

    // 清理搜索文本，取前50个字符
    const searchStr = textToFind.trim().substring(0, 50)
    if (!searchStr) return

    // 使用 TreeWalker 查找文本节点
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    )

    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.includes(searchStr)) {
        const parent = node.parentElement
        if (parent) {
          // 添加高亮动画
          parent.classList.add('content-update-highlight')
          parent.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // 2秒后移除高亮
          setTimeout(() => {
            parent.classList.remove('content-update-highlight')
          }, 3000)
        }
        break
      }
    }
  }, [])

  // 检查内容差异
  const checkContentDiff = useCallback(() => {
    // 只在文章页面运行
    const isBlogPost = window.location.pathname.startsWith('/blog/')
    if (!isBlogPost) return

    const currentPath = window.location.pathname
    const storageKey = STORAGE_PREFIX + currentPath
    const currentText = getContentText()

    if (!currentText) return

    const cachedText = localStorage.getItem(storageKey)

    if (!cachedText) {
      // 首次访问，缓存当前文本
      localStorage.setItem(storageKey, currentText)
    } else if (cachedText !== currentText) {
      // 内容已更改
      const diffs = diffWords(cachedText, currentText)
      
      // 过滤出有意义的添加部分（长度大于10个字符）
      const addedParts = diffs.filter(
        (part) => part.added && part.value.trim().length > 10
      )

      if (addedParts.length > 0) {
        setDiffCount(addedParts.length)
        setShowNotification(true)
        
        // 高亮第一个差异
        highlightFirstDiff(addedParts[0].value)
      }

      // 更新缓存
      localStorage.setItem(storageKey, currentText)
    }
  }, [getContentText, highlightFirstDiff])

  // 滚动到第一个更新处
  const scrollToUpdate = useCallback(() => {
    const highlighted = document.querySelector('.content-update-highlight')
    if (highlighted) {
      highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setShowNotification(false)
  }, [])

  // 初始化检查
  useEffect(() => {
    // 延迟执行，等待页面内容加载完成
    const timer = setTimeout(() => {
      checkContentDiff()
    }, 1000)

    return () => clearTimeout(timer)
  }, [checkContentDiff])

  // 如果不是文章页面，不渲染
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/blog/')) {
    return null
  }

  return (
    <>
      {/* 内容更新通知 */}
      <div
        className={cn(
          'fixed top-20 right-4 z-50 transition-all duration-300',
          showNotification
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0 pointer-events-none'
        )}
      >
        <div
          className={cn(
            'rounded-xl shadow-lg p-4 max-w-sm relative',
            'bg-background/80 dark:bg-background/80 border border-border',
            'flex flex-col gap-2'
          )}
          style={{
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          }}
        >
          <div className="flex items-center gap-2 text-primary">
            <Icon icon="material-symbols:edit-document" className="w-5 h-5" />
            <span className="font-bold text-sm text-foreground">内容已更新</span>
          </div>
          <p className="text-xs text-muted-foreground">
            检测到文章内容有变化，已为您高亮显示差异部分。
            {diffCount > 0 && `共 ${diffCount} 处更新。`}
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={scrollToUpdate}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs hover:bg-primary/90 transition-colors"
            >
              跳转到更新处
            </button>
            <button
              onClick={() => setShowNotification(false)}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs hover:bg-secondary/80 transition-colors"
            >
              忽略
            </button>
          </div>
        </div>
      </div>

      {/* 高亮样式 */}
      <style jsx global>{`
        .content-update-highlight {
          background: linear-gradient(120deg, rgba(234, 179, 8, 0.3) 0%, rgba(234, 179, 8, 0.1) 100%);
          border-radius: 4px;
          padding: 2px 4px;
          animation: highlight-pulse 2s ease-in-out;
        }

        @keyframes highlight-pulse {
          0%, 100% {
            background-color: rgba(234, 179, 8, 0.3);
          }
          50% {
            background-color: rgba(234, 179, 8, 0.5);
          }
        }
      `}</style>
    </>
  )
}
