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

const videoDialog = document.getElementById('videoDialog');
const profileVideo = document.getElementById('profileVideo');
const videoStatus = document.getElementById('videoStatus');
const videoStatusTitle = document.getElementById('videoStatusTitle');
const videoStatusText = document.getElementById('videoStatusText');
let videoReturnFocus;
let videoLoadTimer;

function showVideoMessage(title, message) {
  profileVideo.hidden = true;
  videoStatus.hidden = false;
  videoStatusTitle.textContent = title;
  videoStatusText.textContent = message;
}

function revealVideo() {
  clearTimeout(videoLoadTimer);
  videoStatus.hidden = true;
  profileVideo.hidden = false;
}

function videoUnavailable() {
  clearTimeout(videoLoadTimer);
  profileVideo.pause();
  showVideoMessage('Video belum dapat diputar.', 'Periksa koneksi Anda, lalu tutup dan buka kembali pemutar. Program pendidikan tetap dapat Anda jelajahi.');
}

function openVideo(event) {
  videoReturnFocus = event.currentTarget;
  videoDialog.showModal();
  const videoSource = profileVideo.dataset.videoSrc.trim();
  if (!videoSource) return;

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
    else if (error.name !== 'AbortError') videoUnavailable();
  });
}

function closeVideo() {
  clearTimeout(videoLoadTimer);
  profileVideo.pause();
  videoDialog.close();
  videoReturnFocus?.focus();
}

profileVideo.addEventListener('loadeddata', revealVideo);
profileVideo.addEventListener('error', videoUnavailable);
document.querySelectorAll('[data-video-open]').forEach((button) => button.addEventListener('click', openVideo));
document.querySelector('[data-video-close]').addEventListener('click', closeVideo);
document.querySelector('[data-video-explore]').addEventListener('click', closeVideo);
videoDialog.addEventListener('click', (event) => { if (event.target === videoDialog) closeVideo(); });
videoDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeVideo();
});

const facilityCollections = JSON.parse(document.getElementById('facilityData').textContent);
const facilityTabs = [...document.querySelectorAll('.facility-tab')];
const facilityPanel = document.getElementById('facility-panel');
const facilityMainImage = document.getElementById('facilityMainImage');
const facilityBackdropImage = document.getElementById('facilityBackdropImage');
const facilityPhotoSelector = document.getElementById('facilityPhotoSelector');
let activeFacility = 'dorm';
let facilityIndex = 0;

function renderFacilityPhoto() {
  const photos = facilityCollections[activeFacility].photos;
  const photo = photos[facilityIndex];
  const position = `${String(facilityIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  facilityMainImage.src = photo.src;
  facilityMainImage.alt = photo.alt;
  facilityBackdropImage.src = photo.src;
  document.getElementById('facilityImageOpen').setAttribute('aria-label', `Perbesar foto ${facilityCollections[activeFacility].label}, ${facilityIndex + 1} dari ${photos.length}: ${photo.caption}`);
  document.getElementById('facilityPhotoCaption').textContent = photo.caption;
  document.getElementById('facilityPhotoPosition').textContent = position;
  document.getElementById('facilityInlineCount').textContent = position;
  facilityPhotoSelector.querySelectorAll('button').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === facilityIndex));
  });
  document.getElementById('facilityPrev').disabled = photos.length === 1;
  document.getElementById('facilityNext').disabled = photos.length === 1;
}

function selectFacilityPhoto(index) {
  const photos = facilityCollections[activeFacility].photos;
  facilityIndex = (index + photos.length) % photos.length;
  renderFacilityPhoto();
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

const facilityDialog = document.getElementById('facilityDialog');
const facilityDialogImage = document.getElementById('facilityDialogImage');
const facilityDialogViewport = document.getElementById('facilityDialogViewport');
const facilityDialogImageButton = document.getElementById('facilityDialogImageButton');
const facilityZoomIn = document.getElementById('facilityZoomIn');
const facilityZoomOut = document.getElementById('facilityZoomOut');
let facilityZoom = 1;
let facilityReturnFocus;

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
  const photo = facilityCollections[activeFacility].photos[facilityIndex];
  facilityDialogImage.src = photo.src;
  facilityDialogImage.alt = photo.alt;
  document.getElementById('facilityDialogCaption').textContent = `${facilityCollections[activeFacility].label} — ${photo.caption}`;
  facilityDialog.showModal();
  setFacilityZoom(1);
});
facilityDialogImageButton.addEventListener('click', () => setFacilityZoom(facilityZoom === 1 ? 2 : 1));
facilityZoomIn.addEventListener('click', () => setFacilityZoom(facilityZoom + 0.5));
facilityZoomOut.addEventListener('click', () => setFacilityZoom(facilityZoom - 0.5));
document.getElementById('facilityDialogClose').addEventListener('click', () => facilityDialog.close());
facilityDialog.addEventListener('close', () => facilityReturnFocus?.focus());
facilityDialog.addEventListener('click', (event) => { if (event.target === facilityDialog) facilityDialog.close(); });

const galleryDialog = document.getElementById('galleryDialog');
const galleryImage = document.getElementById('galleryDialogImage');
const galleryCaption = document.getElementById('galleryDialogCaption');
const galleryCount = document.getElementById('galleryCount');
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

function renderGalleryPhoto() {
  const collection = galleryCollections[activeGalleryGroup];
  const photo = collection.photos[galleryIndex];
  const position = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(collection.photos.length).padStart(2, '0')}`;
  galleryStageImage.src = photo.src;
  galleryStageImage.alt = photo.alt;
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
  }
}

