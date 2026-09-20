const root = document.documentElement;
const menuButton = document.getElementById('menuButton');
const mobileMenu = document.getElementById('mobileMenu');
const themeButton = document.getElementById('themeToggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = motionPreference.matches;

document.getElementById('year').textContent = new Date().getFullYear();

function readTheme() {
  try {
    return localStorage.getItem('annajah-theme-v3');
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem('annajah-theme-v3', theme);
  } catch {
    // Theme remains active for the current visit when storage is unavailable.
  }
}

function applyTheme(theme, persist = true) {
  const isDark = theme === 'dark';
  root.dataset.theme = isDark ? 'dark' : 'light';
  const label = isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap';
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeMeta.content = isDark ? '#071a3d' : '#f5f8fc';
  if (persist) saveTheme(root.dataset.theme);
}

applyTheme(readTheme() || root.dataset.theme || 'light', false);

themeButton.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

const siteContent = document.getElementById('siteContent');
let splashFinished = false;

function revealPage() {
  root.classList.remove('splash-active', 'splash-leaving');
  siteContent.inert = false;
  root.classList.add('page-ready');
}

function finishSplash() {
  if (splashFinished) return;
  splashFinished = true;
  if (!root.classList.contains('splash-active') || motionPreference.matches) {
    revealPage();
    return;
  }
  root.classList.add('splash-leaving');
  // Keep the page inert until the full-screen layer has finished fading out.
  window.setTimeout(revealPage, 740);
}

if (root.classList.contains('splash-active') && !reduceMotion) {
  siteContent.inert = true;
  const heroPhoto = document.querySelector('.hero-media img');
  const photoReady = heroPhoto?.decode ? heroPhoto.decode().catch(() => {}) : Promise.resolve();
  const minimumIntro = new Promise((resolve) => window.setTimeout(resolve, 2700));
  const maximumIntro = new Promise((resolve) => window.setTimeout(resolve, 3100));
  Promise.race([Promise.all([photoReady, minimumIntro]), maximumIntro]).then(finishSplash);
} else {
  finishSplash();
}

const onMotionPreferenceChange = (event) => {
  if (event.matches) {
    finishSplash();
    // Also unlock immediately if reduced motion is enabled during the exit.
    revealPage();
  }
};
if (motionPreference.addEventListener) motionPreference.addEventListener('change', onMotionPreferenceChange);
else if (motionPreference.addListener) motionPreference.addListener(onMotionPreferenceChange);

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  mobileMenu.hidden = !open;
}

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
document.querySelector('.nav .brand').addEventListener('click', () => setMenu(false));
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', (event) => {
  if (!mobileMenu.hidden && !event.target.closest('.nav')) setMenu(false);
});
const desktopPreference = window.matchMedia('(min-width: 1081px)');
const onDesktopPreferenceChange = (event) => {
  if (event.matches) setMenu(false);
};
if (desktopPreference.addEventListener) desktopPreference.addEventListener('change', onDesktopPreferenceChange);
else if (desktopPreference.addListener) desktopPreference.addListener(onDesktopPreferenceChange);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileMenu.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});

const header = document.getElementById('siteHeader');
const hero = document.querySelector('.hero');
const headerSentinel = document.getElementById('headerSentinel');
if ('IntersectionObserver' in window) {
  const headerObserver = new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-scrolled', !entry.isIntersecting);
  }, { threshold: 0 });
  headerObserver.observe(headerSentinel);
} else {
  // Keep navigation readable over light sections in older browsers.
  header.classList.add('is-scrolled');
}

// Pointer depth is isolated on the media wrapper; CSS owns the image's scroll depth.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let pointerFrame = 0;
let pointerX = 0;
let pointerY = 0;
function resetHeroPointer() {
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  hero.style.setProperty('--hero-x', '0px');
  hero.style.setProperty('--hero-y', '0px');
}
hero.addEventListener('pointermove', (event) => {
  if (!finePointer.matches || motionPreference.matches || event.pointerType === 'touch') return;
  const bounds = hero.getBoundingClientRect();
  pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * -28;
  pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * -20;
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    hero.style.setProperty('--hero-x', `${pointerX.toFixed(2)}px`);
    hero.style.setProperty('--hero-y', `${pointerY.toFixed(2)}px`);
    pointerFrame = 0;
  });
}, { passive: true });
hero.addEventListener('pointerleave', resetHeroPointer);
if (motionPreference.addEventListener) motionPreference.addEventListener('change', resetHeroPointer);
else if (motionPreference.addListener) motionPreference.addListener(resetHeroPointer);
if (finePointer.addEventListener) finePointer.addEventListener('change', resetHeroPointer);
else if (finePointer.addListener) finePointer.addListener(resetHeroPointer);

function bindTabs(tabSelector, panelSelector) {
  const tabs = [...document.querySelectorAll(tabSelector)];
  const panels = [...document.querySelectorAll(panelSelector)];

  function activate(tab, focus = false) {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let targetIndex = index;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) targetIndex = (index + 1) % tabs.length;
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) targetIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = tabs.length - 1;
      activate(tabs[targetIndex], true);
    });
  });
}

