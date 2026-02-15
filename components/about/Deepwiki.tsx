'use client'

import { Icon } from '@iconify/react'

export function Deepwiki() {
  return (
    <div className="author-content-item single">
      <a 
        href="https://deepwiki.com/yxksw/cofe" 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border-2 border-primary text-primary font-bold text-base sm:text-lg hover:bg-primary hover:text-primary-foreground transition-all shadow-md active:scale-95 group"
      >
        <Icon 
          icon="lucide:message-circle" 
          className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" 
        />
        有问题？询问 DeepWiki！
      </a>
    </div>
  )
}
