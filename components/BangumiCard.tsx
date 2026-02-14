'use client';

import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { BangumiCollectionItem, CollectionType } from '@/types/bangumi';

interface BangumiCardProps {
  item: BangumiCollectionItem;
  collectionType: CollectionType;
  onComment?: (content: string) => void;
}

export default function BangumiCard({ item, collectionType, onComment }: BangumiCardProps) {
  const { subject, ep_status, updated_at, url } = item;

  // 计算评分星星
  const getStarIcon = (index: number) => {
    const scoreTotal = subject.score / 2;
    const integerPart = Math.floor(scoreTotal);
    const hasHalf = scoreTotal % 1 !== 0;

    if (index < integerPart) {
      return 'ri:star-fill';
    } else if (index === integerPart && hasHalf) {
      return 'ri:star-half-line';
    } else {
      return 'ri:star-line';
    }
  };

  // 计算进度
  const progress = subject.eps > 0 ? (ep_status / subject.eps) * 100 : 0;

  // 根据收藏类型获取进度提示
  const getProgressLabel = () => {
    switch (collectionType) {
      case 'do':
        return '追更进度';
      case 'wish':
        return '期待值';
      case 'collect':
        return '已完成';
      case 'on_hold':
        return '搁置中';
      case 'dropped':
        return '已抛弃';
      default:
        return '进度';
    }
  };

  const handleClick = () => {
    // 优先使用自定义URL，否则使用Bangumi默认链接
    const targetUrl = url || `https://bgm.tv/subject/${subject.id}`;
    window.open(targetUrl, '_blank');
  };

  const handleComment = () => {
    if (onComment) {
      onComment(subject.short_summary);
    }
  };

  // 是否显示进度条：在看/在玩/在听时显示
  const showProgress = collectionType === 'do' && subject.eps > 0;

  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section - 左侧封面 */}
        <div className="relative w-full sm:w-[140px] h-[180px] sm:h-[200px] flex-shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <Image
            src={subject.images.common}
            alt={subject.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 140px"
          />
        </div>

        {/* Content Section - 右侧内容 */}
        <div className="flex-1 p-4 flex flex-col">
          {/* 标题和评分 - 顶部区域 */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-bold text-foreground line-clamp-1 flex-1">
              {subject.name_cn || subject.name}
            </h3>
            {/* 评分 - 右上角 */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md flex-shrink-0">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Icon
                    key={index}
                    icon={getStarIcon(index)}
                    className="w-3.5 h-3.5 text-amber-400"
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-amber-500">
                {subject.score}
              </span>
            </div>
          </div>

          {/* 描述 - 限制2行 */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
            {subject.short_summary}
          </p>

          {/* 进度条 - 仅在"在看"状态且有多集时显示 */}
          {showProgress && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs mb-1">
                <span className="text-muted-foreground">{getProgressLabel()}</span>
                <span className="font-medium">{ep_status}/{subject.eps}</span>
                <span className="text-muted-foreground ml-auto">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 标签 - 蓝色背景样式 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {subject.tags.slice(0, 10).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400 rounded"
              >
                {tag.name}
                <sup className="text-[8px] opacity-70 ml-0.5">{tag.count}</sup>
              </span>
            ))}
          </div>

          {/* 元信息 - 时间和来源 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <Icon icon="ph:calendar-blank" className="w-3.5 h-3.5" />
              <span>{updated_at}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon icon="ri:bilibili-line" className="w-3.5 h-3.5" />
              <span>Bangumi</span>
            </div>
          </div>

          {/* 按钮 - 底部 */}
          <div className="flex items-center gap-3 mt-auto">
            <button
              onClick={handleClick}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground rounded-lg text-sm font-medium transition-all duration-300"
            >
              <span>查看详情</span>
              <Icon icon="ri:arrow-right-line" className="w-4 h-4" />
            </button>
            <button
              onClick={handleComment}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground rounded-lg text-sm font-medium transition-all duration-300"
            >
              <Icon icon="ph:chat-circle-text" className="w-4 h-4" />
              <span>点击评论</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
