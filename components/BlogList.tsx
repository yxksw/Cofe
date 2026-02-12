'use client'

import { BlogCard } from './BlogCard'
import { BlogPost } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FancyboxWrapper } from './FancyboxWrapper'
import Link from 'next/link'

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const router = useRouter()
  const t = useTranslations('HomePage')

  if (posts.length === 0) {
    return (
      <div className='max-w-3xl mx-auto px-4 py-8'>
        <div className='flex flex-col items-center mt-16 space-y-6'>
          <div className='text-center space-y-3'>
            <h2 className='text-2xl font-semibold text-foreground'>No blog posts yet</h2>
            <p className='text-muted-foreground max-w-md'>Share your thoughts and experiences by creating your first blog post.</p>
          </div>
          <Button
            onClick={() => router.push('/editor?type=blog')}
            className='bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3'
          >
            {t('createBlogPost')}
          </Button>
        </div>
      </div>
    )
  }

  const sorted = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className='max-w-3xl mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-semibold text-foreground'>Blog Posts</h2>
        <Link href='/blog' className='text-xs text-muted-foreground hover:text-foreground underline'>
          more
        </Link>
      </div>
      <FancyboxWrapper>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {sorted.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </FancyboxWrapper>
    </div>
  )
}
