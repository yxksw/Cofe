export interface BangumiTag {
  name: string
  count: number
}

export interface BangumiSubject {
  id: number
  name: string
  name_cn: string
  short_summary: string
  score: number
  eps: number
  images: {
    common: string
    large: string
    medium: string
    small: string
    grid: string
  }
  tags: BangumiTag[]
}

export interface BangumiCollectionItem {
  subject_id: number
  subject: BangumiSubject
  rate: number
  ep_status: number
  updated_at: string
  url?: string // 自定义跳转链接，可选
}

export interface BangumiApiResponse {
  data: BangumiCollectionItem[]
  total: number
  limit: number
  offset: number
}

export type ContentType = 'book' | 'anime' | 'music' | 'game'
export type CollectionType = 'wish' | 'collect' | 'do' | 'on_hold' | 'dropped'

export const TYPE_SUBJECT_MAP: Record<ContentType, number> = {
  book: 1,
  anime: 2,
  music: 3,
  game: 4,
}

export const TYPE_ID_MAP: Record<CollectionType, number> = {
  wish: 1,
  collect: 2,
  do: 3,
  on_hold: 4,
  dropped: 5,
}

export const SUBJECT_LABEL_MAP: Record<ContentType, string> = {
  book: '书籍',
  anime: '追番',
  music: '音乐',
  game: '游戏',
}

// 通用收藏标签映射
export const COLLECTION_LABEL_MAP: Record<CollectionType, string> = {
  wish: '想看',
  collect: '看过',
  do: '在看',
  on_hold: '搁置',
  dropped: '抛弃',
}

// 根据内容类型获取对应的收藏标签
export function getCollectionLabels(contentType: ContentType): Record<CollectionType, string> {
  switch (contentType) {
    case 'music':
      return {
        wish: '想听',
        collect: '听过',
        do: '在听',
        on_hold: '搁置',
        dropped: '抛弃',
      }
    case 'game':
      return {
        wish: '想玩',
        collect: '玩过',
        do: '在玩',
        on_hold: '搁置',
        dropped: '抛弃',
      }
    case 'book':
      return {
        wish: '想读',
        collect: '读过',
        do: '在读',
        on_hold: '搁置',
        dropped: '抛弃',
      }
    case 'anime':
    default:
      return {
        wish: '想看',
        collect: '看过',
        do: '在看',
        on_hold: '搁置',
        dropped: '抛弃',
      }
  }
}
