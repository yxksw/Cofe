'use client';

import React from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { REWARDS_CONFIG } from '@/data/rewards';
import dynamic from 'next/dynamic';

// 动态导入 GitalkComments 组件，避免 SSR 问题
const DynamicGitalkComments = dynamic(() => import('@/components/GitalkComments').then(mod => ({ default: mod.GitalkComments })), {
  ssr: false,
  loading: () => (
    <div className="mt-8 p-8 bg-card rounded-lg border border-border text-center text-muted-foreground">
      评论加载中...
    </div>
  ),
});

export default function RewardsPage() {
  const { alipay, wechat, thankImage, list } = REWARDS_CONFIG;

  // 反转列表，最新的在最后
  const sortedList = [...list].reverse();

  // 计算统计数据
  const totalCount = sortedList.length;
  const totalAmount = sortedList.reduce((sum, item) => {
    const amount = parseFloat(item.amount.replace('¥', ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <div className="min-h-screen pb-20">
      {/* 页面头部 */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background pt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon icon="lucide:heart" className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">感谢赞助</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            感谢每一份慷慨的赞赏，它不仅是支持，更是我前行路上温暖的光。
            这份心意我已悉心珍藏，会化作动力，努力为大家创造更多价值 💗
          </p>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* 感谢图片 */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-md h-48 rounded-xl overflow-hidden bg-muted/30">
            <Image
              src={thankImage}
              alt="感谢"
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 448px"
              priority
              onError={(e) => {
                console.error('Thank image failed to load:', thankImage);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* 收款码区域 */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-12">
          {/* 支付宝 */}
          <div className="text-center group">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
              <Image
                src={alipay.image}
                alt={alipay.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="mt-3 font-medium text-foreground">{alipay.name}</p>
          </div>

          {/* 微信 */}
          <div className="text-center group">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
              <Image
                src={wechat.image}
                alt={wechat.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="mt-3 font-medium text-foreground">{wechat.name}</p>
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="bg-card border border-border rounded-xl p-6 mb-12">
          <div className="flex items-start gap-3">
            <Icon icon="lucide:info" className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">温馨提示</h3>
              <p className="text-sm text-muted-foreground">
                如果您在赞赏时，能留下备注或在下方评论区说一声，就能方便我将这份心意与您对应上，为您记录在专属的感谢名单里。期待与您相遇！
              </p>
            </div>
          </div>
        </div>

        {/* 赞赏者列表 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:users" className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">赞赏者名单</h2>
            </div>
            <p className="text-sm text-muted-foreground italic">
              你的每一份支持都是对我的莫大鼓励
            </p>
          </div>

          {sortedList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedList.map((sponsor, index) => (
                <SponsorCard key={index} sponsor={sponsor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Icon icon="lucide:heart-handshake" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无赞赏者，成为第一个支持本站的朋友吧！</p>
            </div>
          )}

          {/* 统计信息 */}
          {sortedList.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
              <div className="bg-card border border-border rounded-lg px-6 py-3">
                <span className="text-muted-foreground">共计</span>
                <span className="mx-2 text-xl font-bold text-primary">{totalCount}</span>
                <span className="text-muted-foreground">笔打款</span>
              </div>
              <div className="bg-card border border-border rounded-lg px-6 py-3">
                <span className="text-muted-foreground">累计金额</span>
                <span className="mx-2 text-xl font-bold text-primary">¥{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 评论区 */}
        <div className="bg-card rounded-lg border border-border p-8">
          <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
            <Icon icon="lucide:message-circle" className="w-5 h-5" />
            留言
          </h2>
          <DynamicGitalkComments id="rewards" title="感谢赞助" />
        </div>
      </div>
    </div>
  );
}

// 赞赏者卡片组件
function SponsorCard({ sponsor }: { sponsor: typeof REWARDS_CONFIG.list[0] }) {
  const CardContent = () => (
    <div className="relative bg-card border border-border rounded-xl p-4 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {/* 背景图片 */}
      <div
        className="absolute inset-0 opacity-20 transition-all duration-300 group-hover:opacity-40 group-hover:scale-110"
        style={{
          backgroundImage: `url(${sponsor.avatar})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to left, transparent, black)',
          WebkitMaskImage: 'linear-gradient(to left, transparent, black)',
        }}
      />

      {/* 内容 */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border">
            <Image
              src={sponsor.avatar}
              alt={sponsor.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{sponsor.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{sponsor.description}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-primary">{sponsor.amount}</p>
          <p className="text-xs text-muted-foreground">{sponsor.date}</p>
        </div>
      </div>
    </div>
  );

  if (sponsor.website) {
    return (
      <a
        href={sponsor.website}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <CardContent />
      </a>
    );
  }

  return <CardContent />;
}
