'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import Image from 'next/image';

export default function GoPage() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState<string>('');
  const [countdown, setCountdown] = useState(5);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const encodedUrl = searchParams.get('u');
    if (encodedUrl) {
      try {
        const decodedUrl = atob(encodedUrl);
        setUrl(decodedUrl);
        setIsReady(true);
      } catch {
        window.location.href = '/';
      }
    } else {
      window.location.href = '/';
    }
  }, [searchParams]);

  // 倒计时逻辑
  useEffect(() => {
    if (!isReady || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isReady]);

  // 倒计时结束自动跳转
  useEffect(() => {
    if (isReady && countdown === 0 && url) {
      window.location.href = url;
    }
  }, [countdown, url, isReady]);

  // 主动跳转
  const handleGo = () => {
    if (url) {
      window.location.href = url;
    }
  };

  // 取消返回上一页
  const handleCancel = () => {
    window.history.back();
  };

  // 提取域名
  const getDomain = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      return urlString;
    }
  };

  // 进度百分比
  const progress = ((5 - countdown) / 5) * 100;

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Icon icon="ri:loader-4-line" className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        {/* 卡片 */}
        <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 text-center border-b border-border">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <Image
                src="https://cn.cravatar.com/avatar/eb7277a11fa4dc00606e73afda41aeeb?=256"
                alt="Avatar"
                width={64}
                height={64}
                className="rounded-full"
                unoptimized
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Icon icon="ri:alert-line" className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">即将离开本站</h1>
            <p className="text-sm text-muted-foreground mt-2">
              您正在访问外部链接
            </p>
          </div>

          {/* 目标链接 */}
          <div className="p-6">
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-2">即将跳转到</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon icon="ri:link" className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {getDomain(url)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 truncate" title={url}>
                {url}
              </p>
            </div>

            {/* 倒计时进度条 */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>自动跳转倒计时</span>
                <span className="font-medium">{countdown} 秒</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon icon="ri:arrow-left-line" className="w-5 h-5" />
                取消
              </button>
              <button
                onClick={handleGo}
                className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon icon="ri:arrow-right-line" className="w-5 h-5" />
                前往
              </button>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="px-6 py-4 bg-muted/30 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              外部链接由第三方提供，请注意保护个人信息安全
            </p>
          </div>
        </div>

        {/* 版权信息 */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} 塔罗会
        </p>
      </div>
    </div>
  );
}
