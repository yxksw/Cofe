'use client'

import { useEffect } from 'react'
import { Author } from '@/components/about/Author'
import { AboutSiteTips } from '@/components/about/AboutSiteTips'
import { Maxim } from '@/components/about/Maxim'
import { MyInfoAndSayHello } from '@/components/about/MyInfoAndSayHello'
import { SkillInfo } from '@/components/about/SkillInfo'
import { SiteStats } from '@/components/about/SiteStats'
import { Single } from '@/components/about/Single'
import './about.css'

export default function AboutPage() {
  useEffect(() => {
    // 动态加载 about.js 脚本
    const script = document.createElement('script')
    script.src = '/js/about.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div id="about-page" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <Author />
      <div className="author-page-content">
        <div className="author-content">
          <MyInfoAndSayHello />
        </div>
        <div className="author-content">
          <AboutSiteTips />
          <Maxim />
        </div>
        <div className="author-content">
          <SkillInfo />
        </div>
        <div className="author-content">
          <SiteStats />
        </div>
        <div className="author-content">
          <Single />
        </div>
      </div>
    </div>
  )
}
