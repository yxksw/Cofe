'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Icon } from '@iconify/react'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLDivElement | null>
}

export function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // 提取标题生成目录
  useEffect(() => {
    const extractHeadings = () => {
      const content = contentRef.current
      if (!content) return

      const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const tocItems: TOCItem[] = []

      headings.forEach((heading, index) => {
        // 确保标题有 ID
        if (!heading.id) {
          const text = heading.textContent?.trim() || ''
          heading.id = text
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u4e00-\u9fa5-]/g, '')
            .replace(/-+/g, '-') || `heading-${index}`
        }

        tocItems.push({
          id: heading.id,
          text: heading.textContent?.trim() || '',
          level: parseInt(heading.tagName.charAt(1)),
        })
      })

      setItems(tocItems)
      setIsVisible(tocItems.length > 0)
    }

    // 延迟执行以确保内容已渲染
    const timer = setTimeout(extractHeadings, 100)
    return () => clearTimeout(timer)
  }, [contentRef])

  // 监听滚动，高亮当前标题
  useEffect(() => {
    if (items.length === 0) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100

      for (let i = items.length - 1; i >= 0; i--) {
        const element = document.getElementById(items[i].id)
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(items[i].id)
          return
        }
      }
      setActiveId('')
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  // 点击目录项滚动到对应位置
  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // 顶部偏移量
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      })
      setActiveId(id)
      setIsOpen(false)
    }
  }, [])

  // 滚动到评论区
  const scrollToComments = useCallback(() => {
    const commentsSection = document.querySelector('.gt-container') ||
                           document.querySelector('[class*="comment"]') ||
                           document.querySelector('h2:contains("评论")')
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // 如果没有找到评论区，滚动到页面底部
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      })
    }
    setIsOpen(false)
  }, [])

  // 回到顶部
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
    setIsOpen(false)
  }, [])

  // 点击外部关闭目录
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.toc-container')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => document.removeEventListener('click', handleClickOutside)
  }, [isOpen])

  if (!isVisible || items.length === 0) {
    return null
  }

  return (
    <>
      {/* 桌面端侧边目录 */}
      <aside className="hidden xl:block fixed left-[max(20px,calc(50%-600px))] top-24 w-56 max-h-[calc(100vh-8rem)] overflow-y-auto z-40">
        <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Icon icon="lucide:list" className="w-4 h-4" />
              目录
            </h3>
            {/* 直达评论按钮 */}
            <button
              onClick={scrollToComments}
              className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
              title="跳转到评论"
              aria-label="跳转到评论"
            >
              <Icon icon="lucide:message-circle" className="w-4 h-4" />
            </button>
          </div>
          <nav className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`
                  w-full text-left text-sm py-1.5 px-2 rounded transition-colors duration-200
                  hover:bg-muted
                  ${activeId === item.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}
                `}
                style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
              >
                <span className="line-clamp-1">{item.text}</span>
              </button>
            ))}
          </nav>
          {/* 回到顶部按钮 */}
          <button
            onClick={scrollToTop}
            className="w-full mt-3 pt-3 border-t border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 hover:bg-muted rounded-md"
          >
            <Icon icon="lucide:arrow-up" className="w-4 h-4" />
            <span>Top</span>
          </button>
        </div>
      </aside>

      {/* 移动端浮动目录按钮 */}
      <div className="xl:hidden toc-container">
        {/* 目录面板 */}
        <div
          className={`
            fixed bottom-36 right-4 w-64 max-h-[60vh] z-40
            bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-lg
            transition-all duration-300 ease-out
            ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
          `}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Icon icon="lucide:list" className="w-4 h-4" />
                目录
              </h3>
              <div className="flex items-center gap-1">
                {/* 直达评论按钮 */}
                <button
                  onClick={scrollToComments}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                  title="跳转到评论"
                  aria-label="跳转到评论"
                >
                  <Icon icon="lucide:message-circle" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                  <Icon icon="lucide:x" className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <nav className="space-y-1 max-h-[40vh] overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={`
                    w-full text-left text-sm py-2 px-2 rounded transition-colors duration-200
                    hover:bg-muted
                    ${activeId === item.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'}
                  `}
                  style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                >
                  <span className="line-clamp-1">{item.text}</span>
                </button>
              ))}
            </nav>
            {/* 回到顶部按钮 */}
            <button
              onClick={scrollToTop}
              className="w-full mt-3 pt-3 border-t border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 hover:bg-muted rounded-md"
            >
              <Icon icon="lucide:arrow-up" className="w-4 h-4" />
              <span>Top</span>
            </button>
          </div>
        </div>

        {/* 浮动按钮 - 位置调整到不干扰 CreateButton (bottom-9 right-9 ≈ 36px) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className={`
            fixed bottom-36 right-4 z-50
            w-12 h-12 rounded-full
            flex items-center justify-center
            shadow-lg border-2
            transition-all duration-300 ease-out
            ${isOpen
              ? 'bg-primary border-primary text-primary-foreground rotate-90'
              : 'bg-card border-primary text-primary hover:bg-primary hover:text-primary-foreground'
            }
          `}
          aria-label={isOpen ? '关闭目录' : '打开目录'}
        >
          <Icon
            icon={isOpen ? 'lucide:x' : 'lucide:list'}
            className="w-5 h-5"
          />
        </button>
      </div>
    </>
  )
}
