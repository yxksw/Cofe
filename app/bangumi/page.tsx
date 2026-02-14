'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import {
  ContentType,
  CollectionType,
  SUBJECT_LABEL_MAP,
  getCollectionLabels,
} from '@/types/bangumi';
import { filterBangumiData, getCountByCollectionType } from '@/data/bangumi';
import BangumiCard from '@/components/BangumiCard';
import dynamic from 'next/dynamic';

// 动态导入 GitalkComments 组件，避免 SSR 问题
const GitalkComments = dynamic(() => import('@/components/GitalkComments'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 p-8 bg-card rounded-lg border border-border text-center text-muted-foreground">
      评论加载中...
    </div>
  ),
});

const contentTypes: ContentType[] = ['book', 'anime', 'music', 'game'];
const collectionTypes: CollectionType[] = ['wish', 'collect', 'do', 'on_hold', 'dropped'];

// 参考卡片数据
const referenceCards = [
  { name: '克喵的博客', link: 'https://blog-v3.kemeow.top/', type: 'API参考' },
  { name: '风纪星辰', link: 'https://www.thyuu.com/douban/', type: '样式参考' },
  { name: 'Mikuの鬆', link: 'https://miku.love/', type: '卡片样式' },
];

export default function BangumiPage() {
  const [contentType, setContentType] = useState<ContentType>('anime');
  const [collectionType, setCollectionType] = useState<CollectionType>('collect');
  const [isLoading, setIsLoading] = useState(false);

  // 获取当前内容类型对应的收藏标签
  const collectionLabels = useMemo(() => getCollectionLabels(contentType), [contentType]);

  // 过滤数据
  const filteredData = useMemo(() => {
    return filterBangumiData(contentType, collectionType);
  }, [contentType, collectionType]);

  // 处理内容类型切换
  const handleContentTypeChange = (type: ContentType) => {
    setIsLoading(true);
    setContentType(type);
    setTimeout(() => setIsLoading(false), 300);
  };

  // 处理收藏类型切换
  const handleCollectionTypeChange = (type: CollectionType) => {
    setIsLoading(true);
    setCollectionType(type);
    setTimeout(() => setIsLoading(false), 300);
  };

  // 滚动到评论区
  const scrollToComments = (content: string) => {
    const commentsSection = document.querySelector('.gt-container');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen relative">
      <main className="flex-1 flex flex-col relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 z-10">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              追更历史
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 italic">
              记录我的番剧、书籍、音乐和游戏收藏
            </p>
          </div>

          {/* Content Type Navigation */}
          <div className="flex justify-center mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pb-4">
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleContentTypeChange(type)}
                  className={`
                    text-base sm:text-lg font-medium transition-all duration-300 pb-1 border-b-2
                    ${
                      contentType === type
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                    }
                  `}
                >
                  {SUBJECT_LABEL_MAP[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Collection Type Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {collectionTypes.map((type) => {
                const count = getCountByCollectionType(contentType, type);
                return (
                  <button
                    key={type}
                    onClick={() => handleCollectionTypeChange(type)}
                    className={`
                      px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold rounded-full border transition-all duration-300
                      ${
                        collectionType === type
                          ? 'bg-primary/10 text-primary border-primary cursor-not-allowed'
                          : 'bg-primary/5 text-foreground border-border hover:border-primary hover:text-primary'
                      }
                    `}
                  >
                    {collectionLabels[type]}
                    {count > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-primary/20 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}

          {/* Bangumi Cards Grid */}
          {!isLoading && (
            <div className="space-y-4 mb-12">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <BangumiCard
                    key={`${item.subject_id}-${index}`}
                    item={item}
                    collectionType={collectionType}
                    onComment={scrollToComments}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Icon icon="ri:folder-open-line" className="w-16 h-16 mb-4" />
                  <p className="text-lg">暂无数据</p>
                </div>
              )}
            </div>
          )}

          {/* Copyright Info */}
          <div className="text-right text-xs text-muted-foreground mb-8 space-y-1">
            {referenceCards.map((item) => (
              <div key={item.link}>
                基于
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline mx-1"
                >
                  {item.name}
                </a>
                的{item.type}
              </div>
            ))}
          </div>

          {/* Gitalk 评论区 */}
          <div className="bg-card rounded-lg border border-border p-8">
            <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
              <Icon icon="lucide:message-circle" className="w-5 h-5" />
              评论
            </h2>
            <GitalkComments id="bangumi" title="追更历史" />
          </div>
        </div>
      </main>
    </div>
  );
}
