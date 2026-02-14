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
  const session = await getServerSession(authOptions);
  
  let posts = []
  
  // 如果有登录，尝试使用 SmartClient（GitHub API）
  if (session?.accessToken) {
    try {
      const client = createSmartClient(session.accessToken)
      posts = await client.getBlogPosts()
      console.log(`Fetched ${posts.length} posts from GitHub API`)
    } catch (error) {
      console.error('Error fetching from GitHub API, falling back to local:', error)
      posts = await getPostsFromLocal()
    }
  } else {
    // 未登录时，直接从本地文件系统读取
    console.log('No session, reading posts from local filesystem')
    posts = await getPostsFromLocal()
    console.log(`Fetched ${posts.length} posts from local filesystem`)
  }

  return <BlogList posts={posts} />;
}
