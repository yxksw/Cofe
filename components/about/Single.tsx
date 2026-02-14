'use client'

import { about } from '@/data/about'
import aboutContent from '@/data/about.md'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { processExternalLink } from '@/lib/externalLink'

function LinkComponent({ href, children }: { href?: string; children?: React.ReactNode }) {
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

export function Single() {
  const content = aboutContent

  return (
    <div className="create-site-post author-content-item single">
      {about.map((singleItem, index) => (
        <div key={index}>
          {singleItem.single.map((single, idx) => (
            <div key={idx}>
              <div className="author-content-item-tips">
                {single.tip}
              </div>
              <div className="author-content-item-title">
                {single.title}
              </div>
              <p className="author-content-item-content">
                {single.content}
              </p>
              <div className="lishi">
                {single.lishi}
              </div>
              <div className="singlePost">
                {content ? (
                  <div className="article prose dark:prose-invert max-w-none text-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        a: LinkComponent,
                        img: ({ src, alt, ...props }) => (
                          <img
                            src={src}
                            alt={alt}
                            {...props}
                            className="inline-block"
                            style={{
                              width: '1.1em',
                              height: '1.1em',
                              borderRadius: '50%',
                              verticalAlign: '-0.15em',
                              margin: '0 0.1em'
                            }}
                          />
                        )
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    可于 about.md 配置补充说明。
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
