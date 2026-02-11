'use client'

import { about } from '@/data/about'

export function MyInfoAndSayHello() {
  return (
    <div className="myInfoAndSayHello author-content-item">
      {about.map((info, index) => (
        <div key={index} style={{ textAlign: 'center', width: '100%' }}>
          <div className="title1">{info.myinfo[0]?.title1}</div>
          <div className="title2">
            {info.myinfo[0]?.title2}
            <span className="inline-word">{info.myinfo[0]?.inlineword1}</span>
          </div>
          <div className="title1">
            {info.myinfo[0]?.title3}
            <span className="inline-word">{info.myinfo[0]?.inlineword2}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
