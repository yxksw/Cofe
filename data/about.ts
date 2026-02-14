export interface aboutConnect {
    author: author[];
    large: string;
    myinfo: myinfo[];
    hello: string;
    maxim: maxim[];
    technology: technology[];
    game: game[];
    single: single[];
    social: social[];
}

export interface author {
    left: left[];
    logo: string;
    right: right[];
}

export interface left {
    tag1: string;
    tag2: string;
    tag3: string;
    tag4: string;
}

export interface right {
    tag1: string;
    tag2: string;
    tag3: string;
    tag4: string;
}

export interface myinfo {
    title1: string;
    title2: string;
    inlineword1: string;
    title3: string;
    inlineword2: string;
    card: card[];
}

export interface card {
    tips: string;
    conect1: string;
    conect2: string;
    inlineword: string;
    mask: mask[];
}

export interface mask {
    firstTips: string;
    span: string;
    up: string;
    show: string;
}

export interface maxim {
    tip: string;
    title1: string;
    title2: string;
}

export interface technology {
    tip: string;
    title: string;
    bottomTip: string;
}

export interface game {
    tip: string;
    title: string;
    uid: string;
    image: string;
}

export interface single {
    tip: string;
    title: string;
    lishi: string;
    content: string;
}

export interface social {
    href: string;
    class: string;
    name: string;
}

export const about: aboutConnect[] = [
    {
        author: [
            {
                left: [{
                    tag1: "💻 博客魔改",
                    tag2: "📝 记录生活",
                    tag3: "🕊 资源分享",
                    tag4: "🧱 踩坑经历"
                }],
                logo: "https://cn.cravatar.com/avatar/eb7277a11fa4dc00606e73afda41aeeb?=256",
                right: [{
                    tag1: "社恐内向不说话 💤",
                    tag2: "活到老学到老 🤝",
                    tag3: "小说狂热爱好者 🔨",
                    tag4: "只会CTRL CV 💢"
                }]
            }
        ],
        large: "关于本站",
        myinfo: [{
            title1: "你好，很高兴认识你👋",
            title2: "我叫",
            inlineword1: "异飨客",
            title3: "是一名 博客写作者者、学生、",
            inlineword2: "博主",
            card: [{
                tips: "追求",
                conect1: "源于",
                conect2: "热爱而去",
                inlineword: "感受",
                mask: [{
                    firstTips: "学习",
                    span: "生活",
                    up: "程序",
                    show: "体验"
                }]
            }]
        }],
        hello: "YXK's BLOG",
        social: [
            { href: "https://github.com/yxksw", class: "mdi:github", name: "Github" },
            { href: "", class: "mdi:twitter", name: "Twitter" }
        ],
        maxim: [{
            tip: "座右铭",
            title1: "每一段旅行，",
            title2: "都有终点。",
        }],
        technology: [{
            tip: "关注偏好",
            title: "单机游戏",
            bottomTip: "博客写作、小说阅读"
        }],
        game: [{
            tip: "爱好游戏",
            title: "游戏",
            uid: "",
            image: ""
        }],
        single: [{
            tip: "建站历程",
            title: "怎么魔改",
            lishi: "『塔罗会』历史进程",
            content: "『塔罗会』是一个记录技术与生活的个人博客，集成了文章、动态、友链等功能。"
        }]
    }
]