function selectGalleryPhoto(index) {
  const photos = galleryCollections[activeGalleryGroup].photos;
  galleryIndex = (index + photos.length) % photos.length;
  renderGalleryPhoto();
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
  galleryDialog.showModal();
  renderGalleryPhoto();
}

function closeGallery() {
  galleryDialog.close();
  galleryReturnFocus?.focus();
}

galleryStage.addEventListener('click', openGallery);
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

const storyDialog = document.getElementById('storyDialog');
const storyCopy = {
  halaqah: 'Dalam contoh kegiatan ini, santriwati mengikuti halaqah bersama asatidzah untuk memperbaiki bacaan dan mengulang hafalan. Kegiatan menekankan ketelitian, adab menyimak, serta semangat saling mendukung dalam mempelajari Al-Quran.',
  sains: 'Contoh kegiatan pembelajaran umum ini mengajak santriwati melakukan pengamatan sederhana dan berdiskusi tentang hasilnya. Proses belajar melatih rasa ingin tahu, ketelitian, kemampuan mencatat, dan kerja sama dengan tetap menjaga adab di kelas.',
  adab: 'Contoh cerita keseharian ini menampilkan pembiasaan saling menghormati, menjaga kebersihan, dan menyelesaikan tanggung jawab bersama. Nilai adab dipelajari melalui praktik kecil yang dilakukan secara konsisten dalam lingkungan khusus putri.'
};
let storyReturnFocus;
document.querySelectorAll('[data-story-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const article = button.closest('article');
    const photo = article.querySelector('img');
    storyReturnFocus = button;
    document.getElementById('storyDialogTitle').textContent = article.querySelector('h3').textContent;
    document.getElementById('storyDialogDate').textContent = `${article.querySelector('time').textContent} | Konten contoh`;
    document.getElementById('storyDialogBody').textContent = storyCopy[button.dataset.storyOpen];
    const image = document.getElementById('storyDialogImage');
    image.src = photo.getAttribute('src');
    image.alt = photo.alt;
    storyDialog.showModal();
  });
});
function closeStory() {
  storyDialog.close();
  storyReturnFocus?.focus();
}
document.querySelector('[data-story-close]').addEventListener('click', closeStory);
storyDialog.addEventListener('click', (event) => { if (event.target === storyDialog) closeStory(); });
storyDialog.addEventListener('cancel', (event) => { event.preventDefault(); closeStory(); });

window.addEventListener('pagehide', () => {
  cancelAnimationFrame(pointerFrame);
  clearTimeout(videoLoadTimer);
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
