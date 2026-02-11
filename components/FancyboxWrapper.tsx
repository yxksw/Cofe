'use client'

import { useEffect, useRef } from 'react'
import { Fancybox as NativeFancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

interface FancyboxWrapperProps {
  children: React.ReactNode
  options?: object
  delegate?: string
}

/**
 * Fancybox 包装组件
 * 为子元素中的图片添加灯箱功能
 */
export function FancyboxWrapper({
  children,
  options = {},
  delegate = '[data-fancybox]',
}: FancyboxWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 初始化 Fancybox
    NativeFancybox.bind(container, delegate, {
      // 默认配置
      animated: true,
      showClass: 'f-fadeIn',
      hideClass: 'f-fadeOut',
      dragToClose: true,
      Toolbar: {
        display: {
          left: ['infobar'],
          middle: ['zoomIn', 'zoomOut', 'toggle1to1', 'rotateCCW', 'rotateCW', 'flipX', 'flipY'],
          right: ['slideshow', 'thumbs', 'close'],
        },
      },
      Image: {
        click: 'toggleZoom',
        doubleClick: 'toggleZoom',
        wheel: 'zoom',
        fit: 'contain-w',
        protect: true,
      },
      // 自定义配置覆盖
      ...options,
    })

    // 清理函数
    return () => {
      NativeFancybox.unbind(container)
      NativeFancybox.close()
    }
  }, [delegate, options])

  return <div ref={containerRef}>{children}</div>
}

/**
 * 图片链接组件
 * 用于包装图片以启用 Fancybox 灯箱
 */
interface FancyboxImageProps {
  src: string
  alt?: string
  caption?: string
  className?: string
  children?: React.ReactNode
  thumbnailSrc?: string
}

export function FancyboxImage({
  src,
  alt = '',
  caption,
  className,
  children,
  thumbnailSrc,
}: FancyboxImageProps) {
  const dataAttrs: Record<string, string> = {
    'data-fancybox': 'gallery',
    'data-src': src,
  }

  if (caption) {
    dataAttrs['data-caption'] = caption
  }

  return (
    <a
      href={src}
      {...dataAttrs}
      className={className}
    >
      {children || (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailSrc || src}
          alt={alt}
          className="cursor-zoom-in"
        />
      )}
    </a>
  )
}

export default FancyboxWrapper
