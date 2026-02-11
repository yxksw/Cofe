'use client';

import React from 'react';
import Image from 'next/image';

interface FCircleHeaderProps {
  background: string;
  title: string;
  desc: string;
}

const FCircleHeader: React.FC<FCircleHeaderProps> = ({ background, title, desc }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 mt-4">
      <div className="cover-wrapper relative rounded-2xl h-[300px] overflow-hidden">
        <Image
          src={background}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="header-wrapper mt-3 px-5 py-4 rounded-2xl bg-card border border-border">
        <h3 className="title text-xl font-bold text-foreground">{title}</h3>
        <span className="desc text-sm text-muted-foreground mt-1 block">{desc}</span>
      </div>
    </div>
  );
};

export default FCircleHeader;
