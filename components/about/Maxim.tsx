'use client'

import { about } from '@/data/about'

export function Maxim() {
  return (
    <div className="maxim author-content-item">
      {about.map((maximItem, index) => (
        <div key={index} className="w-full">
          {maximItem.maxim.map((maxim, idx) => (
            <div key={idx} className="w-full">
              <div className="author-content-item-tips">
                {maxim.tip}
              </div>
              <span className="maxim-title">
                <span style={{ opacity: 0.6, marginBottom: '8px' }}>
                  {maxim.title1}
                </span>
                <span>
                  {maxim.title2}
                </span>
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
