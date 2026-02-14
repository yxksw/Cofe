export interface DeviceItem {
  name: string
  category: '生产力' | '出行'
  categoryColor?: '#3af' | '#3ba'
  desc: string
  info?: Record<string, string>
  tag?: string[]
  image?: string
  date?: string
  src?: string
  money?: number
}

export const devices: DeviceItem[] = [
  {
    name: '机械革命2022极光PRO',
    image: 'https://2a.zol-img.com.cn/product/221_320x240/370/ce1OZQFMgDuf.jpg',
    src: 'https://www.mechrevo.com/cn/series/game',
    category: '生产力',
    desc: '虽然是游戏本，但我本来也不玩什么高配置的游戏，所以现在也能用，大问题其实没什么，没网上那么折腾，但也不算小白很舒服的那种，也还行。',
    info: {
      芯片: 'Intel Core i7-12700H',
      内存: '16G LPDDR4 3200MHz',
      显卡: 'NVIDIA GeForce RTX 3060',
      存储: '512G PCIE4 SSD',
      机器版本: '基础版',
      机器颜色: '黑色',
    },
    tag: ['游戏本', '机械革命'],
    date: '2022-06-15',
    money: 7499,
  },
  {
    name: 'IQOO 11',
    image: 'https://shopstatic.vivo.com.cn/vivoshop/commodity/52/10007952_1669636269985_750x750.png.webp',
    src: 'https://shop.vivo.com.cn/product/10007952?skuId=125337',
    category: '生产力',
    desc: 'iQOO 11 高中毕业后的手机，其实不大玩手机游戏，正常使用没问题，要说问题，耗电其实不算很友好，但还能接受，相机不怎么样，但我本身不算喜欢拍照的，一般。',
    info: {
      芯片: '骁龙 8 Gen 2',
      内存: '16GB + 512GB',
      电池容量: '5000mAh',
      存储: '512G',
      机器版本: '主流旗舰版',
      机器颜色: '黑色',
    },
    tag: ['性价比', 'IQOO'],
    date: '2023-06-15',
    money: 4399,
  },
  {
    name: '罗技G502hero',
    image: 'https://resource.logitechg.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/gaming/en/non-braid/hyjal-g502-hero/2025/g502-hero-mouse-top-angle-gallery-1.png',
    src: 'https://www.logitechg.com/zh-cn/shop/p/g502-hero-gaming-mouse',
    category: '生产力',
    desc: '比较好的有线鼠标，由于我不打竞技类游戏，单纯独立、单机游戏效果不错。',
    info: {
      传感器: '光学传感器',
      DPI: '200~25600',
      连接方式: '有线USB 2.0',
      机器版本: '电竞版',
      机器颜色: '黑色',
    },
    tag: ['电竞鼠标', '罗技'],
    date: '2025-02-22',
    money: 209,
    },
  {
    name: '西伯利亚s21头戴式耳机',
    image: 'https://27450057.s21i.faiusr.com/2/ABUIABACGAAgsf3NtwYo4KunuAMwoAY4oAY.jpg.webp',
    src: 'https://www.xiberia.net/h-pd-138.html',
    category: '生产力',
    desc: '有一说一，不算好评的耳机，初代会有个问题，就是不调声音只有一边听得见，忽略这个还行。',
    info: {
      特色: '飞翼式双悬浮头梁',
      续航: '149小时',
      连接方式: '四模传输',
      机器版本: 'S21GS',
      耳机颜色: '火焰风暴',
    },
    tag: ['耳机', '头戴式'],
    date: '2024-05-22',
    money: 409,
  },
  {
    name: 'IQOO tws 1e',
    image: 'https://shopstatic.vivo.com.cn/vivoshop/commodity/86/10009286_1702631065572_750x750.png.webp',
    src: 'https://shop.vivo.com.cn/product/10009286?skuId=130649',
    category: '出行',
    desc: '一款高性价比真无线降噪耳机，使用体验不错。基于我是iqoo手机，所以好评。',
    info: {
      音效: 'DeepX 3.0 立体声效、3D 全景⾳频、Monster Sound 电竞声效',
      蓝牙版本: '蓝牙5.3',
      降噪能力: '智能主动降噪、AI 通话降噪',
      续航: '开启降噪：单耳机最长 9 小时，整机最长 36 小时 ；关闭降噪：单耳机最长 11 小时，整机最长 44 小时',
      发声单元: '11mm 动圈声音单元',
      耳机颜色: '星珠黄',
    },
    tag: ['IQOO', '智能降噪'],
    date: '2024-02-08',
    money: 149,
  },
]
