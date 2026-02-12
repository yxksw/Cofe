'use client'

import 'katex/dist/katex.min.css'

import React, { useRef } from 'react'
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
          <div className='text-sm text-muted-foreground flex items-center gap-3 flex-wrap'>
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
