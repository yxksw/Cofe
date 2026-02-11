'use client'

import { about } from '@/data/about'
import aboutContent from '@/data/about.md'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Single() {
  // 直接使用导入的 markdown 内容
  const content = aboutContent

  return (
    <div className="create-site-post author-content-item single">
      {about.map((singleItem, index) => (
        <div key={index}>
          {singleItem.single.map((single, idx) => (
            <div key={idx}>
              <div className="author-content-item-tips">
                {single.tip}
              </div>
              <div className="author-content-item-title">
                {single.title}
              </div>
              <p className="author-content-item-content">
                {single.content}
              </p>
              <div className="lishi">
                {single.lishi}
              </div>
              <div className="singlePost">
                {content ? (
                  <div className="article prose dark:prose-invert max-w-none text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    可于 about.md 配置补充说明。
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
