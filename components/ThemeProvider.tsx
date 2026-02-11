/**
 * 主题提供者组件
 * @module components/ThemeProvider
 * @description 提供全局主题状态管理，支持明暗模式切换和持久化存储
 */

'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'cofe-blog-theme'

/**
 * 获取初始主题
 * 优先从 localStorage 读取，其次检测系统偏好
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && (stored === 'light' || stored === 'dark')) {
      return stored
    }

    // 检测系统偏好
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch {
    // localStorage 不可用时的回退
  }

  return 'light'
}

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * 主题提供者组件
 * 管理全局主题状态并应用到文档根元素
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // 初始化主题
  useEffect(() => {
    const initialTheme = getInitialTheme()
    setThemeState(initialTheme)
    setMounted(true)
  }, [])

  // 应用主题到文档
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // 存储用户偏好
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage 不可用时的静默处理
    }
  }, [theme, mounted])

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  /**
   * 设置指定主题
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  // 防止 hydration 不匹配
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * 使用主题的 Hook
 * @throws 如果在 ThemeProvider 外部使用会抛出错误
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
