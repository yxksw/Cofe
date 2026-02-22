'use client';

import React from 'react';
import type { FriendLink } from '@/data/friends';
import DisconnectedFriendCard from './DisconnectedFriendCard';
import { Icon } from '@iconify/react';

interface DisconnectedFriendsListProps {
    links: FriendLink[];
}

const DisconnectedFriendsList: React.FC<DisconnectedFriendsListProps> = ({ links }) => {
    // 过滤出失联的友链
    const disconnectedLinks = links.filter(link => link.disconnected);

    if (disconnectedLinks.length === 0) {
        return null;
    }

    return (
        <div className="mt-12 mb-8">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Icon icon="lucide:unlink" className="w-5 h-5" />
                <h3 className="text-lg font-semibold">失联友链</h3>
                <span className="text-sm">({disconnectedLinks.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {disconnectedLinks.map((link) => (
                    <DisconnectedFriendCard key={link.url} link={link} />
                ))}
            </div>
        </div>
    );
};

export default DisconnectedFriendsList;
