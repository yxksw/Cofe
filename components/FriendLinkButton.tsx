'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

interface FriendLinkButtonProps {
    onClick: () => void;
}

const FriendLinkButton: React.FC<FriendLinkButtonProps> = ({ onClick }) => {
    return (
        <Button
            onClick={onClick}
            className="fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 bg-primary text-primary-foreground"
            size="icon"
            aria-label="申请友链"
        >
            <Icon icon="lucide:plus" className="w-6 h-6" />
        </Button>
    );
};

export default FriendLinkButton;
