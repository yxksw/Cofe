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
 * 主题提供者组件
 * 管理全局主题状态并应用到文档根元素
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // 初始化主题状态，直接从localStorage获取
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }
    
    // 从localStorage获取主题
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })

  // 初始化主题并应用到文档
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 应用主题
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  // 主题变化时更新DOM和localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 应用主题到DOM
    document.documentElement.classList.toggle('dark', theme === 'dark')

    // 保存到localStorage
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  // 切换主题
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // 设置主题
  const setThemeFunction = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeFunction }}>
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
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
