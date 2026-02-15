import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pLimit from 'p-limit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_PATH = path.resolve(__dirname, '../data/friends.ts')
const CHECK_TIMEOUT = 15000
const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const CONCURRENCY = 5 // 并发数

interface FriendLink {
  name: string
  url: string
  avatar: string
  description?: string
  addDate?: string
  recommended?: boolean
  disconnected?: boolean
  responseTime?: number
  lastChecked?: string
  status?: 'ok' | 'timeout' | 'error'
}

type LinkStatus = 'ok' | 'timeout' | 'error'

interface LinkCheckResult {
  name: string
  url: string
  status: LinkStatus
  httpStatus?: number
  responseTime?: number
  reason?: string
}

async function fetchLink(url: string): Promise<{ ok: boolean; status: number; time: number }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT)

  try {
    const start = Date.now()
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 FriendLinkChecker/1.0' }
    })
    const time = Date.now() - start

    return {
      ok: res.ok,
      status: res.status,
      time
    }
  } finally {
    clearTimeout(timer)
  }
}

async function checkLink(link: FriendLink): Promise<LinkCheckResult> {
  let lastError: Error | null = null

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetchLink(link.url)
      console.log(`[Check-Links] ${link.name} responded in ${res.time}ms ✨`)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      return {
        name: link.name,
        url: link.url,
        status: 'ok',
        httpStatus: res.status,
        responseTime: res.time
      }
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (i < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY * 2 ** i + Math.floor(Math.random() * 100)
        console.warn(
          `[Check-Links] Retry attempt (${i + 1}/${MAX_RETRIES}) for ${link.name} after ${delay}ms due to: ${lastError.message} 😭`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  return {
    name: link.name,
    url: link.url,
    status: lastError?.name === 'AbortError' ? 'timeout' : 'error',
    reason: lastError?.message,
    responseTime: 0
  }
}

// 解析 friends.ts 文件
async function parseFriendsTs(filePath: string): Promise<FriendLink[]> {
  const content = await fs.readFile(filePath, 'utf-8')
  
  // 提取 FRIEND_LINKS 数组内容
  const match = content.match(/export const FRIEND_LINKS: FriendLink\[\] = ([\s\S]*?);\s*$/)
  if (!match) {
    throw new Error('无法找到 FRIEND_LINKS 数组')
  }

  // 使用更安全的方式解析 - 直接匹配每个对象
  const arrayContent = match[1]
  const links: FriendLink[] = []
  
  // 匹配每个友链对象
  const objectRegex = /\{\s*name:\s*["']([^"']+)["'],\s*description:\s*["']([^"']*)["'],\s*url:\s*["']([^"']+)["'],\s*avatar:\s*["']([^"']+)["']([^}]*)\}/g
  
  let objMatch
  while ((objMatch = objectRegex.exec(arrayContent)) !== null) {
    const [, name, description, url, avatar, rest] = objMatch
    
    const link: FriendLink = {
      name,
      description,
      url,
      avatar
    }
    
    // 解析可选字段
    if (rest.includes('addDate:')) {
      const dateMatch = rest.match(/addDate:\s*["']([^"']+)["']/)
      if (dateMatch) link.addDate = dateMatch[1]
    }
    
    if (rest.includes('recommended:')) {
      link.recommended = rest.includes('recommended: true')
    }
    
    if (rest.includes('disconnected:')) {
      link.disconnected = rest.includes('disconnected: true')
    }
    
    if (rest.includes('responseTime:')) {
      const timeMatch = rest.match(/responseTime:\s*(\d+)/)
      if (timeMatch) link.responseTime = parseInt(timeMatch[1])
    }
    
    if (rest.includes('lastChecked:')) {
      const checkedMatch = rest.match(/lastChecked:\s*["']([^"']+)["']/)
      if (checkedMatch) link.lastChecked = checkedMatch[1]
    }
    
    if (rest.includes('status:')) {
      const statusMatch = rest.match(/status:\s*["']([^"']+)["']/)
      if (statusMatch) link.status = statusMatch[1] as FriendLink['status']
    }
    
    links.push(link)
  }
  
  if (links.length === 0) {
    throw new Error('未能解析到任何友链数据')
  }
  
  return links
}

// 生成新的 friends.ts 内容
function generateFriendsTs(links: FriendLink[]): string {
  const linksStr = links.map(link => {
    const fields = [
      `name: "${link.name}"`,
      `description: "${link.description || ''}"`,
      `url: "${link.url}"`,
      `avatar: "${link.avatar}"`,
      link.addDate ? `addDate: "${link.addDate}"` : null,
      link.recommended ? `recommended: true` : null,
      link.disconnected ? `disconnected: true` : null,
      link.responseTime ? `responseTime: ${link.responseTime}` : null,
      link.lastChecked ? `lastChecked: "${link.lastChecked}"` : null,
      link.status ? `status: "${link.status}"` : null
    ].filter(Boolean)
    
    return `    {\n      ${fields.join(',\n      ')}\n    }`
  }).join(',\n')

  return `// ============================================
// 友情链接配置
// ============================================

export interface FriendLink {
    name: string;
    description: string;
    url: string;
    avatar: string;
    addDate?: string;
    recommended?: boolean;
    disconnected?: boolean; // 是否失联
    responseTime?: number; // 响应时间(ms)
    lastChecked?: string; // 最后检测时间
    status?: 'ok' | 'timeout' | 'error'; // 检测状态
}

export const FRIEND_LINKS: FriendLink[] = [
${linksStr}
];
`
}

async function main() {
  console.log('[Check-Links] Start checking friend links... ❤️')

  // 读取友链数据
  const links = await parseFriendsTs(DATA_PATH)
  console.log(`[Check-Links] Found ${links.length} friend links`)

  // 使用 p-limit 控制并发
  const limit = pLimit(CONCURRENCY)
  
  // 并发检测
  const results = await Promise.all(
    links.map(link =>
      limit(async () => {
        const result = await checkLink(link)
        
        // 更新链接数据
        const linkData = links.find(l => l.url === link.url)
        if (linkData) {
          linkData.responseTime = result.responseTime
          linkData.status = result.status
          linkData.lastChecked = new Date().toISOString()
          
          // 如果检测失败，标记为失联
          if (result.status !== 'ok') {
            linkData.disconnected = true
            console.log(`[Check-Links] ${link.name} marked as disconnected ❌`)
          } else {
            linkData.disconnected = false
          }
        }
        
        return result
      })
    )
  )

  // 保存更新后的数据
  const newContent = generateFriendsTs(links)
  await fs.writeFile(DATA_PATH, newContent, 'utf-8')
  console.log('[Check-Links] Updated friends.ts ✅')

  // 输出统计
  const failed = results.filter(r => r.status !== 'ok')
  const success = results.filter(r => r.status === 'ok')
  
  console.log('\n[Check-Links] Check completed! 📊')
  console.log(`  ✅ Success: ${success.length}`)
  console.log(`  ❌ Failed: ${failed.length}`)
  
  if (failed.length > 0) {
    console.log('\n[Check-Links] Failed links:')
    for (const f of failed) {
      console.log(`  - ${f.name} (${f.url}) => ${f.status}${f.reason ? ` | ${f.reason}` : ''}`)
    }
  }

  // 计算平均响应时间
  if (success.length > 0) {
    const avgResponseTime = success.reduce((sum, r) => sum + (r.responseTime || 0), 0) / success.length
    console.log(`\n[Check-Links] Average response time: ${Math.round(avgResponseTime)}ms ⏱️`)
  }
}

main().catch(error => {
  console.error('[Check-Links] Error:', error)
  process.exit(1)
})
