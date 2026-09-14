import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile, mkdtemp, readdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { readContent, renderContent, isAssetPath } from '../editor/content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(new URL('../an-najah-4.html', import.meta.url), 'utf8');

test('editor reads marked text, fixed photos, and facility/gallery collections', () => {
  const content = readContent(html);
  assert.ok(Object.keys(content.texts).length >= 50);
  assert.equal(Object.keys(content.images).length, 6);
  assert.deepEqual(Object.keys(content.facilities), ['dorm', 'class', 'library', 'worship']);
  assert.equal(content.facilities.library.photos.length, 2);
  assert.equal(content.facilities.class.photos.length, 4);
  assert.deepEqual(Object.keys(content.gallery), ['halaqah', 'ekstrakurikuler', 'ukhuwah', 'belajar']);
});

test('editor produces static HTML, escapes text, and updates photo captions', () => {
  const content = readContent(html);
  content.texts['hero.intro'] = 'Teks <baru> & lebih jelas.';
  content.images.hero.src = 'assets/maahad-putri-hero-niqab.webp';
  content.gallery.halaqah.photos.unshift({ src: 'assets/images/ANNAJAH-1.png', alt: 'Santriwati bersama', caption: 'Belajar bersama.' });
  content.facilities.dorm.photos[0] = { src: 'assets/images/fasilitas/PERPUS-2.jpeg', alt: 'Lemari buku', caption: 'Buku & piala di lemari.' };
  content.facilities.library.photos.unshift({ src: 'assets/images/fasilitas/PERPUS-2.jpeg', alt: 'Lemari buku', caption: 'Buku & piala di lemari.' });
  const output = renderContent(html, content);
  assert.match(output, /Teks &lt;baru&gt; &amp; lebih jelas\./);
  assert.match(output, /id="galleryStageImage" src="assets\/images\/ANNAJAH-1\.png"/);
  assert.match(output, /id="facilityMainImage" src="assets\/images\/fasilitas\/PERPUS-2\.jpeg"/);
  assert.match(output, /id="facilityBackdropImage" src="assets\/images\/fasilitas\/PERPUS-2\.jpeg"/);
  assert.match(output, /id="facilityPhotoCaption"[^>]*>Buku &amp; piala di lemari\./);
  assert.match(output, /id="galleryPhotoCaption"[^>]*>Belajar bersama\./);
  assert.match(output, /<meta property="og:image" content="assets\/maahad-putri-hero-niqab\.webp"/);
  assert.match(output, /data-editor-preload="hero"[\s\S]*?href="assets\/maahad-putri-hero-niqab\.webp"[\s\S]*?type="image\/webp"/);
  assert.equal(readContent(output).texts['hero.intro'], 'Teks <baru> & lebih jelas.');
  assert.equal(readContent(output).gallery.halaqah.photos.length, 5);
  assert.equal(readContent(output).facilities.library.photos.length, 3);
  assert.equal(readContent(output).facilities.dorm.photos[0].caption, 'Buku & piala di lemari.');
});

test('editor refuses empty copy and paths outside assets', () => {
  const content = readContent(html);
  content.texts['hero.intro'] = ' ';
  assert.throws(() => renderContent(html, content), /hero\.intro/);
  content.texts['hero.intro'] = 'Teks valid';
  content.images.introduction.src = 'assets/../secret.png';
  assert.equal(isAssetPath(content.images.introduction.src), false);
  assert.throws(() => renderContent(html, content), /introduction/);
});

test('facility photos give specific guidance when descriptions are empty', () => {
  const content = readContent(html);
  content.facilities.library.photos[0].caption = '';
  assert.throws(() => renderContent(html, content), /keterangan singkat foto 1 pada Perpustakaan/i);
});

