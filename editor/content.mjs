import { createHash } from 'node:crypto';

const textTag = /<([a-z][\w:-]*)\b([^>]*\bdata-editor-text="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi;
const imageTag = /<img\b[^>]*\bdata-editor-image="([^"]+)"[^>]*>/gi;
const facilityTag = /(<script type="application\/json" id="facilityData">)([\s\S]*?)(<\/script>)/i;
const galleryTag = /(<script type="application\/json" id="galleryData">)([\s\S]*?)(<\/script>)/i;
const assetPath = /^assets\/(?!.*(?:^|\/)\.\.\/)[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|avif)$/i;

function decodeEntities(value) {
  return value.replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp);/gi, (entity) => ({
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&nbsp;': ' '
  })[entity.toLowerCase()] || entity);
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function plainText(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function readAttribute(tag, name) {
  return decodeEntities(tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] || '');
}

export function revisionOf(html) {
  return createHash('sha256').update(html).digest('hex');
}

export function readContent(html) {
  const texts = {};
  const images = {};
  for (const match of html.matchAll(textTag)) {
    if (Object.hasOwn(texts, match[3])) throw new Error(`Penanda teks ganda: ${match[3]}`);
    texts[match[3]] = plainText(match[4]);
  }
  for (const match of html.matchAll(imageTag)) {
    if (Object.hasOwn(images, match[1])) throw new Error(`Penanda foto ganda: ${match[1]}`);
    images[match[1]] = {
      src: readAttribute(match[0], 'src'),
      alt: readAttribute(match[0], 'alt')
    };
  }
  const facilityMatch = html.match(facilityTag);
  if (!facilityMatch) throw new Error('Data fasilitas tidak ditemukan.');
  const facilities = JSON.parse(facilityMatch[2]);
  const galleryMatch = html.match(galleryTag);
  if (!galleryMatch) throw new Error('Data galeri tidak ditemukan.');
  const gallery = JSON.parse(galleryMatch[2]);
  return { revision: revisionOf(html), texts, images, facilities, gallery };
}

export function isAssetPath(value) {
  return typeof value === 'string' && assetPath.test(value) && !value.split('/').includes('..');
}

export function validateContent(current, draft) {
  if (!draft || typeof draft !== 'object' || !draft.texts || !draft.images || !draft.facilities || !draft.gallery) {
    throw new Error('Format data editor tidak lengkap.');
  }
  for (const key of Object.keys(current.texts)) {
    const value = draft.texts[key];
    if (typeof value !== 'string' || !value.trim() || value.length > 2500) throw new Error(`Teks ${key} wajib diisi (maksimal 2.500 karakter).`);
  }
  for (const key of Object.keys(current.images)) {
    const image = draft.images[key];
    if (!image || !isAssetPath(image.src)) throw new Error(`Alamat foto ${key} tidak valid.`);
    if (typeof image.alt !== 'string' || image.alt.length > 240 || (!['hero', 'video'].includes(key) && !image.alt.trim())) throw new Error(`Isi deskripsi foto ${key} sebelum menyimpan.`);
  }
  for (const type of ['facilities', 'gallery']) {
    const currentCollections = current[type];
    const draftCollections = draft[type];
    if (Object.keys(draftCollections).length !== Object.keys(currentCollections).length) throw new Error(`Kategori ${type === 'facilities' ? 'fasilitas' : 'galeri'} tidak boleh diubah.`);
    for (const key of Object.keys(currentCollections)) {
      const original = currentCollections[key];
      const collection = draftCollections[key];
      if (!collection || collection.label !== original.label || !Array.isArray(collection.photos) || collection.photos.length < 1 || collection.photos.length > 60) {
        throw new Error(`Koleksi ${key} harus berisi 1–60 foto.`);
      }
      for (const [index, photo] of collection.photos.entries()) {
        if (!photo || !isAssetPath(photo.src) || typeof photo.alt !== 'string' || !photo.alt.trim() || photo.alt.length > 240) {
          throw new Error(`Foto ${index + 1} pada ${collection.label} perlu berkas dan deskripsi alternatif yang valid.`);
        }
        if (typeof photo.caption !== 'string' || !photo.caption.trim() || photo.caption.length > 240) throw new Error(`Isi keterangan singkat foto ${index + 1} pada ${collection.label}.`);
      }
    }
  }
}

