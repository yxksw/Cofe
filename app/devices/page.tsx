'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { devices, DeviceItem } from '@/data/devices';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { FancyboxWrapper } from '@/components/FancyboxWrapper';

// 动态导入 GitalkComments 组件，避免 SSR 问题
const GitalkComments = dynamic(() => import('@/components/GitalkComments'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 p-8 bg-card rounded-lg border border-border text-center text-muted-foreground">
      评论加载中...
    </div>
  ),
});

const categories = ['生产力', '出行'] as const;

type Category = typeof categories[number];

const categoryColors: Record<Category, string> = {
  生产力: '#3af',
  出行: '#3ba',
};

const categoryIcons: Record<Category, string> = {
  生产力: 'ph:laptop-bold',
  出行: 'ph:package-bold',
};

export default function DevicesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('生产力');

  const filteredDevices = useMemo(() => {
    return devices.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const getCategoryCount = (category: Category) => {
    return devices.filter((item) => item.category === category).length;
  };

  const handleTabClick = (category: Category) => {
    setActiveCategory(category);
  };

  const scrollToComments = () => {
    const commentsSection = document.querySelector('.gt-container');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen relative">
      <main className="flex-1 flex flex-col relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 z-10">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              我的装备
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 italic">
              展示生产力、娱乐和移动设备清单
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-wrap gap-2 sm:gap-3 p-2 bg-slate-100/50 dark:bg-white/5 rounded-2xl">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleTabClick(category)}
                  className={`
                    flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium
                    transition-all duration-300 whitespace-nowrap
                    ${
                      activeCategory === category
                        ? 'text-white shadow-lg scale-105'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                  style={{
                    backgroundColor:
                      activeCategory === category
                        ? categoryColors[category]
                        : 'transparent',
                    borderColor: categoryColors[category],
                    borderWidth: activeCategory === category ? '0' : '2px',
                    borderStyle: 'solid',
                  }}
                >
                  <Icon icon={categoryIcons[category]} className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{category}</span>
                  <span
                    className={`
                      ml-1 px-1.5 py-0.5 text-xs rounded-full
                      ${
                        activeCategory === category
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }
                    `}
                  >
                    {getCategoryCount(category)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Grid */}
          <FancyboxWrapper options={{ infinite: false }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12">
              {filteredDevices.map((item, index) => (
                <DeviceCard key={`${item.name}-${index}`} item={item} onComment={scrollToComments} />
              ))}
            </div>
          </FancyboxWrapper>

          {/* Gitalk 评论区 */}
          <div className="bg-card rounded-lg border border-border p-8">
            <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
              <Icon icon="lucide:message-circle" className="w-5 h-5" />
              评论
            </h2>
            <GitalkComments id="devices" title="我的装备" />
          </div>
        </div>
      </main>
    </div>
  );
}

interface DeviceCardProps {
  item: DeviceItem;
  onComment: () => void;
}

function DeviceCard({ item, onComment }: DeviceCardProps) {
  const categoryColor = item.category === '生产力' ? '#3af' : '#3ba';

  return (
    <div
      className="group relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image Section with Fancybox */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        {item.image ? (
          <a
            href={item.image}
            data-fancybox="devices-gallery"
            data-caption={`${item.name} - ${item.desc}`}
            className="block w-full h-full cursor-zoom-in"
          >
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-contain p-4 sm:p-6 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </a>
        ) : (
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <Icon icon="ph:image" className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-foreground truncate flex-1">
            {item.name}
          </h3>
          <span
            className="flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
            }}
          >
            {item.category}
          </span>
        </div>

        {/* Description */}
        {item.desc && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.desc}
          </p>
        )}

        {/* Specs Grid */}
        {item.info && Object.keys(item.info).length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            {Object.entries(item.info).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{key}</span>
                <span className="text-foreground font-medium truncate" title={value}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {item.tag && item.tag.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tag.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
            {item.date && (
              <div className="flex items-center gap-1">
                <Icon icon="ph:calendar-bold" className="w-3.5 h-3.5" />
                <span>{item.date}</span>
              </div>
            )}
            {item.money !== undefined && (
              <div className="font-semibold text-foreground">
                ￥{item.money.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {item.src ? (
            <a
              href={item.src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-4 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground rounded-lg text-sm font-medium transition-all duration-300 text-center"
            >
              查看详情
            </a>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={onComment}
            className="p-2 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground rounded-lg transition-all duration-300"
            aria-label="评论"
          >
            <Icon icon="ph:chat-circle-bold" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
