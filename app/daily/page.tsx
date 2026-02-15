'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FancyboxWrapper } from '@/components/FancyboxWrapper';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 配置
const CONFIG = {
  apiUrl: 'https://tg-api.381359.xyz/',
  emactionApi: 'https://api-emaction.381359.xyz/',
  cacheKey: 'daily-messages-cache',
  cacheTimeKey: 'daily-messages-cache-time',
  cacheDuration: 5 * 60 * 1000, // 5分钟缓存
};

// 消息数据类型
interface MessageData {
  [key: string]: {
    text: string;
    image: string[];
    time: number;
    views?: string | null;
  };
}

interface ApiResponse {
  nextBefore: number;
  Region: string;
  version: string;
  ChannelMessageData: MessageData;
}

// 表情反应类型
interface Reaction {
  emoji: string;
  name: string;
  count: number;
  reacted: boolean;
}

// emoji 到 name 的映射
const EMOJI_MAP: Record<string, string> = {
  '👍': 'thumbs-up',
  '❤️': 'red-heart',
  '😄': 'smile-face',
  '🎉': 'party-popper',
  '🤔': 'thinking-face',
  '👏': 'clap',
  '🔥': 'fire',
  '👀': 'eyes',
};

const NAME_TO_EMOJI: Record<string, string> = {
  'thumbs-up': '👍',
  'red-heart': '❤️',
  'smile-face': '😄',
  'party-popper': '🎉',
  'thinking-face': '🤔',
  'clap': '👏',
  'fire': '🔥',
  'eyes': '👀',
};

