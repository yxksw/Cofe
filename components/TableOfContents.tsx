'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

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
  const [isMobile, setIsMobile] = useState(false)
  const tocRef = useRef<HTMLDivElement>(null)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 生成目录项
  useEffect(() => {
    const generateTOC = () => {
      const content = contentRef.current
      if (!content) return

      const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const tocItems: TOCItem[] = []

      headings.forEach((heading, index) => {
        // 为没有 id 的标题生成 id
        if (!heading.id) {
          const text = heading.textContent || ''
          heading.id = text.trim().replace(/\s+/g, '-').toLowerCase() + '-' + index
        }

        tocItems.push({
          id: heading.id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.charAt(1)),
        })
      })

      setItems(tocItems)
    }

    // 延迟执行以确保内容已渲染
    const timer = setTimeout(generateTOC, 100)
    return () => clearTimeout(timer)
  }, [contentRef])

  // 滚动监听，高亮当前阅读位置
  useEffect(() => {
    if (items.length === 0) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100

      for (let i = items.length - 1; i >= 0; i--) {
        const element = document.getElementById(items[i].id)
        if (element && element.offsetTop <= scrollPosition) {
          setActiveId(items[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初始检查

    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  // 点击外部关闭移动端目录
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tocRef.current && !tocRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen && isMobile) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, isMobile])

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // 考虑固定导航栏的高度
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      })
      setActiveId(id)
      if (isMobile) {
        setIsOpen(false)
      }
    }
  }, [isMobile])

  const toggleTOC = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  if (items.length === 0) return null

  return (
    <>
      {/* 桌面端侧边栏目录 */}
      <div className="hidden lg:block">
        <div className="fixed left-[max(20px,calc((100vw-1280px)/2+20px))] top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto z-40">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon icon="lucide:list" className="w-4 h-4" />
              目录
            </h3>
            <nav className="space-y-1">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={cn(
                    'block text-sm py-1.5 px-2 rounded-md transition-colors duration-200 truncate',
                    'hover:bg-muted',
                    item.level === 1 && 'font-medium',
                    item.level === 2 && 'pl-4',
                    item.level === 3 && 'pl-6 text-xs',
                    item.level >= 4 && 'pl-8 text-xs text-muted-foreground',
                    activeId === item.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* 移动端浮动按钮和弹出目录 */}
      <div className="lg:hidden" ref={tocRef}>
        {/* 浮动按钮 */}
        <button
          onClick={toggleTOC}
          className={cn(
            'fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full shadow-lg',
            'flex items-center justify-center',
            'transition-all duration-300 ease-out',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            isOpen && 'rotate-90 bg-destructive hover:bg-destructive/90'
          )}
          aria-label={isOpen ? '关闭目录' : '打开目录'}
        >
          <Icon
            icon={isOpen ? 'lucide:x' : 'lucide:list'}
            className="w-5 h-5"
          />
        </button>

        {/* 弹出式目录面板 */}
        <div
          className={cn(
            'fixed bottom-36 right-4 z-40 w-72 max-h-[60vh]',
            'bg-card/95 backdrop-blur-md rounded-xl border border-border',
            'shadow-xl overflow-hidden',
            'transition-all duration-300 ease-out',
            isOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon icon="lucide:list" className="w-4 h-4" />
              目录
            </h3>
            <nav className="space-y-1 max-h-[45vh] overflow-y-auto">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={cn(
                    'block text-sm py-2 px-2 rounded-md transition-colors duration-200',
                    'hover:bg-muted',
                    item.level === 1 && 'font-medium',
                    activeId === item.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* 遮罩层 */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </>
  )
}
