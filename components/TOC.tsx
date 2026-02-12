'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Icon } from '@iconify/react'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TOCProps {
  contentRef: React.RefObject<HTMLDivElement | null>
}

export function TOC({ contentRef }: TOCProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!contentRef.current) return

    const extractHeadings = () => {
      const elements = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6')
      if (!elements) return

      const items: TOCItem[] = []
      elements.forEach((el) => {
        const level = parseInt(el.tagName.charAt(1))
        const text = el.textContent?.trim() || ''
        
        if (!el.id) {
          el.id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
        }
        
        items.push({
          id: el.id,
          text,
          level
        })
      })
      
      setHeadings(items)
    }

    extractHeadings()

    const observer = new MutationObserver(extractHeadings)
    observer.observe(contentRef.current, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [contentRef])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0
      }
    )

    const timer = setTimeout(() => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id)
        if (element) {
          observer.observe(element)
        }
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [headings])

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      
      setActiveId(id)
      setIsOpen(false)
    }
  }, [])

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const tocElement = document.querySelector('.toc-container')
      const tocButton = document.querySelector('.toc-toggle-button')
      if (isOpen && tocElement && !tocElement.contains(e.target as Node) && !tocButton?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const minLevel = useMemo(() => {
    if (headings.length === 0) return 1
    return Math.min(...headings.map(h => h.level))
  }, [headings])

  if (headings.length === 0) return null

  return (
    <>
      <div className="hidden lg:block fixed right-8 top-32 w-64 z-40">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon icon="lucide:list" className="w-4 h-4" />
            目录
          </h3>
          <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
            {headings.map((heading) => {
              const indentLevel = heading.level - minLevel
              const isActive = activeId === heading.id
              
              return (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`
                    w-full text-left text-sm py-1.5 px-2 rounded transition-all duration-200
                    ${isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                  style={{ paddingLeft: `${indentLevel * 12 + 8}px` }}
                >
                  <span className="block truncate">{heading.text}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={handleToggle}
          className="toc-toggle-button w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="切换目录"
        >
          <Icon 
            icon={isOpen ? "lucide:x" : "lucide:list"} 
            className={`w-5 h-5 text-primary transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
          />
        </button>

        <div
          className={`
            toc-container absolute bottom-16 right-0 w-72 max-h-[60vh] bg-card border border-border 
            rounded-lg shadow-xl overflow-hidden transition-all duration-300 origin-bottom-right
            ${isOpen 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
            }
          `}
        >
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Icon icon="lucide:list" className="w-4 h-4" />
              目录
            </h3>
          </div>
          <nav className="p-2 space-y-0.5 max-h-[calc(60vh-60px)] overflow-y-auto">
            {headings.map((heading) => {
              const indentLevel = heading.level - minLevel
              const isActive = activeId === heading.id
              
              return (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`
                    w-full text-left text-sm py-2 px-2 rounded transition-all duration-200
                    ${isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                  style={{ paddingLeft: `${indentLevel * 12 + 8}px` }}
                >
                  <span className="block truncate">{heading.text}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
