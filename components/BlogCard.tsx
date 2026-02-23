"use client";

import { BlogPost } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { animateValueWithSuffix } from "@/lib/animate-value";

// 计算字数（中文按字符，英文按单词）
function countWords(content: string): number {
  const cleanContent = content
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "$1")
    .replace(/[#*`~\-_>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const chineseChars = (cleanContent.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (cleanContent.match(/[a-zA-Z]+/g) || []).length;

  return chineseChars + englishWords;
}

// 计算阅读时间
function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 300;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "w";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

export const BlogCard = ({ post }: { post: BlogPost }) => {
  const displayImage = post.cover || post.imageUrl;
  const [views, setViews] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);
  const viewsRef = useRef<HTMLSpanElement>(null);

  const wordCount = countWords(post.content);
  const readingTime = calculateReadingTime(wordCount);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const pathname = `/blog/${encodeURIComponent(post.id)}`;
        const response = await fetch(
          `https://cf-umami-cofe.050815.xyz/share?pathname=${encodeURIComponent(pathname)}`
        );
        const data = await response.json();
        const viewCount = data.views || 0;
        
        setViews(viewCount);
        setLoaded(true);
        
        // 动画效果
        if (viewsRef.current && viewCount > 0) {
          animateValueWithSuffix(viewsRef.current, 0, viewCount, 1000, '次');
        }
      } catch (error) {
        console.error("Failed to fetch views:", error);
      }
    };

    fetchViews();
  }, [post.id]);

  return (
    <div className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-200">
      {displayImage && (
        <a
          href={displayImage}
          data-fancybox="blog-gallery"
          data-caption={post.title}
          className="block h-48 bg-muted relative overflow-hidden cursor-zoom-in"
        >
          <Image
            src={displayImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </a>
      )}
      <Link
        href={`/blog/${encodeURIComponent(post.id)}`}
        className="block p-6 h-full flex flex-col justify-between"
        aria-label={post.title}
      >
        <div className="space-y-4">
          <h3 className="font-semibold text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
            {post.title}
          </h3>
          {/* Meta info: date, word count, reading time, views */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {/* Date */}
            <div className="flex items-center gap-1">
              <Icon icon="material-symbols:schedule-outline-rounded" className="w-3.5 h-3.5" />
              <span>{formatDate(post.date)}</span>
            </div>

            {/* Word count */}
            <div className="flex items-center gap-1" title="文章字数">
              <Icon icon="material-symbols:description-outline-rounded" className="w-3.5 h-3.5" />
              <span>{formatNumber(wordCount)} 字</span>
            </div>

            {/* Reading time */}
            <div className="flex items-center gap-1" title="预计阅读时间">
              <Icon icon="material-symbols:timer-outline-rounded" className="w-3.5 h-3.5" />
              <span>{readingTime} 分钟</span>
            </div>

            {/* Views */}
            <div className="flex items-center gap-1" title="浏览量">
              <Icon icon="material-symbols:visibility-outline-rounded" className="w-3.5 h-3.5" />
              <span ref={viewsRef}>
                {loaded ? `${views} 次` : '0 次'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}
