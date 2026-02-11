'use client'

import { creativityData } from '@/data/creativity'
import { Icon } from '@iconify/react'

export function SkillInfo() {
  return (
    <div className="creativityMain author-content-item">
      {creativityData.map((creativity, index) => (
        <div key={index}>
          <div className="author-content-item-tips">
            {creativity.subtitle}
          </div>
          <div className="author-content-item-list">
            {creativity.creativity_list.map((item) => (
              <div className="cardInfo" key={item.name}>
                <div
                  className="creativityIcon"
                  style={{ background: item.color }}
                >
                  <Icon icon={item.icon} width={18} height={18} />
                </div>
                <div className="creativityTitle">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
