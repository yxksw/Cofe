'use client'

import { useEffect, useState, ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import announcementConfig from '@/data/announcement.json'
import announcementContent from '@/data/announcement.md'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { processExternalLink } from '@/lib/externalLink'

function LinkComponent({ href, children }: { href?: string; children?: ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href) return
    
    try {
      const url = new URL(href, window.location.origin)
      const currentHost = window.location.hostname
      
      if (url.hostname === currentHost) {
        return
      }
      
      const processedUrl = processExternalLink(href)
      
      if (processedUrl === null) {
        e.preventDefault()
        alert('该链接已被拦截，无法访问')
        return
      }
      
      if (processedUrl !== href) {
        e.preventDefault()
        window.open(processedUrl, '_blank')
      }
    } catch {
      // 非有效 URL，不处理
    }
  }
  
  return (
    <a
      href={href}
      onClick={handleClick}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

type AnnouncementLevel = 'info' | 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'happy'

interface AnnouncementConfig {
  enable: boolean
  level: AnnouncementLevel
  title: string
  content: string
}

const iconMap: Record<AnnouncementLevel, string> = {
  info: 'lucide:info',
  note: 'lucide:file-text',
  tip: 'lucide:lightbulb',
  important: 'lucide:message-square-warning',
  warning: 'lucide:alert-triangle',
  caution: 'lucide:alert-circle',
  happy: 'lucide:party-popper',
}

const colorMap: Record<AnnouncementLevel, string> = {
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
  note: 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400',
  tip: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
  important: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400',
  caution: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  happy: 'bg-card',
}

export function Announcement() {
  const [config, setConfig] = useState<AnnouncementConfig>(announcementConfig as AnnouncementConfig)
  const [content, setContent] = useState(announcementContent)
  const [showImages, setShowImages] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
    setContent(announcementContent)
    setConfig(announcementConfig as AnnouncementConfig)
  }, [])

  if (!config.enable) {
    return null
  }

  const isHappy = config.level === 'happy'
  const currentIcon = iconMap[config.level] || iconMap.info
  const currentColor = colorMap[config.level] || colorMap.info

  // 避免 hydration 不匹配，在客户端挂载前显示简化版本
  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 w-full">
        <div className={`rounded-xl border p-4 ${currentColor}`}>
          <div className="flex items-start gap-4">
            <Icon icon={currentIcon} width={24} height={24} />
            <div className="text-sm md:text-base">{config.title}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 w-full">
      <div className="announcement-card mb-6 relative transition-all duration-300 hover:shadow-lg">
        {isHappy ? (
          // Happy level with rainbow effect
          <div className="announcement-happy flex items-start gap-4 p-4 rounded-xl bg-card relative overflow-hidden">
            <div className="icon-wrapper flex items-center justify-center shrink-0 mt-0.5">
              <span className="notice-emoji" aria-hidden="true">🎉</span>
            </div>
            <div className="text-wrapper grow relative min-w-0">
              <div className="announcement-text text-sm md:text-base announcement-rainbow-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    a: LinkComponent,
                    p: ({ children }) => <span className="block mb-2 last:mb-0">{children}</span>,
                    img: ({ src, alt }) => (
                      <span className="block my-3">
                        {!showImages ? (
                          <button
                            onClick={() => setShowImages(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-background border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <Icon icon="lucide:image" width={16} height={16} />
                            查看图片
                          </button>
                        ) : (
                          <span className="block space-y-2">
                            <Image
                              src={src || ''}
                              alt={alt || ''}
                              width={800}
                              height={600}
                              className="max-w-full h-auto rounded-lg border border-border"
                              unoptimized
                            />
                            <button
                              onClick={() => setShowImages(false)}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Icon icon="lucide:chevron-up" width={14} height={14} />
                              收起图片
                            </button>
                          </span>
                        )}
                      </span>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>

            {/* 编辑按钮 - 仅登录用户可见 */}
            {session && (
              <div className="absolute top-2 right-2 z-10">
                <Link
                  href="/announcement-editor"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-background/80 backdrop-blur-sm border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <Icon icon="lucide:edit-3" width={14} height={14} />
                  编辑公告
                </Link>
              </div>
            )}
          </div>
        ) : (
          // Normal levels
          <div
            className={`announcement-content flex items-start gap-4 p-4 rounded-xl border bg-card ${currentColor}`}
          >
            <div className="icon-wrapper flex items-center justify-center shrink-0 mt-0.5">
              <Icon icon={currentIcon} width={24} height={24} />
            </div>
            <div className="text-wrapper grow relative min-w-0">
              <div className="announcement-text text-sm md:text-base text-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    a: LinkComponent,
                    p: ({ children }) => <span className="block mb-2 last:mb-0">{children}</span>,
                    img: ({ src, alt }) => (
                      <span className="block my-3">
                        {!showImages ? (
                          <button
                            onClick={() => setShowImages(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-background border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <Icon icon="lucide:image" width={16} height={16} />
                            查看图片
                          </button>
                        ) : (
                          <span className="block space-y-2">
                            <Image
                              src={src || ''}
                              alt={alt || ''}
                              width={800}
                              height={600}
                              className="max-w-full h-auto rounded-lg border border-border"
                              unoptimized
                            />
                            <button
                              onClick={() => setShowImages(false)}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Icon icon="lucide:chevron-up" width={14} height={14} />
                              收起图片
                            </button>
                          </span>
                        )}
                      </span>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>

            {/* 编辑按钮 - 仅登录用户可见 */}
            {session && (
              <div className="absolute top-2 right-2">
                <Link
                  href="/announcement-editor"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-background/80 backdrop-blur-sm border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <Icon icon="lucide:edit-3" width={14} height={14} />
                  编辑公告
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rainbow effect styles */}
      <style jsx>{`
        @keyframes rainbow-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .announcement-happy {
          --hue: 0;
          --card-bg: hsl(var(--card));
          --notice-gradient: linear-gradient(
            90deg,
            oklch(0.78 0.18 calc(var(--hue) + 0)),
            oklch(0.78 0.18 calc(var(--hue) + 45)),
            oklch(0.78 0.18 calc(var(--hue) + 90)),
            oklch(0.78 0.18 calc(var(--hue) + 135)),
            oklch(0.78 0.18 calc(var(--hue) + 180)),
            oklch(0.78 0.18 calc(var(--hue) + 225)),
            oklch(0.78 0.18 calc(var(--hue) + 270)),
            oklch(0.78 0.18 calc(var(--hue) + 315)),
            oklch(0.78 0.18 calc(var(--hue) + 360))
          );
          border: 2px solid transparent;
          background: linear-gradient(var(--card-bg), var(--card-bg)) padding-box, 
                      var(--notice-gradient) border-box;
          background-size: 100% 100%, 200% 100%;
          animation: rainbow-flow 3s linear infinite;
        }

        .announcement-rainbow-text {
          background: linear-gradient(
            90deg,
            oklch(0.78 0.18 calc(var(--hue) + 0)),
            oklch(0.78 0.18 calc(var(--hue) + 45)),
            oklch(0.78 0.18 calc(var(--hue) + 90)),
            oklch(0.78 0.18 calc(var(--hue) + 135)),
            oklch(0.78 0.18 calc(var(--hue) + 180)),
            oklch(0.78 0.18 calc(var(--hue) + 225)),
            oklch(0.78 0.18 calc(var(--hue) + 270)),
            oklch(0.78 0.18 calc(var(--hue) + 315)),
            oklch(0.78 0.18 calc(var(--hue) + 360))
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: rainbow-flow 3s linear infinite;
        }

        .announcement-happy :global(p),
        .announcement-happy :global(span),
        .announcement-happy :global(h1),
        .announcement-happy :global(h2),
        .announcement-happy :global(h3),
        .announcement-happy :global(h4),
        .announcement-happy :global(h5),
        .announcement-happy :global(h6) {
          background: linear-gradient(
            90deg,
            oklch(0.78 0.18 calc(var(--hue) + 0)),
            oklch(0.78 0.18 calc(var(--hue) + 45)),
            oklch(0.78 0.18 calc(var(--hue) + 90)),
            oklch(0.78 0.18 calc(var(--hue) + 135)),
            oklch(0.78 0.18 calc(var(--hue) + 180)),
            oklch(0.78 0.18 calc(var(--hue) + 225)),
            oklch(0.78 0.18 calc(var(--hue) + 270)),
            oklch(0.78 0.18 calc(var(--hue) + 315)),
            oklch(0.78 0.18 calc(var(--hue) + 360))
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: rainbow-flow 3s linear infinite;
        }

        .announcement-happy .notice-emoji {
          font-size: 1.5rem;
          line-height: 1;
        }
      `}</style>
    </div>
  )
}
