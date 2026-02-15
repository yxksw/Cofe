// ============================================
// 友情链接配置
// ============================================

export interface FriendLink {
    name: string;
    description: string;
    url: string;
    avatar: string;
    addDate?: string;
    recommended?: boolean;
    disconnected?: boolean; // 是否失联
    responseTime?: number; // 响应时间(ms)
    lastChecked?: string; // 最后检测时间
    status?: 'ok' | 'timeout' | 'error'; // 检测状态
}

export const FRIEND_LINKS: FriendLink[] = [
    {
      name: "纸鹿摸鱼处",
      description: "纸鹿至麓不知路，支炉制露不止漉",
      url: "https://blog.zhilu.site/",
      avatar: "https://www.zhilu.site/api/avatar.png",
      addDate: "2026-02-15",
      recommended: true,
      responseTime: 903,
      lastChecked: "2026-02-15T08:30:25.159Z",
      status: "ok"
    },
    {
      name: "ATao-Blog",
      description: "做自己喜欢的事",
      url: "https://blog.atao.cyou/",
      avatar: "https://cdn.atao.cyou/Web/Avatar.png",
      addDate: "2026-02-15",
      responseTime: 1247,
      lastChecked: "2026-02-15T08:30:25.554Z",
      status: "ok"
    },
    {
      name: "清羽飞扬",
      description: "柳影曳曳，清酒孤灯，扬笔撒墨，心境如霜",
      url: "https://blog.liushen.fun",
      avatar: "https://blog.liushen.fun/info/avatar.ico",
      addDate: "2026-02-15",
      recommended: true,
      responseTime: 1174,
      lastChecked: "2026-02-15T08:30:25.481Z",
      status: "ok"
    },
    {
      name: "张洪Heo",
      description: "分享设计与科技生活",
      url: "https://blog.zhheo.com",
      avatar: "https://img.zhheo.com/i/67d8fa75943e4.webp",
      addDate: "2026-02-15",
      recommended: true,
      responseTime: 1291,
      lastChecked: "2026-02-15T08:30:25.600Z",
      status: "ok"
    },
    {
      name: "安知鱼",
      description: "生活明朗，万物可爱",
      url: "https://blog.anheyu.com/",
      avatar: "https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg",
      addDate: "2026-02-15",
      recommended: true,
      responseTime: 2362,
      lastChecked: "2026-02-15T08:30:26.672Z",
      status: "ok"
    },
    {
      name: "源境录",
      description: "凡尘修行悟道，叩问仙缘之境",
      url: "https://www.yjluo.top",
      avatar: "https://www.myxz.top/_ipx/_/avatar.avif",
      addDate: "2026-02-15",
      responseTime: 1155,
      lastChecked: "2026-02-15T08:30:26.315Z",
      status: "ok"
    },
    {
      name: "二叉树树",
      description: "Protect What You Love.",
      url: "https://2x.nz/",
      avatar: "https://q2.qlogo.cn/headimg_dl?dst_uin=2726730791&spec=0",
      addDate: "2026-02-15",
      recommended: true,
      responseTime: 703,
      lastChecked: "2026-02-15T08:30:26.184Z",
      status: "ok"
    },
    {
      name: "青序栈",
      description: "青序成栈·向简而生",
      url: "https://www.qixz.cn/",
      avatar: "https://www.qixz.cn/avatar.avif",
      addDate: "2026-02-15",
      responseTime: 1072,
      lastChecked: "2026-02-15T08:30:26.626Z",
      status: "ok"
    }
];