export function renderContent(html, draft) {
  const current = readContent(html);
  validateContent(current, draft);
  let result = html.replace(textTag, (full, tag, attrs, key) => {
    if (draft.texts[key] === current.texts[key]) return full;
    const safe = escapeHtml(draft.texts[key].replace(/\s+/g, ' ').trim());
    return `<${tag}${attrs}>${safe}</${tag}>`;
  });
  result = result.replace(imageTag, (tag, key) => {
    const image = draft.images[key];
    if (image.src === current.images[key].src && image.alt === current.images[key].alt) return tag;
    return tag.replace(/\bsrc="[^"]*"/i, `src="${escapeHtml(image.src)}"`)
      .replace(/\balt="[^"]*"/i, `alt="${escapeHtml(image.alt)}"`);
  });
  if (draft.images.hero.src !== current.images.hero.src) {
    const heroSource = escapeHtml(draft.images.hero.src);
    const extension = draft.images.hero.src.split('.').at(-1).toLowerCase();
    const heroType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;
    result = result.replace(/(<meta property="og:image" content=")[^"]*(")/i, (_full, start, end) => `${start}${heroSource}${end}`);
    result = result.replace(/<link\b[^>]*\bdata-editor-preload="hero"[^>]*>/i, (tag) => tag
      .replace(/\bhref="[^"]*"/i, `href="${heroSource}"`)
      .replace(/\btype="[^"]*"/i, `type="${heroType}"`));
  }
  if (JSON.stringify(draft.facilities) !== JSON.stringify(current.facilities)) {
    const facilityJson = JSON.stringify(draft.facilities, null, 2).replaceAll('<', '\\u003c');
    result = result.replace(facilityTag, (_full, start, _body, end) => `${start}\n${facilityJson}\n    ${end}`);
    const firstPhoto = draft.facilities.dorm.photos[0];
    result = result.replace(/<img\b[^>]*\bid="facilityMainImage"[^>]*>/i, (tag) => tag
      .replace(/\bsrc="[^"]*"/i, `src="${escapeHtml(firstPhoto.src)}"`)
      .replace(/\balt="[^"]*"/i, `alt="${escapeHtml(firstPhoto.alt)}"`));
    result = result.replace(/<img\b[^>]*\bid="facilityBackdropImage"[^>]*>/i, (tag) => tag
      .replace(/\bsrc="[^"]*"/i, `src="${escapeHtml(firstPhoto.src)}"`));
    result = result.replace(/(<span id="facilityPhotoCaption"[^>]*>)[\s\S]*?(<\/span>)/i, (_full, start, end) => `${start}${escapeHtml(firstPhoto.caption)}${end}`);
    result = result.replace(/(<span id="facilityPhotoPosition"[^>]*>)[\s\S]*?(<\/span>)/i, (_full, start, end) => `${start}01 / ${String(draft.facilities.dorm.photos.length).padStart(2, '0')}${end}`);
    result = result.replace(/(<span id="facilityInlineCount"[^>]*>)[\s\S]*?(<\/span>)/i, (_full, start, end) => `${start}01 / ${String(draft.facilities.dorm.photos.length).padStart(2, '0')}${end}`);
    for (const [key, collection] of Object.entries(draft.facilities)) {
      result = result.replace(new RegExp(`(<small data-facility-count="${key}">)[\\s\\S]*?(<\\/small>)`, 'i'), (_full, start, end) => `${start}${collection.photos.length} foto${end}`);
    }
  }
  if (JSON.stringify(draft.gallery) !== JSON.stringify(current.gallery)) {
    const galleryJson = JSON.stringify(draft.gallery, null, 2).replaceAll('<', '\\u003c');
    result = result.replace(galleryTag, (_full, start, _body, end) => `${start}\n${galleryJson}\n    ${end}`);
    const firstPhoto = draft.gallery.halaqah.photos[0];
    result = result.replace(/<img\b[^>]*\bid="galleryStageImage"[^>]*>/i, (tag) => tag
      .replace(/\bsrc="[^"]*"/i, `src="${escapeHtml(firstPhoto.src)}"`)
      .replace(/\balt="[^"]*"/i, `alt="${escapeHtml(firstPhoto.alt)}"`));
    result = result.replace(/(<p class="gallery-photo-caption" id="galleryPhotoCaption"[^>]*>)[\s\S]*?(<\/p>)/i, (_full, start, end) => `${start}${escapeHtml(firstPhoto.caption)}${end}`);
  }
  return result;
}
