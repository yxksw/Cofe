'use client'

import { useEffect, useRef } from 'react'
import 'gitalk/dist/gitalk.css'
import { useTheme } from 'next-themes'

interface GitalkCommentsProps {
  id: string
  title: string
}

export function GitalkComments({ id, title }: GitalkCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const loadGitalk = async () => {
      if (!containerRef.current) return

      // 清空容器
      containerRef.current.innerHTML = ''

      // 动态导入 gitalk
      const Gitalk = (await import('gitalk')).default

      const gitalk = new Gitalk({
        clientID: process.env.NEXT_PUBLIC_GITALK_CLIENT_ID || '',
        clientSecret: process.env.NEXT_PUBLIC_GITALK_CLIENT_SECRET || '',
        repo: process.env.NEXT_PUBLIC_GITALK_REPO || '',
        owner: process.env.NEXT_PUBLIC_GITALK_OWNER || '',
        admin: process.env.NEXT_PUBLIC_GITALK_ADMIN?.split(',') || [],
        id: id.substring(0, 50),
        title: title,
        language: 'zh-CN',
        distractionFreeMode: false,
        createIssueManually: false,
        enableHotKey: true,
        proxy: process.env.NEXT_PUBLIC_GITALK_PROXY || 'https://cors-anywhere.azm.workers.dev/https://github.com/login/oauth/access_token',
      })

      gitalk.render(containerRef.current)
    }

    loadGitalk()
  }, [id, title])

  // 根据主题更新 Gitalk 样式
  useEffect(() => {
    const updateGitalkTheme = () => {
      const gitalkContainer = document.querySelector('.gt-container')
      if (gitalkContainer) {
        if (resolvedTheme === 'dark') {
          gitalkContainer.classList.add('gt-dark')
        } else {
          gitalkContainer.classList.remove('gt-dark')
        }
      }
    }

    // 延迟执行，确保 Gitalk 已渲染
    const timer = setTimeout(updateGitalkTheme, 500)
    return () => clearTimeout(timer)
  }, [resolvedTheme])

  return (
    <div className="mt-8">
      <div ref={containerRef} />
    </div>
  )
}

export default GitalkComments
