'use client'

import { authorData } from '@/data/about/author'
import Image from 'next/image'

export function Author() {
  return (
    <div className="author-main">
      {authorData.map((author, index) => (
        <div key={index} className="flex items-center justify-center w-full">
          {/* 左侧标签 */}
          <div className="author-tag-left">
            {author.左侧.map((left, idx) => (
              <div key={idx} className="flex flex-col items-end">
                <span className="author-tag">{left.标签1}</span>
                <span className="author-tag">{left.标签2}</span>
                <span className="author-tag">{left.标签3}</span>
                <span className="author-tag">{left.标签4}</span>
              </div>
            ))}
          </div>

          {/* 头像 */}
          <div className="mainports">
            <div className="author-img">
              <Image
                className="author-avatar"
                src={author.头像}
                alt="作者头像"
                width={180}
                height={180}
                priority
              />
            </div>
          </div>

          {/* 右侧标签 */}
          <div className="author-tag-right">
            {author.右侧.map((right, idx) => (
              <div key={idx} className="flex flex-col items-start">
                <span className="author-tag">{right.标签1}</span>
                <span className="author-tag">{right.标签2}</span>
                <span className="author-tag">{right.标签3}</span>
                <span className="author-tag">{right.标签4}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
