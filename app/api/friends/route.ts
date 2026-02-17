import { FRIEND_LINKS } from '@/data/friends';
import { NextResponse } from 'next/server';

/**
 * 友链数据 API
 * 供其他博客调用获取友链列表
 * 
 * 使用方法:
 * GET /api/friends - 获取所有友链
 * GET /api/friends?format=opml - 获取 OPML 格式
 * GET /api/friends?format=json - 获取 JSON 格式 (默认)
 * GET /api/friends?recommended=true - 只获取推荐友链
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  const recommendedOnly = searchParams.get('recommended') === 'true';
  const disconnected = searchParams.get('disconnected');

  // 过滤数据
  let data = [...FRIEND_LINKS];
  
  if (recommendedOnly) {
    data = data.filter(f => f.recommended);
  }
  
  if (disconnected === 'false') {
    data = data.filter(f => !f.disconnected);
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

  // OPML 格式
  if (format === 'opml') {
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>友情链接 - 塔罗会</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <dateModified>${new Date().toUTCString()}</dateModified>
  </head>
  <body>
    <outline text="友情链接">
      ${data.map(f => `      <outline text="${f.name}" title="${f.name}" description="${f.description}" htmlUrl="${f.url}" xmlUrl="${f.url}/feed.xml" type="rss" />`).join('\n')}
    </outline>
  </body>
</opml>`;

    return new Response(opml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  }

  // JSON 格式 (默认)
  const response = {
    code: 0,
    msg: 'success',
    data: {
      total: data.length,
      updatedAt: new Date().toISOString(),
      list: data.map(f => ({
        name: f.name,
        description: f.description,
        url: f.url,
        avatar: f.avatar,
        addDate: f.addDate,
        recommended: f.recommended,
        disconnected: f.disconnected,
        status: f.status,
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
