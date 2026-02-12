import { Metadata } from 'next'
import TagsPage from './TagsPage'
import { createSmartClient } from '@/lib/smartClient'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const metadata: Metadata = {
  title: '标签 - YXK BLOG',
  description: '浏览博客文章标签，按标签查找相关内容',
}

export const revalidate = 0

async function getTagsData() {
  const session = await getServerSession(authOptions)
  const client = createSmartClient(session?.accessToken)

  try {
    const posts = await client.getBlogPosts()

    // 统计标签和分类
    const tagStats = new Map<string, { count: number; posts: typeof posts }>()
    const categoryStats = new Map<string, { count: number; posts: typeof posts }>()

    posts.forEach((post) => {
      // 统计标签
      post.tags?.forEach((tag) => {
        const existing = tagStats.get(tag)
        if (existing) {
          existing.count++
          existing.posts.push(post)
        } else {
          tagStats.set(tag, { count: 1, posts: [post] })
        }
      })

      // 统计分类
      post.categories?.forEach((category) => {
        const existing = categoryStats.get(category)
        if (existing) {
          existing.count++
          existing.posts.push(post)
        } else {
          categoryStats.set(category, { count: 1, posts: [post] })
        }
      })
    })

    // 转换为数组并排序
    const tags = Array.from(tagStats.entries())
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        posts: stats.posts,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    const categories = Array.from(categoryStats.entries())
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        posts: stats.posts,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    return { tags, categories, posts }
  } catch (error) {
    console.error('Error fetching tags data:', error)
    return { tags: [], categories: [], posts: [] }
  }
}

export default async function TagsPageWrapper() {
  const { tags, categories, posts } = await getTagsData()

  return <TagsPage tags={tags} categories={categories} allPosts={posts} />
}
