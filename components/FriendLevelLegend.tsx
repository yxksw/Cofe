'use client';

import React, { useState } from 'react';
import { FRIEND_LEVELS } from '@/data/friendLevels';
import { Icon } from '@iconify/react';

const FriendLevelLegend: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="w-full bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden mb-8 transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Icon icon="lucide:info" className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    友链印记说明
                </h3>
                <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    <Icon icon={isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'} className="w-5 h-5" />
                </div>
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 p-6 pt-0 border-t border-gray-100 dark:border-white/5' : 'grid-rows-[0fr] opacity-0 px-6 py-0'}`}>
                <div className="overflow-hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-4">
                        {FRIEND_LEVELS.map((level, index) => {
                            const prevDays = index === 0 ? 0 : FRIEND_LEVELS[index - 1].days;
                            const isLast = index === FRIEND_LEVELS.length - 1;
                            const dayRange = isLast ? `${level.days}天+` : `${prevDays}-${level.days}天`;
                            
                            return (
                                <div key={level.level} className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-default">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${level.theme}`}>
                                        <Icon icon={level.icon} className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col cursor-default">
                                        <span className={`text-xs font-bold ${level.theme} cursor-default`}>
                                            {level.title}
                                        </span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 cursor-default">
                                            {dayRange}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendLevelLegend;
