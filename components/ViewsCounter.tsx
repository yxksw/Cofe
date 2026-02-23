'use client'

import { useEffect, useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { animateValueWithSuffix } from '@/lib/animate-value'

interface ViewsCounterProps {
  pathname: string
  suffix?: string
  id?: string
}

export function ViewsCounter({ pathname, suffix = '次', id }: ViewsCounterProps) {
  const elementId = id ?? `page-views-${pathname.replace(/[^a-zA-Z0-9]+/g, '-')}`
  const [views, setViews] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    async function loadViews() {
      try {
        const res = await fetch(
          `https://cf-umami-cofe.050815.xyz/share?pathname=${encodeURIComponent(pathname)}`,
        )
        if (!res.ok) return
        const data = await res.json()
        const viewCount = data?.views || 0
        
        setViews(viewCount)
        setLoaded(true)
        
        // 动画效果
        if (elementRef.current && viewCount > 0) {
          animateValueWithSuffix(elementRef.current, 0, viewCount, 1000, suffix)
        }
      } catch {
        // 静默处理错误
      }
    }

    loadViews()
  }, [pathname, suffix])

  return (
    <div className="flex items-center gap-1.5">
      <Icon icon="material-symbols:visibility-outline-rounded" className="w-4 h-4 text-muted-foreground" />
      <span 
        ref={elementRef}
        id={elementId}
        className="text-sm text-muted-foreground font-medium"
      >
        {loaded ? `${views} ${suffix}` : `0 ${suffix}`}
      </span>
    </div>
  )
}
