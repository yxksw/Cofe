'use client'

import { useState, useMemo } from 'react'
import { BlogPost } from '@/lib/types'
import { BlogCard } from '@/components/BlogCard'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, Tag, FolderOpen, LayoutGrid, List, X } from 'lucide-react'

interface TagItem {
  name: string
  count: number
  posts: BlogPost[]
}

interface TagsPageProps {
  tags: TagItem[]
  categories: TagItem[]
  allPosts: BlogPost[]
}

type ViewMode = 'cloud' | 'list'

export default function TagsPage({ tags, categories, allPosts }: TagsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cloud')

  // 过滤标签
  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags
    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tags, searchQuery])

  // 过滤分类
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  // 获取当前选中的文章列表
  const currentPosts = useMemo(() => {
    if (selectedTag) {
      const tag = tags.find((t) => t.name === selectedTag)
      return tag?.posts || []
    }
    if (selectedCategory) {
      const cat = categories.find((c) => c.name === selectedCategory)
      return cat?.posts || []
    }
    return []
  }, [selectedTag, selectedCategory, tags, categories])

  // 计算最大和最小文章数（用于标签云大小）
  const { maxCount, minCount } = useMemo(() => {
    const allItems = [...tags, ...categories]
    if (allItems.length === 0) return { maxCount: 0, minCount: 0 }
    const counts = allItems.map((item) => item.count)
    return {
      maxCount: Math.max(...counts),
      minCount: Math.min(...counts),
    }
  }, [tags, categories])

  // 计算标签大小（用于标签云）
  const getTagSize = (count: number) => {
    if (maxCount === minCount) return 'text-base'
    const ratio = (count - minCount) / (maxCount - minCount)
    if (ratio > 0.8) return 'text-2xl font-bold'
    if (ratio > 0.6) return 'text-xl font-semibold'
    if (ratio > 0.4) return 'text-lg font-medium'
    if (ratio > 0.2) return 'text-base'
    return 'text-sm'
  }

  // 清除选择
  const clearSelection = () => {
    setSelectedTag(null)
    setSelectedCategory(null)
  }

  // 处理标签点击
  const handleTagClick = (tagName: string) => {
    if (selectedTag === tagName) {
      setSelectedTag(null)
    } else {
      setSelectedTag(tagName)
      setSelectedCategory(null)
    }
  }

  // 处理分类点击
  const handleCategoryClick = (catName: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(catName)
      setSelectedTag(null)
    }
  }

  const hasNoData = tags.length === 0 && categories.length === 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          标签云
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          通过标签和分类浏览文章，快速找到你感兴趣的内容
        </p>
      </div>

      {hasNoData ? (
        <div className="text-center py-16">
          <div className="text-muted-foreground">
            <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无标签数据</p>
            <p className="text-sm mt-2">创建博客文章并添加标签后即可查看</p>
          </div>
        </div>
      ) : (
        <>
          {/* 搜索和视图切换 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索标签或分类..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('cloud')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  viewMode === 'cloud'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                云图
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                <List className="w-4 h-4" />
                列表
              </button>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex flex-wrap gap-4 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>共 {tags.length} 个标签</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>共 {categories.length} 个分类</span>
            </div>
            <div className="flex items-center gap-2">
              <span>共 {allPosts.length} 篇文章</span>
            </div>
          </div>

          {/* 当前选中状态 */}
          {(selectedTag || selectedCategory) && (
            <div className="flex items-center gap-3 mb-6 p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">当前筛选:</span>
              {selectedTag && (
                <Badge className="bg-primary text-primary-foreground">
                  标签: {selectedTag}
                </Badge>
              )}
              {selectedCategory && (
                <Badge className="bg-primary text-primary-foreground">
                  分类: {selectedCategory}
                </Badge>
              )}
              <span className="text-sm text-muted-foreground ml-auto">
                {currentPosts.length} 篇文章
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                清除
              </button>
            </div>
          )}

          {/* 标签云视图 */}
          {viewMode === 'cloud' && (
            <div className="space-y-8">
              {/* 标签云 */}
              {filteredTags.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    标签
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => handleTagClick(tag.name)}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200',
                          'hover:scale-105 hover:shadow-md',
                          selectedTag === tag.name
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                      >
                        <span className={getTagSize(tag.count)}>{tag.name}</span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            selectedTag === tag.name
                              ? 'bg-primary-foreground/20'
                              : 'bg-background/50'
                          )}
                        >
                          {tag.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 分类列表 */}
              {filteredCategories.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    分类
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {filteredCategories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => handleCategoryClick(category.name)}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                          'hover:scale-105 hover:shadow-md',
                          selectedCategory === category.name
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                      >
                        <span className="font-medium">{category.name}</span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            selectedCategory === category.name
                              ? 'bg-primary-foreground/20'
                              : 'bg-background/50'
                          )}
                        >
                          {category.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 列表视图 */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 标签列表 */}
              {filteredTags.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    标签
                  </h2>
                  <div className="space-y-2">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => handleTagClick(tag.name)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200',
                          selectedTag === tag.name
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 hover:bg-secondary text-secondary-foreground'
                        )}
                      >
                        <span className="font-medium">{tag.name}</span>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            selectedTag === tag.name
                              ? 'bg-primary-foreground/20'
                              : 'bg-background'
                          )}
                        >
                          {tag.count} 篇
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 分类列表 */}
              {filteredCategories.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    分类
                  </h2>
                  <div className="space-y-2">
                    {filteredCategories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => handleCategoryClick(category.name)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200',
                          selectedCategory === category.name
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 hover:bg-secondary text-secondary-foreground'
                        )}
                      >
                        <span className="font-medium">{category.name}</span>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            selectedCategory === category.name
                              ? 'bg-primary-foreground/20'
                              : 'bg-background'
                          )}
                        >
                          {category.count} 篇
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 文章列表 */}
          {currentPosts.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span>相关文章</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({currentPosts.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentPosts
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
              </div>
            </div>
          )}

          {/* 无结果提示 */}
          {searchQuery &&
            filteredTags.length === 0 &&
            filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  没有找到匹配 &quot;{searchQuery}&quot; 的标签或分类
                </p>
              </div>
            )}
        </>
      )}
    </div>
  )
}
