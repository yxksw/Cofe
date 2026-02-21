import { NextResponse } from 'next/server';

/**
 * 友链数据 API
 * 从远程数据源获取友链列表
 * 
 * 使用方法:
 * GET /api/friends - 获取所有友链
 * GET /api/friends?format=opml - 获取 OPML 格式
 * GET /api/friends?recommended=true - 只获取推荐友链
 */

// 远程友链数据源
const REMOTE_FRIENDS_URL = 'https://friends.152531.xyz/data/friends.ts';

// 解析 TypeScript 数据文件
async function fetchRemoteFriends(): Promise<Array<{
  name: string;
  description: string;
  url: string;
  avatar: string;
  addDate?: string;
  recommended?: boolean;
  disconnected?: boolean;
}>> {
  const response = await fetch(REMOTE_FRIENDS_URL, {
    next: { revalidate: 3600 }, // 缓存1小时
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch remote friends data');
  }
  
  const text = await response.text();
  
  // 提取 FRIEND_LINKS 数组
  const match = text.match(/export const FRIEND_LINKS: FriendLink\[\] = ([\s\S]*?);\s*$/);
  if (!match) {
    throw new Error('Failed to parse friends data');
  }
  
  // 使用正则提取每个对象
  const arrayContent = match[1];
  const objects: Array<{
    name: string;
    description: string;
    url: string;
    avatar: string;
    addDate?: string;
    recommended?: boolean;
    disconnected?: boolean;
  }> = [];
  
  // 匹配每个友链对象
  const objectRegex = /\{\s*name:\s*"([^"]+)"\s*,\s*description:\s*"([^"]*)"\s*,\s*url:\s*"([^"]+)"\s*,\s*avatar:\s*"([^"]+)"([^}]*)\}/g;
  
  let objMatch;
  while ((objMatch = objectRegex.exec(arrayContent)) !== null) {
    const [, name, description, url, avatar, rest] = objMatch;
    
    const obj: {
      name: string;
      description: string;
      url: string;
      avatar: string;
      addDate?: string;
      recommended?: boolean;
      disconnected?: boolean;
    } = {
      name,
      description,
      url,
      avatar,
    };
    
    // 解析可选字段
    const addDateMatch = rest.match(/addDate:\s*"([^"]+)"/);
    if (addDateMatch) obj.addDate = addDateMatch[1];
    
    if (rest.includes('recommended:')) {
      obj.recommended = rest.includes('recommended: true');
    }
    
    if (rest.includes('disconnected:')) {
      obj.disconnected = rest.includes('disconnected: true');
    }
    
    objects.push(obj);
  }
  
  return objects;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  const recommendedOnly = searchParams.get('recommended') === 'true';

  // CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600',
  };

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 获取远程数据
    let data = await fetchRemoteFriends();
    
    // 过滤数据
    if (recommendedOnly) {
      data = data.filter(f => f.recommended);
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
        list: data,
      },
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Failed to fetch friends:', error);
    return NextResponse.json(
      { code: 1, msg: 'Failed to fetch friends data', data: null },
      { status: 500, headers: corsHeaders }
    );
  }
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
