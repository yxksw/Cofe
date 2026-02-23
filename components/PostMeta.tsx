'use client'

import { useEffect, useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface PostMetaProps {
  date: string
  content: string
  slug: string
}

// 数字动画函数
function animateValue(
  element: HTMLElement,
  start: number,
  end: number,
  duration: number,
  suffix: string = ''
) {
  if (start === end) {
    element.textContent = `${start} ${suffix}`
    return
  }
  
  const range = end - start
  const minTimer = 50
  let stepTime = Math.abs(Math.floor(duration / range))
  stepTime = Math.max(stepTime, minTimer)
  
  const startTime = Date.now()
  const endTime = startTime + duration
  let timer: NodeJS.Timeout | null = null
  
  const run = () => {
    const now = Date.now()
    const remaining = Math.max((endTime - now) / duration, 0)
    const value = Math.round(end - (remaining * range))
    element.textContent = `${value} ${suffix}`
    
    if (value === end && timer) {
      clearInterval(timer)
    }
  }
  
  timer = setInterval(run, stepTime)
  run()
}

// 计算字数（中文按字符，英文按单词）
function countWords(content: string): number {
  // 移除 markdown 标记
  const cleanContent = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '$1') // 保留链接文本
    .replace(/[#*`~\-_>]/g, '') // 移除 markdown 符号
    .replace(/\s+/g, ' ') // 合并空白
    .trim()

  // 中文字符数
  const chineseChars = (cleanContent.match(/[\u4e00-\u9fa5]/g) || []).length
  // 英文单词数
  const englishWords = (cleanContent.match(/[a-zA-Z]+/g) || []).length

  return chineseChars + englishWords
}

// 计算阅读时间（按每分钟 300 字/词）
function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 300
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

export function PostMeta({ date, content, slug }: PostMetaProps) {
  const [views, setViews] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const viewsRef = useRef<HTMLSpanElement>(null)

  const wordCount = countWords(content)
  const readingTime = calculateReadingTime(wordCount)

  useEffect(() => {
    // 获取浏览量
    const fetchViews = async () => {
      try {
        // 使用 encodeURIComponent 对 slug 进行编码，确保中文路径正确处理
        const encodedSlug = encodeURIComponent(slug)
        const pathname = `/blog/${encodedSlug}`
        const apiUrl = `https://cf-umami-cofe.050815.xyz/share?pathname=${encodeURIComponent(pathname)}`
        
        // 调试日志
        console.log('[PostMeta] 开始获取浏览量:', {
          slug,
          pathname,
          apiUrl
        })
        
        const response = await fetch(apiUrl)
        
        console.log('[PostMeta] API 响应:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        })
        
        const data = await response.json()
        
        console.log('[PostMeta] API 数据:', data)
        
        const viewCount = data.views || 0
        
        console.log('[PostMeta] 解析后的浏览量:', {
          viewCount,
          type: typeof viewCount
        })
        
        setViews(viewCount)
        
        // 数字动画效果
        if (viewsRef.current && viewCount > 0) {
          animateValue(viewsRef.current, 0, viewCount, 1000, '次')
        }
      } catch (error) {
        console.error('[PostMeta] 获取浏览量失败:', error)
        setViews(0)
      } finally {
        setLoading(false)
        console.log('[PostMeta] 加载完成')
      }
    }

    fetchViews()
  }, [slug])

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      {/* 日期 */}
      <div className="flex items-center gap-1.5">
        <Icon icon="lucide:calendar" className="w-4 h-4" />
        <time dateTime={date}>
          {format(new Date(date), 'yyyy-MM-dd', { locale: zhCN })}
        </time>
      </div>

      {/* 分隔符 */}
      <span className="text-border">|</span>

      {/* 字数 */}
      <div className="flex items-center gap-1.5" title="文章字数">
        <Icon icon="lucide:file-text" className="w-4 h-4" />
        <span>{formatNumber(wordCount)} 字</span>
      </div>

      {/* 分隔符 */}
      <span className="text-border">|</span>

      {/* 阅读时间 */}
      <div className="flex items-center gap-1.5" title="预计阅读时间">
        <Icon icon="lucide:clock" className="w-4 h-4" />
        <span>{readingTime} 分钟</span>
      </div>

      {/* 分隔符 */}
      <span className="text-border">|</span>

      {/* 浏览量 */}
      <div className="flex items-center gap-1.5" title="文章浏览量">
        <Icon icon="lucide:eye" className="w-4 h-4" />
        {loading ? (
          <span className="animate-pulse">--</span>
        ) : (
          <span ref={viewsRef}>{formatNumber(views || 0)} 次</span>
        )}
      </div>
    </div>
  )
}
