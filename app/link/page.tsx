'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import FriendsList from '@/components/FriendsList';
import FriendLevelLegend from '@/components/FriendLevelLegend';
import DisconnectedFriendsList from '@/components/DisconnectedFriendsList';
import SiteInfo from '@/components/SiteInfo';
import ErrorBoundary from '@/components/ErrorBoundary';
import dynamic from 'next/dynamic';
import type { FriendLink } from '@/data/friends';

// 动态导入 GitalkComments 组件，避免 SSR 问题
const GitalkComments = dynamic(() => import('@/components/GitalkComments'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 p-8 bg-card rounded-lg border border-border text-center text-muted-foreground">
      评论加载中...
    </div>
  ),
});

// 本站信息配置
const SITE_INFO = {
    name: "塔罗会",
    url: "https://cofe.050815.xyz",
    description: "每一段旅行，都有终点。",
    avatar: "https://cn.cravatar.com/avatar/eb7277a11fa4dc00606e73afda41aeeb?=256"
};

// 友链联系邮箱
// const FRIEND_LINK_EMAIL = "yxksw@foxmail.com";

// 本地 API 地址
const API_URL = '/api/friends';

export default function LinkPage() {
    const [friendLinks, setFriendLinks] = useState<FriendLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                setLoading(true);
                const response = await fetch(API_URL);
                const result = await response.json();
                
                if (result.code !== 0) {
                    throw new Error(result.msg || 'Failed to fetch friends data');
                }
                
                setFriendLinks(result.data.list);
            } catch (err) {
                console.error('Failed to fetch friends:', err);
                setError('加载友链数据失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, []);

    return (
        <div className="min-h-screen relative">
            <main className="flex-1 flex flex-col relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 z-10">
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            友情链接
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 italic">
                            探索更多优秀的内容创作者和技术伙伴。
                        </p>
                    </div>

                    {/* Legend */}
                    <ErrorBoundary>
                        <FriendLevelLegend />
                    </ErrorBoundary>

                    {/* Friends List with Pagination */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="mt-4 text-muted-foreground">加载友链中...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-destructive">
                            <Icon icon="lucide:alert-circle" className="w-12 h-12 mx-auto mb-4" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <ErrorBoundary>
                            <FriendsList links={friendLinks} />
                        </ErrorBoundary>
                    )}

                    {/* Disconnected Friends List */}
                    {!loading && !error && (
                        <ErrorBoundary>
                            <DisconnectedFriendsList links={friendLinks} />
                        </ErrorBoundary>
                    )}

                    {/* Apply Section - Redesigned */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* 申请友链 */}
                        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Icon icon="lucide:mail" className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">申请友链</h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                欢迎技术与生活类博客交换友链
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                评论区留言或请在仓库创建 <a href={`https://github.com/yxksw/Friends/issues/new?template=friend-link-request.yml`} className="text-primary hover:underline">议题</a>
                            </p>
                            {/* 提示信息框 */}
                            <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 text-center">
                                <p className="text-sm text-primary font-medium mb-1">
                                    博客名称、描述、地址、头像等信息
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    任意格式均可,包含基本信息即可
                                </p>
                            </div>
                        </div>

                        {/* 本站信息 */}
                        <ErrorBoundary>
                            <SiteInfo
                                name={SITE_INFO.name}
                                url={SITE_INFO.url}
                                description={SITE_INFO.description}
                                avatar={SITE_INFO.avatar}
                            />
                        </ErrorBoundary>
                    </div>

                    {/* Gitalk 评论区 */}
                    <div className="bg-card rounded-lg border border-border p-8">
                        <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                            <Icon icon="lucide:message-circle" className="w-5 h-5" />
                            评论
                        </h2>
                        <GitalkComments id="friend-links" title="友情链接" />
                    </div>
                </div>
            </main>
        </div>
    );
}
