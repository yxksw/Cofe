'use client'

import 'katex/dist/katex.min.css'

import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import Image from 'next/image'
import LikeButton from './LikeButton'
import { FancyboxWrapper } from './FancyboxWrapper'
import { Icon } from '@iconify/react'
import dynamic from 'next/dynamic'

// 动态导入 GitalkComments 组件，避免 SSR 问题
const GitalkComments = dynamic(() => import('./GitalkComments'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 p-8 bg-card rounded-lg border border-border text-center text-muted-foreground">
      评论加载中...
    </div>
  ),
})

interface Heading {
  id: string;
  text: string;
  level: number;
}

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
  const [headings, setHeadings] = useState<Heading[]>([])
  const [isTocOpen, setIsTocOpen] = useState(false)

  useEffect(() => {
    // 提取文章中的标题
    const extractHeadings = () => {
      if (contentRef.current) {
        const headingElements = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
        const extractedHeadings: Heading[] = []
        
        headingElements.forEach((heading, index) => {
          const text = heading.textContent || ''
          const level = parseInt(heading.tagName.charAt(1))
          const id = `heading-${index}`
          heading.id = id
          extractedHeadings.push({ id, text, level })
        })
        
        setHeadings(extractedHeadings)
      }
    }
    
    // 延迟提取，等待内容渲染完成
    const timer = setTimeout(extractHeadings, 100)

    return () => clearTimeout(timer)
  }, [content])

  // 点击目录项滚动到对应位置
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsTocOpen(false)
    }
  }

  // 点击外部关闭目录
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const tocElement = document.querySelector('.toc-container')
      const tocButton = document.querySelector('.toc-button')
      if (tocElement && !tocElement.contains(e.target as Node) && !tocButton?.contains(e.target as Node)) {
        setIsTocOpen(false)
      }
    }

    if (isTocOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => document.removeEventListener('click', handleClickOutside)
  }, [isTocOpen])

  return (
    <div className='max-w-3xl mx-auto px-4 py-8'>
      {headerContent && (
        <div className='flex justify-end mb-6'>
          {headerContent}
        </div>
      )}
      <main className='bg-card rounded-lg border border-border p-8'>
        <header className='mb-8 flex justify-between items-start'>
          <div>
            <h1 className='text-3xl font-bold leading-tight mb-3 text-foreground'>{title}</h1>
            <div className='text-sm text-muted-foreground flex items-center gap-3 flex-wrap'>
              <time dateTime={date}>
                {format(new Date(date), 'MMM d, yyyy')}
              </time>
              {location?.city && (
                <span className='flex items-center gap-1'>🖊 {location.city}{location.street ? ` · ${location.street}` : ''}</span>
              )}
            </div>
          </div>
          {/* 目录按钮 */}
          {headings.length > 0 && (
            <button 
              className='toc-button ml-4 p-2 rounded-lg hover:bg-accent transition-colors flex items-center justify-center border border-border bg-background'
              onClick={(e) => {
                e.stopPropagation();
                setIsTocOpen(!isTocOpen);
              }}
              aria-label="目录"
              title="目录"
            >
              <Icon icon="lucide:menu" className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </header>
        <FancyboxWrapper>
          <div className='prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed prose-p:my-3 prose-img:my-0 markdown-body' ref={contentRef}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                pre: ({ children }) => (
                  <pre className='code-block-wrapper my-4 overflow-x-auto rounded-lg'>
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
                  const isInline = !className?.includes('language-')
                  const language = className?.replace('language-', '') || 'text'

                  if (isInline) {
                    return (
                      <code className='inline-code bg-muted px-1.5 py-0.5 rounded text-sm font-mono' {...props}>
                        {children}
                      </code>
                    )
                  }

                  return (
                    <code className={`code-block language-${language}`} {...props}>
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
                  <blockquote className='pl-4 border-l-4 border-border text-muted-foreground bg-muted/50 py-2 px-4 rounded-r-lg my-4'>
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => (
                  <ul className='list-disc list-inside my-4 text-foreground space-y-1'>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className='list-decimal list-inside my-4 text-foreground space-y-1'>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className='text-foreground'>
                    {children}
                  </li>
                ),
                h1: ({ children }) => (
                  <h1 className='text-3xl font-bold text-foreground mt-8 mb-4'>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className='text-2xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-2'>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className='text-xl font-bold text-foreground mt-6 mb-3'>
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className='text-lg font-bold text-foreground mt-4 mb-2'>
                    {children}
                  </h4>
                ),
                strong: ({ children }) => (
                  <strong className='font-bold text-foreground'>
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className='italic text-foreground'>
                    {children}
                  </em>
                ),
                hr: () => (
                  <hr className='my-8 border-border' />
                ),
                table: ({ children }) => (
                  <div className='overflow-x-auto my-4'>
                    <table className='w-full border-collapse border border-border'>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className='bg-muted'>
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody>
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className='border-b border-border'>
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className='border border-border px-4 py-2 text-left font-bold text-foreground'>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className='border border-border px-4 py-2 text-foreground'>
                    {children}
                  </td>
                ),
                p: ({ children, ...props }) => {
                  // Check if this paragraph contains any images
                  const childrenArray = React.Children.toArray(children)
                  const hasImage = childrenArray.some(child =>
                    React.isValidElement(child) && child.type === 'img'
                  )
                  // If contains image, render as div to avoid hydration mismatch
                  if (hasImage) {
                    return <div {...props} className='my-3 text-foreground'>{children}</div>
                  }
                  return <p {...props} className='text-foreground'>{children}</p>
                },
                img: ({ src, alt }) => {
                  if (!src) return null
                  
                  return (
                    <span className='block my-4'>
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
                    </span>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </FancyboxWrapper>
        
        {/* 目录弹窗 */}
        {isTocOpen && headings.length > 0 && (
          <div className='toc-container fixed top-24 right-4 sm:right-8 w-64 max-h-[70vh] overflow-y-auto bg-card border border-border rounded-lg shadow-lg p-4 z-50'>
            <h3 className='text-sm font-semibold mb-3 text-foreground'>目录</h3>
            <nav className='space-y-1'>
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className='w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded px-2 py-1.5 transition-colors'
                  style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </div>
        )}
        
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

      {/* Gitalk 评论区 */}
      <div className='mt-6 bg-card rounded-lg border border-border p-8'>
        <h2 className='text-xl font-bold mb-6 text-foreground flex items-center gap-2'>
          <Icon icon="lucide:message-circle" className="w-5 h-5" />
          评论
        </h2>
        <GitalkComments id={slug} title={title} />
      </div>
    </div>
  )
}
