const sections = [
  { id: 'home', name: 'Beranda', description: 'Kalimat pembuka dan gambar utama.', text: ['hero', 'strength'], images: ['hero'] },
  { id: 'introduction', name: 'Tentang', description: 'Pengantar pondok dan tiga prinsip pendidikan.', text: ['introduction'], images: ['introduction'] },
  { id: 'vision', name: 'Visi & Misi', description: 'Pernyataan resmi. Periksa kembali sebelum mengubah isi visi dan misi.', text: ['vision'], images: [] },
  { id: 'pondok', name: 'Program Pondok', description: 'Pengantar program tahfidz dan mata pelajaran.', text: ['pondok'], images: [] },
  { id: 'education', name: 'Pendidikan', description: 'Penjelasan jenjang dan kelompok pelajaran.', text: ['education'], images: [] },
  { id: 'facilities', name: 'Fasilitas', description: 'Atur deskripsi fasilitas serta koleksi foto dan keterangan tiap foto.', text: ['facilities', 'facility'], images: [], facilities: true },
  { id: 'video', name: 'Video Profil', description: 'Teks dan gambar sampul video.', text: ['video'], images: ['video'] },
  { id: 'gallery', name: 'Galeri', description: 'Tambah, urutkan, atau hapus foto kegiatan beserta keterangannya.', text: ['gallery'], images: [], gallery: true },
  { id: 'showcase', name: 'Karya Santriwati', description: 'Atur koleksi ekstrakurikuler dan hasil karya santriwati.', text: [], images: [], showcase: true },
  { id: 'activities', name: 'Kegiatan', description: 'Tiga cerita kegiatan beserta foto dan isi selengkapnya.', text: ['activities', 'activity'], images: ['activity'] },
  { id: 'rhythm', name: 'Ritme Harian', description: 'Gambaran kegiatan dari pagi hingga malam.', text: ['rhythm'], images: [] },
  { id: 'faq', name: 'FAQ', description: 'Pengantar pertanyaan yang sering diajukan.', text: ['faq'], images: [] },
  { id: 'social', name: 'Instagram & Sosial', description: 'Teks pengantar kanal resmi pondok.', text: ['instagram', 'social'], images: [] },
  { id: 'contact', name: 'Kontak', description: 'Ajakan untuk menghubungi pengelola.', text: ['contact'], images: [] }
];

const names = {
  title: 'Judul', intro: 'Pengantar', body: 'Paragraf utama', girls: 'Khusus putri', subjects: 'Diniyah dan umum', sunnah: "Al-Qur'an dan Sunnah", levels: 'Jenjang SMP & SMA',
  principle1: 'Prinsip — Al-Qur\'an dan Sunnah', principle2: 'Prinsip — Menjaga aurat dan adab', principle3: 'Prinsip — Lingkungan putri',
  statement: 'Visi resmi', mission1: 'Misi 01', mission2: 'Misi 02', mission3: 'Misi 03', mission4: 'Misi 04', mission5: 'Misi 05',
  smp: 'Jenjang SMP', sma: 'Jenjang SMA', diniyah: 'Diniyah & Al-Qur\'an', general: 'Pelajaran Umum', self: 'Pengembangan Diri',
  dorm: 'Asrama putri', class: 'Kelas & laboratorium', library: 'Perpustakaan', worship: 'Ibadah & olahraga',
  halaqah: 'Halaqah Al-Qur\'an', science: 'Praktik sains', community: 'Kehidupan bersama',
  dawn: 'Fajar', morning: 'Pagi', afternoon: 'Sore', night: 'Malam', detail: 'Cerita lengkap', summary: 'Ringkasan', caption: 'Keterangan pada foto'
};

const token = document.querySelector('meta[name="editor-token"]').content;
const sectionNav = document.getElementById('sectionNav');
const sectionPicker = document.getElementById('sectionPicker');
const editorPanel = document.getElementById('editorPanel');
const status = document.getElementById('status');
const previewDialog = document.getElementById('previewDialog');
let draft;
let currentSection = 'home';
let currentGallery = 'halaqah';
let currentFacility = 'dorm';
let dirty = false;
let busy = false;

