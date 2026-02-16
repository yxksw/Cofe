// ============================================
// 打赏/赞赏数据配置
// ============================================

export interface RewardItem {
  name: string;
  avatar: string;
  website?: string;
  date: string;
  amount: string;
  description?: string;
}

export interface RewardConfig {
  alipay: {
    name: string;
    image: string;
  };
  wechat: {
    name: string;
    image: string;
  };
  thankImage: string;
  list: RewardItem[];
}

export const REWARDS_CONFIG: RewardConfig = {
  alipay: {
    name: '支付宝收款码',
    image: '/images/rewards/zhifubao.png',
  },
  wechat: {
    name: '微信收款码',
    image: '/images/rewards/weixin.png',
  },
  thankImage: '/images/rewards/thankyou.png',
  list: [
    {
      name: '示例用户',
      avatar: 'https://cn.cravatar.com/avatar/default',
      website: 'https://example.com',
      date: '2025-02-15',
      amount: '¥8.88',
      description: '感谢支持！',
    },
  ],
};
