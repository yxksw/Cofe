/**
 * RSS 存储管理
 * @module lib/rssStore
 * @description 使用 IndexedDB 存储和管理 RSS 数据
 */

import type { Post, DiffPart } from '@/hooks/usePostChanges'
import { diffLines } from 'diff'

const DB_NAME = 'cofe-blog-rss-store'
const DB_VERSION = 1
const STORE_NAME = 'posts'

export interface StoredPost extends Post {
  id: string
}

/**
 * 打开 IndexedDB 数据库
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

/**
 * 生成作用域 ID
 */
export function generateId(guid: string): string {
  const scope = typeof window !== 'undefined' ? window.location.hostname : 'default'
  return `${scope}:${guid}`
}

/**
 * 获取存储的所有文章
 */
export async function getStoredPosts(db: IDBDatabase): Promise<StoredPost[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as StoredPost[])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 保存文章到数据库
 */
export async function savePosts(db: IDBDatabase, posts: Post[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    posts.forEach((post) => {
      const itemToSave: StoredPost = { ...post, id: generateId(post.guid) }
      store.put(itemToSave)
    })

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * 清除所有存储的文章
 */
export async function clearPosts(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取 RSS 数据
 */
export async function fetchRSS(): Promise<Post[]> {
  try {
    const response = await fetch('/atom.xml', { cache: 'no-store' })
    const text = await response.text()
    const parser = new DOMParser()
    const xml = parser.parseFromString(text, 'text/xml')
    const entries = Array.from(xml.querySelectorAll('entry'))

    return entries.map((entry) => {
      const title = entry.querySelector('title')?.textContent || ''
      const link = entry.querySelector('link')?.getAttribute('href') || ''
      const guid = entry.querySelector('id')?.textContent || link
      const updated = entry.querySelector('updated')?.textContent || ''
      const pubDate = new Date(updated).getTime()
      const content = entry.querySelector('content')?.textContent || ''

      return {
        title,
        link,
        guid,
        pubDate,
        content,
      }
    })
  } catch (e) {
    console.error('Failed to fetch RSS:', e)
    return []
  }
}

/**
 * 计算文本差异
 */
export function computeDiff(oldText: string, newText: string): DiffPart[] | null {
  if (!oldText || !newText) return null

  // 去除 HTML 标签
  const stripHtml = (html: string): string => {
    if (typeof document === 'undefined') return html
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const cleanOld = stripHtml(oldText)
  const cleanNew = stripHtml(newText)

  const diffs = diffLines(cleanOld, cleanNew)
  const hasChanges = diffs.some((part) => part.added || part.removed)

  if (!hasChanges) return null

  return diffs.map((part) => ({
    value: part.value,
    added: part.added,
    removed: part.removed,
  }))
}

/**
 * 检查新文章或更新的文章
 */
export async function checkForNewPosts(): Promise<{
  newPosts: Post[]
  hasChanges: boolean
}> {
  try {
    const db = await openDB()
    const storedPosts = await getStoredPosts(db)
    const fetchedPosts = await fetchRSS()

    console.log('[RSS Store] Stored posts:', storedPosts.length)
    console.log('[RSS Store] Fetched posts:', fetchedPosts.length)

    const newOrUpdatedPosts: Post[] = []

    for (const post of fetchedPosts) {
      const existingPost = storedPosts.find((p) => p.guid === post.guid)

      if (!existingPost) {
        // 新文章 - GUID 不存在于存储中
        console.log('[RSS Store] New post found:', post.title)
        newOrUpdatedPosts.push({ ...post, isUpdated: false })
      } else if (existingPost.content !== post.content) {
        // 更新的文章 - 内容有变化
        console.log('[RSS Store] Updated post found:', post.title)
        const diff = computeDiff(existingPost.content, post.content)
        if (diff) {
          newOrUpdatedPosts.push({ ...post, isUpdated: true, diff })
        }
      }
    }

    // 保存所有获取的文章
    await savePosts(db, fetchedPosts)

    return {
      newPosts: newOrUpdatedPosts,
      hasChanges: newOrUpdatedPosts.length > 0,
    }
  } catch (error) {
    console.error('Error checking for new posts:', error)
    return {
      newPosts: [],
      hasChanges: false,
    }
  }
}
