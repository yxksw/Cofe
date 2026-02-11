/**
 * 主题切换按钮组件
 * @module components/ThemeToggle
 * @description 提供明暗模式切换功能，带有平滑的过渡动画效果
 */

'use client'

import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

/**
 * 浅色模式图标（太阳图标）
 */
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0m-5 0h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7l-.7.7m0 11.4l.7.7m-12.1-.7l-.7.7"
      />
    </svg>
  )
}

/**
 * 深色模式图标（月亮图标）
 */
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z"
      />
    </svg>
  )
}

/**
 * 主题切换按钮组件
 * 在浅色模式显示太阳图标，深色模式显示月亮图标
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center',
        'w-10 h-10 rounded-full',
        'bg-transparent hover:bg-accent',
        'text-foreground hover:text-accent-foreground',
        'transition-all duration-300 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'active:scale-95',
        className
      )}
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      <span className="sr-only">
        {isDark ? '切换到浅色模式' : '切换到深色模式'}
      </span>
      
      {/* 太阳图标 - 浅色模式显示 */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          'transition-all duration-300 ease-in-out',
          isDark 
            ? 'opacity-0 rotate-90 scale-50' 
            : 'opacity-100 rotate-0 scale-100'
        )}
        aria-hidden={isDark}
      >
        <SunIcon className="w-5 h-5" />
      </span>
      
      {/* 月亮图标 - 深色模式显示 */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          'transition-all duration-300 ease-in-out',
          isDark 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-50'
        )}
        aria-hidden={!isDark}
      >
        <MoonIcon className="w-5 h-5" />
      </span>
    </button>
  )
}

export default ThemeToggle
