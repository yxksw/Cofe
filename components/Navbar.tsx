'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  href: string
  icon: string
  target?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { id: 'home', label: '首页', href: '/', icon: 'material-symbols:home-outline' },
  {
    id: 'blog',
    label: '文章',
    href: '#',
    icon: 'material-symbols:article-outline',
    children: [
      { id: 'list', label: '所有文章', href: '/blog', icon: 'tabler:books' },
      { id: 'tags', label: '标签', href: '/tags', icon: 'tabler:tags' },
    ]
  },
//   { id: 'memos', label: '动态', href: '/memos', icon: 'material-symbols:chat-bubble-outline' },
  {
    id: 'friends',
    label: '友链',
    href: '#',
    icon: 'material-symbols:group-outline',
    children: [
      { id: 'links', label: '友情链接', href: '/link', icon: 'material-symbols:link' },
      { id: 'circle', label: '朋友圈', href: '/fcircle', icon: 'material-symbols:hub' },
    ]
    },
  {
    id: 'pages',
    label: '页面',
    href: '#',
    icon: 'iconoir:page-flip',
    children: [
      { id: 'sponsors', label: '赞助', href: '/sponsors', icon: 'octicon:sponsor-tiers-16' },
        { id: 'devices', label: '设备', href: '/devices', icon: 'material-symbols:devices' },
      { id: 'bangumi', label: '追番', href: '/bangumi', icon: 'meteor-icons:bilibili' },
    ]
  },
  { id: 'about', label: '关于', href: '/about', icon: 'material-symbols:person-outline' },
//   { id: 'editor', label: '编辑器', href: '/editor', icon: 'material-symbols:edit-note' },
]

// Iconify 图标组件
function IconifyIcon({ name, className }: { name: string; className?: string }) {
  const [svgContent, setSvgContent] = useState<string>('')

  useEffect(() => {
    const fetchIcon = async () => {
      try {
        const response = await fetch(`https://api.iconify.design/${name.replace(':', '/')}.svg`)
        const svg = await response.text()
        setSvgContent(svg)
      } catch (error) {
        console.error('Failed to load icon:', error)
      }
    }
    fetchIcon()
  }, [name])

  if (!svgContent) {
    return <span className={cn('inline-block', className)} />
  }

  return (
    <span
      className={cn('inline-flex items-center justify-center', className)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const lastScrollY = useRef(0)
  const submenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭子菜单（仅桌面端）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 只在桌面端处理点击外部关闭
      if (window.innerWidth >= 768 && submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        setOpenSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 滚动处理 - 向下滚动隐藏，向上滚动显示
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // 判断是否滚动超过阈值
      setIsScrolled(currentScrollY > 20)

      // 向下滚动超过50px且正在向下滚动时隐藏
      if (currentScrollY > 50 && currentScrollY > lastScrollY.current) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label)
  }

  return (
    <>
      {/* 桌面端导航栏 - 透明毛玻璃胶囊式设计 */}
      <header
        className={cn(
          'fixed top-4 left-0 right-0 z-50 hidden md:block',
          'transition-all duration-500 ease-in-out',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
        )}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div
            className={cn(
              'flex items-center justify-between px-6 py-3 rounded-full',
              'bg-background/80 backdrop-blur-xl border border-border/50',
              'shadow-2xl shadow-foreground/5',
              'transition-all duration-300',
              isScrolled && 'bg-background/95 shadow-foreground/10'
            )}
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-foreground font-bold text-xl hover:text-primary transition-colors duration-300 hover:scale-105"
            >
              <Image
                src="https://cn.cravatar.com/avatar/eb7277a11fa4dc00606e73afda41aeeb?=256"
                alt="塔罗会"
                width={36}
                height={36}
                className="rounded-full"
              />
              <span>塔罗会</span>
            </Link>

            {/* 桌面端水平菜单 */}
            <nav className="flex items-center gap-1" ref={submenuRef}>
              {navItems.map((item) => (
                <div key={item.id} className="relative">
                  {item.children ? (
                    // 有子菜单的导航项
                    <div className="relative">
                      <button
                        onClick={() => toggleSubmenu(item.label)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-xl',
                          'text-sm font-medium text-foreground/80',
                          'hover:text-foreground hover:bg-accent/50',
                          'transition-all duration-200',
                          openSubmenu === item.label && 'text-primary bg-accent/50'
                        )}
                      >
                        <IconifyIcon name={item.icon} className="w-5 h-5" />
                        <span>{item.label}</span>
                        <svg
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            openSubmenu === item.label && 'rotate-180'
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {/* 子菜单下拉 */}
                      <div
                        className={cn(
                          'absolute top-full left-0 mt-2 min-w-[160px]',
                          'bg-card/95 backdrop-blur-xl border border-border/50',
                          'rounded-xl shadow-2xl shadow-foreground/10',
                          'py-2 z-50 overflow-hidden',
                          'transition-all duration-200 origin-top',
                          openSubmenu === item.label
                            ? 'opacity-100 scale-100 translate-y-0'
                            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                        )}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            target={child.target || '_self'}
                            onClick={() => setOpenSubmenu(null)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg',
                              'text-sm font-medium text-foreground/70',
                              'hover:text-foreground hover:bg-accent/50',
                              'transition-all duration-200'
                            )}
                          >
                            <IconifyIcon name={child.icon} className="w-4 h-4" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // 普通导航项
                    <Link
                      href={item.href}
                      target={item.target || '_self'}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl',
                        'text-sm font-medium text-foreground/80',
                        'hover:text-foreground hover:bg-accent/50',
                        'transition-all duration-200'
                      )}
                    >
                      <IconifyIcon name={item.icon} className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* 右侧工具栏 */}
            <div className="flex items-center gap-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 移动端顶部导航栏 */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 md:hidden',
          'transition-all duration-500 ease-in-out',
          isVisible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-foreground font-bold text-lg">
              <Image
                src="https://cn.cravatar.com/avatar/eb7277a11fa4dc00606e73afda41aeeb?=256"
                alt="塔罗会"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span>塔罗会</span>
            </Link>

            {/* 右侧按钮 */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                  'p-2 rounded-lg text-foreground/80 hover:text-foreground hover:bg-accent/50',
                  'transition-all duration-200'
                )}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        <div
          className={cn(
            'bg-background/95 backdrop-blur-xl border-b border-border/50 overflow-hidden',
            'transition-all duration-300 ease-in-out',
            isMobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <div key={item.id}>
                {item.children ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(item.label)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-3 rounded-xl',
                        'text-sm font-medium text-foreground/80',
                        'hover:text-foreground hover:bg-accent/50',
                        'transition-all duration-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <IconifyIcon name={item.icon} className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      <svg
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          openSubmenu === item.label && 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* 移动端子菜单 */}
                    <div
                      className={cn(
                        'ml-4 mt-1 space-y-1 overflow-hidden transition-all duration-200',
                        openSubmenu === item.label ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      )}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          target={child.target || '_self'}
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setOpenSubmenu(null)
                          }}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                            'text-sm text-foreground/60',
                            'hover:text-foreground hover:bg-accent/50',
                            'transition-all duration-200'
                          )}
                        >
                          <IconifyIcon name={child.icon} className="w-4 h-4" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    target={item.target || '_self'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl',
                      'text-sm font-medium text-foreground/80',
                      'hover:text-foreground hover:bg-accent/50',
                      'transition-all duration-200'
                    )}
                  >
                    <IconifyIcon name={item.icon} className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>
    </>
  )
}

export default Navbar
