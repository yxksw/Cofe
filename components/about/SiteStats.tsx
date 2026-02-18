'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'

interface StatsData {
  today_uv: string | number
  today_pv: string | number
  yesterday_uv: string | number
  yesterday_pv: string | number
  last_month_pv: string | number
  total_uv: string | number
  total_pv: string | number
}

export function SiteStats() {
  const [statsData, setStatsData] = useState<StatsData>({
    today_uv: '加载中...',
    today_pv: '加载中...',
    yesterday_uv: '加载中...',
    yesterday_pv: '加载中...',
    last_month_pv: '加载中...',
    total_uv: '加载中...',
    total_pv: '加载中...',
  })

  useEffect(() => {
    // 获取 Umami 统计数据
    const fetchStats = async () => {
      try {
        const response = await fetch('https://um-cofe.050815.xyz/')
        const data = await response.json()

        if (data) {
          setStatsData({
            today_uv: formatNumber(data.today_uv || 0),
            today_pv: formatNumber(data.today_pv || 0),
            yesterday_uv: formatNumber(data.yesterday_uv || 0),
            yesterday_pv: formatNumber(data.yesterday_pv || 0),
            last_month_pv: formatNumber(data.last_month_pv || 0),
            total_uv: formatNumber(data.total_uv || 0),
            total_pv: formatNumber(data.total_pv || 0),
          })
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        setStatsData({
          today_uv: '-',
          today_pv: '-',
          yesterday_uv: '-',
          yesterday_pv: '-',
          last_month_pv: '-',
          total_uv: '-',
          total_pv: '-',
        })
      }
    }

    fetchStats()
  }, [])

  // 格式化数字
  function formatNumber(num: number): string {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`
    }
    return num.toString()
  }

  return (
    <div className="stats-card author-content-item">
      <div className="author-content-item-tips">网站统计</div>
      <div className="stats-content">
        <div className="stats-range-section">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{statsData.today_pv}</span>
              <span className="stat-label">今日浏览</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{statsData.today_uv}</span>
              <span className="stat-label">今日访客</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{statsData.yesterday_pv}</span>
              <span className="stat-label">昨日浏览</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{statsData.yesterday_uv}</span>
              <span className="stat-label">昨日访客</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{statsData.total_pv}</span>
              <span className="stat-label">总浏览量</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{statsData.total_uv}</span>
              <span className="stat-label">总访客数</span>
            </div>
          </div>
        </div>
      </div>
      <Icon icon="lucide:bar-chart-3" className="card-bg-icon" />
    </div>
  )
}
