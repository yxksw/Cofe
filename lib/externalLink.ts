// 外链白名单配置
// 这些域名不会被拦截，直接在新窗口打开
export const WHITELIST_DOMAINS = [
  'github.com',
  'github.io',
  'vercel.app',
  'vercel.com',
  'npmjs.com',
  'npm.dev',
  'jsdelivr.net',
  'jsdelivr.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'api.bilibili.com',
  'bilibili.com',
  'bgm.tv',
  'bangumi.tv',
  'mijisou.com',
]

// 外链黑名单配置
// 这些域名会被完全拦截，无法访问
export const BLACKLIST_DOMAINS = [
  // 可以添加需要完全拦截的域名
]

/**
 * 检查 URL 是否为外部链接
 */
export function isExternalLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // 如果是相对路径或同源链接，不是外部链接
    if (!urlObj.hostname || urlObj.hostname === window.location.hostname) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查 URL 是否在白名单中
 */
export function isWhitelisted(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return WHITELIST_DOMAINS.some((domain) => {
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
}

/**
 * 检查 URL 是否在黑名单中
 */
export function isBlacklisted(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return BLACKLIST_DOMAINS.some((domain) => {
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    return false;
  }
}

/**
 * 获取处理后的链接
 * - 白名单：直接返回原链接
 * - 黑名单：返回 null
 * - 普通外链：返回中转页链接
 */
export function processExternalLink(url: string): string | null {
  // 先检查是否为外部链接
  if (!isExternalLink(url)) {
    return url;
  }
  
  // 检查白名单
  if (isWhitelisted(url)) {
    return url;
  }
  
  // 检查黑名单
  if (isBlacklisted(url)) {
    return null;
  }
  
  // 普通外链，返回中转页链接
  // 使用 Base64 编码目标 URL
  const encodedUrl = btoa(url);
  return `/go?u=${encodedUrl}`;
}