bindTabs('.program-tab', '.program-panel');

// Some desktop preview shells expose <dialog> without implementing the
// native showModal()/close() methods. Use a fixed-layer fallback so photo,
// story, and video previews remain clickable everywhere.
function dispatchDialogEvent(dialog, type) {
  const event = document.createEvent('Event');
  event.initEvent(type, false, false);
  dialog.dispatchEvent(event);
}

function openDialog(dialog) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    return;
  }
  dialog.setAttribute('open', '');
  dialog.classList.add('is-open');
  document.body.classList.add('dialog-open');
}

function closeDialog(dialog) {
  if (typeof dialog.close === 'function') {
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
  dialog.classList.remove('is-open');
  document.body.classList.remove('dialog-open');
  dispatchDialogEvent(dialog, 'close');
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const fallbackDialog = document.querySelector('dialog.is-open');
  if (!fallbackDialog) return;
  event.preventDefault();
  closeDialog(fallbackDialog);
});

const videoDialog = document.getElementById('videoDialog');
const profileVideo = document.getElementById('profileVideo');
const videoStatus = document.getElementById('videoStatus');
const videoStatusTitle = document.getElementById('videoStatusTitle');
const videoStatusText = document.getElementById('videoStatusText');
const videoStatusCopy = document.querySelector('.video-status-copy');
let videoReturnFocus;
let videoLoadTimer;
let videoErrorTimer;

function showVideoMessage(title, message) {
  profileVideo.hidden = true;
  videoStatus.hidden = false;
  const isError = title === 'Video belum dapat diputar.';
  videoStatus.classList.toggle('is-error', isError);
  videoStatusCopy.hidden = !isError;
  videoStatusTitle.textContent = title;
  videoStatusText.textContent = message;
}

function revealVideo() {
  clearTimeout(videoLoadTimer);
  clearTimeout(videoErrorTimer);
  videoStatus.classList.remove('is-error');
  videoStatusCopy.hidden = true;
  videoStatus.hidden = true;
  profileVideo.hidden = false;
}

function videoUnavailable() {
  clearTimeout(videoLoadTimer);
  clearTimeout(videoErrorTimer);
  profileVideo.pause();
  showVideoMessage('Video belum dapat diputar.', 'Periksa koneksi Anda, lalu tutup dan buka kembali pemutar. Program pendidikan tetap dapat Anda jelajahi.');
}

function scheduleVideoUnavailable() {
  clearTimeout(videoErrorTimer);
  videoErrorTimer = window.setTimeout(() => {
    // A media error can fire while the browser is replacing the source. Give
    // the local MP4 a moment to recover before showing the error state.
    if (profileVideo.readyState < 2 && profileVideo.error) videoUnavailable();
  }, 3500);
}

function openVideo(event) {
  videoReturnFocus = event.currentTarget;
  openDialog(videoDialog);
  const videoSource = profileVideo.dataset.videoSrc.trim();
  if (!videoSource) return;

  clearTimeout(videoLoadTimer);
  clearTimeout(videoErrorTimer);

  if (profileVideo.readyState >= 2 && !profileVideo.error) {
    revealVideo();
  } else {
    showVideoMessage('Menyiapkan film profil…', 'Video akan tampil setelah siap diputar.');
    profileVideo.src = videoSource;
    profileVideo.load();
    videoLoadTimer = window.setTimeout(videoUnavailable, 15000);
  }

  profileVideo.play().catch((error) => {
    if (error.name === 'NotAllowedError') revealVideo();
    else if (error.name !== 'AbortError') scheduleVideoUnavailable();
  });
}

function closeVideo() {
  clearTimeout(videoLoadTimer);
  profileVideo.pause();
  closeDialog(videoDialog);
  videoReturnFocus?.focus();
}

profileVideo.addEventListener('loadeddata', revealVideo);
profileVideo.addEventListener('error', scheduleVideoUnavailable);
document.querySelectorAll('[data-video-open]').forEach((button) => button.addEventListener('click', openVideo));
document.querySelector('[data-video-close]').addEventListener('click', closeVideo);
document.querySelector('[data-video-explore]').addEventListener('click', closeVideo);
videoDialog.addEventListener('click', (event) => { if (event.target === videoDialog) closeVideo(); });
videoDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeVideo();
});

