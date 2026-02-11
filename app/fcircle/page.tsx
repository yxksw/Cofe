'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import FCircleHeader from '@/components/FCircleHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// 配置选项
const UserConfig = {
  private_api_url: 'https://fc.mcyzsx.top/',
  page_turning_number: 20,
  error_img: "https://fastly.jsdelivr.net/gh/willow-god/Friend-Circle-Lite@latest/static/favicon.ico"
};

interface Article {
  author: string;
  avatar: string;
  title: string;
  created: string;
  link: string;
}

interface Stats {
  friends_num: number;
  active_num: number;
  article_num: number;
  last_updated_time: string;
}

interface AuthorArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  author: string;
  avatar: string;
  origin: string;
  articles: Article[];
}

const AuthorArticlesModal: React.FC<AuthorArticlesModalProps> = ({
  isOpen,
  onClose,
  author,
  avatar,
  origin,
  articles
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-4 pb-4 border-b">
          <Image
            src={avatar || UserConfig.error_img}
            alt={author}
            width={50}
            height={50}
            className="rounded-full object-cover"
          />
          <a
            href={origin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            {author}
          </a>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {articles.map((article, index) => (
            <div
              key={index}
              className="pb-4 border-b last:border-0 last:pb-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-foreground hover:text-primary transition-colors line-clamp-2"
              >
                {article.title}
              </a>
              <div className="text-sm text-muted-foreground mt-1">
                📅 {article.created?.substring(0, 10)}
              </div>
            </div>
          ))}
        </div>
        <Image
          src={avatar || UserConfig.error_img}
          alt=""
          width={128}
          height={128}
          className="absolute bottom-5 right-5 rounded-full opacity-20 blur-sm pointer-events-none -z-10"
        />
      </DialogContent>
    </Dialog>
  );
};

export default function FCirclePage() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Stats>({
    friends_num: 0,
    active_num: 0,
    article_num: 0,
    last_updated_time: ''
  });
  const [start, setStart] = useState(0);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const [randomArticle, setRandomArticle] = useState<Article | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [currentAuthorAvatar, setCurrentAuthorAvatar] = useState('');
  const [authorOrigin, setAuthorOrigin] = useState('');
  const [authorArticles, setAuthorArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return dateString ? dateString.substring(0, 10) : '';
  };

  // 头像加载处理
  const avatarOrDefault = (avatar: string) => {
    return avatar || UserConfig.error_img;
  };

  // 显示随机文章
  const displayRandomArticle = useCallback(() => {
    if (allArticles.length > 0) {
      const randomIndex = Math.floor(Math.random() * allArticles.length);
      setRandomArticle(allArticles[randomIndex]);
    }
  }, [allArticles]);

  // 处理文章数据
  const processArticles = useCallback((data: any) => {
    // 更新统计数据
    setStats({
      friends_num: data.statistical_data?.friends_num || 0,
      active_num: data.statistical_data?.active_num || 0,
      article_num: data.statistical_data?.article_num || 0,
      last_updated_time: data.statistical_data?.last_updated_time || ''
    });

    // 合并新旧文章
    const newArticles = data.article_data || [];
    setAllArticles(prev => {
      const merged = [...prev, ...newArticles];
      return merged;
    });

    // 更新显示的列表
    setDisplayedArticles(prev => {
      const currentStart = start;
      const newDisplayed = newArticles.slice(0, UserConfig.page_turning_number);
      return [...prev, ...newDisplayed];
    });

    // 更新起始位置
    setStart(prev => prev + UserConfig.page_turning_number);

    // 检查是否有更多文章
    setHasMoreArticles(start + UserConfig.page_turning_number < newArticles.length);
  }, [start]);

  // 加载更多文章
  const loadMoreArticles = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const cacheKey = 'friend-circle-lite-cache';
    const cacheTimeKey = 'friend-circle-lite-cache-time';
    const now = new Date().getTime();

    try {
      // 检查缓存
      if (typeof window !== 'undefined' && localStorage) {
        const cacheTime = localStorage.getItem(cacheTimeKey);
        if (cacheTime && (now - parseInt(cacheTime) < 10 * 60 * 1000)) {
          const cachedData = JSON.parse(localStorage.getItem(cacheKey) || '{}');
          if (cachedData && cachedData.article_data) {
            processArticles(cachedData);
            setIsLoading(false);
            return;
          }
        }
      }

      // 从API获取数据
      const response = await fetch(`${UserConfig.private_api_url}all.json`);
      const data = await response.json();

      // 更新缓存
      if (typeof window !== 'undefined' && localStorage) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(cacheTimeKey, now.toString());
      }

      processArticles(data);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 打开文章链接
  const openArticle = (link: string) => {
    window.open(link, '_blank');
  };

  // 打开随机文章
  const openRandomArticle = () => {
    if (randomArticle) {
      window.open(randomArticle.link, '_blank');
    }
  };

  // 显示作者文章模态框
  const showAuthorArticles = (author: string, avatar: string, link: string) => {
    setCurrentAuthor(author);
    setCurrentAuthorAvatar(avatar);
    setAuthorOrigin(new URL(link).origin);
    setAuthorArticles(
      allArticles
        .filter(article => article.author === author)
        .slice(0, 4)
    );
    setShowModal(true);
  };

  // 初始化
  useEffect(() => {
    loadMoreArticles();
  }, []);

  // 显示随机文章
  useEffect(() => {
    if (allArticles.length > 0 && !randomArticle) {
      displayRandomArticle();
    }
  }, [allArticles, randomArticle, displayRandomArticle]);

  return (
    <div className="min-h-screen pb-20">
      <FCircleHeader
        background="https://img.314926.xyz/h"
        title="友链朋友圈"
        desc="Cofe Blog的友链朋友圈页面。"
      />

      <div className="max-w-3xl mx-auto px-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="article-list">
          {/* 随机文章区域 */}
          {randomArticle && (
            <div className="random-article flex items-center gap-3 mb-4">
              <div className="random-container-title text-lg font-semibold whitespace-nowrap hidden sm:block">
                随机钓鱼
              </div>
              <button
                onClick={openRandomArticle}
                className="article-item flex-1 min-w-0"
              >
                <div className="article-container bg-card border border-border rounded-lg p-3 flex items-center gap-2 hover:border-primary/50 transition-colors">
                  <div className="article-author text-sm text-muted-foreground shrink-0">
                    {randomArticle.author}
                  </div>
                  <div className="article-title text-foreground truncate flex-1 text-left">
                    {randomArticle.title}
                  </div>
                  <div className="article-date text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {randomArticle.created?.substring(0, 10)}
                  </div>
                </div>
              </button>
              <Button
                variant="outline"
                size="icon"
                onClick={displayRandomArticle}
                className="shrink-0 h-10 w-10"
              >
                <Icon icon="lucide:refresh-cw" className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* 统计信息 */}
          <div className="stats-bar flex gap-4 mb-4 text-sm text-muted-foreground">
            <span>友链: {stats.friends_num}</span>
            <span>活跃: {stats.active_num}</span>
            <span>文章: {stats.article_num}</span>
          </div>

          {/* 文章列表区域 */}
          <div className="articles-list flex flex-col gap-2">
            {displayedArticles.map((article, index) => (
              <div
                key={index}
                className="article-item flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <button
                  onClick={() => showAuthorArticles(article.author, article.avatar, article.link)}
                  className="article-image shrink-0 w-8 h-8 rounded-full overflow-hidden border border-border hover:scale-105 transition-transform"
                >
                  <Image
                    src={avatarOrDefault(article.avatar)}
                    alt={article.author}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </button>
                <div className="article-container bg-card border border-border rounded-lg p-2.5 flex items-center gap-2 flex-1 min-w-0 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => openArticle(article.link)}
                >
                  <div className="article-author text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {article.author}
                  </div>
                  <div className="article-title text-sm text-foreground truncate flex-1">
                    {article.title}
                  </div>
                  <div className="article-date text-xs text-muted-foreground shrink-0 font-mono">
                    {formatDate(article.created)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 加载更多按钮 */}
          <div className="load-more-container text-center mt-6">
            {hasMoreArticles && (
              <Button
                onClick={loadMoreArticles}
                disabled={isLoading}
                className="w-full sm:w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                    加载中...
                  </>
                ) : (
                  '再来亿点'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 作者文章模态框 */}
      <AuthorArticlesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        author={currentAuthor}
        avatar={currentAuthorAvatar}
        origin={authorOrigin}
        articles={authorArticles}
      />
    </div>
  );
}
