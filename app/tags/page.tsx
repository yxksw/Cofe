import { Metadata } from 'next'
import TagsPage from './TagsPage'

export const metadata: Metadata = {
  title: '标签 - YXK BLOG',
  description: '浏览博客文章标签，按标签查找相关内容',
}

export const revalidate = 0

// 直接使用本地文件系统获取文章数据
async function getPostsFromLocal() {
  try {
    const { createLocalFileSystemClient } = await import('@/lib/localClient.server')
    const client = createLocalFileSystemClient()
    return await client.getBlogPosts(true)
  } catch (error) {
    console.error('Error reading local posts:', error)
    return []
  }
}

async function getTagsData() {
  // 优先从本地文件系统读取
  const posts = await getPostsFromLocal()
  
  // 如果本地没有文章，返回错误
  if (posts.length === 0) {
    console.log('No local posts found')
    return { 
      tags: [], 
      categories: [], 
      posts: [],
      error: '未能读取文章数据，请检查 data/blog 目录是否存在文章'
    }
  }

  console.log(`Fetched ${posts.length} posts from local filesystem`)

  try {
    // 统计标签和分类
    const tagStats = new Map<string, { count: number; posts: typeof posts }>()
    const categoryStats = new Map<string, { count: number; posts: typeof posts }>()

    posts.forEach((post) => {
      // 统计标签
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: string) => {
          const existing = tagStats.get(tag)
          if (existing) {
            existing.count++
            existing.posts.push(post)
          } else {
            tagStats.set(tag, { count: 1, posts: [post] })
          }
        })
      }

      // 统计分类
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category: string) => {
          const existing = categoryStats.get(category)
          if (existing) {
            existing.count++
            existing.posts.push(post)
          } else {
            categoryStats.set(category, { count: 1, posts: [post] })
          }
        })
      }
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

    console.log(`Found ${tags.length} tags and ${categories.length} categories`)

    return { tags, categories, posts, error: null }
  } catch (error) {
    console.error('Error processing tags data:', error)
    return { 
      tags: [], 
      categories: [], 
      posts: [],
      error: error instanceof Error ? error.message : '处理数据失败'
    }
  }
}

export default async function TagsPageWrapper() {
  const { tags, categories, posts, error } = await getTagsData()

  return <TagsPage tags={tags} categories={categories} allPosts={posts} error={error} />
}
