'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { animateValueWithSuffix } from '@/lib/animate-value'

interface PostMetaProps {
  date: string
  content: string
  slug?: string
}

// 计算字数（中文按字符，英文按单词）
function countWords(content: string): number {
  const cleanContent = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '$1') // 保留链接文本
    .replace(/[#*`~\-_>]/g, '') // 移除 markdown 符号
    .replace(/\s+/g, ' ') // 合并空白
    .trim()

  const chineseChars = (cleanContent.match(/[\u4e00-\u9fa5]/g) || []).length
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
  const wordCount = countWords(content)
  const readingTime = calculateReadingTime(wordCount)
  
  // 浏览量状态
  const [views, setViews] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const viewsRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!slug) return
    
    async function fetchPageViews() {
      try {
        // 构建路径：/blog/编码后的slug
        const encodedSlug = encodeURIComponent(slug || '')
        const pathname = `/blog/${encodedSlug}`
        // 只对 pathname 编码一次
        const response = await fetch(
          `https://cf-umami-cofe.050815.xyz/share?pathname=${pathname}`
        )
        if (!response.ok) return
        
        const data = await response.json()
        const pageViews = data.views || 0
        
        setViews(pageViews)
        setLoaded(true)
        
        // 动画效果
        if (viewsRef.current && pageViews > 0) {
          animateValueWithSuffix(viewsRef.current, 0, pageViews, 1000, '次')
        }
      } catch (error) {
        console.error('Error fetching page views:', error)
      }
    }

    fetchPageViews()
  }, [slug])

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      {/* 日期 */}
      <div className="flex items-center gap-1.5">
        <Icon icon="material-symbols:schedule-outline-rounded" className="w-4 h-4" />
        <time dateTime={date}>
          {format(new Date(date), 'yyyy-MM-dd', { locale: zhCN })}
        </time>
      </div>

      {/* 分隔符 */}
      <span className="text-border">|</span>

      {/* 字数 */}
      <div className="flex items-center gap-1.5" title="文章字数">
        <Icon icon="material-symbols:description-outline-rounded" className="w-4 h-4" />
        <span>{formatNumber(wordCount)} 字</span>
      </div>

      {/* 分隔符 */}
      <span className="text-border">|</span>

      {/* 阅读时间 */}
      <div className="flex items-center gap-1.5" title="预计阅读时间">
        <Icon icon="material-symbols:timer-outline-rounded" className="w-4 h-4" />
        <span>{readingTime} 分钟</span>
      </div>

      {/* 浏览量 */}
      {slug && (
        <>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5" title="文章浏览量">
            <Icon icon="material-symbols:visibility-outline-rounded" className="w-4 h-4" />
            <span ref={viewsRef}>
              {loaded ? `${views} 次` : '0 次'}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
