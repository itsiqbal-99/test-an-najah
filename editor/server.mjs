import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, copyFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAssetPath, readContent, renderContent, revisionOf } from './content.mjs';

const root = process.env.ANNAJAH_EDITOR_TEST_ROOT
  ? resolve(process.env.ANNAJAH_EDITOR_TEST_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pagePath = join(root, 'an-najah-4.html');
const assetsPath = join(root, 'assets');
const token = randomBytes(24).toString('hex');
const port = Number(process.env.ANNAJAH_EDITOR_PORT || 4174);
const editorOrigin = `http://127.0.0.1:${port}`;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif' };

function send(response, status, body, type = 'application/json; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

async function readBody(request, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Berkas terlalu besar.'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readPage() { return readFile(pagePath, 'utf8'); }

function requireEditor(request) {
  if (request.headers['x-editor-token'] !== token ||
      (request.headers.origin && request.headers.origin !== editorOrigin)) {
    throw Object.assign(new Error('Permintaan editor tidak diizinkan.'), { status: 403 });
  }
}

function detectImage(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'jpg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buffer.toString('ascii', 4, 8) === 'ftyp' && /^(avif|avis)$/.test(buffer.toString('ascii', 8, 12))) return 'avif';
  return null;
}

async function checkAssets(draft) {
  const paths = [
    ...Object.values(draft.images).map((image) => image.src),
    ...Object.values(draft.facilities).flatMap((group) => group.photos.map((photo) => photo.src)),
    ...Object.values(draft.gallery).flatMap((group) => group.photos.map((photo) => photo.src))
  ];
  for (const asset of new Set(paths)) {
    if (!isAssetPath(asset)) throw new Error(`Alamat foto tidak valid: ${asset}`);
    const absolute = resolve(root, asset);
    if (!absolute.startsWith(assetsPath + sep)) throw new Error('Foto harus berada di folder assets.');
    const info = await stat(absolute).catch(() => null);
    if (!info?.isFile()) throw new Error(`Berkas foto tidak ditemukan: ${asset}`);
  }
}

async function handle(request, response) {
  const url = new URL(request.url, editorOrigin);
  if (request.method === 'GET' && url.pathname === '/') {
    const html = await readFile(join(root, 'editor', 'index.html'), 'utf8');
    return send(response, 200, html.replace('__EDITOR_TOKEN__', token), mime['.html']);
  }
  if (request.method === 'GET' && url.pathname === '/editor.js') {
    return send(response, 200, await readFile(join(root, 'editor', 'editor.js')), mime['.js']);
  }
  if (request.method === 'GET' && url.pathname === '/api/content') {
    return send(response, 200, readContent(await readPage()));
  }
  if (request.method === 'GET' && url.pathname === '/api/export') {
    response.writeHead(200, { 'Content-Type': mime['.html'], 'Content-Disposition': 'attachment; filename="an-najah-4.html"', 'Cache-Control': 'no-store' });
    return response.end(await readPage());
  }
  if (request.method === 'GET' && url.pathname === '/preview') {
    return send(response, 200, await readPage(), mime['.html']);
  }
  if (request.method === 'GET' && url.pathname.startsWith('/assets/')) {
    const asset = decodeURIComponent(url.pathname.slice(1));
    const publicAsset = /^assets\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|avif|css|js)$/i.test(asset) && !asset.split('/').includes('..');
    if (!publicAsset) throw Object.assign(new Error('Berkas tidak tersedia.'), { status: 404 });
    const absolute = resolve(root, asset);
    if (!absolute.startsWith(assetsPath + sep)) throw Object.assign(new Error('Berkas tidak tersedia.'), { status: 404 });
    return send(response, 200, await readFile(absolute), mime[extname(absolute).toLowerCase()] || 'application/octet-stream');
  }
  if (request.method === 'POST' && url.pathname === '/api/upload') {
    requireEditor(request);
    const bytes = await readBody(request, 10 * 1024 * 1024);
    const extension = detectImage(bytes);
    if (!extension) throw new Error('Gunakan foto PNG, JPG, WebP, atau AVIF.');
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const uploadDir = join(assetsPath, 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filename = `${hash}.${extension}`;
    const absolute = join(uploadDir, filename);
    await writeFile(absolute, bytes, { flag: 'wx' }).catch((error) => { if (error.code !== 'EEXIST') throw error; });
    return send(response, 200, { src: `assets/uploads/${filename}` });
  }
  if (request.method === 'POST' && (url.pathname === '/api/preview' || url.pathname === '/api/save')) {
    requireEditor(request);
    const draft = JSON.parse((await readBody(request, 800 * 1024)).toString('utf8'));
    const original = await readPage();
    if (draft.revision !== revisionOf(original)) throw Object.assign(new Error('File situs berubah di luar editor. Muat ulang editor sebelum menyimpan.'), { status: 409 });
    const output = renderContent(original, draft);
    await checkAssets(draft);
    if (url.pathname === '/api/preview') return send(response, 200, output, mime['.html']);
    if (output === original) return send(response, 200, { revision: revisionOf(original), message: 'Tidak ada perubahan untuk disimpan.' });
    const backupDir = join(root, 'editor', 'backups');
    await mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await copyFile(pagePath, join(backupDir, `${stamp}-${draft.revision.slice(0, 8)}.html`));
    const temp = `${pagePath}.editor-${process.pid}-${Date.now()}.tmp`;
    await writeFile(temp, output, 'utf8');
    await rename(temp, pagePath);
    return send(response, 200, { revision: revisionOf(output), message: 'Perubahan tersimpan ke an-najah-4.html.' });
  }
  throw Object.assign(new Error('Halaman tidak ditemukan.'), { status: 404 });
}

const server = createServer((request, response) => {
  handle(request, response).catch((error) => {
    const status = error.status || (error.code === 'ENOENT' ? 404 : 400);
    send(response, status, { error: error.message });
  });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Editor konten Ma'had An-Najah: ${editorOrigin}\n`);
});
