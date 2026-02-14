'use client';

import { useState } from 'react';
import { FRIEND_LINKS } from '@/data/friends';
import { Icon } from '@iconify/react';
import FriendsList from '@/components/FriendsList';
import FriendLevelLegend from '@/components/FriendLevelLegend';
import DisconnectedFriendsList from '@/components/DisconnectedFriendsList';
import SiteInfo from '@/components/SiteInfo';
import ErrorBoundary from '@/components/ErrorBoundary';
import FriendLinkModal from '@/components/FriendLinkModal';
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

// 本站信息配置
const SITE_INFO = {
    name: "塔罗会",
    url: "https://cofe.381359.xyz",
    description: "每一段旅行，都有终点。",
    avatar: "https://cn.cravatar.com/avatar/eb7277a11fa4dc00606e73afda41aeeb?=256"
};

// 友链联系邮箱
const FRIEND_LINK_EMAIL = "your-email@example.com";

export default function LinkPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

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
                    <ErrorBoundary>
                        <FriendsList links={FRIEND_LINKS} />
                    </ErrorBoundary>

                    {/* Disconnected Friends List */}
                    <ErrorBoundary>
                        <DisconnectedFriendsList links={FRIEND_LINKS} />
                    </ErrorBoundary>

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
                                评论区留言或请发送邮件至 <a href={`mailto:${FRIEND_LINK_EMAIL}`} className="text-primary hover:underline">{FRIEND_LINK_EMAIL}</a>
                            </p>
                            {/* 提示信息框 */}
                            <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 text-center mb-4">
                                <p className="text-sm text-primary font-medium mb-1">
                                    博客名称、描述、地址、头像等信息
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    任意格式均可,包含基本信息即可
                                </p>
                            </div>

                            {/* 申请友链按钮 */}
                            <button
                                onClick={handleOpenModal}
                                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon icon="lucide:plus" className="w-5 h-5" />
                                立即申请
                            </button>
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

            {/* 友链申请弹窗 */}
            <FriendLinkModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
            />
        </div>
    );
}
