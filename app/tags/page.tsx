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

// 直接使用本地文件系统获取文章数据
async function getPostsFromLocal() {
  try {
    // 动态导入本地客户端（仅在服务端运行）
    const { createLocalFileSystemClient } = await import('@/lib/localClient.server')
    const client = createLocalFileSystemClient()
    return await client.getBlogPosts(true) // true 表示包含所有文章
  } catch (error) {
    console.error('Error reading local posts:', error)
    return []
  }
}

async function getTagsData() {
  const session = await getServerSession(authOptions)
  
  let posts = []
  
  // 如果有登录，尝试使用 SmartClient（GitHub API）
  if (session?.accessToken) {
    try {
      const client = createSmartClient(session.accessToken)
      posts = await client.getBlogPosts()
      console.log(`Fetched ${posts.length} posts from GitHub API`)
    } catch (error) {
      console.error('Error fetching from GitHub API, falling back to local:', error)
      // 如果 GitHub API 失败，回退到本地
      posts = await getPostsFromLocal()
    }
  } else {
    // 未登录时，直接从本地文件系统读取
    console.log('No session, reading posts from local filesystem')
    posts = await getPostsFromLocal()
    console.log(`Fetched ${posts.length} posts from local filesystem`)
  }

  // 如果没有获取到文章，返回错误
  if (posts.length === 0) {
    return { 
      tags: [], 
      categories: [], 
      posts: [],
      error: '未能读取文章数据，请检查 data/blog 目录是否存在文章'
    }
  }

  try {
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
