function loadResource(type, attributes) {
    if (type === 'style') {
        const style = document.createElement('style');
        style.textContent = attributes.css;
        document.head.appendChild(style);
    }
}

function createTOC() {
    // 检查是否已存在目录
    if (document.querySelector('.toc-container')) return;
    
    const contentContainer = document.querySelector('.markdown-body');
    if (!contentContainer) return;

    const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;

    // 为标题添加 ID
    headings.forEach(heading => {
        if (!heading.id) {
            heading.id = heading.textContent.trim().replace(/\s+/g, '-').toLowerCase();
        }
    });

    // 创建目录容器
    const tocContainer = document.createElement('div');
    tocContainer.className = 'toc-container';
    
    // 创建悬浮按钮
    const tocButton = document.createElement('button');
    tocButton.className = 'toc-button';
    tocButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
    `;
    tocButton.title = '文章目录';

    // 创建目录面板
    const tocPanel = document.createElement('div');
    tocPanel.className = 'toc-panel';
    
    // 目录标题
    const tocHeader = document.createElement('div');
    tocHeader.className = 'toc-header';
    tocHeader.innerHTML = `
        <span class="toc-title">目录</span>
        <button class="toc-close" title="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    tocPanel.appendChild(tocHeader);

    // 目录内容
    const tocContent = document.createElement('div');
    tocContent.className = 'toc-content';

    // 构建目录树结构
    const tocList = document.createElement('div');
    tocList.className = 'toc-list';

    let currentLevel = 0;
    const stack = [tocList];

    headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));
        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.className = 'toc-link';
        link.textContent = heading.textContent;
        link.dataset.level = level;

        // 平滑滚动
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(heading.id);
            if (target) {
                const offset = 80; // 顶部偏移量
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 关闭目录面板
                tocPanel.classList.remove('show');
                tocButton.classList.remove('active');
                
                // 更新活动状态
                document.querySelectorAll('.toc-link.active').forEach(el => el.classList.remove('active'));
                link.classList.add('active');
            }
        });

        // 处理层级
        if (level > currentLevel) {
            const nestedList = document.createElement('div');
            nestedList.className = 'toc-nested';
            stack[stack.length - 1].appendChild(link);
        } else if (level < currentLevel) {
            const diff = currentLevel - level;
            for (let i = 0; i < diff && stack.length > 1; i++) {
                stack.pop();
            }
            stack[stack.length - 1].appendChild(link);
        } else {
            stack[stack.length - 1].appendChild(link);
        }

        currentLevel = level;
    });

    tocContent.appendChild(tocList);
    tocPanel.appendChild(tocContent);

    // 组装
    tocContainer.appendChild(tocButton);
    tocContainer.appendChild(tocPanel);
    document.body.appendChild(tocContainer);

    // 按钮点击事件
    tocButton.addEventListener('click', (e) => {
        e.stopPropagation();
        tocPanel.classList.toggle('show');
        tocButton.classList.toggle('active');
    });

    // 关闭按钮点击事件
    const closeBtn = tocHeader.querySelector('.toc-close');
    closeBtn.addEventListener('click', () => {
        tocPanel.classList.remove('show');
        tocButton.classList.remove('active');
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!tocContainer.contains(e.target)) {
            tocPanel.classList.remove('show');
            tocButton.classList.remove('active');
        }
    });

    // 滚动时高亮当前标题
    const observerOptions = {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                document.querySelectorAll('.toc-link.active').forEach(el => el.classList.remove('active'));
                const activeLink = tocContent.querySelector(`a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    headings.forEach(heading => observer.observe(heading));
}

// 加载样式
function loadStyles() {
    const css = `
        /* 目录容器 */
        .toc-container {
            position: fixed;
            bottom: 100px;
            right: 24px;
            z-index: 999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        /* 悬浮按钮 */
        .toc-button {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: hsl(var(--foreground));
            transition: all 0.3s ease;
        }

        .toc-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            background: hsl(var(--accent));
        }

        .toc-button.active {
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            transform: scale(1.05);
        }

        /* 目录面板 */
        .toc-panel {
            position: absolute;
            bottom: 60px;
            right: 0;
            width: 280px;
            max-height: 60vh;
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .toc-panel.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }

        /* 目录头部 */
        .toc-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid hsl(var(--border));
            background: hsl(var(--muted) / 0.5);
        }

        .toc-title {
            font-size: 14px;
            font-weight: 600;
            color: hsl(var(--foreground));
        }

        .toc-close {
            background: none;
            border: none;
            cursor: pointer;
            color: hsl(var(--muted-foreground));
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .toc-close:hover {
            background: hsl(var(--muted));
            color: hsl(var(--foreground));
        }

        /* 目录内容 */
        .toc-content {
            flex: 1;
            overflow-y: auto;
            padding: 8px 0;
        }

        .toc-content::-webkit-scrollbar {
            width: 4px;
        }

        .toc-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .toc-content::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 2px;
        }

        .toc-content::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
        }

        /* 目录列表 */
        .toc-list {
            display: flex;
            flex-direction: column;
        }

        .toc-nested {
            display: flex;
            flex-direction: column;
        }

        /* 目录链接 */
        .toc-link {
            display: block;
            padding: 8px 16px;
            color: hsl(var(--foreground) / 0.8);
            text-decoration: none;
            font-size: 13px;
            line-height: 1.5;
            transition: all 0.2s ease;
            border-left: 2px solid transparent;
            position: relative;
        }

        .toc-link[data-level="1"] { padding-left: 16px; font-weight: 500; }
        .toc-link[data-level="2"] { padding-left: 28px; }
        .toc-link[data-level="3"] { padding-left: 40px; font-size: 12px; }
        .toc-link[data-level="4"] { padding-left: 52px; font-size: 12px; }
        .toc-link[data-level="5"] { padding-left: 64px; font-size: 12px; color: hsl(var(--foreground) / 0.6); }
        .toc-link[data-level="6"] { padding-left: 76px; font-size: 12px; color: hsl(var(--foreground) / 0.6); }

        .toc-link:hover {
            background: hsl(var(--accent) / 0.5);
            color: hsl(var(--foreground));
            border-left-color: hsl(var(--primary) / 0.5);
        }

        .toc-link.active {
            background: hsl(var(--primary) / 0.1);
            color: hsl(var(--primary));
            border-left-color: hsl(var(--primary));
            font-weight: 500;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
            .toc-container {
                bottom: 80px;
                right: 16px;
            }

            .toc-button {
                width: 44px;
                height: 44px;
            }

            .toc-panel {
                position: fixed;
                bottom: 0;
                right: 0;
                left: 0;
                width: 100%;
                max-height: 50vh;
                border-radius: 16px 16px 0 0;
                transform: translateY(100%);
            }

            .toc-panel.show {
                transform: translateY(0);
            }

            .toc-header {
                padding: 16px;
            }

            .toc-title {
                font-size: 16px;
            }

            .toc-link {
                padding: 12px 16px;
                font-size: 14px;
            }

            .toc-link[data-level="1"] { padding-left: 16px; }
            .toc-link[data-level="2"] { padding-left: 32px; }
            .toc-link[data-level="3"] { padding-left: 48px; font-size: 13px; }
            .toc-link[data-level="4"] { padding-left: 64px; font-size: 13px; }
            .toc-link[data-level="5"] { padding-left: 80px; font-size: 13px; }
            .toc-link[data-level="6"] { padding-left: 96px; font-size: 13px; }
        }

        /* 深色模式优化 */
        @media (prefers-color-scheme: dark) {
            .toc-button {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }

            .toc-panel {
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            }
        }

        /* 动画 */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .toc-panel.show .toc-link {
            animation: fadeIn 0.3s ease forwards;
        }

        .toc-panel.show .toc-link:nth-child(1) { animation-delay: 0.05s; }
        .toc-panel.show .toc-link:nth-child(2) { animation-delay: 0.1s; }
        .toc-panel.show .toc-link:nth-child(3) { animation-delay: 0.15s; }
        .toc-panel.show .toc-link:nth-child(4) { animation-delay: 0.2s; }
        .toc-panel.show .toc-link:nth-child(5) { animation-delay: 0.25s; }
        .toc-panel.show .toc-link:nth-child(6) { animation-delay: 0.3s; }
        .toc-panel.show .toc-link:nth-child(7) { animation-delay: 0.35s; }
        .toc-panel.show .toc-link:nth-child(8) { animation-delay: 0.4s; }
        .toc-panel.show .toc-link:nth-child(9) { animation-delay: 0.45s; }
        .toc-panel.show .toc-link:nth-child(10) { animation-delay: 0.5s; }
    `;
    loadResource('style', { css: css });
}

// 初始化
document.addEventListener("DOMContentLoaded", function() {
    loadStyles();
    createTOC();
});

// 支持 SPA 路由切换后重新创建目录
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(createTOC, 500);
    });
}
