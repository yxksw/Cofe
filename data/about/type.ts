// 头像数据
export interface 头像 {
    左侧: 标签[];
    头像: string;
    右侧: 标签[];
}

export interface 标签 {
    标签1: string;
    标签2: string;
    标签3: string;
    标签4: string;
}

// 个人介绍数据
export interface 我的信息 {
    标题1: string;
    标题2: string;
    博主名称: string;
    内容1: string;
    内容2: string;
    卡片: 卡片[];
}

export interface 卡片 {
    标题: string;
    内容1: string;
    内容2: string;
    显示: string;
    轮播: mask[];
}

export interface mask {
    第一: string;
    第二: string;
    第三: string;
    第四: string;
}

// 座右铭数据
export interface maxim {
    tip: string;
    标题1: string;
    标题2: string;
}

// 偏好数据
export interface technology {
    tip: string;
    标题: string;
    bottomTip: string;
}

// 游戏数据
export interface game {
    tip: string;
    标题: string;
    uid: string;
    image: string;
}

// 历程数据
export interface single {
    tip: string;
    标题: string;
    lishi: string;
    content: string;
}

// 社交数据
export interface social {
    href: string;
    class: string;
    name: string;
}
