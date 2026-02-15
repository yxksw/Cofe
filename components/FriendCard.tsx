'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { FriendLink } from '@/data/friends';
import { FRIEND_LEVELS } from '@/data/friendLevels';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface FriendCardProps {
    link: FriendLink;
}

// 获取状态指示器样式
const getStatusIndicator = (status?: string, responseTime?: number) => {
    if (!status) return null;

    const baseClasses = "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full";

    switch (status) {
        case 'ok':
            if (responseTime && responseTime < 1000) {
                return {
                    className: `${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`,
                    icon: "lucide:zap",
                    label: `${responseTime}ms`
                };
            } else if (responseTime && responseTime < 3000) {
                return {
                    className: `${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`,
                    icon: "lucide:activity",
                    label: `${responseTime}ms`
                };
            } else {
                return {
                    className: `${baseClasses} bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`,
                    icon: "lucide:alert-circle",
                    label: responseTime ? `${responseTime}ms` : '较慢'
                };
            }
        case 'timeout':
            return {
                className: `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`,
                icon: "lucide:clock",
                label: "超时"
            };
        case 'error':
            return {
                className: `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400`,
                icon: "lucide:x-circle",
                label: "异常"
            };
        default:
            return null;
    }
};

const FriendCard: React.FC<FriendCardProps> = ({ link }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);
    const statusInfo = getStatusIndicator(link.status, link.responseTime);

    // 计算已添加天数
    const getDaysAdded = () => {
        if (!link.addDate) return 0;
        const addDate = new Date(link.addDate);
        const today = new Date();
        const diffTime = today.getTime() - addDate.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const days = getDaysAdded();

    // 计算等级
    const getLevelInfo = () => {
        if (days < 0) return null;
        const foundIndex = FRIEND_LEVELS.findIndex(l => days < l.days);
        if (foundIndex === -1) {
            return FRIEND_LEVELS[FRIEND_LEVELS.length - 1];
        }
        return FRIEND_LEVELS[foundIndex];
    };

    const levelInfo = getLevelInfo();

    useEffect(() => {
        if (!imgRef.current || shouldLoad) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' }
        );

        observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, [shouldLoad]);

    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all duration-300 
                bg-white dark:bg-white/5 
                hover:-translate-y-1 hover:shadow-lg
                ${levelInfo ? levelInfo.border.replace('border-', 'border-opacity-50 hover:border-opacity-100 ') : 'border-gray-200 dark:border-white/10'}
                overflow-hidden min-h-[90px]
            `}
        >
            {/* Background Decoration Pattern */}
            <div className={`absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none ${levelInfo?.theme}`}>
                {levelInfo && <Icon icon={levelInfo.icon} className="w-32 h-32" />}
            </div>

            {/* Status Badge - Top Right Corner */}
            {statusInfo && (
                <div 
                    className={`absolute top-2 right-2 z-20 flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium shadow-sm ${statusInfo.className}`}
                    title={`最后检测: ${link.lastChecked || '未知'}`}
                >
                    <Icon icon={statusInfo.icon} className="w-3 h-3" />
                    <span>{statusInfo.label}</span>
                </div>
            )}

            {/* Avatar Section */}
            <div ref={imgRef} className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                <div className={`absolute inset-0 rounded-full border-2 ${levelInfo ? `${levelInfo.border} opacity-20` : 'border-gray-200'} scale-110`} />

                {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                )}

                {(!imageError && shouldLoad) ? (
                    <Image
                        src={link.avatar}
                        alt={link.name}
                        width={56}
                        height={56}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(true);
                        }}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover relative z-10 transition-transform duration-500 group-hover:rotate-12 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                    />
                ) : imageError && (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 z-10 relative">
                        {link.name.charAt(0)}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 z-10 flex flex-col justify-center py-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {link.name}
                    </h3>
                    {link.recommended && (
                        <div className="relative group/rec flex-shrink-0" title="推荐">
                            <Icon icon="lucide:thumbs-up" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {link.description}
                </p>
            </div>

            {/* Genshin Style Stamp (Right Side) */}
            {levelInfo && (
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 opacity-20 group-hover:opacity-35 transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-8deg] pointer-events-none">
                    <div className={`relative w-full h-full flex flex-col items-center justify-center ${levelInfo.color}`}>
                        <div className="font-black tracking-wider uppercase text-[8px] sm:text-[10px] opacity-100 font-serif leading-tight">
                            {levelInfo.title}
                        </div>
                        <Icon icon={levelInfo.icon} className="w-6 h-6 sm:w-8 sm:h-8 opacity-60 my-0.5" />
                        <div className="font-mono text-[8px] sm:text-[9px] opacity-100 font-bold leading-tight">
                            {days} DAYS
                        </div>
                    </div>
                </div>
            )}
        </a>
    );
};

export default FriendCard;
