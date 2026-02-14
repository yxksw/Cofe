import BlogList from "@/components/BlogList";
import { createSmartClient } from '@/lib/smartClient'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const revalidate = 0;

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

export default async function BlogPage() {
  let posts: any[] = []
  
  // 优先从本地文件系统读取（无论是否登录）
  posts = await getPostsFromLocal()
  
  // 如果本地没有文章，尝试使用 GitHub API
  if (posts.length === 0) {
    console.log('No local posts, trying GitHub API...')
    try {
      const session = await getServerSession(authOptions)
      const client = createSmartClient(session?.accessToken)
      posts = await client.getBlogPosts()
      console.log(`Fetched ${posts.length} posts from GitHub API`)
    } catch (error) {
      console.error('Error fetching from GitHub API:', error)
    }
  } else {
    console.log(`Fetched ${posts.length} posts from local filesystem`)
  }

  return <BlogList posts={posts} />;
}
