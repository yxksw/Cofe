import type { BangumiCollectionItem, ContentType, CollectionType } from '@/types/bangumi'

// 扩展接口，添加分类和收藏类型
export interface BangumiItem extends BangumiCollectionItem {
  contentType: ContentType
  collectionType: CollectionType
}

// 示例番剧数据 - 包含不同类型的内容
export const mockBangumiData: BangumiItem[] = [
  // 书籍 - 看过
  {
    subject_id: 1,
    subject: {
      id: 290411,
      name: 'Lord of Mysteries',
      name_cn: '诡秘之主',
      short_summary: '蒸汽与机械的浪潮中，谁能触及非凡？历史和黑暗的迷雾里，又是谁在耳语？我从诡秘中醒来，睁眼看见这个世界：枪械，大炮，巨舰，飞空艇，差分机；魔药，占卜，诅咒，倒吊人，封印物……光明依旧照耀，神秘从未远离，这是一段"愚者"的传说。',
      score: 8.0,
      eps: 13,
      images: {
        common: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-book.avif',
        large: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-book.avif',
        medium: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-book.avif',
        small: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-book.avif',
        grid: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-book.avif',
      },
      tags: [
        { name: '悬疑', count: 99 },
        { name: '奇幻', count: 154 },
        { name: '小说', count: 66 },
        { name: '冒险', count: 63 },
      ],
    },
    rate: 10,
    ep_status: 13,
    updated_at: '2025-06-28',
    contentType: 'book',
    collectionType: 'collect',
  },
  // 书籍 - 想看
  {
    subject_id: 2,
    subject: {
      id: 9585,
      name: 'The Three-Body Problem',
      name_cn: '三体',
      short_summary: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。但在按下发射键的那一刻，历经劫难的叶文洁没有意识到，她彻底改变了人类的命运。',
      score: 8.4,
      eps: 3,
      images: {
        common: 'https://lain.bgm.tv/r/400/pic/cover/l/da/52/9585_ZhcrW.jpg',
        large: 'https://lain.bgm.tv/r/400/pic/cover/l/da/52/9585_ZhcrW.jpg',
        medium: 'https://lain.bgm.tv/r/400/pic/cover/l/da/52/9585_ZhcrW.jpg',
        small: 'https://lain.bgm.tv/r/400/pic/cover/l/da/52/9585_ZhcrW.jpg',
        grid: 'https://lain.bgm.tv/r/400/pic/cover/l/da/52/9585_ZhcrW.jpg',
      },
      tags: [
        { name: '科幻', count: 2345 },
        { name: '刘慈欣', count: 1234 },
        { name: '雨果奖', count: 567 },
        { name: '硬科幻', count: 432 },
      ],
    },
    rate: 0,
    ep_status: 0,
    updated_at: '2025-07-15',
    contentType: 'book',
    collectionType: 'collect',
  },
  // 番剧 - 在看
  {
    subject_id: 3,
    subject: {
      id: 345824,
      name: 'Lord of Mysteries',
      name_cn: '诡秘之主 小丑篇',
      short_summary: '蒸汽与机械的浪潮中，谁能触及非凡？历史和黑暗的迷雾里，又是谁在耳语？我从诡秘中醒来，睁眼看见这个世界：枪械，大炮，巨舰，飞空艇，差分机；魔药，占卜，诅咒，倒吊人，封印物……光明依旧照耀，神秘从未远离，这是一段“愚者”的传说。',
      score: 6.7,
      eps: 13,
      images: {
        common: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-bangumi.avif',
        large: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-bangumi.avif',
        medium: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-bangumi.avif',
        small: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-bangumi.avif',
        grid: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzz-bangumi.avif',
      },
      tags: [
        { name: '悬疑', count: 99 },
        { name: '奇幻', count: 154 },
        { name: '小说改', count: 103 },
        { name: '冒险', count: 63 },
      ],
    },
    rate: 13,
    ep_status: 13,
    updated_at: '2025-06-28',
    contentType: 'anime',
    collectionType: 'collect',
  },
  // 番剧 - 看过
  {
    subject_id: 4,
    subject: {
      id: 55770,
      name: '進撃の巨人',
      name_cn: '进击的巨人',
      short_summary: '107年前（743年），世界上突然出现了人类的天敌"巨人"。面临着生存危机而残存下来的人类逃到了一个地方，盖起了三重巨大的城墙。',
      score: 8.9,
      eps: 25,
      images: {
        common: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/jjdjr-bangumi.avif',
        large: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/jjdjr-bangumi.avif',
        medium: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/jjdjr-bangumi.avif',
        small: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/jjdjr-bangumi.avif',
        grid: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/jjdjr-bangumi.avif',
      },
      tags: [
        { name: '热血', count: 2345 },
        { name: '战斗', count: 1234 },
        { name: '悬疑', count: 890 },
        { name: '神作', count: 567 },
      ],
    },
    rate: 10,
    ep_status: 25,
    updated_at: '2025-06-15',
    contentType: 'anime',
    collectionType: 'collect',
  },
  // 番剧 - 想看
  {
    subject_id: 5,
    subject: {
      id: 245665,
      name: '鬼滅の刃',
      name_cn: '鬼灭之刃',
      short_summary: '大正时期，日本。心地善良的卖炭少年·炭治郎，有一天他的家人被鬼杀死了。而唯一幸存下来的妹妹——祢豆子变成了鬼。',
      score: 8.5,
      eps: 26,
      images: {
        common: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzr-bangumi.avif',
        large: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzr-bangumi.avif',
        medium: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzr-bangumi.avif',
        small: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzr-bangumi.avif',
        grid: 'https://cdn.jsdmirror.com/gh/zsxcoder/github-img@main/img/gmzr-bangumi.avif',
      },
      tags: [
        { name: '热血', count: 3456 },
        { name: '战斗', count: 2345 },
        { name: '奇幻', count: 1234 },
        { name: 'ufotable', count: 567 },
      ],
    },
    rate: 0,
    ep_status: 0,
    updated_at: '2025-07-25',
    contentType: 'anime',
    collectionType: 'wish',
  },
  // 游戏 - 在看（玩）
  {
    subject_id: 6,
    subject: {
      id: 12596,
      name: 'mc',
      name_cn: '我的世界',
      short_summary: '探索随机生成的世界，建造从最简单的住宅到最宏伟的城堡等一切不可思议之物。您可以在创造模式中享用无限资源，也可以在生存模式中挖掘整个世界，合成武器和盔甲，抵御各种危险生物。攀登崎岖的群山，探明复杂的洞穴，挖掘大型矿脉。探索错综的洞穴与石笋洞穴生物群系。用蜡烛照亮世界，展示出自己作为知识渊博的地下冒险者和登山大师的风采！',
      score: 7.8,
      eps: 0,
      images: {
        common: 'https://lain.bgm.tv/r/400/pic/cover/l/ca/a0/12596_8YuNn.jpg',
        large: 'https://lain.bgm.tv/r/400/pic/cover/l/ca/a0/12596_8YuNn.jpg',
        medium: 'https://lain.bgm.tv/r/400/pic/cover/l/ca/a0/12596_8YuNn.jpg',
        small: 'https://lain.bgm.tv/r/400/pic/cover/l/ca/a0/12596_8YuNn.jpg',
        grid: 'https://lain.bgm.tv/r/400/pic/cover/l/ca/a0/12596_8YuNn.jpg',
      },
      tags: [
        { name: '开放世界', count: 23 },
        { name: '我的世界', count: 621 },
        { name: '自由度', count: 800 },
        { name: 'Minecraft', count: 1030 },
      ],
    },
    rate: 8,
    ep_status: 0,
    updated_at: '2026-01-20',
    contentType: 'game',
    collectionType: 'do',
    url: 'https://www.minecraft.net/zh-hans', // 自定义跳转链接
  },
  // 游戏 - 看过（玩过）
  {
    subject_id: 7,
    subject: {
      id: 138967,
      name: '饥荒',
      name_cn: '饥荒',
      short_summary: 'Don\'t Starve Together is the standalone multiplayer expansion of the uncompromising survival game Don\'t Starve.',
      score: 9.0,
      eps: 0,
      images: {
        common: 'https://lain.bgm.tv/r/400/pic/cover/l/87/ff/138967_MZv3V.jpg',
        large: 'https://lain.bgm.tv/r/400/pic/cover/l/87/ff/138967_MZv3V.jpg',
        medium: 'https://lain.bgm.tv/r/400/pic/cover/l/87/ff/138967_MZv3V.jpg',
        small: 'https://lain.bgm.tv/r/400/pic/cover/l/87/ff/138967_MZv3V.jpg',
        grid: 'https://lain.bgm.tv/r/400/pic/cover/l/87/ff/138967_MZv3V.jpg',
      },
      tags: [
        { name: '沙盒', count: 217 },
        { name: '生存', count: 208 },
        { name: '独立游戏', count: 93 },
        { name: 'Klei', count: 72 },
      ],
    },
    rate: 10,
    ep_status: 0,
    updated_at: '2024-05-20',
    contentType: 'game',
    collectionType: 'collect',
  },
  {
    subject_id: 10,
    subject: {
      id: 17852,
      name: 'Terraria',
      name_cn: '泰拉瑞亚',
      short_summary: '挖掘，战斗，探索，制作！在这个一切皆有可能的冒险游戏中，游戏世界是你的画布地面本身就是你的染料。',
      score: 8.3,
      eps: 0,
      images: {
        common: 'https://lain.bgm.tv/r/400/pic/cover/l/59/ee/17852_7H99Q.jpg',
        large: 'https://lain.bgm.tv/r/400/pic/cover/l/59/ee/17852_7H99Q.jpg',
        medium: 'https://lain.bgm.tv/r/400/pic/cover/l/59/ee/17852_7H99Q.jpg',
        small: 'https://lain.bgm.tv/r/400/pic/cover/l/59/ee/17852_7H99Q.jpg',
        grid: 'https://lain.bgm.tv/r/400/pic/cover/l/59/ee/17852_7H99Q.jpg',
      },
      tags: [
        { name: '沙盒', count: 592 },
        { name: '独立游戏', count: 328 },
        { name: '像素', count: 395 },
        { name: '2D', count: 300 },
      ],
    },
    rate: 10,
    ep_status: 0,
    updated_at: '2023-07-20',
    contentType: 'game',
    collectionType: 'collect',
  },
  // 音乐 - 在看（听）
  {
    subject_id: 8,
    subject: {
      id: 118784,
      name: '吹梦到西洲',
      name_cn: '吹梦到西洲',
      short_summary: '恋恋故人难 / 黄诗扶 / 王敬轩（妖扬）',
      score: 8.5,
      eps: 0,
      images: {
        common: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
        large: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
        medium: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
        small: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
        grid: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
      },
      tags: [
        { name: '古风', count: 567 },
        { name: '国风', count: 432 },
      ],
    },
    rate: 9,
    ep_status: 0,
    updated_at: '2026-02-11',
    contentType: 'music',
    collectionType: 'do',
    url: 'https://music.163.com/#/song?id=1376873330',
  },
  // 音乐 - 听过
  {
    subject_id: 9,
    subject: {
      id: 118785,
      name: '一句话形容不了终极笔记',
      name_cn: '一句话形容不了终极笔记',
      short_summary: '应有棠 / 御A桑 / 灬阿楚灬 / 绯言 / 小山xl / 霄镁 / 堇墨安歌 / 天罗 / 叶落梦中 / 烫不直的自然卷',
      score: 9.0,
      eps: 0,
      images: {
        common: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
        large: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
        medium: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
        small: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
        grid: 'https://p2.music.126.net/XE1XFkkDYrEW_eXFFlsSYQ==/109951164202821890.jpg?param=130y130',
      },
      tags: [
        { name: '盗墓笔记', count: 890 },
        { name: '国风', count: 567 },
      ],
    },
    rate: 0,
    ep_status: 0,
    updated_at: '2022-09-10',
    contentType: 'music',
    collectionType: 'collect',
    url: 'https://music.163.com/#/song?id=1957502053',
  },
]

// 按分类和收藏类型过滤数据
export function filterBangumiData(
  contentType: ContentType,
  collectionType: CollectionType
): BangumiItem[] {
  return mockBangumiData.filter(
    (item) =>
      item.contentType === contentType && item.collectionType === collectionType
  )
}

// 获取指定分类的总数
export function getCountByContentType(contentType: ContentType): number {
  return mockBangumiData.filter((item) => item.contentType === contentType).length
}

// 获取指定收藏类型的总数
export function getCountByCollectionType(
  contentType: ContentType,
  collectionType: CollectionType
): number {
  return mockBangumiData.filter(
    (item) =>
      item.contentType === contentType && item.collectionType === collectionType
  ).length
}

// 获取总数
export function getTotalCount(): number {
  return mockBangumiData.length
}
