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
 * 在客户端从localStorage获取，在服务器端返回light
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  
  try {
    // 从localStorage获取主题
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme
    }
    
    // 根据系统偏好设置主题
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    // 如果出错，默认返回light
    return 'light'
  }
}

/**
 * 主题提供者组件
 * 管理全局主题状态并应用到文档根元素
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // 使用函数初始化主题，确保只在客户端执行
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())

  // 主题变化时更新DOM和localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 获取当前已设置的主题（由内联脚本设置）
    const currentClass = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    
    // 只有当主题变化时才更新
    if (currentClass !== theme) {
      // 移除旧的主题类
      document.documentElement.classList.remove('light', 'dark')
      // 添加新的主题类
      document.documentElement.classList.add(theme)
    }

    // 保存到localStorage
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // 忽略localStorage错误
    }
  }, [theme])

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      // 只有当用户没有明确设置主题时，才根据系统偏好更新
      const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (!savedTheme) {
        setTheme(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    // 添加监听器
    mediaQuery.addEventListener('change', handleChange)
    
    // 清理监听器
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // 切换主题
  const toggleTheme = () => {
    console.log('Current theme before toggle:', theme)
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light'
      console.log('New theme after toggle:', newTheme)
      return newTheme
    })
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