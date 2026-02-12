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
    
    // 创建悬浮按钮 - 使用图片中的样式（右侧圆形按钮）
    const tocButton = document.createElement('button');
    tocButton.className = 'toc-fab-button';
    tocButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    `;
    tocButton.title = '文章目录';

    // 创建关闭按钮（展开后显示）
    const tocCloseButton = document.createElement('button');
    tocCloseButton.className = 'toc-close-fab';
    tocCloseButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
    tocCloseButton.title = '关闭目录';

    // 创建目录面板 - 使用图片中的样式（右侧弹出面板）
    const tocPanel = document.createElement('div');
    tocPanel.className = 'toc-side-panel';
    
    // 目录内容
    const tocContent = document.createElement('div');
    tocContent.className = 'toc-side-content';

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
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 关闭目录面板
                closeTOC();
                
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
    tocContainer.appendChild(tocCloseButton);
    tocContainer.appendChild(tocPanel);
    document.body.appendChild(tocContainer);

    // 打开目录函数
    function openTOC() {
        tocPanel.classList.add('show');
        tocButton.classList.add('hidden');
        tocCloseButton.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭目录函数
    function closeTOC() {
        tocPanel.classList.remove('show');
        tocButton.classList.remove('hidden');
        tocCloseButton.classList.remove('show');
        document.body.style.overflow = '';
    }

    // 按钮点击事件
    tocButton.addEventListener('click', (e) => {
        e.stopPropagation();
        openTOC();
    });

    // 关闭按钮点击事件
    tocCloseButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTOC();
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!tocContainer.contains(e.target)) {
            closeTOC();
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

    // ESC 键关闭目录
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tocPanel.classList.contains('show')) {
            closeTOC();
        }
    });
}

// 加载样式
function loadStyles() {
    const css = `
        /* 目录容器 - 固定在右侧 */
        .toc-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        /* 悬浮按钮 - 圆形深色按钮 */
        .toc-fab-button {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: hsl(var(--foreground) / 0.8);
            border: none;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: hsl(var(--background));
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(8px);
        }

        .toc-fab-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            background: hsl(var(--foreground) / 0.9);
        }

        .toc-fab-button.hidden {
            opacity: 0;
            transform: scale(0.8);
            pointer-events: none;
        }

        /* 关闭按钮 - 圆形按钮 */
        .toc-close-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: hsl(var(--destructive) / 0.9);
            border: none;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: scale(0.8);
            pointer-events: none;
            z-index: 1002;
            backdrop-filter: blur(8px);
        }

        .toc-close-fab.show {
            opacity: 1;
            transform: scale(1);
            pointer-events: auto;
        }

        .toc-close-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        /* 右侧目录面板 */
        .toc-side-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 320px;
            height: 100vh;
            background: hsl(var(--card) / 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-left: 1px solid hsl(var(--border));
            box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
            opacity: 0;
            visibility: hidden;
            transform: translateX(100%);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1001;
            display: flex;
            flex-direction: column;
        }

        .toc-side-panel.show {
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
        }

        /* 目录内容 */
        .toc-side-content {
            flex: 1;
            overflow-y: auto;
            padding: 24px 20px;
            padding-bottom: 100px;
        }

        .toc-side-content::-webkit-scrollbar {
            width: 6px;
        }

        .toc-side-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .toc-side-content::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.2);
            border-radius: 3px;
        }

        .toc-side-content::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.4);
        }

        /* 目录列表 */
        .toc-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .toc-nested {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        /* 目录链接 */
        .toc-link {
            display: block;
            padding: 10px 14px;
            color: hsl(var(--foreground) / 0.75);
            text-decoration: none;
            font-size: 14px;
            line-height: 1.5;
            transition: all 0.2s ease;
            border-radius: 8px;
            border-left: 3px solid transparent;
            position: relative;
        }

        .toc-link[data-level="1"] { 
            font-weight: 600; 
            color: hsl(var(--foreground) / 0.9);
            font-size: 15px;
        }
        .toc-link[data-level="2"] { padding-left: 22px; }
        .toc-link[data-level="3"] { padding-left: 34px; font-size: 13px; }
        .toc-link[data-level="4"] { padding-left: 46px; font-size: 13px; }
        .toc-link[data-level="5"] { padding-left: 58px; font-size: 12px; color: hsl(var(--foreground) / 0.6); }
        .toc-link[data-level="6"] { padding-left: 70px; font-size: 12px; color: hsl(var(--foreground) / 0.6); }

        .toc-link:hover {
            background: hsl(var(--accent) / 0.6);
            color: hsl(var(--foreground));
            border-left-color: hsl(var(--primary) / 0.5);
        }

        .toc-link.active {
            background: hsl(var(--primary) / 0.1);
            color: hsl(var(--primary));
            border-left-color: hsl(var(--primary));
            font-weight: 500;
        }

        /* 遮罩层 */
        .toc-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 999;
        }

        .toc-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
            .toc-container {
                bottom: 20px;
                right: 20px;
            }

            .toc-fab-button,
            .toc-close-fab {
                width: 48px;
                height: 48px;
            }

            .toc-fab-button svg,
            .toc-close-fab svg {
                width: 20px;
                height: 20px;
            }

            .toc-side-panel {
                width: 280px;
            }

            .toc-side-content {
                padding: 20px 16px;
                padding-bottom: 90px;
            }

            .toc-link {
                padding: 8px 12px;
                font-size: 13px;
            }

            .toc-link[data-level="1"] { font-size: 14px; }
            .toc-link[data-level="2"] { padding-left: 20px; }
            .toc-link[data-level="3"] { padding-left: 32px; }
            .toc-link[data-level="4"] { padding-left: 44px; }
            .toc-link[data-level="5"] { padding-left: 56px; }
            .toc-link[data-level="6"] { padding-left: 68px; }
        }

        /* 小屏幕移动端 */
        @media (max-width: 480px) {
            .toc-side-panel {
                width: 85vw;
                max-width: 300px;
            }
        }

        /* 深色模式优化 */
        @media (prefers-color-scheme: dark) {
            .toc-fab-button {
                background: hsl(var(--foreground) / 0.7);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            }

            .toc-side-panel {
                box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
            }

            .toc-overlay {
                background: rgba(0, 0, 0, 0.5);
            }
        }

        /* 目录项进入动画 */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .toc-side-panel.show .toc-link {
            animation: slideIn 0.3s ease forwards;
        }

        .toc-side-panel.show .toc-link:nth-child(1) { animation-delay: 0.05s; }
        .toc-side-panel.show .toc-link:nth-child(2) { animation-delay: 0.08s; }
        .toc-side-panel.show .toc-link:nth-child(3) { animation-delay: 0.11s; }
        .toc-side-panel.show .toc-link:nth-child(4) { animation-delay: 0.14s; }
        .toc-side-panel.show .toc-link:nth-child(5) { animation-delay: 0.17s; }
        .toc-side-panel.show .toc-link:nth-child(6) { animation-delay: 0.2s; }
        .toc-side-panel.show .toc-link:nth-child(7) { animation-delay: 0.23s; }
        .toc-side-panel.show .toc-link:nth-child(8) { animation-delay: 0.26s; }
        .toc-side-panel.show .toc-link:nth-child(9) { animation-delay: 0.29s; }
        .toc-side-panel.show .toc-link:nth-child(10) { animation-delay: 0.32s; }
    `;
    loadResource('style', { css: css });
}

// 创建遮罩层
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'toc-overlay';
    overlay.addEventListener('click', () => {
        const panel = document.querySelector('.toc-side-panel');
        const button = document.querySelector('.toc-fab-button');
        const closeBtn = document.querySelector('.toc-close-fab');
        if (panel) panel.classList.remove('show');
        if (button) button.classList.remove('hidden');
        if (closeBtn) closeBtn.classList.remove('show');
        document.body.style.overflow = '';
        overlay.classList.remove('show');
    });
    document.body.appendChild(overlay);
    return overlay;
}

// 初始化
document.addEventListener("DOMContentLoaded", function() {
    loadStyles();
    createTOC();
    createOverlay();
});

// 支持 SPA 路由切换后重新创建目录
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            createTOC();
            if (!document.querySelector('.toc-overlay')) {
                createOverlay();
            }
        }, 500);
    });
}
