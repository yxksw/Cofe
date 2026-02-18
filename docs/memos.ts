/**
 * Memo 数据类型定义
 * 
 * 用于外部应用获取博客便签数据的 TypeScript 类型
 * 
 * @example
 * ```typescript
 * import type { Memo, CreateMemoInput } from './memos'
 * 
 * // 获取 memos
 * const response = await fetch('https://cofe.050815.xyz/api/graphql', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     query: `
 *       query GetMemos {
 *         memos {
 *           id
 *           content
 *           timestamp
 *           image
 *           latitude
 *           longitude
 *           city
 *           street
 *         }
 *       }
 *     `
 *   })
 * })
 * 
 * const { data } = await response.json()
 * const memos: Memo[] = data.memos
 * ```
 */

/**
 * 便签数据类型
 */
export type Memo = {
  /** 唯一标识符 */
  id: string
  
  /** 便签内容（支持 Markdown） */
  content: string
  
  /** 创建时间戳（ISO 8601 格式） */
  timestamp: string
  
  /** 图片 URL（可选） */
  image?: string
  
  /** 纬度（可选，用于地理位置标记） */
  latitude?: number
  
  /** 经度（可选，用于地理位置标记） */
  longitude?: number
  
  /** 城市名称（可选） */
  city?: string
  
  /** 街道地址（可选） */
  street?: string
}

/**
 * 创建便签输入类型
 */
export type CreateMemoInput = {
  /** 便签内容（必填） */
  content: string
  
  /** 图片 URL（可选） */
  image?: string
  
  /** 纬度（可选） */
  latitude?: number
  
  /** 经度（可选） */
  longitude?: number
  
  /** 城市名称（可选） */
  city?: string
  
  /** 街道地址（可选） */
  street?: string
}

/**
 * GraphQL 查询响应类型
 */
export type GetMemosResponse = {
  data: {
    memos: Memo[]
  }
}

/**
 * GraphQL 创建响应类型
 */
export type CreateMemoResponse = {
  data: {
    createMemo: Memo
  }
}

/**
 * GraphQL 错误类型
 */
export type GraphQLError = {
  message: string
  locations?: Array<{
    line: number
    column: number
  }>
  path?: string[]
}

/**
 * GraphQL 错误响应类型
 */
export type GraphQLErrorResponse = {
  errors: GraphQLError[]
}

/**
 * 获取 Memos 的 GraphQL 查询
 */
export const GET_MEMOS_QUERY = `
  query GetMemos {
    memos {
      id
      content
      timestamp
      image
      latitude
      longitude
      city
      street
    }
  }
`

/**
 * 创建 Memo 的 GraphQL 变更
 */
export const CREATE_MEMO_MUTATION = `
  mutation CreateMemo($input: CreateMemoInput!) {
    createMemo(input: $input) {
      id
      content
      timestamp
      image
      latitude
      longitude
      city
      street
    }
  }
`

/**
 * API 配置
 */
export const API_CONFIG = {
  /** GraphQL 接口地址 */
  endpoint: 'https://cofe.050815.xyz/api/graphql',
  
  /** 请求头 */
  headers: {
    'Content-Type': 'application/json'
  }
} as const

/**
 * 获取所有便签
 * 
 * @example
 * ```typescript
 * const memos = await getMemos()
 * console.log(memos)
 * ```
 */
export async function getMemos(): Promise<Memo[]> {
  const response = await fetch(API_CONFIG.endpoint, {
    method: 'POST',
    headers: API_CONFIG.headers,
    body: JSON.stringify({
      query: GET_MEMOS_QUERY
    })
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const result: GetMemosResponse | GraphQLErrorResponse = await response.json()
  
  if ('errors' in result) {
    throw new Error(result.errors[0]?.message || 'GraphQL error')
  }
  
  return result.data.memos
}

/**
 * 创建新便签（需要认证）
 * 
 * @example
 * ```typescript
 * const newMemo = await createMemo({
 *   content: '这是一条新便签',
 *   image: 'https://example.com/image.jpg'
 * }, 'your-session-token')
 * ```
 */
export async function createMemo(
  input: CreateMemoInput,
  sessionToken: string
): Promise<Memo> {
  const response = await fetch(API_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      ...API_CONFIG.headers,
      'Cookie': `next-auth.session-token=${sessionToken}`
    },
    body: JSON.stringify({
      query: CREATE_MEMO_MUTATION,
      variables: { input }
    })
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const result: CreateMemoResponse | GraphQLErrorResponse = await response.json()
  
  if ('errors' in result) {
    throw new Error(result.errors[0]?.message || 'GraphQL error')
  }
  
  return result.data.createMemo
}

// 默认导出
export default {
  getMemos,
  createMemo,
  GET_MEMOS_QUERY,
  CREATE_MEMO_MUTATION,
  API_CONFIG
}
