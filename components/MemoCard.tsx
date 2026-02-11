import 'katex/dist/katex.min.css'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { AiOutlineEllipsis, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { Button } from '@/components/ui/button'
import { Memo } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { getRelativeTimeString } from '@/lib/utils'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTranslations } from 'next-intl'
import LikeButton from './LikeButton'

interface MemoCardProps {
  memo: Memo
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  isDeleting?: boolean
}

export const MemoCard = ({ memo, onDelete, onEdit, isDeleting = false }: MemoCardProps) => {
  const t = useTranslations('HomePage')

  return (
    <div
      key={memo.id}
      className='relative flex flex-col justify-center p-6 rounded-lg leading-5 transition-all duration-200 hover:shadow-md overflow-visible h-fit bg-card border border-border'
    >
      <div className='text-foreground mb-2 prose dark:prose-invert max-w-none'>
        <div className='flex items-center justify-between mb-3'>
          <small className='text-muted-foreground text-xs flex items-center gap-2'>
            {getRelativeTimeString(memo.timestamp)}
            {memo.city && (
              <span>@ {memo.city}{memo.street ? ` · ${memo.street}` : ''}</span>
            )}
          </small>
          <div className='flex items-center gap-2 flex-shrink-0'>
            <LikeButton type="memo" id={memo.id} className="text-xs scale-90" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='text-muted-foreground hover:text-foreground bg-transparent h-6 w-6 p-0 rounded-full'
                >
                  <AiOutlineEllipsis className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="bottom" 
                className="z-50 bg-popover border border-border shadow-lg rounded-md min-w-[120px]"
                sideOffset={4}
              >
                <DropdownMenuItem
                  onSelect={() => onDelete(memo.id)}
                  disabled={isDeleting}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent focus:bg-accent text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
                      {t('delete')}
                    </div>
                  ) : (
                    t('delete')
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onEdit(memo.id)} 
                  disabled={isDeleting}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent focus:bg-accent text-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('edit')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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
              <div className='pl-4 border-l-4 border-border text-muted-foreground'>{children}</div>
            ),
            img: ({ src, alt }) => {
              if (!src) return null
              
              return (
                <a
                  href={src}
                  data-fancybox={`memo-${memo.id}`}
                  data-caption={alt || ''}
                  className='block cursor-zoom-in my-2'
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt || 'image'}
                    className='max-w-full h-auto rounded-lg shadow-md hover:opacity-95 transition-opacity'
                  />
                </a>
              )
            },
          }}
        >
          {memo.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
