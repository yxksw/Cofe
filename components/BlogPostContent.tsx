'use client'

import 'katex/dist/katex.min.css'

import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { format } from 'date-fns'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Image from 'next/image'
import LikeButton from './LikeButton'
import { FancyboxWrapper } from './FancyboxWrapper'

interface BlogPostContentProps {
  title: string
  date: string
  content: string
  slug: string
  headerContent?: React.ReactNode
  discussionsComponent?: React.ReactNode
  location?: {
    city?: string
    street?: string
  }
}

export function BlogPostContent({ title, date, content, slug, headerContent, discussionsComponent, location }: BlogPostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 加载 articletoc.js 文件
    const script = document.createElement('script')
    script.src = '/js/articletoc.js'
    script.async = true
    document.body.appendChild(script)

    // 清理函数
    return () => {
      document.body.removeChild(script)
      // 清理创建的目录元素
      const tocElement = document.querySelector('.toc')
      const tocIcon = document.querySelector('.toc-icon')
      if (tocElement) tocElement.remove()
      if (tocIcon) tocIcon.remove()
    }
  }, [])

  return (
    <div className='max-w-3xl mx-auto px-4 py-8'>
      {headerContent && (
        <div className='flex justify-end mb-6'>
          {headerContent}
        </div>
      )}
      <main className='bg-card rounded-lg border border-border p-8'>
        <header className='mb-8'>
          <h1 className='text-3xl font-bold leading-tight mb-3 text-foreground'>{title}</h1>
          <div className='text-sm text-muted-foreground flex items-center gap-3'>
            <time dateTime={date}>
              {format(new Date(date), 'MMM d, yyyy')}
            </time>
            {location?.city && (
              <span className='flex items-center gap-1'>🖊 {location.city}{location.street ? ` · ${location.street}` : ''}</span>
            )}
          </div>
        </header>
        <FancyboxWrapper>
          <div className='prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed prose-p:my-3 prose-img:my-0 markdown-body' ref={contentRef}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({
                  inline,
                  className,
                  children,
                  ...props
                }: {
                  inline?: boolean
                  className?: string
                  children?: React.ReactNode
                } & React.HTMLAttributes<HTMLElement>) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={tomorrow as { [key: string]: React.CSSProperties }}
                      language={match[1]}
                      PreTag='div'
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                },
                a: ({ children, ...props }) => (
                  <a
                    {...props}
                    className='text-muted-foreground no-underline hover:text-foreground hover:underline hover:underline-offset-4 transition-colors duration-200 break-words'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className='pl-4 border-l-4 border-border text-muted-foreground'>
                    {children}
                  </blockquote>
                ),
                p: ({ children }) => {
                  // Check if this paragraph only contains an image
                  const isImageOnly = React.Children.toArray(children).every(child => 
                    React.isValidElement(child) && child.type === 'img'
                  )
                  return isImageOnly ? <>{children}</> : <p>{children}</p>
                },
                img: ({ src, alt }) => {
                  if (!src) return null
                  
                  return (
                    <div className='flex justify-center my-4'>
                      <a
                        href={src}
                        data-fancybox='gallery'
                        data-caption={alt || ''}
                        className='block w-full cursor-zoom-in'
                      >
                        <Image
                          src={src}
                          alt={alt || 'image'}
                          width={1200}
                          height={800}
                          className='h-auto w-full object-contain rounded-lg shadow-md hover:opacity-95 transition-opacity'
                          quality={100}
                          priority
                        />
                      </a>
                    </div>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </FancyboxWrapper>
        
        {/* Like button section */}
        <div className='mt-8 pt-6 border-t border-border flex justify-center'>
          <LikeButton type="blog" id={slug} />
        </div>
      </main>
      
      {/* External discussions section */}
      {discussionsComponent && (
        <div className='mt-6'>
          {discussionsComponent}
        </div>
      )}
    </div>
  )
}
