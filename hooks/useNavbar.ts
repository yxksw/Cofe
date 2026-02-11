/**
 * 导航栏自定义 Hook
 * @module hooks/useNavbar
 * @description 提供导航栏状态管理、滚动检测和菜单交互逻辑
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 滚动状态接口
 * @interface ScrollState
 */
interface ScrollState {
  /** 当前滚动位置 */
  scrollY: number
  /** 滚动方向 */
  direction: 'up' | 'down' | null
  /** 是否已滚动超过阈值 */
  isScrolled: boolean
  /** 导航栏是否可见 */
  isVisible: boolean
}

/**
 * 移动端菜单状态接口
 * @interface MobileMenuState
 */
interface MobileMenuState {
  /** 主菜单是否展开 */
  isOpen: boolean
  /** 当前展开的子菜单 ID 集合 */
  expandedItems: Set<string>
}

/**
 * 桌面端菜单状态接口
 * @interface DesktopMenuState
 */
interface DesktopMenuState {
  /** 当前悬停的菜单项 ID */
  hoveredItem: string | null
  /** 延迟关闭计时器 */
  closeTimer: NodeJS.Timeout | null
}

/**
 * 导航栏 Hook 返回值接口
 * @interface UseNavbarReturn
 */
interface UseNavbarReturn {
  /** 滚动状态 */
  scrollState: ScrollState
  /** 移动端菜单状态 */
  mobileMenu: MobileMenuState
  /** 桌面端菜单状态 */
  desktopMenu: DesktopMenuState
  /** 切换移动端菜单 */
  toggleMobileMenu: () => void
  /** 关闭移动端菜单 */
  closeMobileMenu: () => void
  /** 切换子菜单展开状态 */
  toggleSubmenu: (itemId: string) => void
  /** 设置桌面端悬停项 */
  setDesktopHoveredItem: (itemId: string | null) => void
  /** 检查子菜单是否展开 */
  isSubmenuExpanded: (itemId: string) => boolean
}

/**
 * 导航栏自定义 Hook
 * @param {Object} options - 配置选项
 * @param {number} options.scrollThreshold - 滚动阈值（默认：50）
 * @param {boolean} options.hideOnScroll - 是否在向下滚动时隐藏导航栏（默认：true）
 * @returns {UseNavbarReturn} 导航栏状态和操作方法
 */
export function useNavbar(
  options: {
    scrollThreshold?: number
    hideOnScroll?: boolean
  } = {}
): UseNavbarReturn {
  const { scrollThreshold = 50, hideOnScroll = true } = options

  // 滚动状态
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    direction: null,
    isScrolled: false,
    isVisible: true,
  })

  // 移动端菜单状态
  const [mobileMenu, setMobileMenu] = useState<MobileMenuState>({
    isOpen: false,
    expandedItems: new Set(),
  })

  // 桌面端菜单状态
  const [desktopMenu, setDesktopMenu] = useState<DesktopMenuState>({
    hoveredItem: null,
    closeTimer: null,
  })

  // 用于存储上一次滚动位置
  const lastScrollY = useRef(0)
  // 用于防抖
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  /**
   * 处理滚动事件
   */
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    const direction = currentScrollY > lastScrollY.current ? 'down' : 'up'
    const isScrolled = currentScrollY > scrollThreshold

    // 计算导航栏可见性
    let isVisible = true
    if (hideOnScroll && isScrolled) {
      // 向下滚动超过阈值时隐藏，向上滚动时显示
      if (direction === 'down' && currentScrollY > lastScrollY.current + 10) {
        isVisible = false
      } else if (direction === 'up') {
        isVisible = true
      } else {
        isVisible = scrollState.isVisible
      }
    }

    setScrollState({
      scrollY: currentScrollY,
      direction,
      isScrolled,
      isVisible,
    })

    lastScrollY.current = currentScrollY
  }, [scrollThreshold, hideOnScroll, scrollState.isVisible])

  /**
   * 使用 requestAnimationFrame 优化滚动性能
   */
  const optimizedScrollHandler = useCallback(() => {
    if (scrollTimeout.current) {
      return
    }

    scrollTimeout.current = setTimeout(() => {
      handleScroll()
      scrollTimeout.current = null
    }, 16) // ~60fps
  }, [handleScroll])

  // 监听滚动事件
  useEffect(() => {
    window.addEventListener('scroll', optimizedScrollHandler, { passive: true })
    return () => {
      window.removeEventListener('scroll', optimizedScrollHandler)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [optimizedScrollHandler])

  /**
   * 切换移动端菜单
   */
  const toggleMobileMenu = useCallback(() => {
    setMobileMenu((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }))
  }, [])

  /**
   * 关闭移动端菜单
   */
  const closeMobileMenu = useCallback(() => {
    setMobileMenu({
      isOpen: false,
      expandedItems: new Set(),
    })
  }, [])

  /**
   * 切换子菜单展开状态
   */
  const toggleSubmenu = useCallback((itemId: string) => {
    setMobileMenu((prev) => {
      const newExpandedItems = new Set(prev.expandedItems)
      if (newExpandedItems.has(itemId)) {
        newExpandedItems.delete(itemId)
      } else {
        newExpandedItems.add(itemId)
      }
      return {
        ...prev,
        expandedItems: newExpandedItems,
      }
    })
  }, [])

  /**
   * 设置桌面端悬停项
   */
  const setDesktopHoveredItem = useCallback((itemId: string | null) => {
    setDesktopMenu((prev) => {
      // 清除之前的计时器
      if (prev.closeTimer) {
        clearTimeout(prev.closeTimer)
      }

      // 如果设置为 null，添加延迟关闭
      if (itemId === null) {
        const timer = setTimeout(() => {
          setDesktopMenu((current) => ({
            ...current,
            hoveredItem: null,
            closeTimer: null,
          }))
        }, 150)

        return {
          ...prev,
          closeTimer: timer,
        }
      }

      return {
        hoveredItem: itemId,
        closeTimer: null,
      }
    })
  }, [])

  /**
   * 检查子菜单是否展开
   */
  const isSubmenuExpanded = useCallback(
    (itemId: string) => {
      return mobileMenu.expandedItems.has(itemId)
    },
    [mobileMenu.expandedItems]
  )

  // 清理计时器
  useEffect(() => {
    return () => {
      if (desktopMenu.closeTimer) {
        clearTimeout(desktopMenu.closeTimer)
      }
    }
  }, [desktopMenu.closeTimer])

  return {
    scrollState,
    mobileMenu,
    desktopMenu,
    toggleMobileMenu,
    closeMobileMenu,
    toggleSubmenu,
    setDesktopHoveredItem,
    isSubmenuExpanded,
  }
}

/**
 * 媒体查询 Hook
 * @param {string} query - CSS 媒体查询字符串
 * @returns {boolean} 是否匹配媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    const updateMatch = () => {
      setMatches(media.matches)
    }

    updateMatch()
    media.addEventListener('change', updateMatch)

    return () => {
      media.removeEventListener('change', updateMatch)
    }
  }, [query])

  return matches
}

/**
 * 检测是否为移动端设备
 * @returns {boolean} 是否为移动端
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

/**
 * 检测是否为桌面端设备
 * @returns {boolean} 是否为桌面端
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}