function labelFor(key) {
  const parts = key.split('.');
  if (parts[0] === 'activity') return parts.length === 2 ? names[parts[1]] || parts[1] : `${names[parts[1]] || parts[1]} — ${names[parts[2]] || parts[2]}`;
  if (parts[0] === 'facility') return `${names[parts[1]] || parts[1]} — Deskripsi`;
  if (parts[0] === 'faq' && /^[qa]\d+$/.test(parts[1])) return `${parts[1][0] === 'q' ? 'Pertanyaan' : 'Jawaban'} ${parts[1].slice(1)}`;
  if (parts[0] === 'pondok' && /^program\d+$/.test(parts[1])) return `Program ${parts[1].slice(7)}`;
  return names[parts.at(-1)] || key;
}

function imageLabelFor(key) {
  if (key === 'hero') return 'Gambar pembuka';
  if (key === 'introduction') return 'Foto pengantar';
  if (key === 'video') return 'Sampul video';
  return names[key.split('.')[1]] || key;
}

function setStatus(message, kind = '') {
  status.textContent = message;
  status.className = `status ${kind}`;
}

function markDirty() {
  dirty = true;
  setStatus('Belum disimpan', 'dirty');
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function belongs(key, prefixes) { return prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}.`)); }

function buildNav() {
  sectionNav.replaceChildren();
  sectionPicker.replaceChildren();
  sections.forEach((section) => {
    const button = element('button', '', section.name);
    button.type = 'button';
    if (section.id === currentSection) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => { currentSection = section.id; render(); });
    sectionNav.append(button);
    const option = element('option', '', section.name);
    option.value = section.id;
    sectionPicker.append(option);
  });
  sectionPicker.value = currentSection;
}

sectionPicker.addEventListener('change', () => { currentSection = sectionPicker.value; render(); });

function buildTextField(key, value) {
  const wrapper = element('div', `field ${/intro|body|summary|detail|statement|mission/.test(key) ? 'wide' : ''}`);
  const label = element('label', '', labelFor(key));
  const input = element('textarea');
  input.rows = /detail|statement|mission/.test(key) ? 3 : 2;
  input.value = value;
  input.id = `field-${key.replaceAll('.', '-')}`;
  label.htmlFor = input.id;
  input.addEventListener('input', () => { draft.texts[key] = input.value; markDirty(); });
  wrapper.append(label, input);
  return wrapper;
}

async function upload(file) {
  if (!file) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran foto maksimal 10 MB.');
  setStatus('Mengunggah foto…');
  const response = await fetch('/api/upload', { method: 'POST', headers: { 'x-editor-token': token }, body: file });
  const payload = await response.json();
  if (response.status === 403) throw new Error('Sesi editor berubah. Segarkan halaman, lalu coba lagi.');
  if (!response.ok) throw new Error(payload.error || 'Foto gagal diunggah.');
  markDirty();
  return payload.src;
}

function photoCard(key, image) {
  const card = element('article', 'photo-item');
  const preview = element('img');
  preview.src = `/${image.src}`;
  preview.alt = '';
  preview.loading = 'lazy';
  const info = element('div', 'photo-info');
  info.append(element('strong', '', imageLabelFor(key)));
  if (!['hero', 'video'].includes(key)) {
    const altLabel = element('label', '', 'Deskripsi foto');
    const alt = element('input');
    alt.type = 'text';
    alt.value = image.alt;
    alt.maxLength = 240;
    alt.placeholder = 'Jelaskan isi foto secara singkat';
    altLabel.append(alt);
    alt.addEventListener('input', () => { image.alt = alt.value; markDirty(); });
    info.append(altLabel);
  }
  const fileInput = element('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/png,image/jpeg,image/webp,image/avif';
  fileInput.hidden = true;
  const replace = element('button', 'button', 'Ganti foto');
  replace.type = 'button';
  replace.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    try {
      const src = await upload(fileInput.files[0]);
      if (!src) return;
      image.src = src;
      if (!image.alt.trim() || image.alt.startsWith('Ilustrasi')) image.alt = `Foto ${imageLabelFor(key)}`;
      render();
    } catch (error) { setStatus(error.message, 'error'); }
  });
  info.append(replace, fileInput, element('small', '', image.src));
  card.append(preview, info);
  return card;
}

function renderCollection(host, type) {
  host.replaceChildren();
  const collections = draft[type];
  const selected = type === 'facilities' ? currentFacility : currentGallery;
  const picker = element('div', 'gallery-select');
  for (const [key, collection] of Object.entries(collections)) {
    const button = element('button', '', `${collection.label} · ${collection.photos.length}`);
    button.type = 'button';
    button.setAttribute('aria-selected', String(key === selected));
    button.addEventListener('click', () => {
      if (type === 'facilities') currentFacility = key;
      else currentGallery = key;
      renderCollection(host, type);
    });
    picker.append(button);
  }
  host.append(picker);
  const collection = collections[selected];
  const list = element('div', 'gallery-list');
  collection.photos.forEach((photo, index) => {
    const card = element('article', 'photo-item');
    const image = element('img');
    image.src = `/${photo.src}`;
    image.alt = '';
    image.loading = 'lazy';
    const info = element('div', 'photo-info');
    info.append(element('strong', '', `Foto ${String(index + 1).padStart(2, '0')}`));
    const altLabel = element('label', '', 'Deskripsi alternatif foto');
    const alt = element('input');
    alt.type = 'text';
    alt.maxLength = 240;
    alt.placeholder = 'Contoh: Santriwati membaca Al-Qur\'an di ruang kelas';
    alt.value = photo.alt;
    alt.addEventListener('input', () => { photo.alt = alt.value; markDirty(); });
    altLabel.append(alt);
    const captionLabel = element('label', '', 'Keterangan singkat yang tampil di website');
    const caption = element('input');
    caption.type = 'text';
    caption.maxLength = 240;
    caption.placeholder = 'Contoh: Rak buku dan bahan bacaan di perpustakaan.';
    caption.value = photo.caption || '';
    caption.addEventListener('input', () => { photo.caption = caption.value; markDirty(); });
    captionLabel.append(caption);
    const replaceInput = element('input');
    replaceInput.type = 'file';
    replaceInput.accept = 'image/png,image/jpeg,image/webp,image/avif';
    replaceInput.hidden = true;
    const replace = element('button', 'button', 'Ganti foto ini');
    replace.type = 'button';
    replace.addEventListener('click', () => replaceInput.click());
    replaceInput.addEventListener('change', async () => {
      try {
        const src = await upload(replaceInput.files[0]);
        if (!src) return;
        photo.src = src;
        photo.alt = `Foto ${collection.label}`;
        photo.caption = `Foto ${collection.label}.`;
        renderCollection(host, type);
        setStatus('Foto diganti. Sesuaikan deskripsi dan keterangannya sebelum menyimpan.', 'dirty');
      } catch (error) { setStatus(error.message, 'error'); }
    });
    const tools = element('div', 'photo-tools');
    const up = element('button', '', '↑ Naik');
    const down = element('button', '', '↓ Turun');
    const remove = element('button', 'danger', 'Hapus');
    up.type = down.type = remove.type = 'button';
    up.disabled = index === 0;
    down.disabled = index === collection.photos.length - 1;
    remove.disabled = collection.photos.length === 1;
    up.addEventListener('click', () => { [collection.photos[index - 1], collection.photos[index]] = [collection.photos[index], collection.photos[index - 1]]; markDirty(); renderCollection(host, type); });
    down.addEventListener('click', () => { [collection.photos[index + 1], collection.photos[index]] = [collection.photos[index], collection.photos[index + 1]]; markDirty(); renderCollection(host, type); });
    remove.addEventListener('click', () => { collection.photos.splice(index, 1); markDirty(); renderCollection(host, type); });
    tools.append(up, down, remove);
    info.append(altLabel, captionLabel, replace, replaceInput, tools, element('small', '', photo.src));
    card.append(image, info);
    list.append(card);
  });
  host.append(list);
  const fileInput = element('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/png,image/jpeg,image/webp,image/avif';
  fileInput.multiple = true;
  fileInput.hidden = true;
  const add = element('button', 'button gallery-add', '+ Tambah foto');
  add.type = 'button';
  add.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    try {
      for (const file of fileInput.files) {
        const src = await upload(file);
        if (src) collection.photos.push({ src, alt: `Foto ${collection.label}`, caption: `Foto ${collection.label}.` });
      }
      renderCollection(host, type);
      setStatus('Foto ditambahkan. Sesuaikan keterangan dengan isi foto sebelum menyimpan.', 'dirty');
    } catch (error) { setStatus(error.message, 'error'); renderCollection(host, type); }
  });
  host.append(add, fileInput);
}

function render() {
  if (!draft) return;
  buildNav();
  const section = sections.find((item) => item.id === currentSection);
  document.getElementById('sectionTitle').textContent = section.name;
  document.getElementById('sectionDescription').textContent = section.description;
  editorPanel.replaceChildren();
  const textKeys = Object.keys(draft.texts).filter((key) => belongs(key, section.text));
  if (textKeys.length) {
    const heading = element('div', 'panel-head');
    heading.append(element('h2', '', 'Teks halaman'), element('p', '', 'Gunakan kalimat yang jelas dan sesuai informasi resmi pondok.'));
    const grid = element('div', 'field-grid');
    textKeys.forEach((key) => grid.append(buildTextField(key, draft.texts[key])));
    editorPanel.append(heading, grid);
  }
  const imageKeys = Object.keys(draft.images).filter((key) => belongs(key, section.images));
  if (imageKeys.length) {
    const heading = element('div', 'subheading');
    heading.append(element('h2', '', 'Foto section'), element('p', '', 'Gunakan foto dengan izin publikasi. Deskripsi foto membantu pembaca yang memakai pembaca layar.'));
    const grid = element('div', 'photo-grid');
    imageKeys.forEach((key) => grid.append(photoCard(key, draft.images[key])));
    editorPanel.append(heading, grid);
  }
  if (section.gallery) {
    const heading = element('div', 'subheading');
    heading.append(element('h2', '', 'Koleksi galeri'), element('p', '', 'Setiap kategori dapat memuat banyak foto. Keterangan singkat muncul di bawah foto saat pengunjung memilihnya.'));
    const host = element('div');
    editorPanel.append(heading, host);
    renderCollection(host, 'gallery');
  }
  if (section.facilities) {
    const heading = element('div', 'subheading');
    heading.append(element('h2', '', 'Koleksi foto fasilitas'), element('p', '', 'Pilih fasilitas, lalu tambah, urutkan, dan beri keterangan tiap foto. Foto pertama tampil saat fasilitas dipilih.'));
    const host = element('div');
    editorPanel.append(heading, host);
    renderCollection(host, 'facilities');
  }
  if (section.showcase) {
    const heading = element('div', 'subheading');
    heading.append(element('h2', '', 'Koleksi ekstrakurikuler & karya'), element('p', '', 'Pilih koleksi, lalu ganti, tambah, urutkan, atau beri keterangan pada tiap foto.'));
    const host = element('div');
    editorPanel.append(heading, host);
    renderCollection(host, 'showcase');
  }
}

async function apiPost(path) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-editor-token': token }, body: JSON.stringify(draft) });
  if (path === '/api/preview' && response.ok) return response.text();
  const payload = await response.json();
  if (response.status === 403) throw new Error('Sesi editor berubah. Segarkan halaman, lalu coba lagi.');
  if (!response.ok) throw new Error(payload.error || 'Permintaan gagal.');
  return payload;
}

async function load() {
  const response = await fetch('/api/content', { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Konten gagal dimuat.');
  draft = payload;
  dirty = false;
  render();
  setStatus('Tersimpan', 'success');
}

document.getElementById('saveButton').addEventListener('click', async () => {
  if (!draft || busy) return;
  busy = true;
  setStatus('Menyimpan…');
  try {
    const result = await apiPost('/api/save');
    draft.revision = result.revision;
    dirty = false;
    setStatus('Tersimpan ke HTML', 'success');
  } catch (error) { setStatus(error.message, 'error'); }
  finally { busy = false; }
});

document.getElementById('previewButton').addEventListener('click', async () => {
  if (!draft || busy) return;
  setStatus('Menyiapkan pratinjau…');
  try {
    const html = await apiPost('/api/preview');
    document.getElementById('previewFrame').srcdoc = html;
    previewDialog.showModal();
    setStatus(dirty ? 'Belum disimpan' : 'Tersimpan', dirty ? 'dirty' : 'success');
  } catch (error) { setStatus(error.message, 'error'); }
});

document.getElementById('closePreview').addEventListener('click', () => previewDialog.close());
document.getElementById('reloadButton').addEventListener('click', () => {
  if (!dirty || confirm('Perubahan yang belum disimpan akan hilang. Muat ulang?')) load().catch((error) => setStatus(error.message, 'error'));
});
window.addEventListener('beforeunload', (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
load().catch((error) => { setStatus(error.message, 'error'); editorPanel.replaceChildren(element('p', 'loading', 'Editor belum dapat memuat file HTML.')); });