function animateCarouselImage(image, direction) {
  if (reduceMotion || !direction || typeof image.animate !== 'function') return;
  image.animate([
    { opacity: 0.68, transform: `translateX(${direction * 18}px)` },
    { opacity: 1, transform: 'translateX(0)' }
  ], { duration: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
}

function bindSwipeCarousel(surface, move, options = {}) {
  let start = null;
  let suppressClickUntil = 0;
  let dragged = false;
  const isZoomed = () => options.isZoomed?.() === true;
  const finish = (x, y) => {
    if (!start) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (isZoomed()) {
      if (dragged) suppressClickUntil = Date.now() + 450;
      start = null;
      dragged = false;
      return;
    }
    start = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    if (move(dx < 0 ? 1 : -1) === false) return;
    suppressClickUntil = Date.now() + 450;
  };
  if ('PointerEvent' in window) {
    surface.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.pointerType === 'touch' && event.isPrimary === false) return;
      suppressClickUntil = 0;
      dragged = false;
      start = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, id: event.pointerId };
      surface.setPointerCapture?.(event.pointerId);
    });
    surface.addEventListener('pointermove', (event) => {
      if (!start?.id || start.id !== event.pointerId || !isZoomed()) return;
      const dx = event.clientX - start.lastX;
      const dy = event.clientY - start.lastY;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      dragged = true;
      start.lastX = event.clientX;
      start.lastY = event.clientY;
      options.onPan?.(dx, dy);
    });
    surface.addEventListener('pointerup', (event) => {
      if (start?.id === event.pointerId) finish(event.clientX, event.clientY);
    });
    surface.addEventListener('pointercancel', () => { start = null; });
  } else {
    surface.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1) return;
      suppressClickUntil = 0;
      dragged = false;
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY, lastX: event.touches[0].clientX, lastY: event.touches[0].clientY };
    }, { passive: true });
    surface.addEventListener('touchmove', (event) => {
      if (event.touches.length !== 1 || !start || !isZoomed()) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.lastX;
      const dy = touch.clientY - start.lastY;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      dragged = true;
      start.lastX = touch.clientX;
      start.lastY = touch.clientY;
      options.onPan?.(dx, dy);
    }, { passive: true });
    surface.addEventListener('touchend', (event) => {
      if (event.changedTouches.length === 1) finish(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }, { passive: true });
    surface.addEventListener('touchcancel', () => { start = null; });
  }
  surface.addEventListener('click', (event) => {
    // The showcase uses a transparent button over the photo for opening its
    // preview. Never let swipe click-suppression swallow that intentional
    // desktop click, even if the pointer moved a few pixels between frames.
    if (event.target?.closest?.('.showcase-stage-action')) return;
    if (event.detail === 0 || Date.now() > suppressClickUntil) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressClickUntil = 0;
  }, true);
}

function bindPinchZoom(target, setScale) {
  let startDistance = 0;
  let startScale = 1;
  let currentScale = 1;
  const distance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  target.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 2) return;
    startDistance = distance(event.touches);
    startScale = currentScale;
  }, { passive: true });
  target.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 2 || !startDistance) return;
    event.preventDefault();
    currentScale = Math.max(1, Math.min(2.5, startScale * distance(event.touches) / startDistance));
    setScale(currentScale);
  }, { passive: false });
  target.addEventListener('touchend', () => { startDistance = 0; }, { passive: true });
  target.addEventListener('touchcancel', () => { startDistance = 0; }, { passive: true });
}

