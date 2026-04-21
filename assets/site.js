const navToggle = document.querySelector('[data-nav-toggle]');
const siteNav = document.querySelector('[data-site-nav]');
const demoVideo = document.querySelector('[data-demo-video]');
const videoFallback = document.querySelector('[data-video-fallback]');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (demoVideo && videoFallback) {
  const showVideo = () => {
    demoVideo.hidden = false;
    videoFallback.hidden = true;
  };

  const showFallback = () => {
    demoVideo.hidden = true;
    videoFallback.hidden = false;
  };

  demoVideo.addEventListener('loadeddata', showVideo);
  demoVideo.addEventListener('canplay', showVideo);
  demoVideo.addEventListener('error', showFallback);

  const source = demoVideo.querySelector('source');
  if (source) {
    source.addEventListener('error', showFallback);
  }

  showFallback();
  demoVideo.load();
}

const year = document.getElementById('year');
if (year) {
  year.textContent = String(new Date().getFullYear());
}
