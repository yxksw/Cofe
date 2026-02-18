# Cofe Blog

一个简洁优雅的博客与便签应用，让写作回归本质。

本项目灵感源自 [tinymind](https://github.com/mazzzystar/tinymind)，基于 [Cofe](https://github.com/metrue/Cofe) 进行深度定制开发。在线演示：[cofe.381359.xyz](https://cofe.381359.xyz)

---

## ✨ 核心功能

### 📝 博客系统
- **Markdown 支持** - 完整的 Markdown 语法，支持代码高亮、数学公式、图片展示
- **标签分类** - 文章支持多标签和多分类，便于内容组织
- **封面图片** - 支持自定义文章封面，提升视觉效果
- **评论集成** - 内置 Gitalk 评论系统，支持 GitHub 登录
- **文章状态** - 支持发布/草稿状态，方便内容管理

### 💭 便签系统
- **快速记录** - 随时随地记录灵感，支持地理位置标记
- **图片上传** - 支持拖拽上传图片，自动保存至图床
- **实时同步** - 数据实时同步至 GitHub，安全可靠
- **时间轴展示** - 按时间顺序展示便签，回顾生活点滴

### 🔗 友链管理
- **自动抓取** - 支持自动抓取友链站点的 favicon 和标题
- **分类展示** - 支持按分类展示友链，清晰明了
- **响应式布局** - 适配各种屏幕尺寸，展示效果优秀

### 📊 番剧追踪
- **分类管理** - 支持书籍、番剧、音乐、游戏分类
- **状态追踪** - 想看、在看、看过、搁置、抛弃多种状态
- **进度显示** - 实时显示追更进度，一目了然
- **Bangumi 集成** - 支持从 Bangumi 导入数据

### 🎨 主题定制
- **深色/浅色模式** - 支持自动切换和手动切换
- **自定义配色** - 支持自定义主题色和强调色
- **背景设置** - 支持自定义背景图片和透明度

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- GitHub 账号（用于数据存储和登录）

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/yxksw/Cofe.git
cd Cofe

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填写必要的配置信息

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`，使用 GitHub 账号登录即可开始写作。

### 一键部署

[![使用 Vercel 部署](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yxksw/Cofe)

---

## 📁 项目结构

```
Cofe/
├── app/                    # Next.js App Router
│   ├── (routes)/          # 路由组
│   ├── api/               # API 路由
│   ├── about/             # 关于页面
│   ├── blog/              # 博客列表
│   ├── bangumi/           # 番剧页面
│   ├── friends/           # 友链页面
│   └── go/                # 外链中转页
├── components/            # React 组件
│   ├── about/             # 关于页面组件
│   ├── ui/                # UI 组件
│   └── ...
├── data/                  # 数据文件
│   ├── blog/              # 博客文章（Markdown）
│   ├── memos.json         # 便签数据
│   ├── friends.json       # 友链数据
│   └── bangumi.ts         # 番剧数据
├── lib/                   # 工具函数
│   ├── types.ts           # TypeScript 类型定义
│   ├── markdown.ts        # Markdown 处理
│   └── externalLink.ts    # 外链处理
├── docs/                  # 文档
│   ├── API.md             # API 文档（中文）
│   └── API_UK.md          # API 文档（英文）
└── public/                # 静态资源
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `GITHUB_ID` | GitHub OAuth App ID | ✅ |
| `GITHUB_SECRET` | GitHub OAuth App Secret | ✅ |
| `GITHUB_USERNAME` | GitHub 用户名 | ✅ |
| `GITHUB_REPO` | 数据存储仓库名 | ✅ |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | ✅ |
| `NEXTAUTH_URL` | 网站 URL | ✅ |

### 站点配置

编辑 `data/site-config.json` 文件：

```json
{
  "title": "你的博客标题",
  "description": "博客描述",
  "author": {
    "name": "作者名",
    "bio": "个人简介",
    "location": "所在地"
  },
  "social": {
    "github": "GitHub 链接",
    "twitter": "Twitter 链接",
    "mail": "邮箱地址"
  }
}
```

---

## 🛠️ 开发指南

### 添加新页面

1. 在 `app/` 目录下创建新文件夹
2. 创建 `page.tsx` 文件
3. 添加页面组件和元数据

示例：
```tsx
// app/custom/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '自定义页面',
  description: '页面描述'
}

export default function CustomPage() {
  return (
    <div>
      <h1>自定义页面</h1>
    </div>
  )
}
```

### 自定义主题

编辑 `app/globals.css` 文件，修改 CSS 变量：

```css
:root {
  --primary: 你的主题色;
  --primary-foreground: 文字颜色;
  --background: 背景色;
  --foreground: 前景色;
}
```

---

## 📸 界面预览

### 桌面端

![首页桌面端](https://github.com/yxksw/Cofe/blob/main/assets/images/home_desktop.png?raw=true)

![博客文章页](https://github.com/yxksw/Cofe/blob/main/assets/images/blog_desktop.png?raw=true)

### 移动端

![首页移动端](https://github.com/yxksw/Cofe/blob/main/assets/images/home_mobile.png?raw=true)

---

## 🔌 API 接口

项目提供 GraphQL API 接口，详细文档请参阅：

- [API 文档（中文）](./docs/API.md)
- [API Documentation (English)](./docs/API_UK.md)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

---

## 🙏 致谢

感谢以下开源项目的支持：

- [tinymind](https://github.com/mazzzystar/tinymind) - 灵感来源
- [Cofe](https://github.com/metrue/Cofe) - 基础框架
- [Fuwari](https://github.com/afoim/fuwari) - 组件参考
- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

## 📮 联系我们

如有问题或建议，欢迎通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/yxksw/Cofe/issues)
- 邮箱: yxksw@foxmail.com
