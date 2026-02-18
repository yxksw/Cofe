import { devices } from '@/data/devices';
import { NextResponse } from 'next/server';

/**
 * 设备数据 API
 * 供其他博客调用获取设备列表
 * 
 * 使用方法:
 * GET /api/devices - 获取所有设备
 * GET /api/devices?category=生产力 - 只获取生产力设备
 * GET /api/devices?category=出行 - 只获取出行设备
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  // 过滤数据
  let data = [...devices];
  
  if (category) {
    data = data.filter(d => d.category === category);
  }

  // CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600', // 缓存1小时
  };

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 计算统计数据
  const totalMoney = data.reduce((sum, d) => sum + (d.money || 0), 0);
  const categoryCount = {
    生产力: devices.filter(d => d.category === '生产力').length,
    出行: devices.filter(d => d.category === '出行').length,
  };

  // JSON 格式
  const response = {
    code: 0,
    msg: 'success',
    data: {
      total: data.length,
      totalMoney,
      categoryCount,
      updatedAt: new Date().toISOString(),
      list: data.map(d => ({
        name: d.name,
        category: d.category,
        categoryColor: d.categoryColor,
        desc: d.desc,
        info: d.info,
        tag: d.tag,
        image: d.image,
        date: d.date,
        src: d.src,
        money: d.money,
      })),
    },
  };

  return NextResponse.json(response, { headers: corsHeaders });
}

// 支持 OPTIONS 方法
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
