// 关于页面滚动动画
var pursuitInterval = null;

function initAboutAnimation() {
  // 清除之前的定时器
  if (pursuitInterval) {
    clearInterval(pursuitInterval);
  }

  pursuitInterval = setInterval(function () {
    const show = document.querySelector('span[data-show]');
    const mask = document.querySelector('.mask');

    if (!show || !mask) return;

    const spans = mask.querySelectorAll('span');
    const currentIndex = Array.from(spans).indexOf(show);
    const nextIndex = (currentIndex + 1) % spans.length;
    const next = spans[nextIndex];
    const up = document.querySelector('span[data-up]');

    if (up) {
      up.removeAttribute('data-up');
    }

    show.removeAttribute('data-show');
    show.setAttribute('data-up', '');

    if (next) {
      next.setAttribute('data-show', '');
    }
  }, 2000);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutAnimation);
} else {
  initAboutAnimation();
}
