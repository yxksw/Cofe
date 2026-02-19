import { REWARDS_CONFIG } from '@/data/rewards';
import { NextResponse } from 'next/server';

/**
 * 打赏/赞赏数据 API
 * 供其他博客调用获取赞赏者列表
 * 
 * 使用方法:
 * GET /api/rewards - 获取所有赞赏数据
 * GET /api/rewards?limit=10 - 只获取前10条
 * GET /api/rewards?format=simple - 获取简化格式
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '0');
  const format = searchParams.get('format') || 'full';

  const { alipay, wechat, thankImage, list } = REWARDS_CONFIG;

  // 处理列表数据
  let sponsorList = [...list].reverse(); // 最新的在前
  
  if (limit > 0) {
    sponsorList = sponsorList.slice(0, limit);
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
  const totalCount = list.length;
  const totalAmount = list.reduce((sum, item) => {
    const amount = parseFloat(item.amount.replace('¥', ''));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // 简化格式
  if (format === 'simple') {
    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: {
        total: totalCount,
        totalAmount: totalAmount.toFixed(2),
        list: sponsorList.map(s => ({
          name: s.name,
          amount: s.amount,
          date: s.date,
        })),
      },
    }, { headers: corsHeaders });
  }

  // 完整格式 (默认)
  const response = {
    code: 0,
    msg: 'success',
    data: {
      total: totalCount,
      totalAmount: totalAmount.toFixed(2),
      updatedAt: new Date().toISOString(),
      payment: {
        alipay: {
          name: alipay.name,
          image: alipay.image,
        },
        wechat: {
          name: wechat.name,
          image: wechat.image,
        },
      },
      thankImage,
      list: sponsorList.map(s => ({
        name: s.name,
        avatar: s.avatar,
        website: s.website,
        date: s.date,
        amount: s.amount,
        description: s.description,
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