test('local editor serves content and preview, but rejects unauthorized writes', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'annajah-editor-test-'));
  await mkdir(join(fixture, 'editor'), { recursive: true });
  await copyFile(join(root, 'editor', 'index.html'), join(fixture, 'editor', 'index.html'));
  await writeFile(join(fixture, 'an-najah-4.html'), html);
  await mkdir(join(fixture, 'assets'), { recursive: true });
  await copyFile(join(root, 'assets', 'an-najah-v2.css'), join(fixture, 'assets', 'an-najah-v2.css'));
  await copyFile(join(root, 'assets', 'an-najah-v2.js'), join(fixture, 'assets', 'an-najah-v2.js'));
  const originalContent = readContent(html);
  const assetPaths = [
    ...Object.values(originalContent.images).map((image) => image.src),
    ...Object.values(originalContent.facilities).flatMap((group) => group.photos.map((photo) => photo.src)),
    ...Object.values(originalContent.gallery).flatMap((group) => group.photos.map((photo) => photo.src))
  ];
  for (const asset of new Set(assetPaths)) {
    const file = join(fixture, asset);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, 'test image');
  }
  const port = 43000 + Math.floor(Math.random() * 1000);
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['editor/server.mjs'], {
    cwd: root,
    env: { ...process.env, ANNAJAH_EDITOR_PORT: String(port), ANNAJAH_EDITOR_TEST_ROOT: fixture },
    stdio: 'ignore'
  });
  try {
    let home;
    for (let attempt = 0; attempt < 40; attempt++) {
      try { home = await fetch(origin); break; }
      catch { await new Promise((resolve) => setTimeout(resolve, 80)); }
    }
    assert.equal(home?.status, 200);
    const editorHtml = await home.text();
    const token = editorHtml.match(/name="editor-token" content="([^"]+)"/)[1];
    const contentResponse = await fetch(`${origin}/api/content`);
    const content = await contentResponse.json();
    assert.equal(contentResponse.status, 200);
    const stylesheet = await fetch(`${origin}/assets/an-najah-v2.css`);
    assert.equal(stylesheet.status, 200);
    assert.match(stylesheet.headers.get('content-type'), /text\/css/);
    assert.equal((await fetch(`${origin}/assets/an-najah-v2.js`)).status, 200);
    const forbidden = await fetch(`${origin}/api/save`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(content) });
    assert.equal(forbidden.status, 403);
    const preview = await fetch(`${origin}/api/preview`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-editor-token': token }, body: JSON.stringify(content) });
    assert.equal(preview.status, 200);
    assert.match(await preview.text(), /Teguh di atas Sunnah/);
    const upload = await fetch(`${origin}/api/upload`, { method: 'POST', headers: { 'x-editor-token': token }, body: await readFile(join(root, 'assets', 'logo-annajah.webp')) });
    assert.equal(upload.status, 200);
    const uploaded = await upload.json();
    assert.match(uploaded.src, /^assets\/uploads\/[a-f0-9]+\.webp$/);
    content.texts['hero.intro'] = 'Teks yang disimpan oleh editor.';
    content.images.hero.src = uploaded.src;
    const libraryCount = content.facilities.library.photos.length;
    content.facilities.library.photos[0] = { src: uploaded.src, alt: 'Foto uji perpustakaan', caption: 'Keterangan foto uji.' };
    const save = await fetch(`${origin}/api/save`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-editor-token': token }, body: JSON.stringify(content) });
    assert.equal(save.status, 200);
    const saved = readContent(await readFile(join(fixture, 'an-najah-4.html'), 'utf8'));
    assert.equal(saved.texts['hero.intro'], 'Teks yang disimpan oleh editor.');
    assert.equal(saved.images.hero.src, uploaded.src);
    assert.equal(saved.facilities.library.photos[0].src, uploaded.src);
    assert.equal(saved.facilities.library.photos[0].caption, 'Keterangan foto uji.');
    assert.equal(saved.facilities.library.photos.length, libraryCount);
    assert.equal((await readdir(join(fixture, 'editor', 'backups'))).length, 1);
  } finally {
    child.kill();
    await rm(fixture, { recursive: true, force: true });
  }
});
