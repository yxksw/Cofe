'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { FriendLink } from '@/data/friends';
import { DISCONNECTED_LEVEL } from '@/data/friendLevels';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface DisconnectedFriendCardProps {
    link: FriendLink;
}

const DisconnectedFriendCard: React.FC<DisconnectedFriendCardProps> = ({ link }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    const levelInfo = DISCONNECTED_LEVEL;

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
                ${levelInfo.border}
                overflow-hidden min-h-[90px] grayscale opacity-80 hover:grayscale-0 hover:opacity-100
            `}
        >
            {/* Background Decoration Pattern */}
            <div className={`absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none ${levelInfo.theme}`}>
                <Icon icon={levelInfo.icon} className="w-32 h-32" />
            </div>

            {/* Avatar Section */}
            <div ref={imgRef} className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                <div className={`absolute inset-0 rounded-full border-2 ${levelInfo.border} opacity-20 scale-110`} />

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
                    <h3 className="font-bold text-gray-900 dark:text-gray-400 text-sm sm:text-base truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {link.name}
                    </h3>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors">
                    {link.description}
                </p>
            </div>

            {/* Ghost Stamp (Right Side) */}
            <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 opacity-20 group-hover:opacity-35 transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-8deg] pointer-events-none">
                <div className={`relative w-full h-full flex flex-col items-center justify-center ${levelInfo.color}`}>
                    <div className="font-black tracking-wider uppercase text-[8px] sm:text-[10px] opacity-100 font-serif leading-tight">
                        {levelInfo.title}
                    </div>
                    <Icon icon={levelInfo.icon} className="w-6 h-6 sm:w-8 sm:h-8 opacity-60 my-0.5" />
                    <div className="font-mono text-[8px] sm:text-[9px] opacity-100 font-bold leading-tight">
                        LOST
                    </div>
                </div>
            </div>
        </a>
    );
};

export default DisconnectedFriendCard;