// Emaction 组件
function EmactionReactions({ messageId }: { messageId: string }) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());

  const availableEmojis = ['👍', '❤️', '😄', '🎉', '🤔', '👏', '🔥', '👀'];

  const fetchReactions = useCallback(async () => {
    try {
      const response = await fetch(`${CONFIG.emactionApi}reactions?targetId=${encodeURIComponent(`daily-${messageId}`)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.code === 0 && result.data?.reactionsGot) {
          const fetchedReactions: Reaction[] = result.data.reactionsGot.map((r: { reaction_name: string; count: number }) => ({
            emoji: NAME_TO_EMOJI[r.reaction_name] || r.reaction_name,
            name: r.reaction_name,
            count: r.count,
            reacted: userReactions.has(r.reaction_name),
          }));
          setReactions(fetchedReactions);
        } else {
          setReactions([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reactions:', error);
    } finally {
      setLoading(false);
    }
  }, [messageId, userReactions]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // 点击外部关闭表情选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const toggleReaction = async (emoji: string) => {
    const reactionName = EMOJI_MAP[emoji];
    if (!reactionName) return;

    const hasReacted = userReactions.has(reactionName);
    const diff = hasReacted ? -1 : 1;

    try {
      const response = await fetch(
        `${CONFIG.emactionApi}reaction?targetId=${encodeURIComponent(`daily-${messageId}`)}&reaction_name=${reactionName}&diff=${diff}`,
        {
          method: 'PATCH',
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          // 更新本地状态
          setUserReactions((prev) => {
            const newSet = new Set(prev);
            if (hasReacted) {
              newSet.delete(reactionName);
            } else {
              newSet.add(reactionName);
            }
            return newSet;
          });
          // 重新获取反应数据
          fetchReactions();
        }
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
    setShowPicker(false);
  };

  if (loading) {
    return <div className="h-8 animate-pulse bg-muted rounded w-32" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {/* 已有反应 */}
      {reactions.map((reaction) => (
        <button
          key={reaction.name}
          onClick={() => toggleReaction(reaction.emoji)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
            reaction.reacted
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-muted hover:bg-muted/80 border border-border'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span className="text-xs">{reaction.count}</span>
        </button>
      ))}

      {/* 添加反应按钮 */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
            showPicker
              ? 'bg-primary/20 border-primary/30 text-primary'
              : 'bg-muted hover:bg-muted/80 border-border text-muted-foreground'
          }`}
        >
          <Icon icon="lucide:smile-plus" className="w-4 h-4" />
        </button>

        {/* 表情选择弹窗 */}
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-1 p-2 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[200px]">
            {availableEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 消息卡片组件
function MessageCard({
  id,
  message,
  index,
}: {
  id: string;
  message: MessageData[string];
  index: number;
}) {
  const date = new Date(message.time);

  // 处理图片渲染
  const renderImage = (src: string, idx: number) => (
    <a
      key={idx}
      href={src}
      data-fancybox={`gallery-${id}`}
      data-caption={`图片 ${idx + 1}`}
      className="block relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-zoom-in"
    >
      <Image
        src={src}
        alt={`图片 ${idx + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 200px"
        loading={index < 3 ? 'eager' : 'lazy'}
      />
    </a>
  );

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* 头部：时间和浏览量 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon icon="lucide:clock" className="w-4 h-4" />
          <time dateTime={date.toISOString()}>
            {format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
          </time>
        </div>
        {message.views && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Icon icon="lucide:eye" className="w-4 h-4" />
            <span>{message.views} 次浏览</span>
          </div>
        )}
      </div>

      {/* 内容 */}
      {message.text && (
        <div className="prose prose-sm dark:prose-invert max-w-none mb-4 text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        </div>
      )}

      {/* 图片网格 */}
      {message.image && message.image.length > 0 && (
        <div
          className={`grid gap-2 mb-4 ${
            message.image.length === 1
              ? 'grid-cols-1 max-w-md'
              : message.image.length === 2
              ? 'grid-cols-2 max-w-md'
              : 'grid-cols-2 md:grid-cols-3 max-w-lg'
          }`}
        >
          {message.image.map((img, idx) => renderImage(img, idx))}
        </div>
      )}

      {/* 表情反应 */}
      <EmactionReactions messageId={id} />
    </div>
  );
}

// 加载骨架屏
function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-4 bg-muted rounded w-20" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="aspect-square bg-muted rounded-lg" />
        <div className="aspect-square bg-muted rounded-lg" />
        <div className="aspect-square bg-muted rounded-lg" />
      </div>
      <div className="h-8 bg-muted rounded w-48" />
    </div>
  );
}

export default function DailyPage() {
  const [messages, setMessages] = useState<MessageData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentTheme = theme;

  // 获取数据
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 检查缓存
      const now = Date.now();
      if (typeof window !== 'undefined') {
        const cacheTime = localStorage.getItem(CONFIG.cacheTimeKey);
        if (cacheTime && now - parseInt(cacheTime) < CONFIG.cacheDuration) {
          const cached = localStorage.getItem(CONFIG.cacheKey);
          if (cached) {
            const data: ApiResponse = JSON.parse(cached);
            setMessages(data.ChannelMessageData);
            setLoading(false);
            return;
          }
        }
      }

      // 从API获取
      const response = await fetch(CONFIG.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setMessages(data.ChannelMessageData);

      // 更新缓存
      if (typeof window !== 'undefined') {
        localStorage.setItem(CONFIG.cacheKey, JSON.stringify(data));
        localStorage.setItem(CONFIG.cacheTimeKey, now.toString());
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 按时间排序的消息ID
  const sortedMessageIds = Object.keys(messages).sort(
    (a, b) => messages[b].time - messages[a].time
  );

  return (
    <div className="min-h-screen pb-20">
      {/* 页面头部 */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background pt-16 pb-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon icon="lucide:message-circle" className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">日常</h1>
              <p className="text-sm text-muted-foreground">记录生活点滴</p>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-3xl mx-auto px-4 mt-6">
        {/* 刷新按钮 */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMessages}
            disabled={loading}
            className="gap-2"
          >
            <Icon
              icon="lucide:refresh-cw"
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            刷新
          </Button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 text-center">
            <Icon icon="lucide:alert-circle" className="w-6 h-6 text-destructive mx-auto mb-2" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMessages} className="mt-2">
              重试
            </Button>
          </div>
        )}

        {/* 消息列表 */}
        <FancyboxWrapper>
          <div className="space-y-6">
            {loading ? (
              // 骨架屏
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : sortedMessageIds.length > 0 ? (
              sortedMessageIds.map((id, index) => (
                <MessageCard
                  key={id}
                  id={id}
                  message={messages[id]}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Icon icon="lucide:inbox" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无内容</p>
              </div>
            )}
          </div>
        </FancyboxWrapper>
      </div>
    </div>
  );
}
