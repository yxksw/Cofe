'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { REWARDS_CONFIG } from '@/data/rewards';

export function RewardSidebar() {
  const { list } = REWARDS_CONFIG;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 随机排序并取前20个
  const shuffledList = React.useMemo(() => {
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20);
  }, [list]);

  const carouselSponsors = shuffledList.slice(0, Math.min(shuffledList.length, 40));
  const displaySponsors = shuffledList.slice(0, Math.min(shuffledList.length, 20));

  const nextSponsor = useCallback(() => {
    if (isTransitioning || carouselSponsors.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % carouselSponsors.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [carouselSponsors.length, isTransitioning]);

  useEffect(() => {
    if (carouselSponsors.length <= 1 || isPaused) return;

    const interval = setInterval(nextSponsor, 3000);
    return () => clearInterval(interval);
  }, [carouselSponsors.length, isPaused, nextSponsor]);

  const currentSponsor = carouselSponsors[currentIndex];

  if (list.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:heart" className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">能量榜</h3>
          </div>
        </div>
        <div className="text-center py-6 text-muted-foreground text-sm">
          暂无赞助者，成为第一个支持本站的朋友吧！
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:heart" className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">能量榜</h3>
        </div>
        <Link
          href="/rewards"
          className="text-xs px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground rounded-full transition-all duration-300"
        >
          前往赞赏
        </Link>
      </div>

      {/* 轮播区域 */}
      {carouselSponsors.length > 0 && (
        <div
          className="mb-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={containerRef}
            className="relative bg-muted/50 rounded-lg p-3 transition-opacity duration-300"
            style={{ opacity: isTransitioning ? 0.5 : 1 }}
          >
            {currentSponsor && (
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
                  <Image
                    src={currentSponsor.avatar}
                    alt={currentSponsor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {currentSponsor.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentSponsor.description || '感谢支持！'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 赞助者列表 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {displaySponsors.map((sponsor, index) => (
          <React.Fragment key={index}>
            {sponsor.website ? (
              <Link
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4 decoration-dashed transition-all duration-200 hover:-translate-y-0.5"
              >
                {sponsor.name}
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground underline underline-offset-4 decoration-dashed">
                {sponsor.name}
              </span>
            )}
          </React.Fragment>
        ))}
        {list.length > 20 && (
          <Link
            href="/rewards"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5"
          >
            查看更多
            <Icon icon="lucide:chevrons-right" className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* 底部说明 */}
      <div className="text-center text-xs text-muted-foreground/80 space-y-1">
        <p>你们的赞赏是我最大的动力</p>
        <p>※ 此处数据随机显示</p>
      </div>
    </div>
  );
}
