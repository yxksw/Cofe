# Cofe Blog

A beautifully simple blog and memo application that brings writing back to its essence.

This project is inspired by [tinymind](https://github.com/mazzzystar/tinymind) and built upon [Cofe](https://github.com/metrue/Cofe) with extensive customization. Live demo: [cofe.381359.xyz](https://cofe.381359.xyz)

---

## ✨ Core Features

### 📝 Blog System
- **Markdown Support** - Full Markdown syntax with code highlighting, math formulas, and image display
- **Tags & Categories** - Multi-tag and multi-category support for content organization
- **Cover Images** - Custom article covers for enhanced visual appeal
- **Comment Integration** - Built-in Gitalk comment system with GitHub login
- **Article Status** - Published/Draft states for content management

### 💭 Memo System
- **Quick Notes** - Capture ideas anytime, anywhere with location tagging
- **Image Upload** - Drag-and-drop image upload with automatic hosting
- **Real-time Sync** - Data syncs to GitHub in real-time, safe and reliable
- **Timeline View** - Display memos chronologically to revisit life moments

### 🔗 Friends Link Management
- **Auto Fetch** - Automatically fetch favicon and title from friend sites
- **Categorized Display** - Display links by category for clarity
- **Responsive Layout** - Adapts to all screen sizes with excellent presentation

### 📊 Anime Tracking
- **Category Management** - Support for Books, Anime, Music, and Games
- **Status Tracking** - Want to watch, Watching, Watched, On Hold, Dropped
- **Progress Display** - Real-time progress tracking at a glance
- **Bangumi Integration** - Import data from Bangumi

### 🎨 Theme Customization
- **Dark/Light Mode** - Auto-switching and manual switching support
- **Custom Colors** - Customize theme colors and accent colors
- **Background Settings** - Custom background images and opacity

---

## 🚀 Quick Start

### Requirements
- Node.js 18+
- GitHub account (for data storage and login)

### Installation

```bash
# Clone the repository
git clone https://github.com/yxksw/Cofe.git
cd Cofe

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Visit `http://localhost:3000`, sign in with GitHub, and start writing.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yxksw/Cofe)

---

## 📁 Project Structure

```
Cofe/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Route groups
│   ├── api/               # API routes
│   ├── about/             # About page
│   ├── blog/              # Blog list
│   ├── bangumi/           # Anime page
│   ├── friends/           # Friends page
│   └── go/                # External link redirect
├── components/            # React components
│   ├── about/             # About page components
│   ├── ui/                # UI components
│   └── ...
├── data/                  # Data files
│   ├── blog/              # Blog posts (Markdown)
│   ├── memos.json         # Memo data
│   ├── friends.json       # Friends data
│   └── bangumi.ts         # Anime data
├── lib/                   # Utility functions
│   ├── types.ts           # TypeScript type definitions
│   ├── markdown.ts        # Markdown processing
│   └── externalLink.ts    # External link handling
├── docs/                  # Documentation
│   ├── API.md             # API docs (Chinese)
│   └── API_UK.md          # API docs (English)
└── public/                # Static assets
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_ID` | GitHub OAuth App ID | ✅ |
| `GITHUB_SECRET` | GitHub OAuth App Secret | ✅ |
| `GITHUB_USERNAME` | GitHub username | ✅ |
| `GITHUB_REPO` | Data storage repository name | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ |
| `NEXTAUTH_URL` | Website URL | ✅ |

### Site Configuration

Edit `data/site-config.json`:

```json
{
  "title": "Your Blog Title",
  "description": "Blog description",
  "author": {
    "name": "Author Name",
    "bio": "Personal bio",
    "location": "Location"
  },
  "social": {
    "github": "GitHub link",
    "twitter": "Twitter link",
    "mail": "Email address"
  }
}
```

---

## 🛠️ Development Guide

### Adding a New Page

1. Create a new folder in `app/`
2. Create `page.tsx` file
3. Add page component and metadata

Example:
```tsx
// app/custom/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custom Page',
  description: 'Page description'
}

export default function CustomPage() {
  return (
    <div>
      <h1>Custom Page</h1>
    </div>
  )
}
```

### Customizing Theme

Edit `app/globals.css` and modify CSS variables:

```css
:root {
  --primary: your-theme-color;
  --primary-foreground: text-color;
  --background: background-color;
  --foreground: foreground-color;
}
```

---

## 📸 Screenshots

### Desktop

![Home Desktop](https://github.com/yxksw/Cofe/blob/main/assets/images/home_desktop.png?raw=true)

![Blog Post](https://github.com/yxksw/Cofe/blob/main/assets/images/blog_desktop.png?raw=true)

### Mobile

![Home Mobile](https://github.com/yxksw/Cofe/blob/main/assets/images/home_mobile.png?raw=true)

---

## 🔌 API

The project provides GraphQL API endpoints. For detailed documentation:

- [API Documentation (Chinese)](./docs/API.md)
- [API Documentation (English)](./docs/API_UK.md)

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open-sourced under the [MIT](LICENSE) license.

---

## 🙏 Acknowledgments

Thanks to these open-source projects:

- [tinymind](https://github.com/mazzzystar/tinymind) - Inspiration
- [Cofe](https://github.com/metrue/Cofe) - Base framework
- [Fuwari](https://github.com/afoim/fuwari) - Component reference
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

## 📮 Contact

For questions or suggestions:

- GitHub Issues: [Submit Issue](https://github.com/yxksw/Cofe/issues)
- Email: 3813596020@qq.com
