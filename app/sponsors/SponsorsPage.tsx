'use client'

import { Icon } from '@iconify/react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import FancyboxWrapper from '@/components/FancyboxWrapper'

// 动态导入 GitalkComments 组件，避免 SSR 问题
const GitalkComments = dynamic(() => import('@/components/GitalkComments'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 p-8 bg-card rounded-lg border border-border text-center text-muted-foreground">
      评论加载中...
    </div>
  ),
})

interface Sponsor {
  name: string
  avatar: string
  date: string
  amount: string
}

interface SponsorsPageProps {
  sponsors: Sponsor[]
}

export default function SponsorsPage({ sponsors }: SponsorsPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Icon icon="material-symbols:favorite" className="text-2xl" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">赞助支持</h1>
      </div>

      {/* 介绍文字 */}
      <div className="mb-8">
        <p className="text-lg text-foreground/80 mb-3">
          如果您觉得我的内容对您有帮助，欢迎通过以下方式支持我的创作。您的每一份支持都是我持续创作的动力！
        </p>
        <p className="text-sm text-muted-foreground">
          所有赞助将用于网站维护、服务器费用以及内容创作。
        </p>
      </div>

      {/* 支付方式卡片 */}
      <FancyboxWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 支付宝 */}
          <div className="donate-card group">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Icon icon="simple-icons:alipay" className="text-xl text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">支付宝</h3>
                <p className="text-sm text-muted-foreground">扫码支付</p>
              </div>
            </div>
            <div className="qr-code-container">
              <QRCodeImage 
                src="https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/alipay.avif"
                alt="支付宝二维码"
              />
            </div>
          </div>

          {/* 微信支付 */}
          <div className="donate-card group">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Icon icon="simple-icons:wechat" className="text-xl text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">微信支付</h3>
                <p className="text-sm text-muted-foreground">扫码支付</p>
              </div>
            </div>
            <div className="qr-code-container">
              <QRCodeImage 
                src="https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/wechat.avif"
                alt="微信支付二维码"
              />
            </div>
          </div>
        </div>
      </FancyboxWrapper>

      {/* 其他支持方式 */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">其他支持方式</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="support-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:share" className="text-lg text-primary" />
              <span className="font-semibold text-foreground">分享推荐</span>
            </div>
            <p className="text-sm text-muted-foreground">
              将我的博客分享给更多朋友
            </p>
          </div>

          <div className="support-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:comment" className="text-lg text-primary" />
              <span className="font-semibold text-foreground">留言互动</span>
            </div>
            <p className="text-sm text-muted-foreground">
              在文章下方留下您的想法
            </p>
          </div>

          <div className="support-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:star" className="text-lg text-primary" />
              <span className="font-semibold text-foreground">关注订阅</span>
            </div>
            <p className="text-sm text-muted-foreground">
              订阅RSS或关注社交媒体
            </p>
          </div>
        </div>
      </div>

      {/* 赞助者名单 */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
          <Icon icon="material-symbols:group" className="text-2xl text-primary" />
          <span>已赞助的小伙伴</span>
        </h2>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            感谢以下小伙伴的慷慨支持！您的支持是我持续创作的最大动力。
          </p>
        </div>

        {sponsors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsors.map((sponsor, index) => (
              <div
                key={index}
                className="sponsor-card"
              >
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                    {sponsor.avatar ? (
                      <Image
                        src={sponsor.avatar}
                        alt={`${sponsor.name}的头像`}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon icon="material-symbols:person" className="text-xl text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-sm truncate">{sponsor.name}</h4>
                    <p className="text-xs text-muted-foreground">{sponsor.date}</p>
                  </div>
                  <div className="text-xs text-primary font-medium shrink-0">{sponsor.amount}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon icon="material-symbols:volunteer-activism-outline" className="text-4xl text-muted-foreground mb-3" />
            <p className="text-muted-foreground">暂无赞助记录</p>
            <p className="text-sm text-muted-foreground mt-1">成为第一个赞助者吧！</p>
          </div>
        )}
      </div>

      {/* 评论区 */}
      <div className="mt-8">
        <GitalkComments 
          id="sponsors-page" 
          title="赞助支持" 
        />
      </div>

      {/* 样式 */}
      <style jsx>{`
        .donate-card {
          @apply flex flex-col p-4 rounded-xl bg-card border border-border;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }

        .donate-card:hover {
          @apply border-primary/30 shadow-lg;
          transform: translateY(-2px);
        }

        .support-card {
          @apply p-4 rounded-lg bg-secondary/30 border border-border;
          transition: all 0.3s ease;
        }

        .support-card:hover {
          @apply bg-secondary/50 border-primary/30;
          transform: translateY(-2px);
        }

        .sponsor-card {
          transition: all 0.2s ease;
        }

        .sponsor-card:hover {
          transform: scale(1.02);
        }

        .sponsor-card:hover > div {
          @apply border-primary/30 shadow-md;
        }

        .qr-code-container {
          @apply text-center py-2;
        }
      `}</style>
    </div>
  )
}

// 二维码图片组件
function QRCodeImage({ 
  src,
  alt
}: { 
  src: string
  alt: string
}) {
  return (
    <a
      href={src}
      data-fancybox="sponsors-qr"
      data-caption={alt}
      className="block relative w-48 h-48 mx-auto rounded-lg overflow-hidden bg-muted border border-border cursor-zoom-in group/img"
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-500 group-hover/img:scale-105"
        sizes="192px"
        unoptimized
      />
    </a>
  )
}
