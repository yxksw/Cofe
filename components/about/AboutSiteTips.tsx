'use client'

import { about } from '@/data/about'
import { useEffect, useState } from 'react'

export function AboutSiteTips() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const getSpanClass = (index: number) => {
    if (index === currentIndex) return 'data-show'
    if (index === (currentIndex - 1 + 4) % 4) return 'data-up'
    return ''
  }

  return (
    <div className="aboutsiteTips author-content-item">
      {about.map((myinfo, index) => (
        <div key={index} className="w-full">
          {myinfo.myinfo.map((info, idx) => (
            <div key={idx} className="w-full">
              {info.card.map((card, cardIdx) => (
                <div key={cardIdx} className="w-full">
                  <div className="author-content-item-tips">
                    {card.tips}
                  </div>
                  <h2 className="w-full">
                    {card.conect1}
                    <br />
                    {card.conect2}
                    <span className="inline-word">
                      {card.inlineword}
                    </span>
                    <div className="mask">
                      {card.mask.map((mask, maskIdx) => (
                        <span
                          key={maskIdx}
                          className={`first-tips ${getSpanClass(0)}`}
                        >
                          {mask.firstTips}
                        </span>
                      ))}
                      {card.mask.map((mask, maskIdx) => (
                        <span
                          key={maskIdx}
                          className={getSpanClass(1)}
                        >
                          {mask.span}
                        </span>
                      ))}
                      {card.mask.map((mask, maskIdx) => (
                        <span
                          key={maskIdx}
                          className={getSpanClass(2)}
                        >
                          {mask.up}
                        </span>
                      ))}
                      {card.mask.map((mask, maskIdx) => (
                        <span
                          key={maskIdx}
                          className={getSpanClass(3)}
                        >
                          {mask.show}
                        </span>
                      ))}
                    </div>
                  </h2>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
