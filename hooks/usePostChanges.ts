/**
 * 文章变更状态管理 Hook
 * @module hooks/usePostChanges
 * @description 管理文章变更的全局状态，支持跨组件通信
 */

'use client'

import { useState, useCallback, useEffect } from 'react'

export interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

export interface Post {
  title: string
  link: string
  guid: string
  pubDate: number
  content: string
  isUpdated?: boolean
  diff?: DiffPart[]
}

interface PostChangesState {
  activePost: Post | null
  isVisible: boolean
  isMinimized: boolean
}

const STORAGE_KEY = 'active-post-changes'
const NOTIFICATION_VISIBLE_KEY = 'cofe-notification-visible'

/**
 * 文章变更状态管理 Hook
 * 用于跨组件共享文章变更状态
 */
export function usePostChanges() {
  const [state, setState] = useState<PostChangesState>({
    activePost: null,
    isVisible: false,
    isMinimized: false,
  })

  // 从 sessionStorage 初始化状态
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setState(prev => ({
          ...prev,
          activePost: data,
          isVisible: true,
        }))
      } catch (e) {
        console.error('Failed to parse post changes:', e)
      }
    }
  }, [])

  /**
   * 显示文章变更
   */
  const showChanges = useCallback((post: Post) => {
    setState({
      activePost: post,
      isVisible: true,
      isMinimized: false,
    })
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(post))
  }, [])

  /**
   * 隐藏文章变更（最小化）
   */
  const hideChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: true,
    }))
  }, [])

  /**
   * 展开文章变更
   */
  const expandChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: false,
    }))
  }, [])

  /**
   * 关闭文章变更（完全关闭并清除数据）
   */
  const closeChanges = useCallback(() => {
    setState({
      activePost: null,
      isVisible: false,
      isMinimized: false,
    })
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  /**
   * 切换最小化状态
   */
  const toggleMinimize = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }))
  }, [])

  return {
    activePost: state.activePost,
    isVisible: state.isVisible,
    isMinimized: state.isMinimized,
    showChanges,
    hideChanges,
    expandChanges,
    closeChanges,
    toggleMinimize,
  }
}

/**
 * 通知面板状态管理 Hook
 */
export function useNotificationPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)

  // 从 localStorage 恢复状态
  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_VISIBLE_KEY)
    if (saved) {
      try {
        const { isMinimized: savedMinimized } = JSON.parse(saved)
        setIsMinimized(savedMinimized)
      } catch (e) {
        console.error('Failed to parse notification state:', e)
      }
    }
  }, [])

  // 保存状态到 localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_VISIBLE_KEY, JSON.stringify({ isMinimized }))
  }, [isMinimized])

  const open = useCallback(() => {
    setIsOpen(true)
    setIsMinimized(false)
  }, [])

  const minimize = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setIsMinimized(true), 300)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsMinimized(true)
    // 同时关闭文章变更展示
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    isOpen,
    isMinimized,
    open,
    minimize,
    close,
  }
}
