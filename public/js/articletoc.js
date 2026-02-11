function loadResource(type, attributes) {
    if (type === 'style') {
        const style = document.createElement('style');
        style.textContent = attributes.css;
        document.head.appendChild(style);
    }
}

function createTOC() {
    const tocElement = document.createElement('div');
    tocElement.className = 'toc';
    const contentContainer = document.querySelector('.markdown-body');
    if (!contentContainer) return;
    contentContainer.appendChild(tocElement);

    const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach(heading => {
        if (!heading.id) {
            heading.id = heading.textContent.trim().replace(/\s+/g, '-').toLowerCase();
        }
        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent;
        link.className = 'toc-link';
        link.style.paddingLeft = `${(parseInt(heading.tagName.charAt(1)) - 1) * 10}px`;
        tocElement.appendChild(link);
    });
}

// 在 DOMContentLoaded 时创建目录
document.addEventListener("DOMContentLoaded", function() {
    createTOC();
    
    const css = `
        .toc {
            position: fixed;
            top: 100px;
            right: 20px;
            width: 250px;
            max-height: 70vh;
            background-color: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow-y: auto;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
        }
        .toc.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        .toc a {
            display: block;
            color: hsl(var(--foreground));
            text-decoration: none;
            padding: 6px 8px;
            font-size: 14px;
            line-height: 1.5;
            border-radius: 4px;
            transition: background-color 0.2s ease, padding-left 0.2s ease;
            margin-bottom: 2px;
        }
        .toc a:last-child {
            margin-bottom: 0;
        }
        .toc a:hover {
            background-color: hsl(var(--accent));
            padding-left: 12px;
        }
        /* 移动端适配 */
        @media (max-width: 768px) {
            .toc {
                width: calc(100vw - 40px);
                max-width: 280px;
                right: 10px;
                top: 80px;
            }
        }
    `;
    loadResource('style', {css: css});

    // 点击目录外部关闭目录
    document.addEventListener('click', (e) => {
        const tocElement = document.querySelector('.toc');
        const tocButton = document.querySelector('.toc-button');
        if (tocElement && tocElement.classList.contains('show')) {
            const isClickOnToc = tocElement.contains(e.target);
            const isClickOnButton = tocButton && tocButton.contains(e.target);
            if (!isClickOnToc && !isClickOnButton) {
                tocElement.classList.remove('show');
            }
        }
    });
});