function preloadCollectionPhoto(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

const facilityCollections = JSON.parse(document.getElementById('facilityData').textContent);
const facilityTabs = [...document.querySelectorAll('.facility-tab')];
const facilityPanel = document.getElementById('facility-panel');
const facilityMainImage = document.getElementById('facilityMainImage');
const facilityBackdropImage = document.getElementById('facilityBackdropImage');
const facilityPhotoSelector = document.getElementById('facilityPhotoSelector');
let activeFacility = 'dorm';
let facilityIndex = 0;
let facilityPhotoRequest = 0;

function renderFacilityPhoto(direction = 0) {
  const photos = facilityCollections[activeFacility].photos;
  const photo = photos[facilityIndex];
  const position = `${String(facilityIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  facilityMainImage.alt = photo.alt;
  const frame = facilityMainImage.closest('.facility-image-frame');
  const request = ++facilityPhotoRequest;
  frame.classList.add('is-loading');
  frame.setAttribute('aria-busy', 'true');
  facilityMainImage.removeAttribute('src');
  facilityBackdropImage.removeAttribute('src');
  preloadCollectionPhoto(photo.src).then(() => {
    if (request !== facilityPhotoRequest) return;
    facilityMainImage.src = photo.src;
    facilityBackdropImage.src = photo.src;
    frame.classList.remove('is-loading');
    frame.setAttribute('aria-busy', 'false');
    animateCarouselImage(facilityMainImage, direction);
  });
  document.getElementById('facilityImageOpen').setAttribute('aria-label', `Perbesar foto ${facilityCollections[activeFacility].label}, ${facilityIndex + 1} dari ${photos.length}: ${photo.caption}`);
  document.getElementById('facilityPhotoCaption').textContent = photo.caption;
  document.getElementById('facilityPhotoPosition').textContent = position;
  document.getElementById('facilityInlineCount').textContent = position;
  facilityPhotoSelector.querySelectorAll('button').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === facilityIndex));
  });
  document.getElementById('facilityPrev').disabled = photos.length === 1;
  document.getElementById('facilityNext').disabled = photos.length === 1;
  document.getElementById('facilitySwipeHint').hidden = photos.length === 1;
}

function selectFacilityPhoto(index, direction = Math.sign(index - facilityIndex)) {
  const photos = facilityCollections[activeFacility].photos;
  const next = (index + photos.length) % photos.length;
  if (next === facilityIndex) return;
  facilityIndex = next;
  renderFacilityPhoto(direction);
}

function selectFacility(tab, focus = false) {
  activeFacility = tab.dataset.facilityGroup;
  facilityIndex = 0;
  facilityTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  facilityPanel.setAttribute('aria-labelledby', tab.id);
  const collection = facilityCollections[activeFacility];
  document.getElementById('facilityActiveTitle').textContent = collection.label;
  document.getElementById('facilityActiveDescription').textContent = document.querySelector(`[data-editor-text="facility.${activeFacility}"]`).textContent.trim();
  facilityPhotoSelector.replaceChildren();
  collection.photos.forEach((photo, index) => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    const caption = document.createElement('span');
    button.type = 'button';
    button.className = 'facility-photo-choice';
    button.setAttribute('aria-label', `${collection.label}, foto ${index + 1}: ${photo.caption}`);
    image.src = photo.src;
    image.alt = '';
    image.loading = 'lazy';
    caption.textContent = photo.caption;
    button.append(image, caption);
    button.addEventListener('click', () => selectFacilityPhoto(index));
    facilityPhotoSelector.append(button);
  });
  renderFacilityPhoto();
  if (focus) tab.focus();
}

facilityTabs.forEach((tab, index) => {
  const collection = facilityCollections[tab.dataset.facilityGroup];
  tab.querySelector('small').textContent = `${collection.photos.length} foto`;
  tab.addEventListener('click', () => selectFacility(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? facilityTabs.length - 1
      : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + facilityTabs.length) % facilityTabs.length;
    selectFacility(facilityTabs[next], true);
  });
});
selectFacility(document.getElementById('facility-tab-dorm'));
document.getElementById('facilityPrev').addEventListener('click', () => selectFacilityPhoto(facilityIndex - 1));
document.getElementById('facilityNext').addEventListener('click', () => selectFacilityPhoto(facilityIndex + 1));
const facilityImageOpen = document.getElementById('facilityImageOpen');
bindSwipeCarousel(facilityImageOpen, (direction) => {
  if (facilityCollections[activeFacility].photos.length === 1) return false;
  selectFacilityPhoto(facilityIndex + direction, direction);
});
facilityImageOpen.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  selectFacilityPhoto(facilityIndex + (event.key === 'ArrowRight' ? 1 : -1));
});

const facilityDialog = document.getElementById('facilityDialog');
const facilityDialogImage = document.getElementById('facilityDialogImage');
const facilityDialogViewport = document.getElementById('facilityDialogViewport');
const facilityDialogImageButton = document.getElementById('facilityDialogImageButton');
const facilityZoomIn = document.getElementById('facilityZoomIn');
const facilityZoomOut = document.getElementById('facilityZoomOut');
const facilityDialogPrev = document.getElementById('facilityDialogPrev');
const facilityDialogNext = document.getElementById('facilityDialogNext');
const facilityDialogCount = document.getElementById('facilityDialogCount');
let facilityZoom = 1;
let facilityReturnFocus;

function syncFacilityDialogPhoto(direction = 0) {
  const photos = facilityCollections[activeFacility].photos;
  const photo = photos[facilityIndex];
  facilityDialogImage.src = photo.src;
  facilityDialogImage.alt = photo.alt;
  document.getElementById('facilityDialogCaption').textContent = `${facilityCollections[activeFacility].label} — ${photo.caption}`;
  facilityDialogCount.textContent = `${String(facilityIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  facilityDialogPrev.disabled = photos.length === 1;
  facilityDialogNext.disabled = photos.length === 1;
  setFacilityZoom(1);
  animateCarouselImage(facilityDialogImage, direction);
}

function setFacilityZoom(level) {
  facilityZoom = Math.max(1, Math.min(2.5, level));
  if (facilityZoom === 1) {
    facilityDialog.classList.remove('is-zoomed');
    facilityDialog.style.removeProperty('--facility-zoom-width');
    facilityDialogViewport.scrollTo(0, 0);
  } else {
    const width = facilityDialogImage.naturalWidth || facilityDialogViewport.clientWidth;
    const height = facilityDialogImage.naturalHeight || facilityDialogViewport.clientHeight;
    const fittedWidth = Math.min(width, facilityDialogViewport.clientWidth, facilityDialogViewport.clientHeight * width / height);
    facilityDialog.style.setProperty('--facility-zoom-width', `${Math.round(fittedWidth * facilityZoom)}px`);
    facilityDialog.classList.add('is-zoomed');
    facilityDialogViewport.scrollTo(
      Math.max(0, (facilityDialogViewport.scrollWidth - facilityDialogViewport.clientWidth) / 2),
      Math.max(0, (facilityDialogViewport.scrollHeight - facilityDialogViewport.clientHeight) / 2)
    );
  }
  facilityDialogImageButton.setAttribute('aria-label', facilityZoom === 1 ? 'Perbesar foto' : 'Perkecil foto');
  document.getElementById('facilityZoomLevel').textContent = `${Math.round(facilityZoom * 100)}%`;
  facilityZoomOut.disabled = facilityZoom === 1;
  facilityZoomIn.disabled = facilityZoom === 2.5;
}

document.getElementById('facilityImageOpen').addEventListener('click', (event) => {
  facilityReturnFocus = event.currentTarget;
  syncFacilityDialogPhoto();
  openDialog(facilityDialog);
});
facilityDialogImageButton.addEventListener('click', () => setFacilityZoom(facilityZoom === 1 ? 2 : 1));
facilityZoomIn.addEventListener('click', () => setFacilityZoom(facilityZoom + 0.5));
facilityZoomOut.addEventListener('click', () => setFacilityZoom(facilityZoom - 0.5));
facilityDialogPrev.addEventListener('click', () => {
  selectFacilityPhoto(facilityIndex - 1, -1);
  syncFacilityDialogPhoto(-1);
});
facilityDialogNext.addEventListener('click', () => {
  selectFacilityPhoto(facilityIndex + 1, 1);
  syncFacilityDialogPhoto(1);
});
bindPinchZoom(facilityDialogImage, (scale) => setFacilityZoom(scale));
bindSwipeCarousel(facilityDialogImageButton, (direction) => {
  if (facilityCollections[activeFacility].photos.length === 1) return false;
  selectFacilityPhoto(facilityIndex + direction, direction);
  syncFacilityDialogPhoto(direction);
}, {
  isZoomed: () => facilityZoom > 1,
  onPan: (dx, dy) => {
    facilityDialogViewport.scrollLeft -= dx;
    facilityDialogViewport.scrollTop -= dy;
  }
});
document.getElementById('facilityDialogClose').addEventListener('click', () => closeDialog(facilityDialog));
facilityDialog.addEventListener('close', () => facilityReturnFocus?.focus());
facilityDialog.addEventListener('click', (event) => { if (event.target === facilityDialog) closeDialog(facilityDialog); });

const galleryDialog = document.getElementById('galleryDialog');
const galleryImage = document.getElementById('galleryDialogImage');
const galleryImageButton = document.getElementById('galleryDialogImageButton');
const galleryCaption = document.getElementById('galleryDialogCaption');
const galleryCount = document.getElementById('galleryCount');
const galleryZoomIn = document.getElementById('galleryZoomIn');
const galleryZoomOut = document.getElementById('galleryZoomOut');
const galleryZoomLevel = document.getElementById('galleryZoomLevel');
const galleryStage = document.getElementById('galleryStage');
const galleryStageImage = document.getElementById('galleryStageImage');
const galleryPanel = document.getElementById('gallery-panel');
const galleryActiveTitle = document.getElementById('galleryActiveTitle');
const galleryInlineCount = document.getElementById('galleryInlineCount');
const galleryPhotoCaption = document.getElementById('galleryPhotoCaption');
const galleryThumbnails = document.getElementById('galleryThumbnails');
const galleryTabs = [...document.querySelectorAll('.gallery-category')];

const galleryCollections = JSON.parse(document.getElementById('galleryData').textContent);
let galleryReturnFocus;
let activeGalleryGroup = 'halaqah';
let galleryIndex = 0;
let galleryModalZoom = 1;
let galleryPanX = 0;
let galleryPanY = 0;
let galleryPhotoRequest = 0;

function setGalleryPan(x, y) {
  const maxX = Math.max(0, galleryImage.clientWidth * (galleryModalZoom - 1) / 2);
  const maxY = Math.max(0, galleryImage.clientHeight * (galleryModalZoom - 1) / 2);
  galleryPanX = Math.max(-maxX, Math.min(maxX, x));
  galleryPanY = Math.max(-maxY, Math.min(maxY, y));
  galleryImage.style.setProperty('--gallery-modal-x', `${galleryPanX}px`);
  galleryImage.style.setProperty('--gallery-modal-y', `${galleryPanY}px`);
}

function setGalleryModalZoom(level) {
  galleryModalZoom = Math.max(1, Math.min(2.5, level));
  if (galleryModalZoom === 1) {
    galleryPanX = 0;
    galleryPanY = 0;
  }
  galleryDialog.classList.toggle('is-gallery-zoomed', galleryModalZoom > 1);
  galleryImage.style.setProperty('--gallery-modal-scale', galleryModalZoom);
  setGalleryPan(galleryPanX, galleryPanY);
  galleryZoomLevel.textContent = `${Math.round(galleryModalZoom * 100)}%`;
  galleryZoomOut.disabled = galleryModalZoom === 1;
  galleryZoomIn.disabled = galleryModalZoom === 2.5;
}

function renderGalleryPhoto(direction = 0) {
  const collection = galleryCollections[activeGalleryGroup];
  const photo = collection.photos[galleryIndex];
  const position = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(collection.photos.length).padStart(2, '0')}`;
  galleryStageImage.alt = photo.alt;
  const request = ++galleryPhotoRequest;
  galleryStage.classList.add('is-loading');
  galleryStage.setAttribute('aria-busy', 'true');
  galleryStageImage.removeAttribute('src');
  preloadCollectionPhoto(photo.src).then(() => {
    if (request !== galleryPhotoRequest) return;
    galleryStageImage.src = photo.src;
    galleryStage.classList.remove('is-loading');
    galleryStage.setAttribute('aria-busy', 'false');
    animateCarouselImage(galleryStageImage, direction);
  });
  galleryStage.setAttribute('aria-label', `Perbesar foto ${collection.label}, ${galleryIndex + 1} dari ${collection.photos.length}`);
  galleryActiveTitle.textContent = collection.label;
  galleryInlineCount.textContent = position;
  galleryPhotoCaption.textContent = photo.caption || photo.alt;
  galleryThumbnails.querySelectorAll('button').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === galleryIndex));
  });
  if (galleryDialog.open) {
    galleryImage.src = photo.src;
    galleryImage.alt = photo.alt;
    galleryCaption.textContent = photo.caption || photo.alt;
    galleryCount.textContent = position;
    setGalleryModalZoom(1);
  }
}

function selectGalleryPhoto(index, direction = Math.sign(index - galleryIndex)) {
  const photos = galleryCollections[activeGalleryGroup].photos;
  const next = (index + photos.length) % photos.length;
  if (next === galleryIndex) return;
  galleryIndex = next;
  renderGalleryPhoto(direction);
  if (galleryDialog.open) animateCarouselImage(galleryImage, direction);
}

function selectGalleryGroup(tab, focus = false) {
  activeGalleryGroup = tab.dataset.galleryGroup;
  galleryIndex = 0;
  galleryTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  galleryPanel.setAttribute('aria-labelledby', tab.id);
  const collection = galleryCollections[activeGalleryGroup];
  galleryThumbnails.replaceChildren();
  collection.photos.forEach((photo, index) => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    button.type = 'button';
    button.className = 'gallery-thumbnail';
    button.setAttribute('aria-label', `Tampilkan foto ${index + 1} dari ${collection.label}: ${photo.caption || photo.alt}`);
    image.src = photo.src;
    image.alt = '';
    image.loading = 'lazy';
    button.append(image);
    button.addEventListener('click', () => selectGalleryPhoto(index));
    galleryThumbnails.append(button);
  });
  renderGalleryPhoto();
  if (focus) tab.focus();
}

galleryTabs.forEach((tab, index) => {
  const collection = galleryCollections[tab.dataset.galleryGroup];
  tab.querySelector('.gallery-category-count').textContent = `${String(collection.photos.length).padStart(2, '0')} foto`;
  tab.addEventListener('click', () => selectGalleryGroup(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? galleryTabs.length - 1
      : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + galleryTabs.length) % galleryTabs.length;
    selectGalleryGroup(galleryTabs[next], true);
  });
});
selectGalleryGroup(galleryTabs[0]);
document.getElementById('galleryInlinePrev').addEventListener('click', () => selectGalleryPhoto(galleryIndex - 1));
document.getElementById('galleryInlineNext').addEventListener('click', () => selectGalleryPhoto(galleryIndex + 1));

function openGallery(event) {
  galleryReturnFocus = event.currentTarget;
  openDialog(galleryDialog);
  setGalleryModalZoom(1);
  renderGalleryPhoto();
}

function closeGallery() {
  closeDialog(galleryDialog);
  galleryReturnFocus?.focus();
}

galleryStage.addEventListener('click', openGallery);
bindSwipeCarousel(galleryStage, (direction) => selectGalleryPhoto(galleryIndex + direction, direction));
bindSwipeCarousel(galleryImageButton, (direction) => selectGalleryPhoto(galleryIndex + direction, direction), {
  isZoomed: () => galleryModalZoom > 1,
  onPan: (dx, dy) => setGalleryPan(galleryPanX + dx, galleryPanY + dy)
});
bindPinchZoom(galleryImage, setGalleryModalZoom);
galleryImageButton.addEventListener('click', () => setGalleryModalZoom(galleryModalZoom === 1 ? 2 : 1));
galleryZoomIn.addEventListener('click', () => setGalleryModalZoom(galleryModalZoom + 0.5));
galleryZoomOut.addEventListener('click', () => setGalleryModalZoom(galleryModalZoom - 0.5));
galleryStage.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  selectGalleryPhoto(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
});
document.querySelector('[data-gallery-prev]').addEventListener('click', () => selectGalleryPhoto(galleryIndex - 1));
document.querySelector('[data-gallery-next]').addEventListener('click', () => selectGalleryPhoto(galleryIndex + 1));
galleryDialog.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Home') selectGalleryPhoto(0);
  else if (event.key === 'End') selectGalleryPhoto(galleryCollections[activeGalleryGroup].photos.length - 1);
  else selectGalleryPhoto(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
});
document.querySelector('[data-gallery-close]').addEventListener('click', closeGallery);
galleryDialog.addEventListener('click', (event) => { if (event.target === galleryDialog) closeGallery(); });
galleryDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeGallery();
});

const showcaseCollections = JSON.parse(document.getElementById('showcaseData').textContent);
const showcaseTabs = [...document.querySelectorAll('.showcase-tab')];
const showcaseStage = document.querySelector('.showcase-stage');
const showcaseStageImage = document.getElementById('showcaseStageImage');
const showcaseStageLabel = document.getElementById('showcaseStageLabel');
const showcaseStageCaption = document.getElementById('showcaseStageCaption');
const showcaseActiveTitle = document.getElementById('showcaseActiveTitle');
const showcaseActiveDescription = document.getElementById('showcaseActiveDescription');
const showcaseThumbnails = document.getElementById('showcaseThumbnails');
const showcaseCount = document.getElementById('showcaseCount');
const showcaseOpen = document.getElementById('showcaseOpen');
const showcaseDialog = document.getElementById('showcaseDialog');
const showcaseDialogImage = document.getElementById('showcaseDialogImage');
const showcaseDialogViewport = document.getElementById('showcaseDialogViewport');
const showcaseDialogImageButton = document.getElementById('showcaseDialogImageButton');
const showcaseZoomIn = document.getElementById('showcaseZoomIn');
const showcaseZoomOut = document.getElementById('showcaseZoomOut');
const showcaseDialogPrev = document.getElementById('showcaseDialogPrev');
const showcaseDialogNext = document.getElementById('showcaseDialogNext');
const showcaseDialogCount = document.getElementById('showcaseDialogCount');
let showcaseZoom = 1;
let showcaseReturnFocus;
let activeShowcaseGroup = 'ekstrakurikuler';
let showcaseIndex = 0;
let showcasePhotoRequest = 0;

function renderShowcasePhoto(direction = 0) {
  const collection = showcaseCollections[activeShowcaseGroup];
  const photo = collection.photos[showcaseIndex];
  showcaseStageImage.alt = photo.alt;
  const request = ++showcasePhotoRequest;
  showcaseStage.classList.add('is-loading');
  showcaseStage.setAttribute('aria-busy', 'true');
  showcaseStageImage.removeAttribute('src');
  preloadCollectionPhoto(photo.src).then(() => {
    if (request !== showcasePhotoRequest) return;
    showcaseStageImage.src = photo.src;
    showcaseStage.classList.remove('is-loading');
    showcaseStage.setAttribute('aria-busy', 'false');
    animateCarouselImage(showcaseStageImage, direction);
  });
  showcaseStageLabel.textContent = collection.label;
  showcaseStageCaption.textContent = photo.caption;
  showcaseActiveTitle.textContent = collection.label;
  showcaseActiveDescription.textContent = collection.description;
  showcaseCount.textContent = `${String(showcaseIndex + 1).padStart(2, '0')} / ${String(collection.photos.length).padStart(2, '0')}`;
  showcaseThumbnails.querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-pressed', String(index === showcaseIndex)));
  const activeThumbnail = showcaseThumbnails.querySelectorAll('button')[showcaseIndex];
  if (activeThumbnail && Number.isFinite(activeThumbnail.offsetLeft)) {
    const left = activeThumbnail.offsetLeft;
    const right = left + activeThumbnail.offsetWidth;
    const viewLeft = showcaseThumbnails.scrollLeft;
    const viewRight = viewLeft + showcaseThumbnails.clientWidth;
    if (left < viewLeft) {
      showcaseThumbnails.scrollTo?.({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else if (right > viewRight) {
      showcaseThumbnails.scrollTo?.({
        left: right - showcaseThumbnails.clientWidth,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }
  }
}

function selectShowcasePhoto(index, direction = Math.sign(index - showcaseIndex)) {
  const photos = showcaseCollections[activeShowcaseGroup].photos;
  const next = (index + photos.length) % photos.length;
  if (next === showcaseIndex) return;
  showcaseIndex = next;
  renderShowcasePhoto(direction);
}

function selectShowcaseGroup(tab) {
  activeShowcaseGroup = tab.dataset.showcaseGroup;
  showcaseIndex = 0;
  showcaseTabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
  showcaseThumbnails.replaceChildren();
  showcaseCollections[activeShowcaseGroup].photos.forEach((photo, index) => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    button.type = 'button';
    button.setAttribute('aria-label', `${showcaseCollections[activeShowcaseGroup].label}, foto ${index + 1}: ${photo.caption}`);
    image.src = photo.src;
    image.alt = '';
    image.loading = 'lazy';
    button.append(image);
    button.addEventListener('click', () => selectShowcasePhoto(index));
    showcaseThumbnails.append(button);
  });
  renderShowcasePhoto();
}

function setShowcaseZoom(level) {
  showcaseZoom = Math.max(1, Math.min(2.5, level));
  showcaseDialog.classList.toggle('is-zoomed', showcaseZoom > 1);
  if (showcaseZoom === 1) {
    showcaseDialog.style.removeProperty('--facility-zoom-width');
    showcaseDialogViewport.scrollTo(0, 0);
  } else {
    const width = showcaseDialogImage.naturalWidth || showcaseDialogViewport.clientWidth;
    const height = showcaseDialogImage.naturalHeight || showcaseDialogViewport.clientHeight;
    const fittedWidth = Math.min(width, showcaseDialogViewport.clientWidth, showcaseDialogViewport.clientHeight * width / height);
    showcaseDialog.style.setProperty('--facility-zoom-width', `${Math.round(fittedWidth * showcaseZoom)}px`);
  }
  showcaseDialogImageButton.setAttribute('aria-label', showcaseZoom === 1 ? 'Perbesar foto' : 'Perkecil foto');
  document.getElementById('showcaseZoomLevel').textContent = `${Math.round(showcaseZoom * 100)}%`;
  showcaseZoomOut.disabled = showcaseZoom === 1;
  showcaseZoomIn.disabled = showcaseZoom === 2.5;
}

bindPinchZoom(showcaseDialogImage, (scale) => setShowcaseZoom(scale));

function syncShowcaseDialogPhoto(direction = 0) {
  const collection = showcaseCollections[activeShowcaseGroup];
  const photo = collection.photos[showcaseIndex];
  showcaseDialogImage.src = photo.src;
  showcaseDialogImage.alt = photo.alt;
  document.getElementById('showcaseDialogCaption').textContent = `${collection.label} — ${photo.caption}`;
  showcaseDialogCount.textContent = `${String(showcaseIndex + 1).padStart(2, '0')} / ${String(collection.photos.length).padStart(2, '0')}`;
  showcaseDialogPrev.disabled = collection.photos.length === 1;
  showcaseDialogNext.disabled = collection.photos.length === 1;
  setShowcaseZoom(1);
  animateCarouselImage(showcaseDialogImage, direction);
}

function openShowcasePreview() {
  if (showcaseDialog.open) return;
  showcaseReturnFocus = showcaseOpen;
  syncShowcaseDialogPhoto();
  openDialog(showcaseDialog);
}

showcaseThumbnails.addEventListener('dblclick', openShowcasePreview);
showcaseDialogImageButton.addEventListener('click', () => setShowcaseZoom(showcaseZoom === 1 ? 2 : 1));
showcaseZoomIn.addEventListener('click', () => setShowcaseZoom(showcaseZoom + 0.5));
showcaseZoomOut.addEventListener('click', () => setShowcaseZoom(showcaseZoom - 0.5));
showcaseDialogPrev.addEventListener('click', () => {
  selectShowcasePhoto(showcaseIndex - 1, -1);
  syncShowcaseDialogPhoto(-1);
});
showcaseDialogNext.addEventListener('click', () => {
  selectShowcasePhoto(showcaseIndex + 1, 1);
  syncShowcaseDialogPhoto(1);
});
bindSwipeCarousel(showcaseDialogImageButton, (direction) => {
  const photos = showcaseCollections[activeShowcaseGroup].photos;
  if (photos.length === 1) return false;
  selectShowcasePhoto(showcaseIndex + direction, direction);
  syncShowcaseDialogPhoto(direction);
}, {
  isZoomed: () => showcaseZoom > 1,
  onPan: (dx, dy) => {
    showcaseDialogViewport.scrollLeft -= dx;
    showcaseDialogViewport.scrollTop -= dy;
  }
});
document.getElementById('showcaseDialogClose').addEventListener('click', () => closeDialog(showcaseDialog));
showcaseDialog.addEventListener('close', () => showcaseReturnFocus?.focus());
showcaseDialog.addEventListener('click', (event) => { if (event.target === showcaseDialog) closeDialog(showcaseDialog); });
showcaseDialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(showcaseDialog); });

showcaseTabs.forEach((tab) => tab.addEventListener('click', () => selectShowcaseGroup(tab)));
document.getElementById('showcasePrev').addEventListener('click', () => selectShowcasePhoto(showcaseIndex - 1, -1));
document.getElementById('showcaseNext').addEventListener('click', () => selectShowcasePhoto(showcaseIndex + 1, 1));
bindSwipeCarousel(showcaseStage, (direction) => selectShowcasePhoto(showcaseIndex + direction, direction));
let showcasePointerOpened = false;
showcaseOpen.addEventListener('mousedown', (event) => {
  if (event.button !== 0) return;
  showcasePointerOpened = true;
  openShowcasePreview(event);
  window.setTimeout(() => { showcasePointerOpened = false; }, 0);
});
// Delegate the desktop click from the stage as well as the transparent
// overlay button. This keeps the preview reachable in embedded browsers that
// do not consistently dispatch clicks on absolutely positioned buttons.
showcaseStage.addEventListener('click', (event) => {
  if (showcasePointerOpened) return;
  if (event.target?.closest?.('#showcaseOpen')) openShowcasePreview(event);
});
selectShowcaseGroup(showcaseTabs[0]);

window.addEventListener('pagehide', () => {
  cancelAnimationFrame(pointerFrame);
  clearTimeout(videoLoadTimer);
  clearTimeout(videoErrorTimer);
  profileVideo.pause();
});

const revealElements = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach((element) => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.13 });
  revealElements.forEach((element) => revealObserver.observe(element));
}
